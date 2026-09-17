import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { createServiceClient, fetchAllRows } from '@/lib/supabase-server'
import { addDaysYmd, parseHm, parseYmd, todayYmd, zonedDateTime } from '@/lib/query-range'

type UsageRow = {
  created_at: string
  provider: string | null
  model: string | null
  context: string | null
  function_name: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  estimated_cost_usd: number | null
  status: string | null
}

const AGG_CAP = 5000

function num(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'ai_usage')
  if ('response' in auth) return auth.response

  const url = req.nextUrl
  const tz = url.searchParams.get('tz') || 'UTC'
  const provider = url.searchParams.get('provider')?.trim().toLowerCase() || null
  const context = url.searchParams.get('context')?.trim().toLowerCase() || null
  const recentLimit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get('limit') || '200', 10) || 200))
  const rangeFrom = parseYmd(url.searchParams.get('from')) || addDaysYmd(todayYmd(tz), -30)
  const rangeTo = parseYmd(url.searchParams.get('to')) || todayYmd(tz)
  const fromTime = url.searchParams.has('fromTime') ? parseHm(url.searchParams.get('fromTime'), '00:00') : null
  const toTime = url.searchParams.has('toTime') ? parseHm(url.searchParams.get('toTime'), '23:59') : null
  const fromIso = zonedDateTime(rangeFrom, fromTime || '00:00', tz).toISOString()
  const toIso = zonedDateTime(rangeTo, toTime || '23:59', tz, true).toISOString()

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const fetched = await fetchAllRows<UsageRow>((from, to) => {
    let query = supabase
      .from('ai_usage_logs')
      .select('created_at, provider, model, context, function_name, input_tokens, output_tokens, total_tokens, estimated_cost_usd, status')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: false })
    if (provider) query = query.eq('provider', provider)
    if (context) query = query.eq('context', context)
    return query.range(from, to)
  }, 1000, AGG_CAP + 1)
  if ('error' in fetched) return NextResponse.json({ error: fetched.error }, { status: 500 })

  const truncated = fetched.data.length > AGG_CAP
  const rows = fetched.data.slice(0, AGG_CAP)
  const byProvider = new Map<string, { requests: number; totalTokens: number; estimatedCostUsd: number }>()
  const byContext = new Map<string, { requests: number; totalTokens: number; estimatedCostUsd: number }>()
  const byDay = new Map<string, { requests: number; totalTokens: number; estimatedCostUsd: number }>()
  let requests = 0
  let successRequests = 0
  let failedRequests = 0
  let inputTokens = 0
  let outputTokens = 0
  let totalTokens = 0
  let estimatedCostUsd = 0

  for (const row of rows) {
    requests += 1
    const status = String(row.status ?? 'ok').toLowerCase()
    if (status === 'ok' || status === 'success') successRequests += 1
    else failedRequests += 1
    inputTokens += num(row.input_tokens)
    outputTokens += num(row.output_tokens)
    totalTokens += num(row.total_tokens)
    estimatedCostUsd += num(row.estimated_cost_usd)

    const p = row.provider || '(empty)'
    const c = row.context || '(empty)'
    const day = row.created_at.slice(0, 10)
    const add = (map: Map<string, { requests: number; totalTokens: number; estimatedCostUsd: number }>, key: string) => {
      const current = map.get(key) ?? { requests: 0, totalTokens: 0, estimatedCostUsd: 0 }
      current.requests += 1
      current.totalTokens += num(row.total_tokens)
      current.estimatedCostUsd += num(row.estimated_cost_usd)
      map.set(key, current)
    }
    add(byProvider, p)
    add(byContext, c)
    add(byDay, day)
  }

  const sortAgg = (map: Map<string, { requests: number; totalTokens: number; estimatedCostUsd: number }>, keyName: string) =>
    [...map.entries()]
      .sort((a, b) => b[1].requests - a[1].requests)
      .map(([key, value]) => ({ [keyName]: key, ...value }))

  return NextResponse.json({
    meta: {
      days: Math.max(1, Math.round((new Date(rangeTo).getTime() - new Date(rangeFrom).getTime()) / 86400000) + 1),
      provider,
      context,
      fromIso,
      toIso,
      date: null,
      rangeFrom,
      rangeTo,
      rangeFromTime: fromTime,
      rangeToTime: toTime,
      timeZone: tz,
      totalRows: truncated ? AGG_CAP + 1 : rows.length,
      aggregatedRows: rows.length,
      truncated,
      sampleSize: Math.min(recentLimit, rows.length),
      limit: recentLimit,
    },
    summary: {
      requests,
      successRequests,
      failedRequests,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd: Math.round(estimatedCostUsd * 1e6) / 1e6,
    },
    byProvider: sortAgg(byProvider, 'provider'),
    byContext: sortAgg(byContext, 'context'),
    byDay: [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, ...value })),
    recent: rows.slice(0, recentLimit),
  })
}
