export function normalizeDemoSandboxId(id: unknown): string | null {
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return trimmed || null
}

export function normalizeDemoEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  if (!trimmed.includes('@')) return null
  return trimmed
}
