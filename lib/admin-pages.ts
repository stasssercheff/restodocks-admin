/** Разделы админки. Новый экран = новая запись; чекбоксы доступа подхватят её сами. */
export const ADMIN_PAGES = [
  { key: 'establishments', label: 'Заведения' },
  { key: 'promo', label: 'Промокоды' },
] as const

export type AdminPageKey = (typeof ADMIN_PAGES)[number]['key']

export const ALL_ADMIN_PAGE_KEYS: AdminPageKey[] = ADMIN_PAGES.map(page => page.key)

export function isAdminPageKey(value: string): value is AdminPageKey {
  return (ALL_ADMIN_PAGE_KEYS as string[]).includes(value)
}

export function sanitizePages(input: unknown): AdminPageKey[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<AdminPageKey>()
  for (const item of input) {
    if (typeof item === 'string' && isAdminPageKey(item)) seen.add(item)
  }
  return ALL_ADMIN_PAGE_KEYS.filter(key => seen.has(key))
}

export type PublicAdminUser = {
  id: string
  email: string
  displayName: string | null
  isOwner: boolean
  pages: AdminPageKey[]
}

export function canAccessPage(
  user: { isOwner: boolean; pages: string[] } | null | undefined,
  page: AdminPageKey,
): boolean {
  if (!user) return false
  if (user.isOwner) return true
  return user.pages.includes(page)
}
