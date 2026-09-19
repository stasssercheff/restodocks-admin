/** Normalize UI date strings to YYYY-MM-DD (accepts ISO, DD.MM.YYYY, DD/MM/YYYY). */
export function normalizeDateInput(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    return `${dmy[3]}-${month}-${day}`
  }
  return ''
}

/** Calendar-day compare on created_at ISO vs YYYY-MM-DD bounds (inclusive). */
export function matchesCreatedAt(
  iso: string | null | undefined,
  from: string,
  to: string,
): boolean {
  const fromDay = normalizeDateInput(from)
  const toDay = normalizeDateInput(to)
  if (!fromDay && !toDay) return true
  if (!iso) return false
  const day = normalizeDateInput(String(iso).slice(0, 10))
  if (!day) return false
  if (fromDay && day < fromDay) return false
  if (toDay && day > toDay) return false
  return true
}
