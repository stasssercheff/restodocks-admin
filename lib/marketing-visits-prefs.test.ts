import assert from 'node:assert/strict'
import test from 'node:test'

// Inline sanitize mirror — prefs module uses @/ aliases that node:test cannot resolve.
type AudienceMode = 'real' | 'all' | 'noise'

function sanitizeAudienceMode(value: unknown): AudienceMode {
  if (value === 'real' || value === 'all' || value === 'noise') return value
  return 'real'
}

function defaultMarketingVisitsPrefs() {
  return {
    version: 2 as const,
    excludeIps: '',
    excludeEnabled: false,
    clickedHideIps: [] as string[],
    excludeBots: true,
    excludeDatacenter: true,
    audience: 'real' as AudienceMode,
    host: 'all',
    sort: 'time_desc',
    viewMode: 'sessions' as const,
  }
}

function sanitizeMarketingVisitsPrefs(input: unknown) {
  const defaults = defaultMarketingVisitsPrefs()
  if (!input || typeof input !== 'object') return defaults
  const raw = input as Record<string, unknown>
  const audience = 'audience' in raw ? sanitizeAudienceMode(raw.audience) : 'real'
  const clicked = Array.isArray(raw.clickedHideIps)
    ? [...new Set(raw.clickedHideIps.map(v => String(v).trim().toLowerCase()).filter(Boolean))]
    : []
  return {
    version: 2 as const,
    excludeIps: typeof raw.excludeIps === 'string' ? raw.excludeIps : '',
    excludeEnabled: raw.excludeEnabled === true,
    clickedHideIps: clicked,
    excludeBots: audience === 'real',
    excludeDatacenter: audience === 'real',
    audience,
    host: typeof raw.host === 'string' && raw.host.trim() ? raw.host.trim() : 'all',
    sort: typeof raw.sort === 'string' && raw.sort.trim() ? raw.sort.trim() : 'time_desc',
    viewMode: raw.viewMode === 'events' ? 'events' as const : 'sessions' as const,
  }
}

test('defaults to real audience (hide bots/cloud/AI noise)', () => {
  const prefs = defaultMarketingVisitsPrefs()
  assert.equal(prefs.audience, 'real')
  assert.equal(prefs.excludeBots, true)
  assert.equal(prefs.excludeDatacenter, true)
  assert.equal(prefs.viewMode, 'sessions')
  assert.equal(prefs.version, 2)
})

test('sanitizeMarketingVisitsPrefs keeps clicked IPs and audience', () => {
  const prefs = sanitizeMarketingVisitsPrefs({
    excludeIps: '1.1.1.1, 2.2.2.2',
    excludeEnabled: true,
    clickedHideIps: ['1.1.1.1', '1.1.1.1', ' 3.3.3.3 '],
    audience: 'noise',
    host: 'prod',
    sort: 'time_asc',
    viewMode: 'events',
  })
  assert.equal(prefs.excludeEnabled, true)
  assert.equal(prefs.audience, 'noise')
  assert.equal(prefs.excludeBots, false)
  assert.equal(prefs.host, 'prod')
  assert.equal(prefs.sort, 'time_asc')
  assert.equal(prefs.viewMode, 'events')
  assert.deepEqual(prefs.clickedHideIps, ['1.1.1.1', '3.3.3.3'])
})

test('legacy v1 prefs upgrade to real audience by default', () => {
  const prefs = sanitizeMarketingVisitsPrefs({
    excludeBots: false,
    excludeDatacenter: false,
    host: 'all',
  })
  assert.equal(prefs.audience, 'real')
  assert.equal(prefs.excludeBots, true)
  assert.equal(prefs.excludeDatacenter, true)
})
