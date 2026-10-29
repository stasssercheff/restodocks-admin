import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase-server'
import { addDaysYmd, parseHm, parseYmd, todayYmd, zonedDateTime } from '@/lib/query-range'

type AggPayload = {
  summary?: {
    requests?: number
    successRequests?: number
    failedRequests?: number
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    estimatedCostUsd?: number
  }
  byProvider?: Array<{ provider: string; requests: number; totalTokens: number; estimatedCostUsd: number }>
  byContext?: Array<{ context: string; requests: number; totalTokens: number; estimatedCostUsd: number }>
  byDay?: Array<{ date: string; requests: number; totalTokens: number; estimatedCostUsd: number }>
  recent?: unknown[]
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

  const { data, error } = await supabase.rpc('admin_ai_usage_stats', {
    p_from: fromIso,
    p_to: toIso,
    p_provider: provider,
    p_context: context,
    p_tz: tz,
    p_recent_limit: recentLimit,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const payload = (data ?? {}) as AggPayload
  const summary = payload.summary ?? {}
  const requests = Number(summary.requests) || 0
  const recent = Array.isArray(payload.recent) ? payload.recent : []

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
      totalRows: requests,
      aggregatedRows: requests,
      truncated: false,
      sampleSize: recent.length,
      limit: recentLimit,
      source: 'ai_usage_logs_sql',
    },
    summary: {
      requests,
      successRequests: Number(summary.successRequests) || 0,
      failedRequests: Number(summary.failedRequests) || 0,
      inputTokens: Number(summary.inputTokens) || 0,
      outputTokens: Number(summary.outputTokens) || 0,
      totalTokens: Number(summary.totalTokens) || 0,
      estimatedCostUsd: Number(summary.estimatedCostUsd) || 0,
    },
    byProvider: Array.isArray(payload.byProvider) ? payload.byProvider : [],
    byContext: Array.isArray(payload.byContext) ? payload.byContext : [],
    byDay: Array.isArray(payload.byDay) ? payload.byDay : [],
    recent,
  })
}
