export type RegistrationNotifyField =
  | 'establishmentName'
  | 'ownerName'
  | 'ownerEmail'
  | 'place'
  | 'ip'
  | 'createdAtLocal'
  | 'totalEstablishments'

export type RegistrationNotifyPrefs = {
  version: 1
  enabled: boolean
  /** Comma/newline separated recipient emails. */
  recipients: string
  /** IANA timezone for “local” registration time in the email. */
  timeZone: string
  /** Skip demo kitchens. */
  excludeDemo: boolean
  fields: Record<RegistrationNotifyField, boolean>
}

const ALL_FIELDS: RegistrationNotifyField[] = [
  'establishmentName',
  'ownerName',
  'ownerEmail',
  'place',
  'ip',
  'createdAtLocal',
  'totalEstablishments',
]

export function defaultRegistrationNotifyPrefs(): RegistrationNotifyPrefs {
  return {
    version: 1,
    enabled: false,
    recipients: '',
    timeZone: 'Asia/Ho_Chi_Minh',
    excludeDemo: true,
    fields: {
      establishmentName: true,
      ownerName: true,
      ownerEmail: true,
      place: true,
      ip: true,
      createdAtLocal: true,
      totalEstablishments: true,
    },
  }
}

function parseEmails(raw: unknown): string[] {
  const text = typeof raw === 'string' ? raw : ''
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of text.split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase()
    if (!email || !email.includes('@') || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

export function sanitizeRegistrationNotifyPrefs(input: unknown): RegistrationNotifyPrefs {
  const defaults = defaultRegistrationNotifyPrefs()
  if (!input || typeof input !== 'object') return defaults
  const raw = input as Record<string, unknown>
  const fieldsIn = raw.fields && typeof raw.fields === 'object' ? raw.fields as Record<string, unknown> : {}
  const fields = { ...defaults.fields }
  for (const key of ALL_FIELDS) {
    if (typeof fieldsIn[key] === 'boolean') fields[key] = fieldsIn[key]
  }
  const timeZone = typeof raw.timeZone === 'string' && raw.timeZone.trim()
    ? raw.timeZone.trim()
    : defaults.timeZone
  return {
    version: 1,
    enabled: raw.enabled === true,
    recipients: typeof raw.recipients === 'string' ? raw.recipients : '',
    timeZone,
    excludeDemo: raw.excludeDemo !== false,
    fields,
  }
}

export function recipientList(prefs: RegistrationNotifyPrefs): string[] {
  return parseEmails(prefs.recipients)
}

function formatLocal(iso: string, timeZone: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return new Date(iso).toISOString()
  }
}

export type EstNotifyRow = {
  id: string
  name: string | null
  created_at: string
  registration_ip: string | null
  registration_country: string | null
  registration_city: string | null
  is_demo: boolean | null
  owner_id: string | null
}

export function buildRegistrationEmail(args: {
  prefs: RegistrationNotifyPrefs
  est: EstNotifyRow
  ownerName: string
  ownerEmail: string
  totalEstablishments: number
}): { subject: string; text: string } {
  const { prefs, est, ownerName, ownerEmail, totalEstablishments } = args
  const place = [est.registration_city, est.registration_country].filter(Boolean).join(', ') || '—'
  const lines: string[] = ['Новое заведение на restodocks.com', '']

  if (prefs.fields.establishmentName) lines.push(`Заведение: ${est.name?.trim() || '—'}`)
  if (prefs.fields.ownerName) lines.push(`Кто: ${ownerName || '—'}`)
  if (prefs.fields.ownerEmail) lines.push(`Почта: ${ownerEmail || '—'}`)
  if (prefs.fields.place) lines.push(`Место: ${place}`)
  if (prefs.fields.ip) lines.push(`IP: ${(est.registration_ip || '').trim() || '—'}`)
  if (prefs.fields.createdAtLocal) {
    lines.push(`Время (${prefs.timeZone}): ${formatLocal(est.created_at, prefs.timeZone)}`)
    lines.push(`Время UTC: ${est.created_at}`)
  }
  if (prefs.fields.totalEstablishments) {
    lines.push(`Всего заведений${prefs.excludeDemo ? ' (без демо)' : ''}: ${totalEstablishments}`)
  }

  lines.push('', `id: ${est.id}`)
  return {
    subject: `Новое заведение: ${est.name?.trim() || est.id}`,
    text: lines.join('\n'),
  }
}
