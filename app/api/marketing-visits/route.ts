import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { parseExcludeIps, rowIpIsExcluded } from '@/lib/exclude-ips'
import { isMarketingHostMode, matchesMarketingHost } from '@/lib/marketing-host'
import { createServiceClient, fetchAllRows } from '@/lib/supabase-server'
import { addDaysYmd, parseYmd, todayYmd, zonedDateTime } from '@/lib/query-range'

type VisitRow = {
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
  user_agent: string | null
  referrer: string | null
  viewport_width: number | null
  viewport_height: number | null
  visitor_kind: string | null
  visitor_hint: string | null
}

function countMap(rows: VisitRow[], keyFn: (row: VisitRow) => string) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = keyFn(row) || '(empty)'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }))
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'marketing_visits')
  if ('response' in auth) return auth.response

  const url = req.nextUrl
  const daysParam = parseInt(url.searchParams.get('days') || '', 10)
  const rangeTo = parseYmd(url.searchParams.get('to')) || todayYmd()
  const rangeFrom = parseYmd(url.searchParams.get('from'))
    || addDaysYmd(rangeTo, Number.isFinite(daysParam) && daysParam > 0 ? -daysParam + 1 : -30)
  const path = url.searchParams.get('path')?.trim() || null
  const host = url.searchParams.get('host')?.trim() || 'all'
  const excludeBots = url.searchParams.get('excludeBots') === '1'
  const excludeIps = parseExcludeIps(url.searchParams.get('excludeIps') || '')
  const limit = Math.min(5000, Math.max(1, parseInt(url.searchParams.get('limit') || '2000', 10) || 2000))
  const fromIso = zonedDateTime(rangeFrom, '00:00', 'UTC').toISOString()
  const toIso = zonedDateTime(rangeTo, '23:59', 'UTC', true).toISOString()

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const hostIsMode = isMarketingHostMode(host)
  const overFetch = excludeIps.length > 0 || hostIsMode
  const fetched = await fetchAllRows<VisitRow>((from, to) => {
    let query = supabase
      .from('marketing_visits')
      .select('id, created_at, session_id, event_type, path, language_code, client_host, ip, country_code, region, city, timezone, location_label, user_agent, referrer, viewport_width, viewport_height, visitor_kind, visitor_hint')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: false })
    if (path) query = query.eq('path', path)
    // Presets (prod / not_beta / beta) are modes, not literal hostnames.
    if (host && !hostIsMode) query = query.eq('client_host', host)
    if (excludeBots) query = query.neq('visitor_kind', 'bot')
    return query.range(from, to)
  }, 1000, overFetch ? limit * 3 : limit)
  if ('error' in fetched) return NextResponse.json({ error: fetched.error }, { status: 500 })
  const excluded = new Set(excludeIps)
  const rows = fetched.data
    .filter(row => matchesMarketingHost(row.client_host, host))
    .filter(row => !rowIpIsExcluded(row.ip, excluded))
    .slice(0, limit)

  const lastActivityBySession = new Map<string, string>()
  for (const row of rows) {
    const sid = (row.session_id ?? '').trim()
    if (!sid) continue
    const prev = lastActivityBySession.get(sid)
    if (!prev || row.created_at > prev) lastActivityBySession.set(sid, row.created_at)
  }
  const activeWindowMs = 15 * 60 * 1000
  const now = Date.now()
  const activeSessionIds = [...lastActivityBySession.entries()]
    .filter(([, at]) => now - new Date(at).getTime() <= activeWindowMs)
    .map(([sid]) => sid)
  const uniqueSessions = lastActivityBySession.size

  return NextResponse.json({
    meta: {
      days: Math.max(1, Math.round((new Date(rangeTo).getTime() - new Date(rangeFrom).getTime()) / 86400000) + 1),
      path,
      host,
      excludeIps,
      excludeBots,
      fromIso,
      toIso,
      date: null,
      rangeFrom,
      rangeTo,
      sampleSize: rows.length,
      limit,
      activeWindowMinutes: 15,
      activeSessionCount: activeSessionIds.length,
    },
    summary: {
      visits: rows.length,
      uniqueSessions,
      activeSessions: activeSessionIds.length,
    },
    byPath: countMap(rows, row => row.path ?? '').map(({ key, count }) => ({ path: key, count })),
    byLanguage: countMap(rows, row => row.language_code ?? '').map(({ key, count }) => ({ language_code: key, count })),
    byEventType: countMap(rows, row => row.event_type ?? '').map(({ key, count }) => ({ event_type: key, count })),
    byVisitorKind: countMap(rows, row => row.visitor_kind ?? '').map(({ key, count }) => ({ visitor_kind: key, count })),
    byDay: countMap(rows, row => row.created_at.slice(0, 10))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, count }) => ({ date: key, count })),
    activeSessionIds,
    recent: rows.map(row => {
      const sid = (row.session_id ?? '').trim()
      const last = sid ? lastActivityBySession.get(sid) : null
      const sessionActive = !!(sid && last && now - new Date(last).getTime() <= activeWindowMs)
      return { ...row, session_active: sessionActive }
    }),
  })
}
