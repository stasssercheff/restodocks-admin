export const MAX_REFERRAL_DEPTH = 5
export const MIN_REFERRAL_DEPTH = 1

export type DataScope = {
  promoCodes: string[]
  referralDepth: number
}

export type ReferralNode = {
  id: string
  referred_by_establishment_id: string | null
  parent_establishment_id: string | null
}

export function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase()
}

export function sanitizePromoCodes(input: unknown): string[] {
  const raw = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[\s,;]+/)
      : []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const code = normalizePromoCode(item)
    if (code) seen.add(code)
  }
  return [...seen]
}

export function sanitizeReferralDepth(input: unknown): number {
  const value = typeof input === 'number' ? input : typeof input === 'string' ? parseInt(input, 10) : NaN
  if (!Number.isFinite(value)) return MIN_REFERRAL_DEPTH
  return Math.min(MAX_REFERRAL_DEPTH, Math.max(MIN_REFERRAL_DEPTH, Math.round(value)))
}

export function sanitizeDataScope(input: unknown): DataScope {
  const record = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  return {
    promoCodes: sanitizePromoCodes(record.promoCodes ?? record.promo_codes),
    referralDepth: sanitizeReferralDepth(record.referralDepth ?? record.referral_depth),
  }
}

export function emptyDataScope(): DataScope {
  return { promoCodes: [], referralDepth: MIN_REFERRAL_DEPTH }
}

/** Level 1 = seed (promo redemption). Levels 2..N follow referred_by. Branches inherit the parent's level. */
export function buildReferralLevels(
  nodes: ReferralNode[],
  seedIds: Iterable<string>,
  depth: number,
): Map<string, number> {
  const maxDepth = sanitizeReferralDepth(depth)
  const byReferrer = new Map<string, string[]>()
  const byParent = new Map<string, string[]>()
  for (const node of nodes) {
    if (node.referred_by_establishment_id) {
      const list = byReferrer.get(node.referred_by_establishment_id) ?? []
      list.push(node.id)
      byReferrer.set(node.referred_by_establishment_id, list)
    }
    if (node.parent_establishment_id) {
      const list = byParent.get(node.parent_establishment_id) ?? []
      list.push(node.id)
      byParent.set(node.parent_establishment_id, list)
    }
  }

  const level = new Map<string, number>()
  const queue: string[] = []
  for (const id of seedIds) {
    if (!id || level.has(id)) continue
    level.set(id, 1)
    queue.push(id)
  }

  while (queue.length > 0) {
    const id = queue.shift()!
    const current = level.get(id) ?? 1
    if (current < maxDepth) {
      for (const child of byReferrer.get(id) ?? []) {
        if (!level.has(child)) {
          level.set(child, current + 1)
          queue.push(child)
        }
      }
    }
    for (const branch of byParent.get(id) ?? []) {
      if (!level.has(branch)) {
        level.set(branch, current)
        queue.push(branch)
      }
    }
  }

  return level
}

export type ScopeStats = {
  promoCodes: string[]
  referralDepth: number
  total: number
  withSubscription: number
  withoutSubscription: number
  byLevel: { level: number; total: number; withSubscription: number; withoutSubscription: number }[]
}

export function summarizeScopedRows(
  rows: { referral_level?: number | null; effective_pro?: boolean }[],
  scope: DataScope,
): ScopeStats {
  const byLevel = new Map<number, { total: number; withSubscription: number; withoutSubscription: number }>()
  for (let level = 1; level <= scope.referralDepth; level += 1) {
    byLevel.set(level, { total: 0, withSubscription: 0, withoutSubscription: 0 })
  }
  for (const row of rows) {
    const level = row.referral_level && row.referral_level >= 1 ? row.referral_level : 1
    const bucket = byLevel.get(level) ?? { total: 0, withSubscription: 0, withoutSubscription: 0 }
    bucket.total += 1
    if (row.effective_pro) bucket.withSubscription += 1
    else bucket.withoutSubscription += 1
    byLevel.set(level, bucket)
  }
  const levels = [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, bucket]) => ({ level, ...bucket }))
  return {
    promoCodes: scope.promoCodes,
    referralDepth: scope.referralDepth,
    total: rows.length,
    withSubscription: rows.filter(row => row.effective_pro).length,
    withoutSubscription: rows.filter(row => !row.effective_pro).length,
    byLevel: levels,
  }
}
