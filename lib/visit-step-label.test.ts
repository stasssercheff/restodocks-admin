import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { VisitEvent, VisitTimelineStep } from './marketing-visit-sessions.ts'
import {
  isLocalePickerPath,
  isPromoLandingPath,
  visitExitLabel,
  visitJourneySteps,
  visitStepLabel,
} from './visit-step-label.ts'

const copy = { localePick: 'Выбор языка', promoView: 'Просмотр промо' }
const labelEvent = (t: string | null) => (t === 'locale_chosen' ? 'Выбор языка' : t || '—')
const labelPath = (p: string | null) => {
  if (p === '/promo') return 'Промо'
  if (p === '/promo/locale') return 'Выбор языка'
  return p || '—'
}

function ev(partial: Partial<VisitEvent> & Pick<VisitEvent, 'id' | 'path' | 'event_type'>): VisitEvent {
  return {
    created_at: '2026-09-30T14:59:14Z',
    session_id: 's',
    language_code: 'en',
    client_host: null,
    ip: '1.1.1.1',
    country_code: 'US',
    region: null,
    city: 'Chicago',
    timezone: null,
    location_label: null,
    visitor_kind: 'human',
    visitor_hint: null,
    ...partial,
  }
}

function tl(events: VisitEvent[]): VisitTimelineStep[] {
  return events.map((event, index) => ({
    event,
    gapFromPrevMs: index === 0 ? null : 0,
    elapsedFromStartMs: 0,
  }))
}

describe('visit step labels', () => {
  it('detects locale picker vs promo landing paths', () => {
    assert.equal(isLocalePickerPath('/promo/locale'), true)
    assert.equal(isPromoLandingPath('/promo'), true)
    assert.equal(isPromoLandingPath('/promo/locale'), false)
  })

  it('does not label promo landing as a second language pick', () => {
    assert.equal(
      visitStepLabel(ev({ id: 1, event_type: 'locale_chosen', path: '/promo/locale' }), labelEvent, labelPath, copy),
      'Выбор языка',
    )
    assert.equal(
      visitStepLabel(ev({ id: 2, event_type: 'locale_chosen', path: '/promo' }), labelEvent, labelPath, copy),
      'Просмотр промо',
    )
  })

  it('builds journey and exit from the Chicago-style double fire', () => {
    const timeline = tl([
      ev({ id: 1, event_type: 'locale_chosen', path: '/promo/locale' }),
      ev({ id: 2, event_type: 'locale_chosen', path: '/promo' }),
    ])
    assert.deepEqual(visitJourneySteps(timeline, labelEvent, labelPath, copy), [
      'Выбор языка',
      'Просмотр промо',
    ])
    assert.equal(visitExitLabel(timeline, labelEvent, labelPath, copy), 'Просмотр промо')
  })
})
