/** Normalize a single IP (or host:port) for exact exclude matching. */
export function normalizeExcludeIp(value: string | null | undefined): string {
  let ip = (value ?? '').trim()
  if (!ip) return ''
  // Strip surrounding brackets used for IPv6 literals: [2001:db8::1]
  if (ip.startsWith('[') && ip.includes(']')) {
    ip = ip.slice(1, ip.indexOf(']'))
  }
  // Strip :port for IPv4 host:port (not IPv6)
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, '')
  }
  return ip.toLowerCase()
}

/** Parse a comma/whitespace-separated exclude list into unique normalized IPs. */
export function parseExcludeIps(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(/[,;\s]+/)) {
    const ip = normalizeExcludeIp(part)
    if (!ip || seen.has(ip)) continue
    seen.add(ip)
    out.push(ip)
  }
  return out
}

/**
 * Keep row unless its IP is exactly in the exclude set.
 * Rows with missing IP are kept (cannot match an exclude entry).
 * Never uses substring / prefix matching — that would hide unrelated rows.
 */
export function rowIpIsExcluded(
  rowIp: string | null | undefined,
  excluded: ReadonlySet<string> | readonly string[],
): boolean {
  const ip = normalizeExcludeIp(rowIp)
  if (!ip) return false
  if (excluded instanceof Set) return excluded.has(ip)
  for (const item of excluded) {
    if (normalizeExcludeIp(item) === ip) return true
  }
  return false
}

export function filterRowsByExcludedIps<T extends { ip?: string | null }>(
  rows: T[],
  rawExcludeList: string | null | undefined,
): T[] {
  const list = parseExcludeIps(rawExcludeList)
  if (!list.length) return rows
  const excluded = new Set(list)
  return rows.filter(row => !rowIpIsExcluded(row.ip, excluded))
}

/**
 * Resolve which IPs are actively filtered.
 * Row-click hides accumulate in `clickedIps` and NEVER dump the whole saved field.
 * Manual checkbox with an empty click-set uses the saved field.
 */
export function resolveActiveExcludeIps(options: {
  enabled: boolean
  savedField: string
  clickedIps?: readonly string[] | null
}): string[] {
  if (!options.enabled) return []
  const clicked = parseExcludeIps((options.clickedIps ?? []).join(','))
  if (clicked.length) return clicked
  return parseExcludeIps(options.savedField)
}

export function addClickedHideIp(
  current: readonly string[],
  ip: string | null | undefined,
): string[] {
  const next = normalizeExcludeIp(ip)
  if (!next) return [...current]
  const list = parseExcludeIps(current.join(','))
  if (list.includes(next)) return list
  return [...list, next]
}
