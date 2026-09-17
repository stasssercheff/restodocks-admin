import assert from 'node:assert/strict'
import test from 'node:test'
import { canAccessPage, sanitizePages } from './admin-pages.ts'

test('sanitizePages keeps known keys in registry order', () => {
  assert.deepEqual(sanitizePages(['promo', 'unknown', 'establishments', 'promo']), [
    'establishments',
    'promo',
  ])
  assert.deepEqual(sanitizePages(['vitrine', 'demo']), ['demo', 'vitrine'])
  assert.deepEqual(sanitizePages(null), [])
  assert.deepEqual(sanitizePages(['nope']), [])
})

test('owner can access every page; staff only granted ones', () => {
  const owner = { isOwner: true, pages: [] }
  const staff = { isOwner: false, pages: ['promo'] }
  assert.equal(canAccessPage(owner, 'demo'), true)
  assert.equal(canAccessPage(owner, 'vitrine'), true)
  assert.equal(canAccessPage(staff, 'demo'), false)
  assert.equal(canAccessPage(staff, 'promo'), true)
  assert.equal(canAccessPage(staff, 'establishments'), false)
  assert.equal(canAccessPage(null, 'promo'), false)
})
