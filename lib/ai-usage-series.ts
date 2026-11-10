/** Chart bucket + zero-filled series for AI usage bars. */

export type UsageBucket = 'hour' | 'day'

export type UsagePoint = {
  date: string
  requests: number
  totalTokens: number
  estimatedCostUsd: number
}

/** Prefer hourly bars when the window is ≤ 48 hours (DeepSeek-style). */
export const HOUR_BUCKET_MAX_MS = 48 * 60 * 60 * 1000

export function chooseUsageBucket(fromIso: string, toIso: string): UsageBucket {
  const from = Date.parse(fromIso)
  const to = Date.parse(toIso)
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return 'day'
  return to - from <= HOUR_BUCKET_MAX_MS ? 'hour' : 'day'
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** Format instant as YYYY-MM-DD or YYYY-MM-DD HH:00 in a timezone. */
export function formatInTimeZone(isoOrMs: string | number, timeZone: string, bucket: UsageBucket): string {
  const d = typeof isoOrMs === 'number' ? new Date(isoOrMs) : new Date(isoOrMs)
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d)
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
    const ymd = `${get('year')}-${get('month')}-${get('day')}`
    if (bucket === 'day') return ymd
    return `${ymd} ${get('hour')}:00`
  } catch {
    const iso = d.toISOString()
    if (bucket === 'day') return iso.slice(0, 10)
    return `${iso.slice(0, 10)} ${iso.slice(11, 13)}:00`
  }
}

function emptyPoint(date: string): UsagePoint {
  return { date, requests: 0, totalTokens: 0, estimatedCostUsd: 0 }
}

/**
 * Zero-fill day or hour slots between fromIso and toIso (inclusive of start hour/day).
 * Caps at 800 points to keep Worker payloads small.
 */
export function fillUsageSeries(
  fromIso: string,
  toIso: string,
  timeZone: string,
  bucket: UsageBucket,
  rows: UsagePoint[],
): UsagePoint[] {
  const from = Date.parse(fromIso)
  const to = Date.parse(toIso)
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
    return [...rows].sort((a, b) => a.date.localeCompare(b.date))
  }

  const byKey = new Map(rows.map(r => [r.date, {
    date: r.date,
    requests: Number(r.requests) || 0,
    totalTokens: Number(r.totalTokens) || 0,
    estimatedCostUsd: Number(r.estimatedCostUsd) || 0,
  }]))

  const stepMs = bucket === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const maxPoints = 800
  const out: UsagePoint[] = []

  // Align cursor to bucket start in the target zone by formatting then reconstructing roughly via steps.
  let cursor = from
  let guard = 0
  while (cursor <= to && guard < maxPoints) {
    const key = formatInTimeZone(cursor, timeZone, bucket)
    if (!out.length || out[out.length - 1].date !== key) {
      out.push(byKey.get(key) ?? emptyPoint(key))
    }
    cursor += stepMs
    guard += 1
  }

  // Ensure the end bucket is present (timezone edge cases).
  const endKey = formatInTimeZone(to, timeZone, bucket)
  if (!out.length || out[out.length - 1].date !== endKey) {
    out.push(byKey.get(endKey) ?? emptyPoint(endKey))
  }

  return out
}

/** DeepSeek-style label: "09:00~10:00" or "2026-11-10". */
export function formatBucketLabel(dateKey: string, bucket: UsageBucket): string {
  if (bucket === 'day') return dateKey
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):00$/.exec(dateKey)
  if (!m) return dateKey
  const hour = Number(m[2])
  const next = (hour + 1) % 24
  return `${pad2(hour)}:00~${pad2(next)}:00`
}

export function formatBucketTooltip(
  point: UsagePoint,
  bucket: UsageBucket,
  valueKey: 'estimatedCostUsd' | 'totalTokens' | 'requests',
): string {
  const label = formatBucketLabel(point.date, bucket)
  const dayPrefix = bucket === 'hour' && point.date.length >= 10 ? `${point.date.slice(0, 10)} · ` : ''
  if (valueKey === 'estimatedCostUsd') {
    return `${dayPrefix}${label}\n$${point.estimatedCostUsd.toFixed(4)}\n${point.requests} req · ${point.totalTokens} tok`
  }
  if (valueKey === 'totalTokens') {
    return `${dayPrefix}${label}\n${point.totalTokens} tok\n$${point.estimatedCostUsd.toFixed(4)}`
  }
  return `${dayPrefix}${label}\n${point.requests} req\n$${point.estimatedCostUsd.toFixed(4)}`
}

/** Local wall-clock parts for "last hour" / "today so far" presets. */
export function wallClockParts(timeZone: string, at = new Date()): {
  ymd: string
  hm: string
  hour: number
  minute: number
} {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at)
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
    const hour = Number(get('hour'))
    const minute = Number(get('minute'))
    return {
      ymd: `${get('year')}-${get('month')}-${get('day')}`,
      hm: `${pad2(hour)}:${pad2(minute)}`,
      hour,
      minute,
    }
  } catch {
    const iso = at.toISOString()
    return {
      ymd: iso.slice(0, 10),
      hm: iso.slice(11, 16),
      hour: Number(iso.slice(11, 13)),
      minute: Number(iso.slice(14, 16)),
    }
  }
}

export function lastHourPreset(timeZone: string, at = new Date()): {
  from: string
  to: string
  fromTime: string
  toTime: string
} {
  const end = wallClockParts(timeZone, at)
  const start = wallClockParts(timeZone, new Date(at.getTime() - 60 * 60 * 1000))
  return {
    from: start.ymd,
    to: end.ymd,
    fromTime: start.hm,
    toTime: end.hm === '00:00' && start.ymd !== end.ymd ? '23:59' : end.hm,
  }
}

export function todaySoFarPreset(timeZone: string, at = new Date()): {
  from: string
  to: string
  fromTime: string
  toTime: string
} {
  const now = wallClockParts(timeZone, at)
  return {
    from: now.ymd,
    to: now.ymd,
    fromTime: '00:00',
    toTime: now.hm === '00:00' ? '00:01' : now.hm,
  }
}
