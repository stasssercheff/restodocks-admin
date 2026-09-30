/** Dashboard «Регистрация» = completed venues, not marketing form opens. */
export function completedRegistrationCount(payload: {
  meta?: { completedRegistrations?: number | null } | null
  summary?: { completedRegistrations?: number | null } | null
} | null | undefined): number {
  const fromMeta = payload?.meta?.completedRegistrations
  if (typeof fromMeta === 'number' && Number.isFinite(fromMeta)) return fromMeta
  const fromSummary = payload?.summary?.completedRegistrations
  if (typeof fromSummary === 'number' && Number.isFinite(fromSummary)) return fromSummary
  return 0
}
