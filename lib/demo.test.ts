import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDemoEmail, normalizeDemoSandboxId } from './demo-id.ts'

test('normalizeDemoSandboxId trims and rejects empty', () => {
  assert.equal(normalizeDemoSandboxId('  abc  '), 'abc')
  assert.equal(normalizeDemoSandboxId(''), null)
  assert.equal(normalizeDemoSandboxId('   '), null)
  assert.equal(normalizeDemoSandboxId(null), null)
  assert.equal(normalizeDemoSandboxId(1), null)
})

test('normalizeDemoEmail lowercases and requires @', () => {
  assert.equal(normalizeDemoEmail('  Stassser@Gmail.com '), 'stassser@gmail.com')
  assert.equal(normalizeDemoEmail('nope'), null)
  assert.equal(normalizeDemoEmail(''), null)
  assert.equal(normalizeDemoEmail(null), null)
})
