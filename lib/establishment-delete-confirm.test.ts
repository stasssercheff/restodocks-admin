import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/** Pure rule used by confirmEstablishmentDelete after loading pin from DB. */
export function pinMatchesDeleteConfirm(pin: string | null | undefined, confirmRaw: string): boolean {
  const confirm = confirmRaw.trim()
  const expected = typeof pin === 'string' ? pin.trim() : ''
  return !!expected && confirm === expected
}

describe('establishment delete confirm pin-only', () => {
  it('accepts only exact pin, rejects wipe-word', () => {
    assert.equal(pinMatchesDeleteConfirm('48291037', '48291037'), true)
    assert.equal(pinMatchesDeleteConfirm('48291037', ' УДАЛИТЬ '), false)
    assert.equal(pinMatchesDeleteConfirm('48291037', 'удалить'), false)
    assert.equal(pinMatchesDeleteConfirm('', 'УДАЛИТЬ'), false)
    assert.equal(pinMatchesDeleteConfirm(null, '1234'), false)
  })
})
