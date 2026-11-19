export type BroadcastUserKind = 'all' | 'owners' | 'line'

/** OR within this set; empty = no status filter. */
export type BroadcastStatusFilter = 'trial' | 'paid' | 'none'

export type BroadcastFilters = {
  userKind: BroadcastUserKind
  /** Combinable status chips (OR). Empty = any status. */
  statuses: BroadcastStatusFilter[]
  /** Specific paid tiers (OR). Applied when non-empty; also implies paid match. */
  subscriptionTypes: string[]
  registeredFrom: string | null
  registeredTo: string | null
  /** Skip demo kitchens. Default true. */
  excludeDemo?: boolean
}

const MS_DAY = 24 * 60 * 60 * 1000
const DEFAULT_TRIAL_DAYS = 3

export function isOwnerRoles(roles: string[] | null | undefined): boolean {
  return !!roles?.includes('owner')
}

export function isFutureIso(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  return Number.isFinite(t) && t > now
}

export function classifyEstablishment(
  est: {
    subscription_type: string | null
    pro_paid_until: string | null
    pro_trial_ends_at: string | null
    created_at: string | null
  },
  now = Date.now(),
): { paid: boolean; trial: boolean; none: boolean; type: string } {
  const type = (est.subscription_type ?? 'free').toLowerCase().trim() || 'free'
  const paidByUntil = isFutureIso(est.pro_paid_until, now)
  const paidByType = type !== 'free' && type !== '' && type !== 'none'
  const paid = paidByUntil || paidByType

  let trialUntilMs: number | null = null
  if (est.pro_trial_ends_at) {
    const t = Date.parse(est.pro_trial_ends_at)
    if (Number.isFinite(t)) trialUntilMs = t
  } else if (est.created_at) {
    const created = Date.parse(est.created_at)
    if (Number.isFinite(created)) trialUntilMs = created + DEFAULT_TRIAL_DAYS * MS_DAY
  }
  const trial = !paid && trialUntilMs != null && trialUntilMs > now
  const none = !paid && !trial
  return { paid, trial, none, type }
}

export function matchesSubscriptionFilters(
  classification: ReturnType<typeof classifyEstablishment>,
  statuses: BroadcastStatusFilter[],
  subscriptionTypes: string[],
): boolean {
  const wantedTypes = subscriptionTypes.map(t => t.toLowerCase().trim()).filter(Boolean)
  const statusSet = new Set(statuses)

  if (statusSet.size === 0 && wantedTypes.length === 0) return true

  const typeMatch = wantedTypes.length > 0 && wantedTypes.includes(classification.type)
  const statusMatch =
    (statusSet.has('trial') && classification.trial)
    || (statusSet.has('paid') && classification.paid)
    || (statusSet.has('none') && classification.none)

  if (statusSet.size === 0) return typeMatch
  if (wantedTypes.length === 0) return statusMatch
  return statusMatch || typeMatch
}

export function parseBroadcastFilters(input: {
  userKind?: unknown
  statuses?: unknown
  subscriptionStatuses?: unknown
  subscriptionMode?: unknown
  subscriptionTypes?: unknown
  registeredFrom?: unknown
  registeredTo?: unknown
  excludeDemo?: unknown
}): BroadcastFilters {
  const userKindRaw = String(input.userKind ?? 'all')
  const userKind: BroadcastUserKind =
    userKindRaw === 'owners' || userKindRaw === 'line' ? userKindRaw : 'all'

  const statusesRaw = input.statuses ?? input.subscriptionStatuses
  let statuses: BroadcastStatusFilter[] = []
  if (Array.isArray(statusesRaw)) {
    statuses = statusesRaw
      .map(item => String(item))
      .filter((item): item is BroadcastStatusFilter => item === 'trial' || item === 'paid' || item === 'none')
  } else if (typeof statusesRaw === 'string' && statusesRaw.trim()) {
    statuses = statusesRaw
      .split(',')
      .map(item => item.trim())
      .filter((item): item is BroadcastStatusFilter => item === 'trial' || item === 'paid' || item === 'none')
  }

  const mode = String(input.subscriptionMode ?? '')
  if (statuses.length === 0 && mode) {
    if (mode === 'with_any_subscription') statuses = ['paid']
    else if (mode === 'without_subscription') statuses = ['none']
    else if (mode === 'with_specific_subscriptions') statuses = ['paid']
    else if (mode === 'trial') statuses = ['trial']
  }

  const typesRaw = input.subscriptionTypes
  const subscriptionTypes = Array.isArray(typesRaw)
    ? typesRaw.map(item => String(item).toLowerCase().trim()).filter(Boolean)
    : String(typesRaw ?? '')
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)

  const registeredFrom = typeof input.registeredFrom === 'string' && input.registeredFrom.trim()
    ? input.registeredFrom.trim()
    : null
  const registeredTo = typeof input.registeredTo === 'string' && input.registeredTo.trim()
    ? input.registeredTo.trim()
    : null

  return {
    userKind,
    statuses,
    subscriptionTypes,
    registeredFrom,
    registeredTo,
    excludeDemo: input.excludeDemo === false ? false : true,
  }
}
