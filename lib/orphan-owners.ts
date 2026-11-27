import { createServiceClient, fetchAllRows } from '@/lib/supabase-server'
import {
  OWNER_DELETE_COOLING_DAYS,
  daysSinceIso,
  matchesOwnerDeleteConfirm,
} from '@/lib/orphan-owners-logic'

export {
  OWNER_DELETE_CONFIRM_WORD,
  OWNER_DELETE_COOLING_DAYS,
  matchesOwnerDeleteConfirm,
} from '@/lib/orphan-owners-logic'

export type OrphanOwnerRow = {
  authUserId: string
  email: string
  fullName: string | null
  lastVenueDeletedAt: string | null
  lastVenueName: string | null
  daysSinceVenueDelete: number | null
  withinCoolingOff: boolean
  pendingRegistration: boolean
}

function isNoiseEmail(email: string): boolean {
  const e = email.toLowerCase()
  return (
    e.endsWith('@demo.restodocks.internal')
    || e.endsWith('@restodocks.invalid')
    || e.includes('mailinator.com')
    || e.startsWith('e2e.')
    || e.startsWith('ttk-eval-')
    || e.startsWith('demo-')
  )
}

export async function listOrphanOwners(): Promise<
  { owners: OrphanOwnerRow[] } | { error: string }
> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const logsRes = await fetchAllRows<{
    owner_auth_id: string
    owner_email: string
    establishment_name: string | null
    deleted_at: string
  }>((from, to) =>
    supabase
      .from('admin_owner_venue_deletions')
      .select('owner_auth_id, owner_email, establishment_name, deleted_at')
      .order('deleted_at', { ascending: false })
      .range(from, to),
  )
  if ('error' in logsRes) {
    if (/admin_owner_venue_deletions|does not exist|42P01/i.test(logsRes.error)) {
      return { owners: [] }
    }
    return logsRes
  }

  const latestByOwner = new Map<string, {
    email: string
    deletedAt: string
    venueName: string | null
  }>()
  for (const row of logsRes.data) {
    if (!row.owner_auth_id || latestByOwner.has(row.owner_auth_id)) continue
    latestByOwner.set(row.owner_auth_id, {
      email: row.owner_email,
      deletedAt: row.deleted_at,
      venueName: row.establishment_name,
    })
  }

  if (latestByOwner.size === 0) return { owners: [] }

  const ownerIds = [...latestByOwner.keys()]
  const estRes = await fetchAllRows<{ owner_id: string }>((from, to) =>
    supabase
      .from('establishments')
      .select('owner_id')
      .in('owner_id', ownerIds)
      .order('owner_id', { ascending: true })
      .range(from, to),
  )
  if ('error' in estRes) return estRes
  const stillHasVenue = new Set(estRes.data.map(r => r.owner_id).filter(Boolean))

  const pendingRes = await fetchAllRows<{
    auth_user_id: string
    full_name: string | null
    email: string | null
  }>((from, to) =>
    supabase
      .from('pending_owner_registrations')
      .select('auth_user_id, full_name, email')
      .in('auth_user_id', ownerIds)
      .order('auth_user_id', { ascending: true })
      .range(from, to),
  )
  const pendingById = new Map<string, { fullName: string | null; email: string | null }>()
  if (!('error' in pendingRes)) {
    for (const p of pendingRes.data) {
      if (!p.auth_user_id) continue
      pendingById.set(p.auth_user_id, { fullName: p.full_name, email: p.email })
    }
  }

  const owners: OrphanOwnerRow[] = []
  const now = Date.now()
  for (const [authUserId, meta] of latestByOwner) {
    if (stillHasVenue.has(authUserId)) continue

    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(authUserId)
    if (authErr || !authUser?.user) continue

    const pending = pendingById.get(authUserId)
    const email = (
      authUser.user.email
      || pending?.email
      || meta.email
      || ''
    ).trim()
    if (!email || isNoiseEmail(email)) continue

    const days = daysSinceIso(meta.deletedAt, now)
    owners.push({
      authUserId,
      email,
      fullName: pending?.fullName
        || (typeof authUser.user.user_metadata?.full_name === 'string'
          ? authUser.user.user_metadata.full_name
          : null),
      lastVenueDeletedAt: meta.deletedAt,
      lastVenueName: meta.venueName,
      daysSinceVenueDelete: days,
      withinCoolingOff: days < OWNER_DELETE_COOLING_DAYS,
      pendingRegistration: pendingById.has(authUserId),
    })
  }

  owners.sort((a, b) => {
    const at = a.lastVenueDeletedAt ? Date.parse(a.lastVenueDeletedAt) : 0
    const bt = b.lastVenueDeletedAt ? Date.parse(b.lastVenueDeletedAt) : 0
    return bt - at
  })
  return { owners }
}

export async function deleteOrphanOwner(
  authUserId: string,
  confirmRaw: unknown,
): Promise<{ ok: true } | { error: string; code?: string }> {
  if (!matchesOwnerDeleteConfirm(confirmRaw)) {
    return { error: 'Для удаления введите слово «удалить»' }
  }
  const id = authUserId.trim()
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: 'Некорректный id собственника' }
  }

  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const { count, error: estErr } = await supabase
    .from('establishments')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', id)
  if (estErr) return { error: estErr.message, code: estErr.code }
  if ((count ?? 0) > 0) {
    return { error: 'У собственника ещё есть заведения — сначала удалите их' }
  }

  const { count: empCount, error: empErr } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .or(`id.eq.${id},auth_user_id.eq.${id}`)
  if (empErr) return { error: empErr.message, code: empErr.code }
  if ((empCount ?? 0) > 0) {
    return { error: 'Учётка ещё привязана к сотруднику — удаление отменено' }
  }

  await supabase.from('pending_owner_registrations').delete().eq('auth_user_id', id)
  await supabase.from('establishment_data_clone_requests').delete().eq('owner_id', id)
  await supabase.from('owner_billing').delete().eq('owner_id', id)
  await supabase.from('admin_owner_venue_deletions').delete().eq('owner_auth_id', id)

  const { error: delErr } = await supabase.auth.admin.deleteUser(id)
  if (delErr) {
    if (!/not\s*found|user\s*not\s*found/i.test(delErr.message)) {
      return { error: delErr.message, code: delErr.status ? String(delErr.status) : undefined }
    }
  }
  return { ok: true }
}

/** Call after a successful venue wipe to record the owner for orphan cleanup. */
export async function logOwnerVenueDeletion(args: {
  ownerAuthId: string | null | undefined
  ownerEmail: string | null | undefined
  establishmentId: string
  establishmentName: string | null | undefined
}): Promise<void> {
  const ownerAuthId = args.ownerAuthId?.trim()
  const ownerEmail = args.ownerEmail?.trim()
  if (!ownerAuthId || !ownerEmail) return

  const supabase = createServiceClient()
  if ('error' in supabase) return

  await supabase.from('admin_owner_venue_deletions').insert({
    owner_auth_id: ownerAuthId,
    owner_email: ownerEmail,
    establishment_id: args.establishmentId,
    establishment_name: args.establishmentName ?? null,
  })
}
