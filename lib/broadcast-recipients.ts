import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient, fetchAllRows } from '@/lib/supabase-server'
import {
  classifyEstablishment,
  isOwnerRoles,
  matchesSubscriptionFilters,
  type BroadcastFilters,
} from '@/lib/broadcast-recipients-logic'

export type { BroadcastFilters, BroadcastStatusFilter, BroadcastUserKind } from '@/lib/broadcast-recipients-logic'
export {
  classifyEstablishment,
  isFutureIso,
  isOwnerRoles,
  matchesSubscriptionFilters,
  parseBroadcastFilters,
} from '@/lib/broadcast-recipients-logic'

export type BroadcastRecipient = {
  employeeId: string
  email: string | null
  establishmentId: string
  isOwner: boolean
  fullName?: string | null
  establishmentName?: string | null
}

export type BroadcastUserOption = {
  employeeId: string
  fullName: string | null
  email: string | null
  establishmentId: string
  establishmentName: string | null
  isOwner: boolean
}

type EmployeeRow = {
  id: string
  email: string | null
  full_name: string | null
  roles: string[] | null
  is_active: boolean | null
  created_at: string | null
  establishment_id: string
}

type EstRow = {
  id: string
  name: string | null
  subscription_type: string | null
  pro_paid_until: string | null
  pro_trial_ends_at: string | null
  created_at: string | null
  is_demo: boolean | null
}

function parseYmdBound(isoDay: string, end: boolean): string {
  return end ? `${isoDay}T23:59:59.999Z` : `${isoDay}T00:00:00.000Z`
}

export async function matchingBroadcastRecipients(
  filters: BroadcastFilters,
  supabaseClient?: SupabaseClient,
): Promise<{ recipients: BroadcastRecipient[] } | { error: string }> {
  const supabase = supabaseClient ?? createServiceClient()
  if ('error' in supabase) return supabase

  const excludeDemo = filters.excludeDemo !== false

  // Explicit employee list: ignore group filters.
  const targetIds = (filters.employeeIds?.length
    ? filters.employeeIds
    : filters.employeeId
      ? [filters.employeeId]
      : []).filter(Boolean)
  if (targetIds.length) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, email, full_name, roles, is_active, created_at, establishment_id')
      .in('id', targetIds)
      .eq('is_active', true)
    if (error) return { error: error.message }
    const rows = data ?? []
    if (!rows.length) return { recipients: [] }
    const estIds = [...new Set(rows.map(r => r.establishment_id))]
    const { data: estRows, error: estErr } = await supabase
      .from('establishments')
      .select('id, name, is_demo')
      .in('id', estIds)
    if (estErr) return { error: estErr.message }
    const estById = new Map((estRows ?? []).map(e => [e.id, e]))
    const byId = new Map(rows.map(r => [r.id, r]))
    const recipients: BroadcastRecipient[] = []
    for (const id of targetIds) {
      const row = byId.get(id)
      if (!row) continue
      const est = estById.get(row.establishment_id)
      if (!est) continue
      if (excludeDemo && est.is_demo) continue
      const email = row.email?.trim() || null
      recipients.push({
        employeeId: row.id,
        email: email && email.includes('@') ? email.toLowerCase() : null,
        establishmentId: row.establishment_id,
        isOwner: isOwnerRoles(row.roles),
        fullName: row.full_name,
        establishmentName: est.name ?? null,
      })
    }
    return { recipients }
  }

  const employeesRes = await fetchAllRows<EmployeeRow>((from, to) => {
    let query = supabase
      .from('employees')
      .select('id, email, full_name, roles, is_active, created_at, establishment_id')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .range(from, to)
    if (filters.registeredFrom) query = query.gte('created_at', parseYmdBound(filters.registeredFrom, false))
    if (filters.registeredTo) query = query.lte('created_at', parseYmdBound(filters.registeredTo, true))
    return query
  })
  if ('error' in employeesRes) return employeesRes

  let employees = employeesRes.data
  if (filters.userKind === 'owners') employees = employees.filter(row => isOwnerRoles(row.roles))
  if (filters.userKind === 'line') employees = employees.filter(row => !isOwnerRoles(row.roles))

  const estIds = [...new Set(employees.map(row => row.establishment_id))]
  // Avoid `.in(id, thousands)` — URL limits / Worker subrequests. Paginate full table.
  const estRes = estIds.length
    ? await fetchAllRows<EstRow>((from, to) =>
      supabase
        .from('establishments')
        .select('id, name, subscription_type, pro_paid_until, pro_trial_ends_at, created_at, is_demo')
        .order('id', { ascending: true })
        .range(from, to),
    )
    : { data: [] as EstRow[] }
  if ('error' in estRes) return estRes
  const wantEst = new Set(estIds)
  const establishments = estRes.data.filter(row => wantEst.has(row.id))
  const estById = new Map(establishments.map(item => [item.id, item]))
  const now = Date.now()
  const statuses = filters.statuses ?? []
  const types = filters.subscriptionTypes ?? []

  const recipients: BroadcastRecipient[] = []
  const seenEmp = new Set<string>()
  for (const row of employees) {
    if (seenEmp.has(row.id)) continue
    const est = estById.get(row.establishment_id)
    if (!est) continue
    if (excludeDemo && est.is_demo) continue
    const cls = classifyEstablishment(est, now)
    if (!matchesSubscriptionFilters(cls, statuses, types)) continue
    seenEmp.add(row.id)
    const email = row.email?.trim() || null
    recipients.push({
      employeeId: row.id,
      email: email && email.includes('@') ? email.toLowerCase() : null,
      establishmentId: row.establishment_id,
      isOwner: isOwnerRoles(row.roles),
      fullName: row.full_name,
      establishmentName: est.name ?? null,
    })
  }

  return { recipients }
}

/** Search active employees for the single-recipient picker. */
export async function searchBroadcastUsers(
  q: string,
  opts?: { limit?: number; excludeDemo?: boolean },
  supabaseClient?: SupabaseClient,
): Promise<{ users: BroadcastUserOption[] } | { error: string }> {
  const supabase = supabaseClient ?? createServiceClient()
  if ('error' in supabase) return supabase

  const needle = q.trim().replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').slice(0, 80)
  const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 50)
  const excludeDemo = opts?.excludeDemo !== false

  let query = supabase
    .from('employees')
    .select('id, email, full_name, roles, establishment_id')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
    .limit(limit * 3) // oversample; filter demos / refine in memory

  if (needle.length >= 1) {
    const like = `%${needle}%`
    query = query.or(`email.ilike.${like},full_name.ilike.${like}`)
  }

  const { data, error } = await query
  if (error) return { error: error.message }

  const rows = data ?? []
  if (!rows.length) return { users: [] }

  const estIds = [...new Set(rows.map(r => r.establishment_id))]
  const { data: estRows, error: estErr } = await supabase
    .from('establishments')
    .select('id, name, is_demo')
    .in('id', estIds)
  if (estErr) return { error: estErr.message }
  const estById = new Map((estRows ?? []).map(e => [e.id, e]))

  const users: BroadcastUserOption[] = []
  for (const row of rows) {
    const est = estById.get(row.establishment_id)
    if (!est) continue
    if (excludeDemo && est.is_demo) continue
    const email = row.email?.trim() || null
    users.push({
      employeeId: row.id,
      fullName: row.full_name,
      email: email && email.includes('@') ? email.toLowerCase() : null,
      establishmentId: row.establishment_id,
      establishmentName: est.name,
      isOwner: isOwnerRoles(row.roles as string[] | null),
    })
    if (users.length >= limit) break
  }
  return { users }
}
