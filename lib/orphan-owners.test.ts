import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  OWNER_DELETE_COOLING_DAYS,
  isWithinOwnerCoolingOff,
  matchesOwnerDeleteConfirm,
} from './orphan-owners-logic.ts'

describe('orphan owner delete confirm', () => {
  it('accepts удалить case-insensitively', () => {
    assert.equal(matchesOwnerDeleteConfirm('удалить'), true)
    assert.equal(matchesOwnerDeleteConfirm(' УДАЛИТЬ '), true)
    assert.equal(matchesOwnerDeleteConfirm('Удалить'), true)
    assert.equal(matchesOwnerDeleteConfirm('123456'), false)
    assert.equal(matchesOwnerDeleteConfirm(''), false)
  })

  it('flags cooling-off within 30 days', () => {
    assert.equal(OWNER_DELETE_COOLING_DAYS, 30)
    const now = Date.parse('2026-11-27T00:00:00Z')
    assert.equal(isWithinOwnerCoolingOff('2026-11-20T00:00:00Z', now), true)
    assert.equal(isWithinOwnerCoolingOff('2026-10-01T00:00:00Z', now), false)
  })
})
