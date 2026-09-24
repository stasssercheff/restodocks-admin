import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultMarketingVisitsPrefs,
  sanitizeMarketingVisitsPrefs,
} from './marketing-visits-prefs.ts'

test('sanitizeMarketingVisitsPrefs keeps clicked IPs and flags', () => {
  const prefs = sanitizeMarketingVisitsPrefs({
    excludeIps: '1.1.1.1, 2.2.2.2',
    excludeEnabled: true,
    clickedHideIps: ['1.1.1.1', '1.1.1.1', ' 3.3.3.3 '],
    excludeBots: true,
    host: 'prod',
    sort: 'time_asc',
  })
  assert.equal(prefs.excludeEnabled, true)
  assert.equal(prefs.excludeBots, true)
  assert.equal(prefs.host, 'prod')
  assert.equal(prefs.sort, 'time_asc')
  assert.deepEqual(prefs.clickedHideIps, ['1.1.1.1', '3.3.3.3'])
})

test('sanitizeMarketingVisitsPrefs falls back to defaults', () => {
  assert.deepEqual(sanitizeMarketingVisitsPrefs(null), defaultMarketingVisitsPrefs())
  assert.deepEqual(sanitizeMarketingVisitsPrefs({}), {
    ...defaultMarketingVisitsPrefs(),
  })
})
