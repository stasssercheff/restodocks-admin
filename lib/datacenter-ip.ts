/**
 * Heuristic: marketing_visits sometimes store AWS/GCP/Azure egress IPs
 * (server-side trackers, preview crawlers) instead of the real visitor IP.
 * Ashburn, VA is the classic AWS us-east-1 footprint in this project.
 */

const AWS_PREFIXES = [
  '3.', '13.', '18.', '23.', '34.', '35.', '44.', '50.', '52.', '54.',
  '100.', '107.', '174.', '184.', '204.',
]

export function isLikelyAwsIp(ip: string | null | undefined): boolean {
  const value = (ip ?? '').trim()
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false
  return AWS_PREFIXES.some(prefix => value.startsWith(prefix))
}

export function looksLikeDatacenterVisit(row: {
  ip?: string | null
  city?: string | null
  region?: string | null
  country_code?: string | null
}): boolean {
  const city = (row.city ?? '').trim().toLowerCase()
  const region = (row.region ?? '').trim().toLowerCase()
  const country = (row.country_code ?? '').trim().toUpperCase()
  const ashburn = city === 'ashburn' || (city === '' && region.includes('virginia') && country === 'US')
  if (ashburn && country === 'US') return true
  return isLikelyAwsIp(row.ip)
}
