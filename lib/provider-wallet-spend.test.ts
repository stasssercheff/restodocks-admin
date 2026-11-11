import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { walletSpendBetween, type BalanceSnapshot } from './provider-wallet-math.ts'

function snap(partial: Partial<BalanceSnapshot> & { captured_at: string; total_balance: number }): BalanceSnapshot {
  return {
    currency: 'USD',
    granted_balance: 0,
    topped_up_balance: partial.total_balance,
    ...partial,
  }
}

describe('provider wallet spend', () => {
  it('counts pure balance drop as spend', () => {
    assert.equal(
      walletSpendBetween(
        snap({ captured_at: '2026-11-11T00:00:00Z', total_balance: 20 }),
        snap({ captured_at: '2026-11-11T12:00:00Z', total_balance: 14 }),
      ),
      6,
    )
  })

  it('adds top-ups back so spend stays correct', () => {
    // Start 20 → spend 6 → 14 → top up 10 → 24
    assert.equal(
      walletSpendBetween(
        snap({ captured_at: 'a', total_balance: 20, topped_up_balance: 20 }),
        snap({ captured_at: 'b', total_balance: 24, topped_up_balance: 30 }),
      ),
      6,
    )
  })
})
