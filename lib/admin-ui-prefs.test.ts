import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultAdminUiPrefs,
  firstVisibleNavTab,
  moveTab,
  moveTabAmong,
  sanitizeAdminUiPrefs,
  setTabVisible,
  visibleNavTabs,
} from './admin-ui-prefs.ts'

test('sanitizeAdminUiPrefs keeps custom order and fills missing keys', () => {
  const prefs = sanitizeAdminUiPrefs({
    version: 1,
    tabs: [
      { key: 'marketing_visits', visible: true },
      { key: 'reviews', visible: false },
      { key: 'unknown', visible: true },
      { key: 'settings', visible: false },
    ],
  })
  assert.equal(prefs.tabs[0].key, 'marketing_visits')
  assert.equal(prefs.tabs[1].key, 'reviews')
  assert.equal(prefs.tabs[1].visible, false)
  const settings = prefs.tabs.find(item => item.key === 'settings')
  assert.ok(settings)
  assert.equal(settings.visible, true)
  assert.ok(prefs.tabs.some(item => item.key === 'establishments'))
  assert.ok(!prefs.tabs.some(item => (item.key as string) === 'unknown'))
})

test('moveTab swaps neighbors', () => {
  const tabs = defaultAdminUiPrefs().tabs
  const moved = moveTab(tabs, 'reviews', 1)
  assert.equal(moved[0].key, 'ads_agent')
  assert.equal(moved[1].key, 'reviews')
})

test('setTabVisible cannot hide settings', () => {
  const tabs = setTabVisible(defaultAdminUiPrefs().tabs, 'settings', false)
  assert.equal(tabs.find(item => item.key === 'settings')?.visible, true)
  const hidden = setTabVisible(tabs, 'reviews', false)
  assert.equal(hidden.find(item => item.key === 'reviews')?.visible, false)
})

test('visibleNavTabs respects access, order, and visibility', () => {
  const owner = { isOwner: true, pages: [] as string[] }
  const prefs = sanitizeAdminUiPrefs({
    tabs: [
      { key: 'marketing_visits', visible: true },
      { key: 'reviews', visible: false },
      { key: 'promo', visible: true },
    ],
  })
  const keys = visibleNavTabs(owner, prefs)
  assert.equal(keys[0], 'marketing_visits')
  assert.ok(!keys.includes('reviews'))
  assert.ok(keys.includes('promo'))
  assert.ok(keys.includes('settings'))
  assert.ok(keys.includes('staff'))

  const staff = { isOwner: false, pages: ['promo', 'reviews'] }
  const staffKeys = visibleNavTabs(staff, prefs)
  assert.deepEqual(staffKeys.filter(key => key !== 'settings'), ['promo'])
  assert.ok(!staffKeys.includes('staff'))
  assert.ok(staffKeys.includes('settings'))
})

test('moveTabAmong swaps only within allowed keys', () => {
  const tabs = [
    { key: 'reviews', visible: true },
    { key: 'ads_agent', visible: true },
    { key: 'promo', visible: true },
  ]
  const allowed = new Set(['reviews', 'promo'])
  const moved = moveTabAmong(tabs, 'reviews', 1, allowed)
  assert.equal(moved[0].key, 'promo')
  assert.equal(moved[1].key, 'ads_agent')
  assert.equal(moved[2].key, 'reviews')
})

test('firstVisibleNavTab falls back to settings', () => {
  const staff = { isOwner: false, pages: [] as string[] }
  const prefs = sanitizeAdminUiPrefs({
    tabs: ALL_HIDDEN_EXCEPT_SETTINGS(),
  })
  assert.equal(firstVisibleNavTab(staff, prefs), 'settings')
})

test('LAYOUT_PAGE_KEYS stays aligned with ADMIN_PAGES registry', async () => {
  const { ALL_ADMIN_PAGE_KEYS } = await import('./admin-pages.ts')
  const { LAYOUT_PAGE_KEYS } = await import('./admin-ui-prefs.ts')
  assert.deepEqual([...LAYOUT_PAGE_KEYS], [...ALL_ADMIN_PAGE_KEYS])
})

function ALL_HIDDEN_EXCEPT_SETTINGS() {
  return defaultAdminUiPrefs().tabs.map(item => ({
    ...item,
    visible: item.key === 'settings',
  }))
}
