import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isAiTestUserAgent,
  isLinuxChromeDesktopUa,
  primaryNoiseLabel,
  sanitizeAudienceMode,
} from './visitor-noise-ua.ts'

test('detects Cursor/Playwright and Linux Chrome agent UAs', () => {
  const linuxChrome =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  const iphone =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E1'
  const playwright =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36'

  assert.equal(isAiTestUserAgent(playwright), true)
  assert.equal(isAiTestUserAgent('Mozilla/5.0 Cursor/1.0 Electron/28'), true)
  assert.equal(isLinuxChromeDesktopUa(linuxChrome), true)
  assert.equal(isLinuxChromeDesktopUa(iphone), false)
  assert.equal(isAiTestUserAgent(iphone), false)
})

test('primaryNoiseLabel prioritizes AI over uncertain', () => {
  assert.equal(primaryNoiseLabel(['uncertain', 'ai_ua']), 'ai_ua')
  assert.equal(sanitizeAudienceMode('noise'), 'noise')
  assert.equal(sanitizeAudienceMode('nope'), 'real')
})
