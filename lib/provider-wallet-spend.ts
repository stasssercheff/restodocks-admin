import {
  fillUsageSeries,
  formatInTimeZone,
  type UsageBucket,
  type UsagePoint,
} from '@/lib/ai-usage-series'
import {
  normalizeSnapshot,
  walletSpendBetween,
  type BalanceSnapshot,
} from '@/lib/provider-wallet-math'

export type { BalanceSnapshot }
export { normalizeSnapshot, walletSpendBetween }

/**
 * Build day/hour spend series from ordered snapshots (asc).
 * Optional `liveEnd` closes the current open bucket with the live balance.
 */
export function buildWalletSpendSeries(opts: {
  snapshots: BalanceSnapshot[]
  fromIso: string
  toIso: string
  timeZone: string
  bucket: UsageBucket
  liveEnd?: BalanceSnapshot | null
}): { series: UsagePoint[]; trackedFrom: string | null; spendUsd: number } {
  const sorted = [...opts.snapshots].sort((a, b) => a.captured_at.localeCompare(b.captured_at))
  if (opts.liveEnd) {
    const last = sorted[sorted.length - 1]
    if (!last || last.captured_at < opts.liveEnd.captured_at) sorted.push(opts.liveEnd)
  }
  if (sorted.length < 2) {
    return {
      series: fillUsageSeries(opts.fromIso, opts.toIso, opts.timeZone, opts.bucket, []),
      trackedFrom: sorted[0]?.captured_at ?? null,
      spendUsd: 0,
    }
  }

  const byBucket = new Map<string, BalanceSnapshot[]>()
  for (const snap of sorted) {
    const key = formatInTimeZone(snap.captured_at, opts.timeZone, opts.bucket)
    const list = byBucket.get(key)
    if (list) list.push(snap)
    else byBucket.set(key, [snap])
  }

  // Carry last snapshot of previous bucket as the start of the next when a bucket
  // has only one point (or for continuity across quiet hours).
  const keys = [...byBucket.keys()].sort()
  const points: UsagePoint[] = []
  let prevEnd: BalanceSnapshot | null = null
  for (const key of keys) {
    const list = byBucket.get(key)!
    const start = prevEnd && prevEnd.captured_at <= list[0].captured_at ? prevEnd : list[0]
    const end = list[list.length - 1]
    const spend = list.length >= 2 || prevEnd
      ? walletSpendBetween(start, end)
      : 0
    points.push({
      date: key,
      requests: 0,
      totalTokens: 0,
      estimatedCostUsd: spend,
    })
    prevEnd = end
  }

  const series = fillUsageSeries(opts.fromIso, opts.toIso, opts.timeZone, opts.bucket, points)
  const startKey = formatInTimeZone(opts.fromIso, opts.timeZone, opts.bucket)
  const endKey = formatInTimeZone(opts.toIso, opts.timeZone, opts.bucket)
  const spendUsd = series
    .filter(p => p.date >= startKey && p.date <= endKey)
    .reduce((sum, p) => sum + p.estimatedCostUsd, 0)

  return {
    series,
    trackedFrom: sorted[0]?.captured_at ?? null,
    spendUsd: Math.round(spendUsd * 1e6) / 1e6,
  }
}
