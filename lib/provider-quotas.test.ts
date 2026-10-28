import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatMoneyBalance, pickPreferredBalance } from './provider-quota-format.ts'

describe('provider quotas helpers', () => {
  it('prefers USD balance when present', () => {
    const row = pickPreferredBalance([
      { currency: 'CNY', total_balance: '10', granted_balance: '0', topped_up_balance: '10' },
      { currency: 'USD', total_balance: '5.60', granted_balance: '0', topped_up_balance: '5.60' },
    ])
    assert.equal(row?.currency, 'USD')
    assert.equal(formatMoneyBalance(row), '$5.60')
  })

  it('falls back to first currency', () => {
    const row = pickPreferredBalance([
      { currency: 'CNY', total_balance: '110.00', granted_balance: '10.00', topped_up_balance: '100.00' },
    ])
    assert.equal(formatMoneyBalance(row), '¥110.00')
  })
})
