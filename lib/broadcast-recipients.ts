import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient, fetchAllRows } from '@/lib/supabase-server'
import {
  classifyEstablishment,
  isOwnerRoles,
  matchesSubscriptionFilters,
  parseBroadcastFilters,
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
}

type EmployeeRow = {
  id: string
  email: string | null
  roles: string[] | null
  is_active: boolean | null
  created_at: string | null
  establishment_id: string
}

type EstRow = {
  id: string
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

  const employeesRes = await fetchAllRows<EmployeeRow>((from, to) => {
    let query = supabase
      .from('employees')
      .select('id, email, roles, is_active, created_at, establishment_id')
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
        .select('id, subscription_type, pro_paid_until, pro_trial_ends_at, created_at, is_demo')
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
    })
  }

  return { recipients }
}
