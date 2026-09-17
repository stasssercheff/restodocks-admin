import assert from 'node:assert/strict'
import test from 'node:test'
import { createSessionToken, verifySessionToken } from './admin-session.ts'

test('session token verifies until expiry', () => {
  process.env.ADMIN_PASSWORD = 'session-secret'
  const created = createSessionToken({
    uid: 'user-1',
    email: 'Partner@Email.com',
    role: 'staff',
  })
  assert.ok(!('error' in created))
  const payload = verifySessionToken(created.token)
  assert.ok(payload)
  assert.equal(payload.uid, 'user-1')
  assert.equal(payload.email, 'partner@email.com')
  assert.equal(payload.role, 'staff')
  assert.equal(verifySessionToken('tampered.' + created.token.split('.')[1]), null)
  assert.equal(verifySessionToken(created.token.slice(0, -2) + 'zz'), null)
})
