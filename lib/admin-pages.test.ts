import assert from 'node:assert/strict'
import test from 'node:test'
import { ALL_ADMIN_PAGE_KEYS, canAccessPage, sanitizePages } from './admin-pages.ts'

test('sanitizePages keeps known keys in registry order', () => {
  assert.deepEqual(sanitizePages(['promo', 'unknown', 'establishments', 'promo']), [
    'establishments',
    'promo',
  ])
  assert.deepEqual(sanitizePages(['health', 'reviews']), ['reviews', 'health'])
  assert.deepEqual(sanitizePages(null), [])
  assert.deepEqual(sanitizePages(['nope']), [])
})

test('registry lists the original 12 admin tabs', () => {
  assert.deepEqual(ALL_ADMIN_PAGE_KEYS, [
    'reviews',
    'ads_agent',
    'establishments',
    'promo',
    'popups',
    'ai_usage',
    'demo_sandboxes',
    'marketing_visits',
    'broadcast',
    'support',
    'security',
    'health',
  ])
})

test('owner can access every page; staff only granted ones', () => {
  const owner = { isOwner: true, pages: [] }
  const staff = { isOwner: false, pages: ['promo'] }
  assert.equal(canAccessPage(owner, 'reviews'), true)
  assert.equal(canAccessPage(owner, 'health'), true)
  assert.equal(canAccessPage(staff, 'reviews'), false)
  assert.equal(canAccessPage(staff, 'promo'), true)
  assert.equal(canAccessPage(staff, 'establishments'), false)
  assert.equal(canAccessPage(null, 'promo'), false)
})

test('new staff with no ticks still has the narrowest default: establishments only', () => {
  const staff = { isOwner: false, pages: sanitizePages([]) }
  assert.deepEqual(staff.pages, [])
  const granted = staff.pages.length ? staff.pages : ['establishments']
  assert.deepEqual(granted, ['establishments'])
  assert.equal(canAccessPage({ isOwner: false, pages: granted }, 'establishments'), true)
  assert.equal(canAccessPage({ isOwner: false, pages: granted }, 'reviews'), false)
})
