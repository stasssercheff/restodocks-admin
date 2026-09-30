'use client'

import { Fragment, type ReactNode } from 'react'
import { looksLikeDatacenterVisit } from '@/lib/datacenter-ip'
import {
  formatDurationMs,
  visitPace,
  type VisitEvent,
  type VisitSession,
  type VisitTimelineStep,
} from '@/lib/marketing-visit-sessions'

type Tm = {
  recentTitle: string
  viewMode: string
  viewSessions: string
  viewEvents: string
  loading: string
  empty: string
  colTime: string
  colPlace: string
  colEvent: string
  colJourney: string
  colVisitor: string
  colPage: string
  colLang: string
  colScreen: string
  colHost: string
  visitor: string
  page: string
  lang: string
  screen: string
  hostLabel: string
  hideIp: string
  hideIpTitle: string
  sessionActive: string
  sessionActiveTitle: string
  eventsInVisit: string
  expandVisit: string
  collapseVisit: string
  visitDuration: string
  afterGap: string
  fromStart: string
  paceQuick: string
  paceNormal: string
  paceSlow: string
  startEvent: string
  endOfList: string
  shownFirst: string
  shownPeriod: string
  narrowHint: string
  record1: string
  record2: string
  record5: string
  person1: string
  person2: string
  person5: string
  people: string
  datacenterIp: string
  datacenterIpTitle: string
  langVisitorTitle: string
}

type Props = {
  tm: Tm
  locale: string
  viewMode: 'sessions' | 'events'
  onViewModeChange: (mode: 'sessions' | 'events') => void
  loading: boolean
  events: VisitEvent[]
  sessions: VisitSession[]
  expandedSessions: Set<string>
  onToggleSession: (key: string) => void
  labelEvent: (type: string | null | undefined) => string
  labelVisitor: (kind: string | null | undefined) => string
  labelPath: (path: string | null | undefined) => string
  labelLang: (code: string | null | undefined) => string
  labelHost: (host: string | null | undefined) => string
  labelPlace: (row: { city?: string | null; region?: string | null; country_code?: string | null; location_label?: string | null }) => string
  formatVisitTime: (iso: string | null | undefined, tz?: string | null) => string
  formatYourTime: (iso: string | null | undefined) => string
  onHideIp: (ip: string) => void
  sampleSize: number
  limit: number
  rangeLabel: string | null
  journeyLabel: (types: string[]) => string
}

function SessionBadge({ active, label, title }: { active?: boolean; label: string; title: string }) {
  if (!active) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-emerald-700/80 bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200"
      title={title}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
      {label}
    </span>
  )
}

function HideIpButton({
  ip,
  label,
  title,
  onHideIp,
  className,
}: {
  ip: string | null | undefined
  label: string
  title: string
  onHideIp: (ip: string) => void
  className?: string
}) {
  const trimmed = ip?.trim()
  if (!trimmed) return null
  return (
    <button
      type="button"
      onClick={() => onHideIp(trimmed)}
      className={className}
      title={title}
    >
      {label} {trimmed}
    </button>
  )
}

function DatacenterBadge({
  row,
  label,
  title,
}: {
  row: { ip?: string | null; city?: string | null; region?: string | null; country_code?: string | null }
  label: string
  title: string
}) {
  if (!looksLikeDatacenterVisit(row)) return null
  return (
    <span
      className="inline-flex rounded border border-amber-800/70 bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-200"
      title={title}
    >
      {label}
    </span>
  )
}

function PaceBadge({
  session,
  tm,
}: {
  session: VisitSession
  tm: Pick<Tm, 'paceQuick' | 'paceNormal' | 'paceSlow'>
}) {
  const pace = visitPace(session.durationMs, session.event_count)
  if (!pace) return null
  const label = pace === 'quick' ? tm.paceQuick : pace === 'slow' ? tm.paceSlow : tm.paceNormal
  const cls =
    pace === 'quick'
      ? 'border-amber-800/70 bg-amber-950/40 text-amber-200'
      : pace === 'slow'
        ? 'border-sky-800/70 bg-sky-950/40 text-sky-200'
        : 'border-gray-700 bg-gray-800/60 text-gray-300'
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] ${cls}`}>
      {label}
    </span>
  )
}

function DurationMeta({
  session,
  tm,
  locale,
  formatVisitTime,
}: {
  session: VisitSession
  tm: Tm
  locale: string
  formatVisitTime: Props['formatVisitTime']
}) {
  const duration = formatDurationMs(session.durationMs, locale)
  const sameMoment = session.first_at === session.last_at || session.event_count < 2
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      <span
        className="inline-flex rounded border border-gray-700 bg-gray-800/70 px-1.5 py-0.5 text-[10px] text-gray-200 font-medium"
        title={tm.visitDuration}
      >
        {sameMoment ? duration : `${tm.visitDuration}: ${duration}`}
      </span>
      <PaceBadge session={session} tm={tm} />
      {!sameMoment ? (
        <span className="text-[10px] text-gray-500 font-mono">
          {formatVisitTime(session.first_at, session.timezone)}
          {' → '}
          {formatVisitTime(session.last_at, session.timezone)}
        </span>
      ) : null}
    </div>
  )
}

function TimelineList({
  timeline,
  tm,
  locale,
  labelEvent,
  labelPath,
  formatVisitTime,
}: {
  timeline: VisitTimelineStep[]
  tm: Tm
  locale: string
  labelEvent: Props['labelEvent']
  labelPath: Props['labelPath']
  formatVisitTime: Props['formatVisitTime']
}) {
  return (
    <ol className="space-y-0">
      {timeline.map((step, index) => {
        const ev = step.event
        return (
          <li key={ev.id}>
            {step.gapFromPrevMs != null ? (
              <div className="flex items-center gap-2 py-1 pl-2 text-[10px] text-indigo-300/90">
                <span className="text-gray-600" aria-hidden>↓</span>
                <span>
                  {tm.afterGap} {formatDurationMs(step.gapFromPrevMs, locale)}
                </span>
                <span className="text-gray-600">
                  · {tm.fromStart} {formatDurationMs(step.elapsedFromStartMs, locale)}
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-gray-600 pl-2 pb-0.5">{tm.startEvent}</div>
            )}
            <div className="flex items-start justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-2.5 py-1.5 text-[11px]">
              <div className="min-w-0">
                <div className="text-gray-100 font-medium">{labelEvent(ev.event_type)}</div>
                <div className="text-gray-500">{labelPath(ev.path)}</div>
              </div>
              <div className="text-gray-400 font-mono shrink-0 text-right">
                <div>{formatVisitTime(ev.created_at, ev.timezone)}</div>
                {index > 0 ? (
                  <div className="text-[10px] text-gray-600">
                    +{formatDurationMs(step.elapsedFromStartMs, locale)}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function MarketingVisitsRecent({
  tm,
  locale,
  viewMode,
  onViewModeChange,
  loading,
  events,
  sessions,
  expandedSessions,
  onToggleSession,
  labelEvent,
  labelVisitor,
  labelPath,
  labelLang,
  labelHost,
  labelPlace,
  formatVisitTime,
  formatYourTime,
  onHideIp,
  sampleSize,
  limit,
  rangeLabel,
  journeyLabel,
}: Props) {
  const listEmpty = viewMode === 'sessions' ? sessions.length === 0 : events.length === 0
  const countNoun = (n: number, one: string, few: string, many: string) =>
    n === 1 ? one : n > 1 && n < 5 ? few : many

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-base font-semibold text-white">{tm.recentTitle}</h2>
        <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-0.5 text-xs">
          <span className="sr-only">{tm.viewMode}</span>
          <button
            type="button"
            onClick={() => onViewModeChange('sessions')}
            className={`px-2.5 py-1 rounded-md transition ${
              viewMode === 'sessions' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tm.viewSessions}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('events')}
            className={`px-2.5 py-1 rounded-md transition ${
              viewMode === 'events' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tm.viewEvents}
          </button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {listEmpty ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-6 text-center text-gray-500 text-sm">
            {loading ? tm.loading : tm.empty}
          </div>
        ) : viewMode === 'sessions' ? (
          sessions.map(session => {
            const open = expandedSessions.has(session.key)
            return (
              <div key={session.key} className="bg-gray-900 rounded-xl border border-gray-800 p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-gray-300 font-mono text-[11px]">
                      {formatVisitTime(session.last_at, session.timezone)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{formatYourTime(session.last_at)}</div>
                    <SessionBadge active={session.session_active} label={tm.sessionActive} title={tm.sessionActiveTitle} />
                    <DurationMeta session={session} tm={tm} locale={locale} formatVisitTime={formatVisitTime} />
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {session.event_count} {tm.eventsInVisit}
                  </span>
                </div>
                <div className="text-gray-100 font-medium leading-snug">{journeyLabel(session.event_types)}</div>
                <div className="text-gray-400 leading-snug" title={labelPlace(session)}>
                  {labelPlace(session)}
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <DatacenterBadge row={session} label={tm.datacenterIp} title={tm.datacenterIpTitle} />
                    <HideIpButton
                      ip={session.ip}
                      label={tm.hideIp}
                      title={tm.hideIpTitle}
                      onHideIp={onHideIp}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div>
                    <span className="text-gray-600">{tm.visitor}: </span>
                    <span className={session.visitor_kind === 'human' ? 'text-emerald-300' : session.visitor_kind === 'bot' ? 'text-rose-300' : 'text-amber-200'}>
                      {labelVisitor(session.visitor_kind)}
                    </span>
                  </div>
                  <div title={tm.langVisitorTitle}>
                    <span className="text-gray-600">{tm.lang}: </span>
                    <span>{labelLang(session.language_code)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">{tm.hostLabel}: </span>
                    <span className="text-gray-500">{labelHost(session.client_host)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSession(session.key)}
                  className="text-[11px] text-indigo-300 hover:text-indigo-200"
                >
                  {open ? tm.collapseVisit : tm.expandVisit}
                </button>
                {open ? (
                  <div className="border-t border-gray-800 pt-2">
                    <TimelineList
                      timeline={session.timeline}
                      tm={tm}
                      locale={locale}
                      labelEvent={labelEvent}
                      labelPath={labelPath}
                      formatVisitTime={formatVisitTime}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
        ) : (
          events.map(e => (
            <div key={e.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-gray-300 font-mono text-[11px]">{formatVisitTime(e.created_at, e.timezone)}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{formatYourTime(e.created_at)}</div>
                  <SessionBadge active={e.session_active} label={tm.sessionActive} title={tm.sessionActiveTitle} />
                </div>
                <span className="text-gray-100 font-medium shrink-0 text-right">{labelEvent(e.event_type)}</span>
              </div>
              <div className="text-gray-400 leading-snug" title={labelPlace(e)}>
                {labelPlace(e)}
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <DatacenterBadge row={e} label={tm.datacenterIp} title={tm.datacenterIpTitle} />
                  <HideIpButton
                    ip={e.ip}
                    label={tm.hideIp}
                    title={tm.hideIpTitle}
                    onHideIp={onHideIp}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div>
                  <span className="text-gray-600">{tm.visitor}: </span>
                  <span className={e.visitor_kind === 'human' ? 'text-emerald-300' : e.visitor_kind === 'bot' ? 'text-rose-300' : 'text-amber-200'}>
                    {labelVisitor(e.visitor_kind)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{tm.page}: </span>
                  <span className="text-gray-200">{labelPath(e.path)}</span>
                </div>
                <div>
                  <span className="text-gray-600">{tm.lang}: </span>
                  <span>{labelLang(e.language_code)}</span>
                </div>
                <div>
                  <span className="text-gray-600">{tm.screen}: </span>
                  <span className="text-gray-400">
                    {e.viewport_width != null && e.viewport_height != null ? `${e.viewport_width}×${e.viewport_height}` : '—'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">{tm.hostLabel}: </span>
                  <span className="text-gray-500">{labelHost(e.client_host)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-left">
                <th className="px-3 py-2 whitespace-nowrap w-[11rem]">{tm.colTime}</th>
                <th className="px-3 py-2 w-[11rem]">{tm.colPlace}</th>
                <th className="px-3 py-2 whitespace-nowrap w-[14rem]">
                  {viewMode === 'sessions' ? tm.colJourney : tm.colEvent}
                </th>
                <th className="px-3 py-2 whitespace-nowrap w-[7rem]">{tm.colVisitor}</th>
                {viewMode === 'events' ? <th className="px-3 py-2 whitespace-nowrap w-[6rem]">{tm.colPage}</th> : null}
                <th className="px-3 py-2 whitespace-nowrap w-[5rem]" title={tm.langVisitorTitle}>{tm.colLang}</th>
                {viewMode === 'events' ? <th className="px-3 py-2 whitespace-nowrap w-[5rem]">{tm.colScreen}</th> : null}
                <th className="px-3 py-2 whitespace-nowrap w-[6rem]">{tm.colHost}</th>
              </tr>
            </thead>
            <tbody>
              {listEmpty ? (
                <tr>
                  <td colSpan={viewMode === 'sessions' ? 6 : 8} className="px-3 py-6 text-center text-gray-500">
                    {loading ? tm.loading : tm.empty}
                  </td>
                </tr>
              ) : viewMode === 'sessions' ? (
                sessions.map(session => {
                  const open = expandedSessions.has(session.key)
                  return (
                    <FragmentRows key={session.key}>
                      <tr className="border-t border-gray-800/70 align-top">
                        <td className="px-3 py-2 text-gray-300 whitespace-nowrap">
                          <div>{formatVisitTime(session.last_at, session.timezone)}</div>
                          <div className="text-[10px] text-gray-500 leading-snug mt-0.5">{formatYourTime(session.last_at)}</div>
                          <div className="mt-1">
                            <SessionBadge active={session.session_active} label={tm.sessionActive} title={tm.sessionActiveTitle} />
                          </div>
                          <DurationMeta session={session} tm={tm} locale={locale} formatVisitTime={formatVisitTime} />
                        </td>
                        <td className="px-3 py-2 text-gray-400 min-w-[9rem] max-w-[14rem]" title={labelPlace(session)}>
                          <div className="break-words leading-snug">{labelPlace(session)}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <DatacenterBadge row={session} label={tm.datacenterIp} title={tm.datacenterIpTitle} />
                            <HideIpButton
                              ip={session.ip}
                              label={tm.hideIp}
                              title={tm.hideIpTitle}
                              onHideIp={onHideIp}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-100 font-medium">
                          <div className="leading-snug">{journeyLabel(session.event_types)}</div>
                          <button
                            type="button"
                            onClick={() => onToggleSession(session.key)}
                            className="mt-1 text-[10px] text-indigo-300 hover:text-indigo-200 font-normal"
                          >
                            {open ? tm.collapseVisit : `${tm.expandVisit} (${session.event_count})`}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap" title={session.visitor_hint ?? undefined}>
                          <span className={session.visitor_kind === 'human' ? 'text-emerald-300' : session.visitor_kind === 'bot' ? 'text-rose-300' : 'text-amber-200'}>
                            {labelVisitor(session.visitor_kind)}
                          </span>
                          {session.visitor_hint ? (
                            <span className="block text-[10px] text-gray-500">{session.visitor_hint}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap" title={tm.langVisitorTitle}>{labelLang(session.language_code)}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{labelHost(session.client_host)}</td>
                      </tr>
                      {open ? (
                        <tr className="border-t border-gray-900 bg-gray-950/40">
                          <td colSpan={6} className="px-4 py-3">
                            <TimelineList
                              timeline={session.timeline}
                              tm={tm}
                              locale={locale}
                              labelEvent={labelEvent}
                              labelPath={labelPath}
                              formatVisitTime={formatVisitTime}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </FragmentRows>
                  )
                })
              ) : (
                events.map(e => (
                  <tr key={e.id} className="border-t border-gray-800/70 align-top">
                    <td className="px-3 py-2 text-gray-300 whitespace-nowrap">
                      <div>{formatVisitTime(e.created_at, e.timezone)}</div>
                      <div className="text-[10px] text-gray-500 leading-snug mt-0.5">{formatYourTime(e.created_at)}</div>
                      <div className="mt-1">
                        <SessionBadge active={e.session_active} label={tm.sessionActive} title={tm.sessionActiveTitle} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400 min-w-[9rem] max-w-[14rem]" title={labelPlace(e)}>
                      <div className="break-words leading-snug">{labelPlace(e)}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <DatacenterBadge row={e} label={tm.datacenterIp} title={tm.datacenterIpTitle} />
                        <HideIpButton
                          ip={e.ip}
                          label={tm.hideIp}
                          title={tm.hideIpTitle}
                          onHideIp={onHideIp}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-100 font-medium whitespace-nowrap">{labelEvent(e.event_type)}</td>
                    <td className="px-3 py-2 whitespace-nowrap" title={e.visitor_hint ?? undefined}>
                      <span className={e.visitor_kind === 'human' ? 'text-emerald-300' : e.visitor_kind === 'bot' ? 'text-rose-300' : 'text-amber-200'}>
                        {labelVisitor(e.visitor_kind)}
                      </span>
                      {e.visitor_hint ? <span className="block text-[10px] text-gray-500">{e.visitor_hint}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{labelPath(e.path)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{labelLang(e.language_code)}</td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                      {e.viewport_width != null && e.viewport_height != null ? `${e.viewport_width}×${e.viewport_height}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{labelHost(e.client_host)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!listEmpty ? (
        <div className="border-t-2 border-gray-700 px-4 py-4 text-center text-sm text-gray-300 bg-gray-950/60 rounded-b-xl border border-t-0 border-gray-800 md:rounded-t-none md:-mt-px">
          {sampleSize >= limit ? (
            <>
              {tm.shownFirst} {limit} {tm.shownPeriod}
              <span className="block text-gray-500 text-xs mt-1">{tm.narrowHint}</span>
            </>
          ) : (
            <>
              <span className="text-gray-200">{tm.endOfList}</span>
              <span className="block text-gray-500 text-xs mt-1">
                {sessions.length}{' '}
                {countNoun(sessions.length, tm.person1, tm.person2, tm.person5)}
                {' · '}
                {sampleSize}{' '}
                {countNoun(sampleSize, tm.record1, tm.record2, tm.record5)}
                {rangeLabel ? ` · ${rangeLabel}` : ''}
              </span>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}

function FragmentRows({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>
}
