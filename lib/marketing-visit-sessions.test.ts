import assert from 'node:assert/strict'
import test from 'node:test'
import { groupVisitSessions, type VisitEvent } from './marketing-visit-sessions.ts'

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
  assert.equal(sessions[1].session_id, 'other')
})

test('groupVisitSessions falls back to IP+host bucket without session_id', () => {
  const sessions = groupVisitSessions([
    row({ id: 1, created_at: '2026-09-29T22:10:00Z', ip: '9.9.9.9', client_host: 'restodocks.com', event_type: 'locale_chosen' }),
    row({ id: 2, created_at: '2026-09-29T22:12:00Z', ip: '9.9.9.9', client_host: 'restodocks.com', event_type: 'registration' }),
    row({ id: 3, created_at: '2026-09-29T23:00:00Z', ip: '9.9.9.9', client_host: 'restodocks.com', event_type: 'page_view' }),
  ])
  // 22:10 and 22:12 share a 30-min bucket; 23:00 is another bucket
  assert.equal(sessions.length, 2)
  assert.equal(sessions.find(item => item.event_count === 2)?.event_types.includes('registration'), true)
})
