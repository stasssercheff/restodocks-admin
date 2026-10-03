import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDemoSandboxId } from './demo-id.ts'

test('normalizeDemoSandboxId trims and rejects empty', () => {
  assert.equal(normalizeDemoSandboxId('  abc  '), 'abc')
  assert.equal(normalizeDemoSandboxId(''), null)
  assert.equal(normalizeDemoSandboxId('   '), null)
  assert.equal(normalizeDemoSandboxId(null), null)
  assert.equal(normalizeDemoSandboxId(1), null)
})
