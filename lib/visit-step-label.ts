import type { VisitEvent, VisitTimelineStep } from './marketing-visit-sessions'

export type VisitStepCopy = {
  /** Language picker screen (/promo/locale). */
  localePick: string
  /** Landed on promo after (or instead of) picking a language. */
  promoView: string
}

function normPath(path: string | null | undefined): string {
  return (path ?? '').trim().toLowerCase().replace(/\/+$/, '') || '/'
}

export function isLocalePickerPath(path: string | null | undefined): boolean {
  const p = normPath(path)
  return p === '/promo/locale' || p.endsWith('/locale')
}

export function isPromoLandingPath(path: string | null | undefined): boolean {
  const p = normPath(path)
  if (isLocalePickerPath(p)) return false
  return p === '/promo' || p.startsWith('/promo?') || p.startsWith('/promo/')
}

/**
 * Human label for one timeline step.
 * locale_chosen on /promo must not read as a second «Выбор языка» —
 * that row is the promo landing after the picker.
 */
export function visitStepLabel(
  event: VisitEvent,
  labelEvent: (type: string | null) => string,
  labelPath: (path: string | null) => string,
  copy: VisitStepCopy,
): string {
  const type = (event.event_type ?? '').trim().toLowerCase()
  const path = event.path

  if (type === 'locale_chosen' || type === 'page_view') {
    if (isLocalePickerPath(path)) return copy.localePick
    if (isPromoLandingPath(path)) return copy.promoView
  }

  if (type === 'page_view') {
    const page = labelPath(path)
    if (page && page !== '—') return page
  }

  const byEvent = labelEvent(event.event_type)
  if (byEvent && byEvent !== '—') return byEvent
  return labelPath(path)
}

/** Chronological step labels with consecutive duplicates collapsed. */
export function visitJourneySteps(
  timeline: VisitTimelineStep[],
  labelEvent: (type: string | null) => string,
  labelPath: (path: string | null) => string,
  copy: VisitStepCopy,
): string[] {
  const out: string[] = []
  for (const step of timeline) {
    const label = visitStepLabel(step.event, labelEvent, labelPath, copy)
    if (!label || label === '—') continue
    if (out[out.length - 1] === label) continue
    out.push(label)
  }
  return out
}

export function visitExitLabel(
  timeline: VisitTimelineStep[],
  labelEvent: (type: string | null) => string,
  labelPath: (path: string | null) => string,
  copy: VisitStepCopy,
): string {
  const steps = visitJourneySteps(timeline, labelEvent, labelPath, copy)
  return steps[steps.length - 1] || '—'
}
