import { createServiceClient, readEnv } from '@/lib/supabase-server'
import { addDaysYmd, parseHm, parseYmd, todayYmd, zonedDateTime } from '@/lib/query-range'
import {
  chooseUsageBucket,
  fillUsageSeries,
  type UsageBucket,
  type UsagePoint,
} from '@/lib/ai-usage-series'
import {
  formatMoneyBalance,
  pickPreferredBalance,
  type DeepseekBalanceRow,
} from '@/lib/provider-quota-format'
import { normalizeSnapshot, type BalanceSnapshot } from '@/lib/provider-wallet-math'
import { buildWalletSpendSeries } from '@/lib/provider-wallet-spend'
import type { SupabaseClient } from '@supabase/supabase-js'

export type { DeepseekBalanceRow }
export { formatMoneyBalance, pickPreferredBalance }
export type { UsageBucket, UsagePoint }

const SNAPSHOT_MIN_INTERVAL_MS = 2 * 60 * 1000

export type DayAgg = UsagePoint

export type ModelAgg = {
  model: string
  requests: number
  totalTokens: number
  estimatedCostUsd: number
}

export type EstablishmentAgg = {
  establishmentId: string | null
  name: string
  requests: number
  totalTokens: number
  estimatedCostUsd: number
}

export type ProviderPeriod = {
  requests: number
  totalTokens: number
  estimatedCostUsd: number
  bucket: UsageBucket
  /** Zero-filled series for the active bucket (hour or day). */
  series: UsagePoint[]
  byDay: DayAgg[]
  byHour: DayAgg[]
  byModel: ModelAgg[]
  byEstablishment: EstablishmentAgg[]
}

export type DeeplLiveUsage = {
  character_count: number
  character_limit: number
  remaining: number
  api_key_character_count: number | null
  api_key_character_limit: number | null
  host: string
}

export type ProviderQuotasPayload = {
  meta: {
    rangeFrom: string
    rangeTo: string
    rangeFromTime: string
    rangeToTime: string
    fromIso: string
    toIso: string
    timeZone: string
    chartBucket: UsageBucket
    liveFetchedAt: string | null
  }
  deepl: {
    live: DeeplLiveUsage | null
    liveError: string | null
    period: ProviderPeriod
  }
  deepseek: {
    live: { is_available: boolean; balances: DeepseekBalanceRow[] } | null
    liveError: string | null
    period: ProviderPeriod
    /** Real wallet deductions from /user/balance snapshots (matches prepaid spend). */
    wallet: {
      series: UsagePoint[]
      spendUsd: number
      trackedFrom: string | null
      snapshotCount: number
      currency: string
    }
  }
}

function emptyPeriod(bucket: UsageBucket = 'day'): ProviderPeriod {
  return {
    requests: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    bucket,
    series: [],
    byDay: [],
    byHour: [],
    byModel: [],
    byEstablishment: [],
  }
}

function asPoints(rows: unknown): UsagePoint[] {
  if (!Array.isArray(rows)) return []
  return rows.map(row => {
    const r = row as Record<string, unknown>
    return {
      date: String(r.date ?? ''),
      requests: Number(r.requests) || 0,
      totalTokens: Number(r.totalTokens) || 0,
      estimatedCostUsd: Number(r.estimatedCostUsd) || 0,
    }
  }).filter(r => r.date)
}

function asModels(rows: unknown): ModelAgg[] {
  if (!Array.isArray(rows)) return []
  return rows.map(row => {
    const r = row as Record<string, unknown>
    return {
      model: String(r.model ?? '(empty)'),
      requests: Number(r.requests) || 0,
      totalTokens: Number(r.totalTokens) || 0,
      estimatedCostUsd: Number(r.estimatedCostUsd) || 0,
    }
  })
}

function asEstablishments(rows: unknown): EstablishmentAgg[] {
  if (!Array.isArray(rows)) return []
  return rows.map(row => {
    const r = row as Record<string, unknown>
    const rawId = r.establishmentId
    const establishmentId =
      rawId == null || rawId === '' || rawId === 'null' ? null : String(rawId)
    return {
      establishmentId,
      name: String(r.name ?? '(unnamed)'),
      requests: Number(r.requests) || 0,
      totalTokens: Number(r.totalTokens) || 0,
      estimatedCostUsd: Number(r.estimatedCostUsd) || 0,
    }
  })
}

async function periodFromRpc(
  supabase: SupabaseClient,
  provider: string,
  fromIso: string,
  toIso: string,
  tz: string,
  bucket: UsageBucket,
): Promise<ProviderPeriod | { error: string }> {
  const { data, error } = await supabase.rpc('admin_ai_usage_stats', {
    p_from: fromIso,
    p_to: toIso,
    p_provider: provider,
    p_context: null,
    p_tz: tz,
    p_recent_limit: 1,
  })
  if (error) return { error: error.message }
  const payload = (data ?? {}) as {
    summary?: Record<string, number>
    byDay?: UsagePoint[]
    byHour?: UsagePoint[]
    byModel?: ModelAgg[]
    byEstablishment?: EstablishmentAgg[]
  }
  const summary = payload.summary ?? {}
  const byDay = asPoints(payload.byDay)
  const byHour = asPoints(payload.byHour)
  const byModel = asModels(payload.byModel)
  const byEstablishment = asEstablishments(payload.byEstablishment)
  const raw = bucket === 'hour' ? byHour : byDay
  return {
    requests: Number(summary.requests) || 0,
    totalTokens: Number(summary.totalTokens) || 0,
    estimatedCostUsd: Number(summary.estimatedCostUsd) || 0,
    bucket,
    series: fillUsageSeries(fromIso, toIso, tz, bucket, raw),
    byDay,
    byHour,
    byModel,
    byEstablishment,
  }
}

async function fetchLiveQuotas(): Promise<{
  fetchedAt: string | null
  deepl: { live: DeeplLiveUsage | null; liveError: string | null }
  deepseek: {
    live: { is_available: boolean; balances: DeepseekBalanceRow[] } | null
    liveError: string | null
  }
}> {
  const url = readEnv('SUPABASE_URL') || readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return {
      fetchedAt: null,
      deepl: { live: null, liveError: 'supabase_env_missing' },
      deepseek: { live: null, liveError: 'supabase_env_missing' },
    }
  }

  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/functions/v1/admin-provider-quotas`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({})) as {
      fetchedAt?: string
      deepl?: { ok?: boolean; usage?: DeeplLiveUsage; error?: string; detail?: string }
      deepseek?: {
        ok?: boolean
        balance?: { is_available: boolean; balances: DeepseekBalanceRow[] }
        error?: string
        detail?: string
      }
      error?: string
    }
    if (!res.ok) {
      const err = typeof json.error === 'string' ? json.error : `edge_http_${res.status}`
      return {
        fetchedAt: null,
        deepl: { live: null, liveError: err },
        deepseek: { live: null, liveError: err },
      }
    }

    const deeplOk = json.deepl?.ok === true && json.deepl.usage
    const deepseekOk = json.deepseek?.ok === true && json.deepseek.balance
    return {
      fetchedAt: typeof json.fetchedAt === 'string' ? json.fetchedAt : new Date().toISOString(),
      deepl: {
        live: deeplOk ? json.deepl!.usage! : null,
        liveError: deeplOk
          ? null
          : [json.deepl?.error, json.deepl?.detail].filter(Boolean).join(': ') || 'deepl_unavailable',
      },
      deepseek: {
        live: deepseekOk ? json.deepseek!.balance! : null,
        liveError: deepseekOk
          ? null
          : [json.deepseek?.error, json.deepseek?.detail].filter(Boolean).join(': ') || 'deepseek_unavailable',
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      fetchedAt: null,
      deepl: { live: null, liveError: msg },
      deepseek: { live: null, liveError: msg },
    }
  }
}

async function maybeRecordDeepseekSnapshot(
  supabase: SupabaseClient,
  live: { is_available: boolean; balances: DeepseekBalanceRow[] } | null,
  fetchedAt: string | null,
): Promise<BalanceSnapshot | null> {
  const preferred = pickPreferredBalance(live?.balances)
  if (!preferred) return null
  const nowIso = fetchedAt || new Date().toISOString()
  const current = normalizeSnapshot({
    captured_at: nowIso,
    currency: preferred.currency,
    total_balance: preferred.total_balance,
    granted_balance: preferred.granted_balance,
    topped_up_balance: preferred.topped_up_balance,
  })

  const { data: lastRows } = await supabase
    .from('provider_balance_snapshots')
    .select('captured_at, currency, total_balance, granted_balance, topped_up_balance')
    .eq('provider', 'deepseek')
    .eq('currency', current.currency)
    .order('captured_at', { ascending: false })
    .limit(1)

  const last = lastRows?.[0]
    ? normalizeSnapshot(lastRows[0] as {
      captured_at: string
      currency: string
      total_balance: unknown
      granted_balance: unknown
      topped_up_balance: unknown
    })
    : null

  const ageMs = last ? Date.parse(nowIso) - Date.parse(last.captured_at) : Number.POSITIVE_INFINITY
  const changed =
    !last
    || Math.abs(last.total_balance - current.total_balance) >= 0.01
    || Math.abs(last.topped_up_balance - current.topped_up_balance) >= 0.01
    || Math.abs(last.granted_balance - current.granted_balance) >= 0.01

  if (!last || ageMs >= SNAPSHOT_MIN_INTERVAL_MS || changed) {
    const { error } = await supabase.from('provider_balance_snapshots').insert({
      provider: 'deepseek',
      currency: current.currency,
      captured_at: nowIso,
      total_balance: current.total_balance,
      granted_balance: current.granted_balance,
      topped_up_balance: current.topped_up_balance,
      is_available: live?.is_available !== false,
    })
    if (error) {
      console.error('[provider-quotas] snapshot insert failed', error.message)
    }
  }

  return current
}

async function loadDeepseekSnapshots(
  supabase: SupabaseClient,
  fromIso: string,
  toIso: string,
  currency: string,
): Promise<BalanceSnapshot[]> {
  // Include a little lookback so the first bucket has a previous end-of-bucket start.
  const lookbackMs = 36 * 60 * 60 * 1000
  const fromLookback = new Date(Date.parse(fromIso) - lookbackMs).toISOString()
  const { data, error } = await supabase
    .from('provider_balance_snapshots')
    .select('captured_at, currency, total_balance, granted_balance, topped_up_balance')
    .eq('provider', 'deepseek')
    .eq('currency', currency)
    .gte('captured_at', fromLookback)
    .lte('captured_at', toIso)
    .order('captured_at', { ascending: true })
    .limit(5000)
  if (error || !data) return []
  return data.map(row => normalizeSnapshot(row as {
    captured_at: string
    currency: string
    total_balance: unknown
    granted_balance: unknown
    topped_up_balance: unknown
  }))
}

export async function buildProviderQuotas(opts: {
  tz?: string | null
  from?: string | null
  to?: string | null
  fromTime?: string | null
  toTime?: string | null
}): Promise<ProviderQuotasPayload | { error: string }> {
  const tz = opts.tz?.trim() || 'UTC'
  const rangeFrom = parseYmd(opts.from ?? null) || addDaysYmd(todayYmd(tz), -30)
  const rangeTo = parseYmd(opts.to ?? null) || todayYmd(tz)
  const rangeFromTime = parseHm(opts.fromTime ?? null, '00:00')
  const rangeToTime = parseHm(opts.toTime ?? null, '23:59')
  const fromIso = zonedDateTime(rangeFrom, rangeFromTime, tz).toISOString()
  const toIso = zonedDateTime(rangeTo, rangeToTime, tz, true).toISOString()
  const chartBucket = chooseUsageBucket(fromIso, toIso)

  const supabase = createServiceClient()
  if ('error' in supabase) return { error: supabase.error }

  const [live, deeplPeriod, deepseekPeriod] = await Promise.all([
    fetchLiveQuotas(),
    periodFromRpc(supabase, 'deepl', fromIso, toIso, tz, chartBucket),
    periodFromRpc(supabase, 'deepseek', fromIso, toIso, tz, chartBucket),
  ])

  if ('error' in deeplPeriod) return { error: deeplPeriod.error }
  if ('error' in deepseekPeriod) return { error: deepseekPeriod.error }

  const preferred = pickPreferredBalance(live.deepseek.live?.balances)
  const currency = (preferred?.currency || 'USD').toUpperCase()
  const liveSnap = await maybeRecordDeepseekSnapshot(
    supabase,
    live.deepseek.live,
    live.fetchedAt,
  )
  const snapshots = await loadDeepseekSnapshots(supabase, fromIso, toIso, currency)
  // Close the open window with the freshest live balance when it falls inside the range.
  const liveEnd =
    liveSnap && Date.parse(liveSnap.captured_at) <= Date.parse(toIso) + 60_000
      ? liveSnap
      : null
  const wallet = buildWalletSpendSeries({
    snapshots,
    fromIso,
    toIso,
    timeZone: tz,
    bucket: chartBucket,
    liveEnd,
  })

  return {
    meta: {
      rangeFrom,
      rangeTo,
      rangeFromTime,
      rangeToTime,
      fromIso,
      toIso,
      timeZone: tz,
      chartBucket,
      liveFetchedAt: live.fetchedAt,
    },
    deepl: {
      live: live.deepl.live,
      liveError: live.deepl.liveError,
      period: deeplPeriod,
    },
    deepseek: {
      live: live.deepseek.live,
      liveError: live.deepseek.liveError,
      period: deepseekPeriod ?? emptyPeriod(chartBucket),
      wallet: {
        series: wallet.series,
        spendUsd: wallet.spendUsd,
        trackedFrom: wallet.trackedFrom,
        snapshotCount: snapshots.length + (liveEnd ? 1 : 0),
        currency,
      },
    },
  }
}
