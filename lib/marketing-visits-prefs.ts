export const MARKETING_VISITS_PREFS_KEY = 'rd_admin_marketing_visits_prefs'
export const MARKETING_EXCLUDE_IPS_LEGACY_KEY = 'admin_marketing_exclude_ips'

export type MarketingVisitsPrefs = {
  version: 1
  /** Comma-separated saved IP list (text field). */
  excludeIps: string
  /** Whether «Hide my IPs» is on. */
  excludeEnabled: boolean
  /** IPs hidden via row «скрыть» clicks (active filter when non-empty). */
  clickedHideIps: string[]
  excludeBots: boolean
  host: string
  sort: string
}

function parseIpList(raw: unknown): string[] {
  const text = Array.isArray(raw)
    ? raw.map(item => String(item ?? '')).join(',')
    : typeof raw === 'string'
      ? raw
      : ''
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of text.split(/[,;\s]+/)) {
    const ip = part.trim().toLowerCase()
    if (!ip || seen.has(ip)) continue
    seen.add(ip)
    out.push(ip)
  }
  return out
}

export function defaultMarketingVisitsPrefs(): MarketingVisitsPrefs {
  return {
    version: 1,
    excludeIps: '',
    excludeEnabled: false,
    clickedHideIps: [],
    excludeBots: false,
    host: 'all',
    sort: 'time_desc',
  }
}

export function sanitizeMarketingVisitsPrefs(input: unknown): MarketingVisitsPrefs {
  const defaults = defaultMarketingVisitsPrefs()
  if (!input || typeof input !== 'object') return defaults
  const raw = input as Record<string, unknown>
  const host = typeof raw.host === 'string' && raw.host.trim() ? raw.host.trim() : defaults.host
  const sort = typeof raw.sort === 'string' && raw.sort.trim() ? raw.sort.trim() : defaults.sort
  const excludeIps = typeof raw.excludeIps === 'string' ? raw.excludeIps : defaults.excludeIps
  return {
    version: 1,
    excludeIps,
    excludeEnabled: raw.excludeEnabled === true,
    clickedHideIps: parseIpList(raw.clickedHideIps),
    excludeBots: raw.excludeBots === true,
    host,
    sort,
  }
}

export function loadMarketingVisitsPrefs(): MarketingVisitsPrefs {
  if (typeof window === 'undefined') return defaultMarketingVisitsPrefs()
  try {
    const raw = window.localStorage.getItem(MARKETING_VISITS_PREFS_KEY)
    if (raw) return sanitizeMarketingVisitsPrefs(JSON.parse(raw))

    // Migrate legacy single-key IP list (older builds only stored the field).
    const legacy = window.localStorage.getItem(MARKETING_EXCLUDE_IPS_LEGACY_KEY)
    if (legacy?.trim()) {
      const ips = parseIpList(legacy)
      return sanitizeMarketingVisitsPrefs({
        excludeIps: legacy.trim(),
        excludeEnabled: ips.length > 0,
        clickedHideIps: ips,
      })
    }
  } catch {
    // ignore
  }
  return defaultMarketingVisitsPrefs()
}

export function saveMarketingVisitsPrefs(prefs: MarketingVisitsPrefs): void {
  if (typeof window === 'undefined') return
  try {
    const clean = sanitizeMarketingVisitsPrefs(prefs)
    window.localStorage.setItem(MARKETING_VISITS_PREFS_KEY, JSON.stringify(clean))
    window.localStorage.setItem(MARKETING_EXCLUDE_IPS_LEGACY_KEY, clean.excludeIps.trim())
  } catch {
    // ignore
  }
}
