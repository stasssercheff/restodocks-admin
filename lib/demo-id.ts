export function normalizeDemoSandboxId(id: unknown): string | null {
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return trimmed || null
}
