'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminLocaleTag, useAdminTr } from '@/lib/admin-tr'
import {
  formatMoneyBalance,
  pickPreferredBalance,
  type DayAgg,
  type ProviderQuotasPayload,
} from '@/lib/provider-quotas'

/** DeepL/DeepSeek have no push — poll while the AI tab is visible. */
const LIVE_POLL_MS = 20_000

function fmtInt(n: number, locale: string) {
  return n.toLocaleString(locale)
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function MiniBars({
  days,
  valueKey,
  accent,
}: {
  days: DayAgg[]
  valueKey: 'estimatedCostUsd' | 'totalTokens' | 'requests'
  accent: string
}) {
  const max = Math.max(1, ...days.map(d => d[valueKey]))
  if (!days.length) {
    return <div className="h-28 flex items-end text-xs text-gray-600">—</div>
  }
  return (
    <div className="h-28 flex items-end gap-[2px]">
      {days.map(d => {
        const h = Math.max(2, Math.round((d[valueKey] / max) * 100))
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d[valueKey]}`}
            className="flex-1 min-w-0 rounded-t-sm"
            style={{ height: `${h}%`, background: accent, opacity: 0.85 }}
          />
        )
      })}
    </div>
  )
}

export default function AiProviderQuotas({
  from,
  to,
  tz,
}: {
  from: string
  to: string
  tz: string
}) {
  const tr = useAdminTr()
  const locale = useAdminLocaleTag()
  const [data, setData] = useState<ProviderQuotasPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const inFlight = useRef(false)

  const load = useCallback(async (mode: 'initial' | 'poll' | 'manual' = 'initial') => {
    if (inFlight.current && mode === 'poll') return
    inFlight.current = true
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    if (mode !== 'poll') setError(null)
    try {
      const q = new URLSearchParams({ from, to, tz })
      const res = await fetch(`/api/ai-provider-quotas?${q}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = typeof json.error === 'string' ? json.error : tr('Ошибка загрузки лимитов')
        setError(msg)
        if (mode === 'initial') setData(null)
        return
      }
      setData(json as ProviderQuotasPayload)
      setError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : tr('Ошибка загрузки лимитов')
      setError(msg)
      if (mode === 'initial') setData(null)
    } finally {
      inFlight.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [from, to, tz, tr])

  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    void load('initial')
  }, [load])

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void loadRef.current('poll')
    }
    const id = window.setInterval(tick, LIVE_POLL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [from, to, tz])

  const deeplPct = useMemo(() => {
    const live = data?.deepl.live
    if (!live || live.character_limit <= 0) return 0
    return Math.min(100, (live.character_count / live.character_limit) * 100)
  }, [data])

  const deepseekBal = pickPreferredBalance(data?.deepseek.live?.balances)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">{tr('Лимиты провайдеров')}</h2>
          <p className="text-xs text-gray-500 mt-0.5 break-words">
            {tr('DeepL — остаток символов; DeepSeek — баланс и расходы из логов.')}
            {` · ${tr('авто каждые')} ${LIVE_POLL_MS / 1000} ${tr('сек.')}`}
            {data?.meta.liveFetchedAt
              ? ` · ${tr('обновлено')} ${new Date(data.meta.liveFetchedAt).toLocaleString(locale)}`
              : null}
            {refreshing ? ` · ${tr('синхронизация…')}` : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load('manual')}
          disabled={loading || refreshing}
          className="text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-50 shrink-0"
        >
          {loading || refreshing ? tr('Обновление…') : tr('Обновить лимиты')}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* DeepL — like DeepL account usage */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="text-sm font-medium text-sky-200">DeepL</div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              {tr('Текущий период API')}
            </div>
          </div>

          {data?.deepl.live ? (
            <>
              <div className="text-4xl font-bold text-white tabular-nums">
                {fmtInt(data.deepl.live.character_count, locale)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {tr('из')} {fmtInt(data.deepl.live.character_limit, locale)} {tr('символов')}
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{ width: `${deeplPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {fmtInt(data.deepl.live.remaining, locale)} {tr('символов осталось')}
                {data.deepl.live.host ? ` · ${data.deepl.live.host}` : null}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">
              {data?.deepl.liveError
                ? `${tr('Live-лимит недоступен')}: ${data.deepl.liveError}`
                : loading
                  ? '…'
                  : tr('Нет live-данных DeepL')}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-3 gap-2">
            <div>
              <div className="text-[11px] text-gray-500">{tr('Вызовы (логи)')}</div>
              <div className="text-lg font-semibold text-white">
                {fmtInt(data?.deepl.period.requests ?? 0, locale)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500">{tr('Символы / токены')}</div>
              <div className="text-lg font-semibold text-white">
                {fmtInt(data?.deepl.period.totalTokens ?? 0, locale)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500">{tr('Оценка $')}</div>
              <div className="text-lg font-semibold text-emerald-300">
                {fmtUsd(data?.deepl.period.estimatedCostUsd ?? 0)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">{tr('По дням (логи)')}</div>
            <MiniBars
              days={data?.deepl.period.byDay ?? []}
              valueKey="totalTokens"
              accent="#38bdf8"
            />
          </div>
        </section>

        {/* DeepSeek — like platform usage cards */}
        <section className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="text-sm font-medium text-orange-200">DeepSeek</div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              {tr('Баланс API')}
            </div>
          </div>

          {deepseekBal ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3">
                  <div className="text-[11px] text-gray-500">{tr('Остаток')}</div>
                  <div className="text-3xl font-bold text-white mt-1 tabular-nums">
                    {formatMoneyBalance(deepseekBal)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {data?.deepseek.live?.is_available === false
                      ? tr('недостаточно для вызовов')
                      : tr('доступен для API')}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3">
                  <div className="text-[11px] text-gray-500">{tr('Пополнение / грант')}</div>
                  <div className="text-sm text-gray-300 mt-2 space-y-1">
                    <div>
                      {tr('пополнено')}:{' '}
                      <span className="text-white font-medium">
                        {deepseekBal.currency.toUpperCase() === 'CNY' ? '¥' : '$'}
                        {deepseekBal.topped_up_balance}
                      </span>
                    </div>
                    <div>
                      {tr('грант')}:{' '}
                      <span className="text-white font-medium">
                        {deepseekBal.currency.toUpperCase() === 'CNY' ? '¥' : '$'}
                        {deepseekBal.granted_balance}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 mb-4">
              {data?.deepseek.liveError
                ? `${tr('Live-баланс недоступен')}: ${data.deepseek.liveError}`
                : loading
                  ? '…'
                  : tr('Нет live-данных DeepSeek')}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
              <div className="text-[11px] text-gray-500">{tr('Расход (логи)')}</div>
              <div className="text-xl font-bold text-orange-300 mt-1">
                {fmtUsd(data?.deepseek.period.estimatedCostUsd ?? 0)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
              <div className="text-[11px] text-gray-500">{tr('Запросы')}</div>
              <div className="text-xl font-bold text-white mt-1">
                {fmtInt(data?.deepseek.period.requests ?? 0, locale)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
              <div className="text-[11px] text-gray-500">{tr('Токены')}</div>
              <div className="text-xl font-bold text-white mt-1">
                {fmtInt(data?.deepseek.period.totalTokens ?? 0, locale)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">{tr('Стоимость по дням')}</div>
            <MiniBars
              days={data?.deepseek.period.byDay ?? []}
              valueKey="estimatedCostUsd"
              accent="#fb923c"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
