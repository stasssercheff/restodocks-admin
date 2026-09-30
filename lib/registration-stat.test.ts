import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { completedRegistrationCount } from './registration-stat.ts'

describe('completedRegistrationCount', () => {
  it('uses establishments count from meta, not form-open events', () => {
    assert.equal(
      completedRegistrationCount({
        meta: { completedRegistrations: 0 },
        summary: { completedRegistrations: 0 },
      }),
      0,
    )
  })

  it('prefers meta over summary', () => {
    assert.equal(
      completedRegistrationCount({
        meta: { completedRegistrations: 3 },
        summary: { completedRegistrations: 9 },
      }),
      3,
    )
  })

  it('falls back to summary then 0', () => {
    assert.equal(completedRegistrationCount({ summary: { completedRegistrations: 2 } }), 2)
    assert.equal(completedRegistrationCount(null), 0)
    assert.equal(completedRegistrationCount({}), 0)
  })
})
