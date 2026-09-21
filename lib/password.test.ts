import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, verifyPassword, safeStringEqual } from './password.ts'

test('hashPassword + verifyPassword roundtrip', async () => {
  const hash = await hashPassword('secret-pass-1')
  assert.match(hash, /^pbkdf2\$sha256\$31000\$[0-9a-f]+\$[0-9a-f]+$/)
  assert.equal(await verifyPassword('secret-pass-1', hash), true)
  assert.equal(await verifyPassword('other', hash), false)
  assert.equal(await verifyPassword('secret-pass-1', 'not-a-hash'), false)
})

test('safeStringEqual compares exact strings', () => {
  assert.equal(safeStringEqual('abc', 'abc'), true)
  assert.equal(safeStringEqual('abc', 'abd'), false)
  assert.equal(safeStringEqual('abc', 'ab'), false)
})
