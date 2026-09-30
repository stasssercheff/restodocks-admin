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

/** Same type+path within this window = double-fire, keep one. */
export const DUP_EVENT_WINDOW_MS = 2_000
/**
 * Sessions with the same IP whose time ranges are this close are one person
 * (new session_id on refresh / double mount), not two visitors.
 */
export const MERGE_SAME_IP_WINDOW_MS = 5_000

function sessionKey(row: VisitEvent): string {
  const sid = (row.session_id ?? '').trim()
  if (sid) return `s:${sid}`
  // Fallback without session_id: IP + 30‑min bucket (host ignored — preview URLs differ)
  const ip = normalizeIp(row.ip) || 'no-ip'
  const bucket = Math.floor(new Date(row.created_at).getTime() / (30 * 60 * 1000))
  return `f:${ip}|${bucket}`
}

function normalizeIp(ip: string | null | undefined): string {
  return (ip ?? '').trim().toLowerCase()
}

function eventFingerprint(event: VisitEvent): string {
  return [
    (event.event_type ?? '').trim().toLowerCase(),
    (event.path ?? '').trim().toLowerCase(),
    (event.language_code ?? '').trim().toLowerCase(),
  ].join('|')
}

/** Drop near-identical double-fires (same action, same second/couple seconds). */
export function dedupeNearDuplicateEvents(events: VisitEvent[]): VisitEvent[] {
  const sorted = [...events].sort((a, b) => {
    const byTime = a.created_at.localeCompare(b.created_at)
    if (byTime) return byTime
    return a.id - b.id
  })
  const kept: VisitEvent[] = []
  for (const event of sorted) {
    const prev = kept[kept.length - 1]
    if (prev) {
      const dt = Math.abs(new Date(event.created_at).getTime() - new Date(prev.created_at).getTime())
      if (dt <= DUP_EVENT_WINDOW_MS && eventFingerprint(event) === eventFingerprint(prev)) {
        // Prefer the row that still has session_active / richer visitor hint.
        if (!prev.session_active && event.session_active) kept[kept.length - 1] = event
        else if (!(prev.visitor_hint || '').trim() && (event.visitor_hint || '').trim()) kept[kept.length - 1] = event
        continue
      }
    }
    kept.push(event)
  }
  return kept
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

function buildSession(key: string, events: VisitEvent[]): VisitSession {
  const deduped = dedupeNearDuplicateEvents(events)
  const sorted = [...deduped].sort((a, b) => a.created_at.localeCompare(b.created_at))
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
  const sessionIds = [...new Set(sorted.map(item => (item.session_id ?? '').trim()).filter(Boolean))]
  return {
    key,
    session_id: sessionIds[0] ?? null,
    first_at: oldest.created_at,
    last_at: newest.created_at,
    durationMs,
    event_count: sorted.length,
    events: [...sorted].reverse(),
    timeline: buildTimeline(sorted),
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
  }
}

function sessionGapMs(a: VisitSession, b: VisitSession): number {
  const a0 = new Date(a.first_at).getTime()
  const a1 = new Date(a.last_at).getTime()
  const b0 = new Date(b.first_at).getTime()
  const b1 = new Date(b.last_at).getTime()
  if (a1 < b0) return b0 - a1
  if (b1 < a0) return a0 - b1
  return 0 // overlap
}

/**
 * Merge same-IP sessions that start/end within a few seconds of each other.
 * Fixes double session_id at the exact same second (React double-mount / refresh).
 */
export function mergeNearbySameIpSessions(
  sessions: VisitSession[],
  windowMs: number = MERGE_SAME_IP_WINDOW_MS,
): VisitSession[] {
  if (sessions.length <= 1) return sessions

  const byIp = new Map<string, VisitSession[]>()
  const noIp: VisitSession[] = []
  for (const session of sessions) {
    const ip = normalizeIp(session.ip)
    if (!ip) {
      noIp.push(session)
      continue
    }
    const list = byIp.get(ip)
    if (list) list.push(session)
    else byIp.set(ip, [session])
  }

  const merged: VisitSession[] = [...noIp]
  for (const [, group] of byIp) {
    const ordered = [...group].sort((a, b) => a.first_at.localeCompare(b.first_at))
    const clusters: VisitSession[][] = []
    for (const session of ordered) {
      const lastCluster = clusters[clusters.length - 1]
      if (!lastCluster) {
        clusters.push([session])
        continue
      }
      const clusterSession = buildSession(
        lastCluster.map(item => item.key).join('+'),
        lastCluster.flatMap(item => item.events),
      )
      if (sessionGapMs(clusterSession, session) <= windowMs) {
        lastCluster.push(session)
      } else {
        clusters.push([session])
      }
    }
    for (const cluster of clusters) {
      if (cluster.length === 1) {
        merged.push(cluster[0])
        continue
      }
      const events = cluster.flatMap(item => item.events)
      const key = `m:${normalizeIp(cluster[0].ip)}:${cluster.map(item => item.key).sort().join('+')}`
      merged.push(buildSession(key, events))
    }
  }

  return merged.sort((a, b) => b.last_at.localeCompare(a.last_at))
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

  const provisional: VisitSession[] = []
  for (const [key, events] of map) {
    provisional.push(buildSession(key, events))
  }

  return mergeNearbySameIpSessions(provisional)
}
