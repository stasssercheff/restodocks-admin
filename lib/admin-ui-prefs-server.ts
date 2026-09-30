import { readAdminConfigJson, writeAdminConfigJson } from '@/lib/admin-kv'
import { sanitizeAdminUiPrefs, type AdminUiPrefs } from '@/lib/admin-ui-prefs'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Primary key — stable across owner/staff id quirks. */
export function uiPrefsEmailKey(email: string): string {
  return `ui_prefs:email:${normalizeEmail(email)}`
}

/** Legacy key used by the first KV sync deploy. */
export function uiPrefsUserIdKey(userId: string): string {
  return `ui_prefs:${userId}`
}

export async function readUiPrefsForUser(user: { id: string; email: string }): Promise<AdminUiPrefs | null> {
  const byEmail = await readAdminConfigJson<AdminUiPrefs>(uiPrefsEmailKey(user.email))
  if (byEmail) return sanitizeAdminUiPrefs(byEmail)

  const byId = await readAdminConfigJson<AdminUiPrefs>(uiPrefsUserIdKey(user.id))
  if (byId) return sanitizeAdminUiPrefs(byId)

  return null
}

/** Write to email key (canonical) and user-id key (legacy readers). */
export async function writeUiPrefsForUser(
  user: { id: string; email: string },
  prefs: AdminUiPrefs,
): Promise<AdminUiPrefs> {
  const clean = sanitizeAdminUiPrefs(prefs)
  await writeAdminConfigJson(uiPrefsEmailKey(user.email), clean)
  try {
    await writeAdminConfigJson(uiPrefsUserIdKey(user.id), clean)
  } catch {
    // Email key is enough for cross-device sync; id key is best-effort.
  }
  return clean
}
