/** Pure UA / audience helpers — no cross-imports (node:test friendly). */

export type AudienceMode = 'real' | 'all' | 'noise'

export type NoiseReason =
  | 'bot'
  | 'uncertain'
  | 'datacenter'
  | 'ai_ua'
  | 'linux_chrome'

/** Explicit automation / Cursor / headless fingerprints. */
const AI_UA_RE =
  /HeadlessChrome|Playwright|Puppeteer|PhantomJS|Selenium|Cursor\/|Electron\/|chatgpt|openai|anthropic|claude-web|perplexity/i

/**
 * Desktop Linux Chrome is the default fingerprint for Cursor Cloud agents,
 * Playwright, and many CI browsers — not typical restaurant-owner traffic.
 */
const LINUX_CHROME_DESKTOP_RE = /\(X11; Linux x86_64\).*Chrome\/\d+/i

export function isAiTestUserAgent(ua: string | null | undefined): boolean {
  const value = (ua ?? '').trim()
  if (!value) return false
  return AI_UA_RE.test(value)
}

export function isLinuxChromeDesktopUa(ua: string | null | undefined): boolean {
  const value = (ua ?? '').trim()
  if (!value) return false
  return LINUX_CHROME_DESKTOP_RE.test(value)
}

export function primaryNoiseLabel(reasons: NoiseReason[]): NoiseReason | null {
  if (reasons.includes('bot')) return 'bot'
  if (reasons.includes('ai_ua')) return 'ai_ua'
  if (reasons.includes('linux_chrome')) return 'linux_chrome'
  if (reasons.includes('datacenter')) return 'datacenter'
  if (reasons.includes('uncertain')) return 'uncertain'
  return null
}

export function sanitizeAudienceMode(value: unknown): AudienceMode {
  if (value === 'real' || value === 'all' || value === 'noise') return value
  return 'real'
}
