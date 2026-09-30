import { readAdminConfig, readAdminConfigJson, writeAdminConfigJson } from '@/lib/admin-kv'
import { createServiceClient, fetchAllRows, readEnv } from '@/lib/supabase-server'
import {
  buildRegistrationEmail,
  recipientList,
  sanitizeRegistrationNotifyPrefs,
  type EstNotifyRow,
  type RegistrationNotifyPrefs,
} from '@/lib/registration-notify-prefs'

export {
  buildRegistrationEmail,
  defaultRegistrationNotifyPrefs,
  recipientList,
  sanitizeRegistrationNotifyPrefs,
  type EstNotifyRow,
  type RegistrationNotifyField,
  type RegistrationNotifyPrefs,
} from '@/lib/registration-notify-prefs'

export const REGISTRATION_NOTIFY_PREFS_KEY = 'registration_notify_prefs'
export const REGISTRATION_NOTIFY_STATE_KEY = 'registration_notify_state'

export type RegistrationNotifyState = {
  /** ISO watermark — only establishments with created_at > this are mailed. */
  watermarkIso: string
  /** Already mailed establishment ids (capped). */
  notifiedIds: string[]
}

export async function readRegistrationNotifyPrefs(): Promise<RegistrationNotifyPrefs> {
  const stored = await readAdminConfigJson<RegistrationNotifyPrefs>(REGISTRATION_NOTIFY_PREFS_KEY)
  return sanitizeRegistrationNotifyPrefs(stored)
}

export async function writeRegistrationNotifyPrefs(prefs: RegistrationNotifyPrefs): Promise<RegistrationNotifyPrefs> {
  const clean = sanitizeRegistrationNotifyPrefs(prefs)
  await writeAdminConfigJson(REGISTRATION_NOTIFY_PREFS_KEY, clean)
  return clean
}

async function readState(): Promise<RegistrationNotifyState> {
  const stored = await readAdminConfigJson<RegistrationNotifyState>(REGISTRATION_NOTIFY_STATE_KEY)
  if (!stored || typeof stored !== 'object') {
    return { watermarkIso: new Date(0).toISOString(), notifiedIds: [] }
  }
  const watermarkIso = typeof stored.watermarkIso === 'string' && stored.watermarkIso
    ? stored.watermarkIso
    : new Date(0).toISOString()
  const notifiedIds = Array.isArray(stored.notifiedIds)
    ? stored.notifiedIds.filter((id): id is string => typeof id === 'string').slice(-500)
    : []
  return { watermarkIso, notifiedIds }
}

async function writeState(state: RegistrationNotifyState): Promise<void> {
  await writeAdminConfigJson(REGISTRATION_NOTIFY_STATE_KEY, {
    watermarkIso: state.watermarkIso,
    notifiedIds: state.notifiedIds.slice(-500),
  })
}

/** First enable: set watermark to now so history is not mailed. */
export async function armRegistrationNotifyWatermark(): Promise<string> {
  const now = new Date().toISOString()
  const state = await readState()
  await writeState({ ...state, watermarkIso: now })
  return now
}

type EmployeeLite = {
  id: string
  email: string | null
  full_name: string | null
}

async function sendResendEmail(to: string[], subject: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = await readAdminConfig('resend_api_key') || readEnv('RESEND_API_KEY')
  const fromEmail = await readAdminConfig('resend_from_email') || readEnv('RESEND_FROM_EMAIL') || 'Restodocks <info@restodocks.com>'
  if (!apiKey) {
    return { ok: false, error: 'Resend не настроен (resend_api_key / RESEND_API_KEY)' }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to, subject, text }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, error: `Resend HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}` }
  }
  return { ok: true }
}

/**
 * Find establishments created after the watermark and email about each new one.
 * Idempotent via notifiedIds + watermark advance.
 */
export async function checkAndSendRegistrationNotify(): Promise<{
  enabled: boolean
  checked: number
  sent: number
  skipped: number
  errors: string[]
  totalEstablishments: number | null
}> {
  const prefs = await readRegistrationNotifyPrefs()
  const recipients = recipientList(prefs)
  if (!prefs.enabled || recipients.length === 0) {
    return { enabled: prefs.enabled, checked: 0, sent: 0, skipped: 0, errors: [], totalEstablishments: null }
  }

  const supabase = createServiceClient()
  if ('error' in supabase) {
    return { enabled: true, checked: 0, sent: 0, skipped: 0, errors: [supabase.error], totalEstablishments: null }
  }

  const state = await readState()
  const notified = new Set(state.notifiedIds)

  let query = supabase
    .from('establishments')
    .select('id, name, created_at, registration_ip, registration_country, registration_city, is_demo, owner_id')
    .gt('created_at', state.watermarkIso)
    .order('created_at', { ascending: true })
    .limit(50)

  if (prefs.excludeDemo) query = query.eq('is_demo', false)

  const fresh = await query
  if (fresh.error) {
    return { enabled: true, checked: 0, sent: 0, skipped: 0, errors: [fresh.error.message], totalEstablishments: null }
  }

  const rows = (fresh.data ?? []) as EstNotifyRow[]
  const toNotify = rows.filter(row => !notified.has(row.id))

  let totalEstablishments: number | null = null
  if (prefs.fields.totalEstablishments && toNotify.length > 0) {
    let countQuery = supabase.from('establishments').select('id', { count: 'exact', head: true })
    if (prefs.excludeDemo) countQuery = countQuery.eq('is_demo', false)
    const counted = await countQuery
    totalEstablishments = typeof counted.count === 'number' ? counted.count : null
  }

  const ownerIds = [...new Set(toNotify.map(row => row.owner_id).filter((id): id is string => !!id))]
  const owners = new Map<string, EmployeeLite>()
  if (ownerIds.length) {
    const empRes = await fetchAllRows<EmployeeLite>((from, to) =>
      supabase.from('employees').select('id, email, full_name').in('id', ownerIds).range(from, to),
    )
    if (!('error' in empRes)) {
      for (const emp of empRes.data) owners.set(emp.id, emp)
    }
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []
  let latestWatermark = state.watermarkIso
  const newNotified = [...state.notifiedIds]

  for (const est of toNotify) {
    const owner = est.owner_id ? owners.get(est.owner_id) : null
    const mail = buildRegistrationEmail({
      prefs,
      est,
      ownerName: owner?.full_name?.trim() || '—',
      ownerEmail: owner?.email?.trim() || '—',
      totalEstablishments: totalEstablishments ?? 0,
    })
    const result = await sendResendEmail(recipients, mail.subject, mail.text)
    if (result.ok) {
      sent += 1
      notified.add(est.id)
      newNotified.push(est.id)
    } else {
      skipped += 1
      if (errors.length < 8) errors.push(`${est.id}: ${result.error}`)
      break
    }
    if (est.created_at > latestWatermark) latestWatermark = est.created_at
  }

  if (toNotify.length === 0 && rows.length > 0) {
    const last = rows[rows.length - 1].created_at
    if (last > latestWatermark) latestWatermark = last
  }

  await writeState({ watermarkIso: latestWatermark, notifiedIds: newNotified })

  return {
    enabled: true,
    checked: rows.length,
    sent,
    skipped,
    errors,
    totalEstablishments,
  }
}
