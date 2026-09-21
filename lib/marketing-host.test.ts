import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesMarketingHost } from './marketing-host.ts'

test('prod mode keeps .com/.ru only', () => {
  assert.equal(matchesMarketingHost('restodocks.com', 'prod'), true)
  assert.equal(matchesMarketingHost('www.restodocks.ru', 'prod'), true)
  assert.equal(matchesMarketingHost('restodocks.pages.dev', 'prod'), false)
  assert.equal(matchesMarketingHost('localhost', 'prod'), false)
})

test('not_beta excludes pages.dev and localhost', () => {
  assert.equal(matchesMarketingHost('restodocks.com', 'not_beta'), true)
  assert.equal(matchesMarketingHost('restodocks.pages.dev', 'not_beta'), false)
  assert.equal(matchesMarketingHost('localhost', 'not_beta'), false)
  assert.equal(matchesMarketingHost(null, 'not_beta'), true)
})

test('beta keeps pages.dev', () => {
  assert.equal(matchesMarketingHost('restodocks.pages.dev', 'beta'), true)
  assert.equal(matchesMarketingHost('restodocks.com', 'beta'), false)
})

test('all keeps everything; exact host still works', () => {
  assert.equal(matchesMarketingHost('restodocks.pages.dev', 'all'), true)
  assert.equal(matchesMarketingHost('restodocks.com', 'restodocks.com'), true)
  assert.equal(matchesMarketingHost('restodocks.com', 'other.com'), false)
})
