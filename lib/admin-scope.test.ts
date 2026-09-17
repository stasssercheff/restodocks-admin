import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildReferralLevels,
  sanitizeDataScope,
  sanitizePromoCodes,
  summarizeScopedRows,
} from './admin-scope.ts'

test('sanitizePromoCodes uppercases and dedupes', () => {
  assert.deepEqual(sanitizePromoCodes(['666', ' 666 ', 'abc', 'ABC']), ['666', 'ABC'])
  assert.deepEqual(sanitizePromoCodes('666, ferni2026; x'), ['666', 'FERNI2026', 'X'])
})

test('sanitizeDataScope clamps referral depth 1..5', () => {
  assert.deepEqual(sanitizeDataScope({ promoCodes: ['666'], referralDepth: 0 }), {
    promoCodes: ['666'],
    referralDepth: 1,
  })
  assert.equal(sanitizeDataScope({ referral_depth: 9 }).referralDepth, 5)
})

test('referral tree: promo seed then children up to configured depth', () => {
  const nodes = [
    { id: 'u1', referred_by_establishment_id: null, parent_establishment_id: null },
    { id: 'u2', referred_by_establishment_id: 'u1', parent_establishment_id: null },
    { id: 'u3', referred_by_establishment_id: 'u2', parent_establishment_id: null },
    { id: 'u4', referred_by_establishment_id: 'u3', parent_establishment_id: null },
    { id: 'other', referred_by_establishment_id: null, parent_establishment_id: null },
    { id: 'u1-branch', referred_by_establishment_id: null, parent_establishment_id: 'u1' },
  ]
  const depth2 = buildReferralLevels(nodes, ['u1'], 2)
  assert.equal(depth2.get('u1'), 1)
  assert.equal(depth2.get('u2'), 2)
  assert.equal(depth2.has('u3'), false)
  assert.equal(depth2.get('u1-branch'), 1)
  assert.equal(depth2.has('other'), false)

  const depth5 = buildReferralLevels(nodes, ['u1'], 5)
  assert.equal(depth5.get('u3'), 3)
  assert.equal(depth5.get('u4'), 4)

  const empty = buildReferralLevels(nodes, [], 5)
  assert.equal(empty.size, 0)
})

test('summarizeScopedRows splits subscription stats by level', () => {
  const stats = summarizeScopedRows([
    { referral_level: 1, effective_pro: true },
    { referral_level: 1, effective_pro: false },
    { referral_level: 2, effective_pro: false },
  ], { promoCodes: ['666'], referralDepth: 2 })
  assert.equal(stats.total, 3)
  assert.equal(stats.withSubscription, 1)
  assert.equal(stats.withoutSubscription, 2)
  assert.equal(stats.byLevel[0].total, 2)
  assert.equal(stats.byLevel[1].withoutSubscription, 1)
})
