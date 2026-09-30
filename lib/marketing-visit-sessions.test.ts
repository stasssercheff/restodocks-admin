import assert from 'node:assert/strict'
import test from 'node:test'
import {
  dedupeNearDuplicateEvents,
  formatDurationMs,
  groupVisitSessions,
  mergeNearbySameIpSessions,
  visitPace,
  type VisitEvent,
} from './marketing-visit-sessions.ts'

function row(partial: Partial<VisitEvent> & Pick<VisitEvent, 'id' | 'created_at'>): VisitEvent {
  return {
    session_id: null,
    event_type: null,
    path: null,
    language_code: null,
    client_host: null,
    ip: null,
    country_code: null,
    region: null,
    city: null,
    timezone: null,
    location_label: null,
    visitor_kind: 'human',
    visitor_hint: null,
    ...partial,
  }
}

test('groupVisitSessions merges same session_id into one visit', () => {
  const sessions = groupVisitSessions([
    row({ id: 3, created_at: '2026-09-29T22:20:14Z', session_id: 'abc', event_type: 'locale_chosen', ip: '1.1.1.1', city: 'Ashburn' }),
    row({ id: 2, created_at: '2026-09-29T22:17:18Z', session_id: 'abc', event_type: 'registration', ip: '1.1.1.1', city: 'Ashburn' }),
    row({ id: 1, created_at: '2026-09-29T22:14:49Z', session_id: 'abc', event_type: 'locale_chosen', ip: '1.1.1.1', city: 'Ashburn' }),
    row({ id: 4, created_at: '2026-09-29T21:00:00Z', session_id: 'other', event_type: 'page_view', ip: '2.2.2.2', city: 'London' }),
  ])
  assert.equal(sessions.length, 2)
  assert.equal(sessions[0].session_id, 'abc')
  assert.equal(sessions[0].event_count, 3)
  assert.deepEqual(sessions[0].event_types, ['locale_chosen', 'registration'])
  assert.equal(sessions[0].first_at, '2026-09-29T22:14:49Z')
  assert.equal(sessions[0].last_at, '2026-09-29T22:20:14Z')
  assert.equal(sessions[0].durationMs, 5 * 60_000 + 25_000) // 5m 25s
  assert.equal(sessions[0].timeline.length, 3)
  assert.equal(sessions[0].timeline[0].gapFromPrevMs, null)
  assert.equal(sessions[0].timeline[1].gapFromPrevMs, 2 * 60_000 + 29_000) // 22:14:49 → 22:17:18
  assert.equal(sessions[0].timeline[2].elapsedFromStartMs, sessions[0].durationMs)
  assert.equal(sessions[1].session_id, 'other')
  assert.equal(sessions[1].durationMs, 0)
})

test('groupVisitSessions falls back to IP bucket without session_id', () => {
  const sessions = groupVisitSessions([
    row({ id: 1, created_at: '2026-09-29T22:10:00Z', ip: '9.9.9.9', client_host: 'a.pages.dev', event_type: 'locale_chosen' }),
    row({ id: 2, created_at: '2026-09-29T22:12:00Z', ip: '9.9.9.9', client_host: 'b.pages.dev', event_type: 'registration' }),
    row({ id: 3, created_at: '2026-09-29T23:00:00Z', ip: '9.9.9.9', client_host: 'a.pages.dev', event_type: 'page_view' }),
  ])
  // 22:10 and 22:12 share a 30-min bucket even on different preview hosts; 23:00 is another bucket
  assert.equal(sessions.length, 2)
  assert.equal(sessions.find(item => item.event_count === 2)?.event_types.includes('registration'), true)
  assert.equal(sessions.find(item => item.event_count === 2)?.durationMs, 2 * 60_000)
})

test('same IP + same second with different session_id is one visit', () => {
  // Real bug from admin: two «Выбор языка» rows at 00:45:38 from 35.174.58.0
  const sessions = groupVisitSessions([
    row({
      id: 101,
      created_at: '2026-09-30T00:45:38.000Z',
      session_id: 'sess-a',
      event_type: 'locale_chosen',
      path: '/promo',
      language_code: 'en',
      ip: '35.174.58.0',
      city: 'Ashburn',
      client_host: 'f3b9272e.restodocks.pages.dev',
    }),
    row({
      id: 102,
      created_at: '2026-09-30T00:45:38.100Z',
      session_id: 'sess-b',
      event_type: 'locale_chosen',
      path: '/promo',
      language_code: 'en',
      ip: '35.174.58.0',
      city: 'Ashburn',
      client_host: 'f3b9272e.restodocks.pages.dev',
    }),
  ])
  assert.equal(sessions.length, 1)
  assert.equal(sessions[0].event_count, 1, 'double-fire collapsed to one step')
  assert.deepEqual(sessions[0].event_types, ['locale_chosen'])
  assert.equal(sessions[0].durationMs, 0)
})

test('same IP minutes apart stays two visits', () => {
  const sessions = groupVisitSessions([
    row({ id: 1, created_at: '2026-09-30T00:30:08Z', session_id: 'a', event_type: 'locale_chosen', ip: '13.219.19.81', path: '/promo' }),
    row({ id: 2, created_at: '2026-09-30T00:45:38Z', session_id: 'b', event_type: 'locale_chosen', ip: '13.219.19.81', path: '/promo' }),
  ])
  assert.equal(sessions.length, 2)
})

test('dedupeNearDuplicateEvents keeps distinct actions', () => {
  const kept = dedupeNearDuplicateEvents([
    row({ id: 1, created_at: '2026-09-30T00:00:00Z', event_type: 'locale_chosen', path: '/promo' }),
    row({ id: 2, created_at: '2026-09-30T00:00:01Z', event_type: 'locale_chosen', path: '/promo' }),
    row({ id: 3, created_at: '2026-09-30T00:00:01Z', event_type: 'registration', path: '/register-company' }),
  ])
  assert.equal(kept.length, 2)
  assert.equal(kept[0].event_type, 'locale_chosen')
  assert.equal(kept[1].event_type, 'registration')
})

test('mergeNearbySameIpSessions merges overlapping windows', () => {
  const a = groupVisitSessions([
    row({ id: 1, created_at: '2026-09-30T00:57:04Z', session_id: 'x', event_type: 'locale_chosen', ip: '13.219.19.81', path: '/promo', language_code: 'ru' }),
  ])[0]
  const b = groupVisitSessions([
    row({ id: 2, created_at: '2026-09-30T00:57:04Z', session_id: 'y', event_type: 'locale_chosen', ip: '13.219.19.81', path: '/promo', language_code: 'ru' }),
  ])[0]
  const merged = mergeNearbySameIpSessions([a, b])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].event_count, 1)
})

test('formatDurationMs and visitPace', () => {
  assert.equal(formatDurationMs(12_000, 'ru'), '12 с')
  assert.equal(formatDurationMs(12_000, 'en'), '12s')
  assert.equal(formatDurationMs(200_000, 'ru'), '3 м 20 с')
  assert.equal(formatDurationMs(3_600_000 + 120_000, 'en'), '1h 2m')
  assert.equal(visitPace(20_000, 3), 'quick')
  assert.equal(visitPace(90_000, 3), 'normal')
  assert.equal(visitPace(200_000, 3), 'slow')
  assert.equal(visitPace(999_999, 1), null)
})
