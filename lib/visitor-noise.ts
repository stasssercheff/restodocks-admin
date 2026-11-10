import { looksLikeDatacenterVisit } from '@/lib/datacenter-ip'
import {
  isAiTestUserAgent,
  isLinuxChromeDesktopUa,
  primaryNoiseLabel,
  sanitizeAudienceMode,
  type AudienceMode,
  type NoiseReason,
} from '@/lib/visitor-noise-ua'

export type { AudienceMode, NoiseReason }
export {
  isAiTestUserAgent,
  isLinuxChromeDesktopUa,
  primaryNoiseLabel,
  sanitizeAudienceMode,
}

export type NoiseVisitRow = {
  visitor_kind?: string | null
  visitor_hint?: string | null
  user_agent?: string | null
  ip?: string | null
  city?: string | null
  region?: string | null
  country_code?: string | null
}

export function noiseReasons(row: NoiseVisitRow): NoiseReason[] {
  const reasons: NoiseReason[] = []
  const kind = (row.visitor_kind ?? '').trim().toLowerCase()
  if (kind === 'bot') reasons.push('bot')
  if (kind === 'uncertain' || kind === '') reasons.push('uncertain')
  if (looksLikeDatacenterVisit(row)) reasons.push('datacenter')
  if (isAiTestUserAgent(row.user_agent)) reasons.push('ai_ua')
  else if (isLinuxChromeDesktopUa(row.user_agent)) reasons.push('linux_chrome')
  return reasons
}

export function isNoiseVisit(row: NoiseVisitRow): boolean {
  return noiseReasons(row).length > 0
}

export function isRealVisit(row: NoiseVisitRow): boolean {
  return !isNoiseVisit(row)
}

export function matchesAudience(row: NoiseVisitRow, audience: AudienceMode): boolean {
  if (audience === 'all') return true
  if (audience === 'noise') return isNoiseVisit(row)
  return isRealVisit(row)
}
