export type VisitEvent = {
  id: number
  created_at: string
  session_id: string | null
  event_type: string | null
  path: string | null
  language_code: string | null
  client_host: string | null
  ip: string | null
  country_code: string | null
  region: string | null
  city: string | null
  timezone: string | null
  location_label: string | null
  visitor_kind: string | null
  visitor_hint: string | null
  viewport_width?: number | null
  viewport_height?: number | null
  session_active?: boolean
}

/** One step in a visit timeline (chronological, oldest → newest). */
export type VisitTimelineStep = {
  event: VisitEvent
  /** ms since previous step; null for the first event. */
  gapFromPrevMs: number | null
  /** ms since the first event of the visit. */
  elapsedFromStartMs: number
}

export type VisitSession = {
  key: string
  session_id: string | null
  first_at: string
  last_at: string
  /** last_at − first_at in ms (0 for a single event). */
  durationMs: number
  event_count: number
  events: VisitEvent[]
  /** Chronological steps with gaps between events. */
  timeline: VisitTimelineStep[]
  event_types: string[]
  ip: string | null
  city: string | null
  region: string | null
  country_code: string | null
  location_label: string | null
  timezone: string | null
  language_code: string | null
  client_host: string | null
  visitor_kind: string | null
  visitor_hint: string | null
  session_active: boolean
}

function sessionKey(row: VisitEvent): string {
  const sid = (row.session_id ?? '').trim()
  if (sid) return `s:${sid}`
  // Fallback for rows without session_id: group by IP + coarse time bucket (30 min) + host
  const ip = (row.ip ?? '').trim() || 'no-ip'
  const host = (row.client_host ?? '').trim() || 'no-host'
  const bucket = Math.floor(new Date(row.created_at).getTime() / (30 * 60 * 1000))
  return `f:${ip}|${host}|${bucket}`
}

function buildTimeline(sortedOldestFirst: VisitEvent[]): VisitTimelineStep[] {
  if (sortedOldestFirst.length === 0) return []
  const start = new Date(sortedOldestFirst[0].created_at).getTime()
  let prev = start
  return sortedOldestFirst.map((event, index) => {
    const at = new Date(event.created_at).getTime()
    const step: VisitTimelineStep = {
      event,
      gapFromPrevMs: index === 0 ? null : Math.max(0, at - prev),
      elapsedFromStartMs: Math.max(0, at - start),
    }
    prev = at
    return step
  })
}

/**
 * Compact duration for UI: `12с`, `3м 20с`, `1ч 5м`.
 * Uses short units so rows stay readable in RU and EN.
 */
export function formatDurationMs(ms: number | null | undefined, locale: string = 'ru'): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.round(ms / 1000)
  const ru = locale.toLowerCase().startsWith('ru')
  if (totalSec < 60) return ru ? `${totalSec} с` : `${totalSec}s`
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (hours > 0) {
    if (minutes === 0) return ru ? `${hours} ч` : `${hours}h`
    return ru ? `${hours} ч ${minutes} м` : `${hours}h ${minutes}m`
  }
  if (seconds === 0 || minutes >= 10) return ru ? `${minutes} м` : `${minutes}m`
  return ru ? `${minutes} м ${seconds} с` : `${minutes}m ${seconds}s`
}

/** Heuristic pace label from total visit span (only when ≥2 events). */
export function visitPace(
  durationMs: number,
  eventCount: number,
): 'quick' | 'normal' | 'slow' | null {
  if (eventCount < 2) return null
  if (durationMs < 45_000) return 'quick'
  if (durationMs >= 3 * 60_000) return 'slow'
  return 'normal'
}

/** Group flat marketing_visits rows into one card per visitor session. */
export function groupVisitSessions(rows: VisitEvent[]): VisitSession[] {
  const map = new Map<string, VisitEvent[]>()
  for (const row of rows) {
    const key = sessionKey(row)
    const list = map.get(key)
    if (list) list.push(row)
    else map.set(key, [row])
  }

  const sessions: VisitSession[] = []
  for (const [key, events] of map) {
    const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at))
    const newest = sorted[sorted.length - 1]
    const oldest = sorted[0]
    const types: string[] = []
    for (const event of sorted) {
      const type = (event.event_type ?? '').trim()
      if (type && !types.includes(type)) types.push(type)
    }
    const firstMs = new Date(oldest.created_at).getTime()
    const lastMs = new Date(newest.created_at).getTime()
    const durationMs = Number.isFinite(firstMs) && Number.isFinite(lastMs)
      ? Math.max(0, lastMs - firstMs)
      : 0
    const timeline = buildTimeline(sorted)
    sessions.push({
      key,
      session_id: (newest.session_id ?? '').trim() || null,
      first_at: oldest.created_at,
      last_at: newest.created_at,
      durationMs,
      event_count: sorted.length,
      events: [...sorted].reverse(), // newest first inside the card
      timeline,
      event_types: types,
      ip: newest.ip,
      city: newest.city,
      region: newest.region,
      country_code: newest.country_code,
      location_label: newest.location_label,
      timezone: newest.timezone,
      language_code: newest.language_code,
      client_host: newest.client_host,
      visitor_kind: newest.visitor_kind,
      visitor_hint: newest.visitor_hint,
      session_active: sorted.some(item => item.session_active),
    })
  }

  return sessions.sort((a, b) => b.last_at.localeCompare(a.last_at))
}
