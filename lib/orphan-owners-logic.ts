export const OWNER_DELETE_CONFIRM_WORD = 'удалить'
export const OWNER_DELETE_COOLING_DAYS = 30

export function matchesOwnerDeleteConfirm(raw: unknown): boolean {
  const t = typeof raw === 'string' ? raw.trim() : ''
  return t.toLocaleLowerCase('ru-RU') === OWNER_DELETE_CONFIRM_WORD
}

export function daysSinceIso(iso: string, now = Date.now()): number {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 0
  return Math.floor((now - t) / (24 * 60 * 60 * 1000))
}

export function isWithinOwnerCoolingOff(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return false
  return daysSinceIso(iso, now) < OWNER_DELETE_COOLING_DAYS
}
