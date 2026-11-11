'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminLocaleTag, useAdminTr } from '@/lib/admin-tr'
import { formatBucketLabel, formatBucketTooltip, type UsageBucket } from '@/lib/ai-usage-series'
import {
  formatMoneyBalance,
  pickPreferredBalance,
  type DayAgg,
  type ModelAgg,
  type ProviderQuotasPayload,
} from '@/lib/provider-quotas'

/** DeepL/DeepSeek have no push — poll while the AI tab is visible. */
const LIVE_POLL_MS = 5_000

function fmtInt(n: number, locale: string) {
  return n.toLocaleString(locale)
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function rangeCaption(
  meta: ProviderQuotasPayload['meta'] | undefined,
  locale: string,
): string | null {
  if (!meta?.rangeFrom || !meta?.rangeTo) return null
  const fromD = new Date(`${meta.rangeFrom}T12:00:00`).toLocaleDateString(locale)
  const toD = new Date(`${meta.rangeTo}T12:00:00`).toLocaleDateString(locale)
  const same = meta.rangeFrom === meta.rangeTo
  const fullDay = meta.rangeFromTime === '00:00' && meta.rangeToTime === '23:59'
  if (same && fullDay) return fromD
  if (same) return `${fromD} ${meta.rangeFromTime} — ${meta.rangeToTime}`
  if (fullDay) return `${fromD} — ${toD}`
  return `${fromD} ${meta.rangeFromTime} — ${toD} ${meta.rangeToTime}`
}

function MiniBars({
  points,
  bucket,
  valueKey,
  accent,
}: {
  points: DayAgg[]
  bucket: UsageBucket
  valueKey: 'estimatedCostUsd' | 'totalTokens' | 'requests'
  accent: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...points.map(d => d[valueKey]))
  if (!points.length) {
    return <div className="h-32 flex items-end text-xs text-gray-600">—</div>
  }

  const tip = hover != null ? points[hover] : null

  return (
    <div className="relative">
      {tip ? (
        <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-gray-700 bg-gray-950 px-2.5 py-1.5 text-[11px] text-gray-100 shadow-lg whitespace-pre text-center">
          {formatBucketTooltip(tip, bucket, valueKey)}
        </div>
      ) : null}
      <div
        className="h-32 flex items-end gap-[2px]"
        onMouseLeave={() => setHover(null)}
      >
        {points.map((d, i) => {
          const h = Math.max(d[valueKey] > 0 ? 3 : 1, Math.round((d[valueKey] / max) * 100))
          return (
            <div
              key={d.date}
              title={formatBucketTooltip(d, bucket, valueKey)}
              onMouseEnter={() => setHover(i)}
              className="flex-1 min-w-0 rounded-t-sm cursor-default transition-opacity"
              style={{
                height: `${h}%`,
                background: accent,
                opacity: hover == null || hover === i ? 0.95 : 0.35,
              }}
            />
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-gray-600 tabular-nums">
        <span>{formatBucketLabel(points[0].date, bucket)}</span>
        <span>{formatBucketLabel(points[points.length - 1].date, bucket)}</span>
      </div>
    </div>
  )
}

function ModelSpendList({
  models,
  locale,
  tr,
}: {
  models: ModelAgg[]
  locale: string
  tr: (s: string) => string
}) {
  const top = models
    .filter(m => !(m.model === '(empty)' && m.estimatedCostUsd <= 0))
    .slice(0, 4)
  const emptyErrors = models.find(m => m.model === '(empty)' && m.estimatedCostUsd <= 0)
  if (!top.length && !emptyErrors) return null
  return (
    <div className="mt-3 space-y-1.5">
      {top.map(m => (
        <div key={m.model} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-400 truncate min-w-0">{m.model}</span>
          <span className="text-gray-200 tabular-nums shrink-0">
            {fmtUsd(m.estimatedCostUsd)}
            <span className="text-gray-600"> · {fmtInt(m.requests, locale)}</span>
          </span>
        </div>
      ))}
      {emptyErrors ? (
        <div
          className="flex items-center justify-between gap-2 text-xs"
          title={tr('Вызовы с ошибкой API (модель не записалась), $ в логах = 0')}
        >
          <span className="text-amber-400/90 truncate min-w-0">{tr('ошибки API (без $)')}</span>
          <span className="text-gray-400 tabular-nums shrink-0">
            $0.00
            <span className="text-gray-600"> · {fmtInt(emptyErrors.requests, locale)}</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default function AiProviderQuotas({
  from,
  to,
  fromTime,
  toTime,
  tz,
}: {
  from: string
  to: string
  fromTime: string
  toTime: string
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
      const q = new URLSearchParams({ from, to, fromTime, toTime, tz })
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
  }, [from, to, fromTime, toTime, tz, tr])

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
  }, [from, to, fromTime, toTime, tz])

  const deeplPct = useMemo(() => {
    const live = data?.deepl.live
    if (!live || live.character_limit <= 0) return 0
    return Math.min(100, (live.character_count / live.character_limit) * 100)
  }, [data])

  const deepseekBal = pickPreferredBalance(data?.deepseek.live?.balances)
  const caption = rangeCaption(data?.meta, locale)
  const bucket: UsageBucket = data?.meta.chartBucket ?? 'day'
  const chartTitle =
    bucket === 'hour' ? tr('Стоимость по часам') : tr('Стоимость по дням')
  const deeplChartTitle =
    bucket === 'hour' ? tr('По часам (логи)') : tr('По дням (логи)')

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
          {caption ? (
            <p className="text-xs text-sky-300/80 mt-1">
              {tr('Расход по логам за')}: {caption}
              {bucket === 'hour' ? ` · ${tr('почасовая разбивка')}` : null}
            </p>
          ) : null}
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
            <div className="text-xs text-gray-500 mb-2">{deeplChartTitle}</div>
            <MiniBars
              points={data?.deepl.period.series ?? []}
              bucket={bucket}
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
              <div className="text-[11px] text-gray-500">{tr('Расход по логам')}</div>
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
            <div className="text-xs text-gray-500 mb-2">
              {chartTitle}
              {data?.deepseek.period.estimatedCostUsd != null
                ? ` ${fmtUsd(data.deepseek.period.estimatedCostUsd)}`
                : null}
            </div>
            <MiniBars
              points={data?.deepseek.period.series ?? []}
              bucket={bucket}
              valueKey="estimatedCostUsd"
              accent="#fb923c"
            />
            <ModelSpendList models={data?.deepseek.period.byModel ?? []} locale={locale} tr={tr} />
            <p className="mt-3 text-[11px] text-gray-600 leading-snug">
              {tr('Остаток сверху — live-баланс DeepSeek. «Расход по логам» / столбики — сумма estimated_cost_usd из наших логов (оценка, может отличаться от списания в кабинете DeepSeek).')}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
