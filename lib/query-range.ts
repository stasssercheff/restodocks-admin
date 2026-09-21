export function parseYmd(value: string | null): string | null {
  if (!value) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

export function parseHm(value: string | null, fallback: string): string {
  if (value && /^\d{2}:\d{2}$/.test(value)) return value
  return fallback
}

export function zonedDateTime(date: string, time: string, timeZone: string, endOfMinute = false): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, endOfMinute ? 59 : 0, endOfMinute ? 999 : 0)
  if (!timeZone || timeZone === 'UTC') return new Date(utcGuess)
  try {
    const asUtc = new Date(utcGuess)
    const inZone = new Date(asUtc.toLocaleString('en-US', { timeZone }))
    const offset = asUtc.getTime() - inZone.getTime()
    return new Date(utcGuess + offset)
  } catch {
    return new Date(utcGuess)
  }
}

export function addDaysYmd(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function todayYmd(timeZone = 'UTC'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

export function countBy<T>(rows: T[], keyFn: (row: T) => string | null | undefined): { key: string; count: number }[] {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = keyFn(row) || '(empty)'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }))
}
