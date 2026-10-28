import { createServiceClient, fetchAllRows, readEnv } from '@/lib/supabase-server'
import { addDaysYmd, parseYmd, todayYmd, zonedDateTime } from '@/lib/query-range'
import type { DeepseekBalanceRow } from '@/lib/provider-quota-format'

export type { DeepseekBalanceRow }
export { formatMoneyBalance, pickPreferredBalance } from '@/lib/provider-quota-format'

export type DayAgg = {
  date: string
  requests: number
  totalTokens: number
  estimatedCostUsd: number
}

export type ProviderPeriod = {
  requests: number
  totalTokens: number
  estimatedCostUsd: number
  byDay: DayAgg[]
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
    fromIso: string
    toIso: string
    timeZone: string
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
  }
}

type UsageRow = {
  created_at: string
  provider: string | null
  total_tokens: number | null
  estimated_cost_usd: number | null
}

function num(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function emptyPeriod(): ProviderPeriod {
  return { requests: 0, totalTokens: 0, estimatedCostUsd: 0, byDay: [] }
}

function aggregateProvider(rows: UsageRow[], provider: string): ProviderPeriod {
  const byDay = new Map<string, DayAgg>()
  let requests = 0
  let totalTokens = 0
  let estimatedCostUsd = 0
  const needle = provider.toLowerCase()
  for (const row of rows) {
    if (String(row.provider ?? '').toLowerCase() !== needle) continue
    requests += 1
    totalTokens += num(row.total_tokens)
    estimatedCostUsd += num(row.estimated_cost_usd)
    const date = row.created_at.slice(0, 10)
    const cur = byDay.get(date) ?? { date, requests: 0, totalTokens: 0, estimatedCostUsd: 0 }
    cur.requests += 1
    cur.totalTokens += num(row.total_tokens)
    cur.estimatedCostUsd += num(row.estimated_cost_usd)
    byDay.set(date, cur)
  }
  return {
    requests,
    totalTokens,
    estimatedCostUsd: Math.round(estimatedCostUsd * 1e6) / 1e6,
    byDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
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

export async function buildProviderQuotas(opts: {
  tz?: string | null
  from?: string | null
  to?: string | null
}): Promise<ProviderQuotasPayload | { error: string }> {
  const tz = opts.tz?.trim() || 'UTC'
  const rangeFrom = parseYmd(opts.from ?? null) || addDaysYmd(todayYmd(tz), -30)
  const rangeTo = parseYmd(opts.to ?? null) || todayYmd(tz)
  const fromIso = zonedDateTime(rangeFrom, '00:00', tz).toISOString()
  const toIso = zonedDateTime(rangeTo, '23:59', tz, true).toISOString()

  const supabase = createServiceClient()
  if ('error' in supabase) return { error: supabase.error }

  const [live, fetched] = await Promise.all([
    fetchLiveQuotas(),
    fetchAllRows<UsageRow>((from, to) =>
      supabase
        .from('ai_usage_logs')
        .select('created_at, provider, total_tokens, estimated_cost_usd')
        .in('provider', ['deepl', 'deepseek'])
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .range(from, to)
    , 1000, 20000),
  ])

  if ('error' in fetched) return { error: fetched.error }

  return {
    meta: {
      rangeFrom,
      rangeTo,
      fromIso,
      toIso,
      timeZone: tz,
      liveFetchedAt: live.fetchedAt,
    },
    deepl: {
      live: live.deepl.live,
      liveError: live.deepl.liveError,
      period: aggregateProvider(fetched.data, 'deepl'),
    },
    deepseek: {
      live: live.deepseek.live,
      liveError: live.deepseek.liveError,
      period: aggregateProvider(fetched.data, 'deepseek') || emptyPeriod(),
    },
  }
}
