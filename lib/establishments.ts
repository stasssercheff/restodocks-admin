import { createServiceClient, fetchAllRows } from '@/lib/supabase-server'
import { buildReferralLevels, type DataScope, summarizeScopedRows, type ScopeStats } from '@/lib/admin-scope'

export type SubscriptionSummary = {
  statusLabel: string
  paymentLabel: string
  promoCode: string | null
  proUntilIso: string | null
  detail: string | null
}

export type EstablishmentRow = {
  id: string
  name: string
  address: string | null
  created_at: string
  default_currency: string
  owner_id: string | null
  parent_establishment_id: string | null
  registration_ip: string | null
  registration_country: string | null
  registration_city: string | null
  registration_client: string | null
  subscription_type: string | null
  pro_paid_until: string | null
  pro_trial_ends_at: string | null
  is_demo: boolean
  employee_count: number
  owner_name: string
  owner_email: string
  owner_pending_confirmation?: boolean
  establishment_type: 'main' | 'branch' | 'separate'
  subscription_summary: SubscriptionSummary
  effective_pro: boolean
  subscription_group: string
  subscription_filter_key: string
  last_activity_at: string | null
  referred_by_establishment_id: string | null
  referral_level: number | null
}

type EstablishmentRecord = {
  id: string
  name: string
  address: string | null
  created_at: string
  default_currency: string | null
  owner_id: string | null
  parent_establishment_id: string | null
  registration_ip: string | null
  registration_country: string | null
  registration_city: string | null
  registration_client: string | null
  subscription_type: string | null
  pro_paid_until: string | null
  pro_trial_ends_at: string | null
  is_demo: boolean | null
  referred_by_establishment_id?: string | null
}

type EmployeeRecord = {
  id: string
  full_name: string | null
  email: string | null
  roles: string[] | null
  establishment_id: string
  last_login_at: string | null
  last_login_ip: string | null
}

type PromoCodeRow = {
  id: number
  code: string
  grants_subscription_type: string | null
  grants_employee_slot_packs: number | null
  grants_branch_slot_packs: number | null
  grants_additive_only: boolean | null
  activation_duration_days: number | null
  expires_at: string | null
  grant_until: string | null
  grant_days: number | null
}

type RedemptionRow = {
  promo_code_id: number
  establishment_id: string
  redeemed_at: string
}

function ruDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function ruDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function isFuture(iso: string | null | undefined): boolean {
  if (!iso) return false
  const date = new Date(iso)
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
}

function tierName(type: string | null | undefined): string {
  const value = (type ?? 'free').toLowerCase()
  if (value === 'ultimate') return 'Ultimate'
  if (value === 'ultra') return 'Ultra'
  if (value === 'premium') return 'Premium'
  if (value === 'pro') return 'Pro'
  return value
}

function promoAccessUntil(promo: PromoCodeRow, redeemedAt: string): string | null {
  if (promo.activation_duration_days && promo.activation_duration_days > 0) {
    return addDays(redeemedAt, promo.activation_duration_days)
  }
  if (promo.grant_days && promo.grant_days > 0) return addDays(redeemedAt, promo.grant_days)
  if (promo.grant_until) return promo.grant_until
  if (promo.expires_at) return promo.expires_at
  return null
}

function establishmentType(
  est: EstablishmentRecord,
  byOwner: Map<string, EstablishmentRecord[]>,
): EstablishmentRow['establishment_type'] {
  if (est.parent_establishment_id) return 'branch'
  if (!est.owner_id) return 'main'
  const siblings = (byOwner.get(est.owner_id) ?? []).filter(item => !item.parent_establishment_id)
  return siblings.length > 1 ? 'separate' : 'main'
}

function buildSubscription(args: {
  est: EstablishmentRecord
  promo: PromoCodeRow | null
  redeemedAt: string | null
  paidUntil: string | null
  paidChannel: 'iap' | 'ls' | null
}): { summary: SubscriptionSummary; effective_pro: boolean; group: string; filterKey: string } {
  const { est, promo, redeemedAt, paidUntil, paidChannel } = args
  const empPacks = promo?.grants_employee_slot_packs ?? 0
  const branchPacks = promo?.grants_branch_slot_packs ?? 0
  const additive = promo?.grants_additive_only ? 1 : 0
  const promoUntil = promo && redeemedAt ? promoAccessUntil(promo, redeemedAt) : null
  const promoActive = !!promo && (!promoUntil || isFuture(promoUntil))
  const paidActive = isFuture(paidUntil)

  if (paidActive) {
    const until = paidUntil
    return {
      summary: {
        statusLabel: `${tierName(est.subscription_type || 'pro')} (оплата)`,
        paymentLabel: paidChannel === 'iap'
          ? 'App Store (In-App Purchase)'
          : paidChannel === 'ls'
            ? 'Lemon Squeezy'
            : 'Оплата',
        promoCode: null,
        proUntilIso: until,
        detail: until ? `до ${ruDate(until)}` : null,
      },
      effective_pro: true,
      group: 'paid_iap',
      filterKey: `paid_iap|${(est.subscription_type || 'pro').toLowerCase()}`,
    }
  }

  if (promo && redeemedAt) {
    const tier = (promo.grants_subscription_type || est.subscription_type || 'ultra').toLowerCase()
    if (promoActive) {
      const hidden = tier === 'ultimate' ? ' (промо, скрытый)' : ''
      return {
        summary: {
          statusLabel: `${tierName(tier)}${hidden} (промокод)`,
          paymentLabel: 'Промокод',
          promoCode: promo.code,
          proUntilIso: promoUntil && !promo.activation_duration_days ? promoUntil : null,
          detail: promoUntil ? `до ${ruDate(promoUntil)}` : 'без срока (промо)',
        },
        effective_pro: true,
        group: 'promo',
        filterKey: `promo|${tier}|${empPacks}|${branchPacks}|${additive}`,
      }
    }
    const expiredLabel = promo.activation_duration_days
      ? `истёк ${ruDate(promoUntil)} (${promo.activation_duration_days} дн. с активации)`
      : `истёк ${ruDate(promoUntil)}`
    return {
      summary: {
        statusLabel: `${tierName(tier)} (истёк, промо)`,
        paymentLabel: 'Промокод (истёк)',
        promoCode: promo.code,
        proUntilIso: null,
        detail: expiredLabel,
      },
      effective_pro: false,
      group: 'expired',
      filterKey: `expired|promo|${tier}|${empPacks}|${branchPacks}`,
    }
  }

  const trialUntil = est.pro_trial_ends_at || (est.created_at ? addDays(est.created_at, 3) : null)
  return {
    summary: {
      statusLabel: 'Без подписки',
      paymentLabel: '—',
      promoCode: null,
      proUntilIso: null,
      detail:
        `Запись заведения: ${ruDateTime(est.created_at)}. Регистрация без промокода: полный Pro 72 ч с этого момента` +
        (trialUntil ? ` (ориентир окончания trial: ${ruDateTime(trialUntil)}).` : '.'),
    },
    effective_pro: isFuture(trialUntil),
    group: 'no_pro',
    filterKey: 'no_pro',
  }
}

export async function listEstablishments(scope: DataScope | 'all' = 'all'): Promise<
  { data: EstablishmentRow[]; stats: ScopeStats | null } | { error: string }
> {
  try {
    const supabase = createServiceClient()
    if ('error' in supabase) return supabase

    const EST_COLUMNS =
      'id, name, address, created_at, default_currency, owner_id, parent_establishment_id, registration_ip, registration_country, registration_city, registration_client, subscription_type, pro_paid_until, pro_trial_ends_at, is_demo, referred_by_establishment_id'
    const EST_COLUMNS_LEGACY =
      'id, name, address, created_at, default_currency, owner_id, parent_establishment_id, registration_ip, registration_country, registration_city, registration_client, subscription_type, pro_paid_until, pro_trial_ends_at, is_demo'
    let establishmentsRes = await fetchAllRows<EstablishmentRecord>((from, to) =>
      supabase
        .from('establishments')
        .select(EST_COLUMNS)
        .order('created_at', { ascending: false })
        .range(from, to),
    )
    if ('error' in establishmentsRes && (establishmentsRes.error ?? '').toLowerCase().includes('referred_by_establishment_id')) {
      establishmentsRes = await fetchAllRows<EstablishmentRecord>((from, to) =>
        supabase
          .from('establishments')
          .select(EST_COLUMNS_LEGACY)
          .order('created_at', { ascending: false })
          .range(from, to),
      )
    }
    if ('error' in establishmentsRes) return establishmentsRes
    const establishments = establishmentsRes.data.map(item => ({
      ...item,
      referred_by_establishment_id: item.referred_by_establishment_id ?? null,
    }))
    if (establishments.length === 0) return { data: [], stats: null }

    const ids = establishments.map(item => item.id)
    const ownerIds = [...new Set(establishments.map(item => item.owner_id).filter(Boolean))] as string[]

    const [employeesRes, redemptionsRes, pendingRes, billingRes, appleRes] = await Promise.all([
      fetchAllRows<EmployeeRecord>((from, to) =>
        supabase
          .from('employees')
          .select('id, full_name, email, roles, establishment_id, last_login_at, last_login_ip')
          .in('establishment_id', ids)
          .range(from, to),
      ),
      fetchAllRows<RedemptionRow>((from, to) =>
        supabase
          .from('promo_code_redemptions')
          .select('promo_code_id, establishment_id, redeemed_at')
          .in('establishment_id', ids)
          .range(from, to),
      ),
      supabase
        .from('pending_owner_registrations')
        .select('establishment_id, email, full_name')
        .in('establishment_id', ids),
      ownerIds.length
        ? supabase.from('owner_billing').select('owner_id, tier, paid_until, ls_status, tier_locked_channel').in('owner_id', ownerIds)
        : Promise.resolve({ data: [] as { owner_id: string; tier: string | null; paid_until: string | null; ls_status: string | null; tier_locked_channel: string | null }[], error: null }),
      ownerIds.length
        ? supabase.from('apple_iap_subscription_claims').select('owner_id').in('owner_id', ownerIds)
        : Promise.resolve({ data: [] as { owner_id: string }[], error: null }),
    ])

    if ('error' in employeesRes) return employeesRes
    if ('error' in redemptionsRes) return redemptionsRes

    const redeemedPromoIds = [...new Set(redemptionsRes.data.map(item => item.promo_code_id))]
    const promosRes = redeemedPromoIds.length
      ? await supabase
          .from('promo_codes')
          .select('id, code, grants_subscription_type, grants_employee_slot_packs, grants_branch_slot_packs, grants_additive_only, activation_duration_days, expires_at, grant_until, grant_days')
          .in('id', redeemedPromoIds)
      : { data: [] as PromoCodeRow[], error: null }
    if (promosRes.error) return { error: promosRes.error.message }

    const promoById = new Map((promosRes.data ?? []).map(item => [item.id, item as PromoCodeRow]))
    const redemptionByEst = new Map<string, { promo: PromoCodeRow; redeemedAt: string }>()
    for (const row of redemptionsRes.data) {
      const promo = promoById.get(row.promo_code_id)
      if (!promo) continue
      const current = redemptionByEst.get(row.establishment_id)
      if (!current || new Date(row.redeemed_at) > new Date(current.redeemedAt)) {
        redemptionByEst.set(row.establishment_id, { promo, redeemedAt: row.redeemed_at })
      }
    }

    const pendingByEst = new Map(
      ((pendingRes.data ?? []) as { establishment_id: string; email: string | null; full_name: string | null }[])
        .map(item => [item.establishment_id, item]),
    )
    const billingByOwner = new Map(
      ((billingRes.data ?? []) as { owner_id: string; paid_until: string | null; ls_status: string | null; tier_locked_channel: string | null }[])
        .map(item => [item.owner_id, item]),
    )
    const appleOwners = new Set(((appleRes.data ?? []) as { owner_id: string }[]).map(item => item.owner_id))

    const employeesByEst = new Map<string, EmployeeRecord[]>()
    for (const employee of employeesRes.data) {
      const list = employeesByEst.get(employee.establishment_id) ?? []
      list.push(employee)
      employeesByEst.set(employee.establishment_id, list)
    }

    const byOwner = new Map<string, EstablishmentRecord[]>()
    for (const est of establishments) {
      if (!est.owner_id) continue
      const list = byOwner.get(est.owner_id) ?? []
      list.push(est)
      byOwner.set(est.owner_id, list)
    }

    const data = establishments.map(est => {
      const employees = employeesByEst.get(est.id) ?? []
      const owner = employees.find(item => item.roles?.includes('owner'))
      const pending = pendingByEst.get(est.id)
      const billing = est.owner_id ? billingByOwner.get(est.owner_id) : undefined
      const hasApple = !!(est.owner_id && appleOwners.has(est.owner_id))
      const paidUntil = isFuture(est.pro_paid_until)
        ? est.pro_paid_until
        : isFuture(billing?.paid_until)
          ? billing?.paid_until ?? null
          : null
      const paidChannel: 'iap' | 'ls' | null = hasApple
        ? 'iap'
        : billing?.tier_locked_channel === 'lemonsqueezy' || (billing?.ls_status && billing.ls_status !== 'expired')
          ? 'ls'
          : null
      const redemption = redemptionByEst.get(est.id)
      const sub = buildSubscription({
        est,
        promo: redemption?.promo ?? null,
        redeemedAt: redemption?.redeemedAt ?? null,
        paidUntil: paidChannel ? paidUntil : isFuture(est.pro_paid_until) ? est.pro_paid_until : null,
        paidChannel: paidUntil ? paidChannel : null,
      })
      const lastActivity = employees
        .map(item => item.last_login_at)
        .filter((value): value is string => !!value)
        .sort()
        .at(-1) ?? null

      return {
        id: est.id,
        name: est.name,
        address: est.address,
        created_at: est.created_at,
        default_currency: est.default_currency ?? 'RUB',
        owner_id: est.owner_id,
        parent_establishment_id: est.parent_establishment_id,
        registration_ip: est.registration_ip,
        registration_country: est.registration_country,
        registration_city: est.registration_city,
        registration_client: est.registration_client,
        subscription_type: est.subscription_type,
        pro_paid_until: est.pro_paid_until,
        pro_trial_ends_at: est.pro_trial_ends_at,
        is_demo: !!est.is_demo,
        employee_count: employees.length,
        owner_name: owner?.full_name || pending?.full_name || '—',
        owner_email: owner?.email || pending?.email || '—',
        ...(pending && !est.owner_id ? { owner_pending_confirmation: true } : {}),
        establishment_type: establishmentType(est, byOwner),
        subscription_summary: sub.summary,
        effective_pro: sub.effective_pro,
        subscription_group: sub.group,
        subscription_filter_key: sub.filterKey,
        last_activity_at: lastActivity,
        referred_by_establishment_id: est.referred_by_establishment_id,
        referral_level: null,
      } satisfies EstablishmentRow
    })

    if (scope === 'all') return { data, stats: null }

    if (scope.promoCodes.length === 0) {
      return {
        data: [],
        stats: summarizeScopedRows([], scope),
      }
    }

    const promoRes = await supabase
      .from('promo_codes')
      .select('id, code, used_by_establishment_id')
    if (promoRes.error) return { error: promoRes.error.message }
    const wanted = new Set(scope.promoCodes)
    const matching = (promoRes.data ?? []).filter(row => wanted.has(String(row.code ?? '').toUpperCase()))
    const scopedPromoIds = matching.map(row => row.id as number)
    const seed = new Set<string>()
    for (const row of matching) {
      if (row.used_by_establishment_id) seed.add(row.used_by_establishment_id as string)
    }
    if (scopedPromoIds.length > 0) {
      const redemptions = await fetchAllRows<{ establishment_id: string }>((from, to) =>
        supabase
          .from('promo_code_redemptions')
          .select('establishment_id')
          .in('promo_code_id', scopedPromoIds)
          .range(from, to),
      )
      if ('error' in redemptions) return redemptions
      for (const row of redemptions.data) seed.add(row.establishment_id)
    }

    const levels = buildReferralLevels(
      establishments.map(item => ({
        id: item.id,
        referred_by_establishment_id: item.referred_by_establishment_id,
        parent_establishment_id: item.parent_establishment_id,
      })),
      seed,
      scope.referralDepth,
    )
    const scoped = data
      .filter(row => levels.has(row.id))
      .map(row => ({ ...row, referral_level: levels.get(row.id) ?? 1 }))
    return { data: scoped, stats: summarizeScopedRows(scoped, scope) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось загрузить заведения'
    return { error: message }
  }
}

export async function deleteEstablishment(id: string): Promise<{ ok: true } | { error: string; code?: string }> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const rpc = await supabase.rpc('admin_delete_establishment', { p_establishment_id: id })
  if (!rpc.error) return { ok: true }

  const fallback = await supabase.from('establishments').delete().eq('id', id)
  if (fallback.error) {
    return { error: rpc.error.message || fallback.error.message, code: rpc.error.code }
  }
  return { ok: true }
}

type GeoLookup = { country?: string; city?: string }

async function lookupGeo(ips: string[]): Promise<Map<string, GeoLookup>> {
  const unique = [...new Set(ips.filter(Boolean))]
  const out = new Map<string, GeoLookup>()
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100)
    try {
      const res = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      if (!res.ok) continue
      const rows = await res.json() as { status?: string; query?: string; country?: string; countryCode?: string; city?: string }[]
      for (const row of rows) {
        if (row.query && row.status === 'success') {
          out.set(row.query, { country: row.countryCode || row.country, city: row.city })
        }
      }
    } catch {
      // geo is best-effort
    }
  }
  return out
}

export async function refreshEstablishmentGeo(): Promise<
  | { ip_backfilled: number; geo_updated: number; skipped_no_login_ip: number; total: number; errors: string[] }
  | { error: string }
> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const establishmentsRes = await fetchAllRows<{
    id: string
    registration_ip: string | null
    registration_country: string | null
    registration_city: string | null
  }>((from, to) =>
    supabase
      .from('establishments')
      .select('id, registration_ip, registration_country, registration_city')
      .range(from, to),
  )
  if ('error' in establishmentsRes) return establishmentsRes
  const establishments = establishmentsRes.data
  const employeesRes = await fetchAllRows<{ establishment_id: string; last_login_ip: string | null }>((from, to) =>
    supabase
      .from('employees')
      .select('establishment_id, last_login_ip')
      .not('last_login_ip', 'is', null)
      .range(from, to),
  )
  if ('error' in employeesRes) return employeesRes

  const loginIpByEst = new Map<string, string>()
  for (const employee of employeesRes.data) {
    if (employee.last_login_ip && !loginIpByEst.has(employee.establishment_id)) {
      loginIpByEst.set(employee.establishment_id, employee.last_login_ip)
    }
  }

  let ipBackfilled = 0
  let skipped = 0
  const errors: string[] = []
  const needGeo: { id: string; ip: string }[] = []

  for (const est of establishments) {
    let ip = est.registration_ip
    if (!ip) {
      const fromLogin = loginIpByEst.get(est.id)
      if (fromLogin) {
        const patch = await supabase.from('establishments').update({ registration_ip: fromLogin }).eq('id', est.id)
        if (patch.error) errors.push(patch.error.message)
        else {
          ip = fromLogin
          ipBackfilled += 1
        }
      }
    }
    if (!ip) {
      skipped += 1
      continue
    }
    if (!est.registration_country || !est.registration_city) {
      needGeo.push({ id: est.id, ip })
    }
  }

  const geo = await lookupGeo(needGeo.map(item => item.ip))
  let geoUpdated = 0
  for (const item of needGeo) {
    const found = geo.get(item.ip)
    if (!found) continue
    const patch = await supabase
      .from('establishments')
      .update({
        registration_country: found.country ?? null,
        registration_city: found.city ?? null,
      })
      .eq('id', item.id)
    if (patch.error) errors.push(patch.error.message)
    else geoUpdated += 1
  }

  return {
    ip_backfilled: ipBackfilled,
    geo_updated: geoUpdated,
    skipped_no_login_ip: skipped,
    total: establishments.length,
    errors,
  }
}
