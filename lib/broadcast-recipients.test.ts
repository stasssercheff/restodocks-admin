import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyEstablishment,
  matchesSubscriptionFilters,
  parseBroadcastFilters,
} from './broadcast-recipients-logic.ts'

describe('classifyEstablishment', () => {
  const now = Date.parse('2026-11-19T12:00:00Z')

  it('detects active paid by pro_paid_until', () => {
    const c = classifyEstablishment({
      subscription_type: 'free',
      pro_paid_until: '2026-12-01T00:00:00Z',
      pro_trial_ends_at: null,
      created_at: '2026-11-01T00:00:00Z',
    }, now)
    assert.equal(c.paid, true)
    assert.equal(c.trial, false)
  })

  it('detects trial from pro_trial_ends_at', () => {
    const c = classifyEstablishment({
      subscription_type: 'free',
      pro_paid_until: null,
      pro_trial_ends_at: '2026-11-20T00:00:00Z',
      created_at: '2026-11-17T00:00:00Z',
    }, now)
    assert.equal(c.trial, true)
    assert.equal(c.paid, false)
    assert.equal(c.none, false)
  })

  it('falls back to created_at + 3 days for trial', () => {
    const c = classifyEstablishment({
      subscription_type: 'free',
      pro_paid_until: null,
      pro_trial_ends_at: null,
      created_at: '2026-11-18T00:00:00Z',
    }, now)
    assert.equal(c.trial, true)
  })
})

describe('matchesSubscriptionFilters', () => {
  const trial = { paid: false, trial: true, none: false, type: 'free' }
  const paidPro = { paid: true, trial: false, none: false, type: 'pro' }
  const none = { paid: false, trial: false, none: true, type: 'free' }

  it('matches all when filters empty', () => {
    assert.equal(matchesSubscriptionFilters(trial, [], []), true)
  })

  it('ORs status chips', () => {
    assert.equal(matchesSubscriptionFilters(trial, ['trial', 'paid'], []), true)
    assert.equal(matchesSubscriptionFilters(none, ['trial', 'paid'], []), false)
    assert.equal(matchesSubscriptionFilters(none, ['trial', 'none'], []), true)
  })

  it('allows combining trial chip with specific types (OR)', () => {
    assert.equal(matchesSubscriptionFilters(trial, ['trial'], ['ultra']), true)
    assert.equal(matchesSubscriptionFilters(paidPro, ['trial'], ['pro']), true)
    assert.equal(matchesSubscriptionFilters(none, ['trial'], ['pro']), false)
  })
})

describe('parseBroadcastFilters', () => {
  it('parses combinable statuses and legacy mode', () => {
    const a = parseBroadcastFilters({
      userKind: 'owners',
      statuses: ['trial', 'paid'],
      subscriptionTypes: ['ultra'],
    })
    assert.deepEqual(a.statuses, ['trial', 'paid'])
    assert.deepEqual(a.subscriptionTypes, ['ultra'])
    assert.equal(a.userKind, 'owners')

    const b = parseBroadcastFilters({ subscriptionMode: 'without_subscription' })
    assert.deepEqual(b.statuses, ['none'])
  })

  it('parses employeeId / employeeIds for targeted send', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const id2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
    const a = parseBroadcastFilters({ employeeId: id, userKind: 'owners' })
    assert.equal(a.employeeId, id)
    assert.deepEqual(a.employeeIds, [id])
    const b = parseBroadcastFilters({ employeeId: 'not-a-uuid' })
    assert.equal(b.employeeId, null)
    assert.deepEqual(b.employeeIds, [])
    const c = parseBroadcastFilters({ employeeIds: [id, id2, 'bad'] })
    assert.deepEqual(c.employeeIds, [id, id2])
  })
})
