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

export type VisitSession = {
  key: string
  session_id: string | null
  first_at: string
  last_at: string
  event_count: number
  events: VisitEvent[]
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
    sessions.push({
      key,
      session_id: (newest.session_id ?? '').trim() || null,
      first_at: oldest.created_at,
      last_at: newest.created_at,
      event_count: sorted.length,
      events: [...sorted].reverse(), // newest first inside the card
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
