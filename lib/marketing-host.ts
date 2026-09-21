const PROD_HOSTS = new Set([
  'restodocks.com',
  'www.restodocks.com',
  'restodocks.ru',
  'www.restodocks.ru',
])

export const MARKETING_HOST_MODES = ['all', 'prod', 'not_beta', 'beta'] as const
export type MarketingHostMode = (typeof MARKETING_HOST_MODES)[number]

export function isMarketingHostMode(value: string): value is MarketingHostMode {
  return (MARKETING_HOST_MODES as readonly string[]).includes(value)
}

export function isProdHost(clientHost: string | null | undefined): boolean {
  const host = (clientHost ?? '').trim().toLowerCase()
  return PROD_HOSTS.has(host)
}

export function isBetaHost(clientHost: string | null | undefined): boolean {
  const host = (clientHost ?? '').trim().toLowerCase()
  return host.includes('pages.dev')
}

export function isLocalHost(clientHost: string | null | undefined): boolean {
  const host = (clientHost ?? '').trim().toLowerCase()
  return host === 'localhost' || host.startsWith('127.0.0.1')
}

/** Filter presets from Витрина host dropdown (not literal hostnames). */
export function matchesMarketingHost(
  clientHost: string | null | undefined,
  mode: string,
): boolean {
  const normalized = (mode || 'all').trim().toLowerCase() || 'all'
  if (normalized === 'all') return true
  if (normalized === 'prod') return isProdHost(clientHost)
  if (normalized === 'beta') return isBetaHost(clientHost)
  if (normalized === 'not_beta') {
    if (isLocalHost(clientHost) || isBetaHost(clientHost)) return false
    return true
  }
  return (clientHost ?? '').trim().toLowerCase() === normalized
}
