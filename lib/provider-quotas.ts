import { createServiceClient, readEnv } from '@/lib/supabase-server'
import { addDaysYmd, parseYmd, todayYmd, zonedDateTime } from '@/lib/query-range'
import type { DeepseekBalanceRow } from '@/lib/provider-quota-format'
import type { SupabaseClient } from '@supabase/supabase-js'

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

function emptyPeriod(): ProviderPeriod {
  return { requests: 0, totalTokens: 0, estimatedCostUsd: 0, byDay: [] }
}

async function periodFromRpc(
  supabase: SupabaseClient,
  provider: string,
  fromIso: string,
  toIso: string,
  tz: string,
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
  const summary = (data as { summary?: Record<string, number> } | null)?.summary ?? {}
  const byDay = Array.isArray((data as { byDay?: DayAgg[] } | null)?.byDay)
    ? ((data as { byDay: DayAgg[] }).byDay)
    : []
  return {
    requests: Number(summary.requests) || 0,
    totalTokens: Number(summary.totalTokens) || 0,
    estimatedCostUsd: Number(summary.estimatedCostUsd) || 0,
    byDay,
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

  const [live, deeplPeriod, deepseekPeriod] = await Promise.all([
    fetchLiveQuotas(),
    periodFromRpc(supabase, 'deepl', fromIso, toIso, tz),
    periodFromRpc(supabase, 'deepseek', fromIso, toIso, tz),
  ])

  if ('error' in deeplPeriod) return { error: deeplPeriod.error }
  if ('error' in deepseekPeriod) return { error: deepseekPeriod.error }

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
      period: deeplPeriod,
    },
    deepseek: {
      live: live.deepseek.live,
      liveError: live.deepseek.liveError,
      period: deepseekPeriod ?? emptyPeriod(),
    },
  }
}
