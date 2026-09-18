import assert from 'node:assert/strict'
import test from 'node:test'

/** Mirror of matchesCreatedAt in admin-client.jsx */
function matchesCreatedAt(iso: string | null | undefined, from: string, to: string) {
  if (!from && !to) return true
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  if (from) {
    const start = new Date(`${from}T00:00:00`).getTime()
    if (t < start) return false
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`).getTime()
    if (t > end) return false
  }
  return true
}

test('matchesCreatedAt inclusive day bounds', () => {
  assert.equal(matchesCreatedAt('2026-09-07T19:16:00.000Z', '', ''), true)
  assert.equal(matchesCreatedAt('2026-09-07T19:16:00.000Z', '2026-09-07', '2026-09-07'), true)
  assert.equal(matchesCreatedAt('2026-09-06T23:00:00.000Z', '2026-09-07', ''), false)
  assert.equal(matchesCreatedAt('2026-09-08T00:00:00.000Z', '', '2026-09-07'), false)
  assert.equal(matchesCreatedAt(null, '2026-09-01', ''), false)
})
