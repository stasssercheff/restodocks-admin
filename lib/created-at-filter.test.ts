import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesCreatedAt, normalizeDateInput } from './created-at-filter.ts'

test('normalizeDateInput accepts ISO and DMY', () => {
  assert.equal(normalizeDateInput('2026-09-19'), '2026-09-19')
  assert.equal(normalizeDateInput('19/09/2026'), '2026-09-19')
  assert.equal(normalizeDateInput('19.09.2026'), '2026-09-19')
  assert.equal(normalizeDateInput(''), '')
})

test('matchesCreatedAt inclusive day bounds via YYYY-MM-DD', () => {
  assert.equal(matchesCreatedAt('2026-09-07T19:16:00.000Z', '', ''), true)
  assert.equal(matchesCreatedAt('2026-09-07T19:16:00.000Z', '2026-09-07', '2026-09-07'), true)
  assert.equal(matchesCreatedAt('2026-08-21T10:17:00.000Z', '2026-09-19', '2026-09-19'), false)
  assert.equal(matchesCreatedAt('2026-09-19T08:00:00.000Z', '19/09/2026', '19/09/2026'), true)
  assert.equal(matchesCreatedAt('2026-09-06T23:00:00.000Z', '2026-09-07', ''), false)
  assert.equal(matchesCreatedAt(null, '2026-09-01', ''), false)
})
