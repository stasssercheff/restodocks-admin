/** UI prefs for the admin shell (tab order / visibility, etc.). */

export const ADMIN_UI_PREFS_KEY = 'rd_admin_ui_prefs'

/**
 * Nav keys that can appear in the shell tab bar.
 * Keep in sync with `ADMIN_PAGES` in admin-pages.ts (+ staff + settings).
 */
export const LAYOUT_PAGE_KEYS = [
  'reviews',
  'ads_agent',
  'establishments',
  'promo',
  'popups',
  'ai_usage',
  'demo_sandboxes',
  'marketing_visits',
  'broadcast',
  'support',
  'security',
  'health',
] as const

export type LayoutPageKey = (typeof LAYOUT_PAGE_KEYS)[number]

/** Nav keys that can appear in the shell tab bar (incl. owner-only + settings). */
export type NavTabKey = LayoutPageKey | 'staff' | 'settings'

export type TabLayoutItem = {
  key: NavTabKey
  visible: boolean
}

export type AdminUiPrefs = {
  version: 1
  tabs: TabLayoutItem[]
  /** Unix ms — used for cross-device last-write-wins. */
  updatedAt?: number
}

/** Default order matches the historic admin shell. */
export const DEFAULT_NAV_TAB_KEYS: NavTabKey[] = [
  ...LAYOUT_PAGE_KEYS,
  'staff',
  'settings',
]

export function isNavTabKey(value: string): value is NavTabKey {
  return (DEFAULT_NAV_TAB_KEYS as string[]).includes(value)
}

export function defaultAdminUiPrefs(): AdminUiPrefs {
  return {
    version: 1,
    tabs: DEFAULT_NAV_TAB_KEYS.map(key => ({
      key,
      visible: true,
    })),
    updatedAt: 0,
  }
}

/**
 * Merge saved prefs with the current registry so new tabs appear at the end
 * and unknown keys are dropped. Settings cannot be hidden.
 */
export function sanitizeAdminUiPrefs(input: unknown): AdminUiPrefs {
  const defaults = defaultAdminUiPrefs()
  if (!input || typeof input !== 'object') return defaults

  const rawTabs = (input as { tabs?: unknown }).tabs
  if (!Array.isArray(rawTabs)) return defaults

  const seen = new Set<NavTabKey>()
  const ordered: TabLayoutItem[] = []

  for (const item of rawTabs) {
    if (!item || typeof item !== 'object') continue
    const key = (item as { key?: unknown }).key
    if (typeof key !== 'string' || !isNavTabKey(key) || seen.has(key)) continue
    seen.add(key)
    const visible = key === 'settings'
      ? true
      : (item as { visible?: unknown }).visible !== false
    ordered.push({ key, visible })
  }

  for (const key of DEFAULT_NAV_TAB_KEYS) {
    if (seen.has(key)) continue
    ordered.push({ key, visible: true })
  }

  const rawUpdated = (input as { updatedAt?: unknown }).updatedAt
  const updatedAt = typeof rawUpdated === 'number' && Number.isFinite(rawUpdated) && rawUpdated > 0
    ? Math.floor(rawUpdated)
    : 0

  return { version: 1, tabs: ordered, updatedAt }
}

export function touchAdminUiPrefs(prefs: AdminUiPrefs): AdminUiPrefs {
  return {
    ...sanitizeAdminUiPrefs(prefs),
    updatedAt: Date.now(),
  }
}

export function loadAdminUiPrefs(): AdminUiPrefs {
  if (typeof window === 'undefined') return defaultAdminUiPrefs()
  try {
    const raw = window.localStorage.getItem(ADMIN_UI_PREFS_KEY)
    if (!raw) return defaultAdminUiPrefs()
    return sanitizeAdminUiPrefs(JSON.parse(raw))
  } catch {
    return defaultAdminUiPrefs()
  }
}

export function saveAdminUiPrefs(prefs: AdminUiPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_UI_PREFS_KEY, JSON.stringify(sanitizeAdminUiPrefs(prefs)))
  } catch {
    // ignore quota / private mode
  }
}

/** True when prefs differ from the default all-visible registry order. */
export function isCustomAdminUiPrefs(prefs: AdminUiPrefs): boolean {
  const defaults = defaultAdminUiPrefs()
  const clean = sanitizeAdminUiPrefs(prefs)
  if (clean.tabs.length !== defaults.tabs.length) return true
  return clean.tabs.some((item, index) => {
    const base = defaults.tabs[index]
    return !base || item.key !== base.key || item.visible !== base.visible
  })
}

/** Fetch account prefs from the server (Cloudflare KV). Falls back to null on error/empty. */
export async function fetchAdminUiPrefsFromServer(): Promise<AdminUiPrefs | null> {
  try {
    const res = await fetch('/api/ui-prefs', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = await res.json() as { prefs?: unknown; source?: string }
    if (!json.prefs || json.source === 'empty') return null
    return sanitizeAdminUiPrefs(json.prefs)
  } catch {
    return null
  }
}

/** Persist prefs to the server so PC and mobile share the same layout. */
export async function pushAdminUiPrefsToServer(prefs: AdminUiPrefs): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/ui-prefs', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ prefs: sanitizeAdminUiPrefs(prefs) }),
    })
    const json = await res.json().catch(() => ({})) as { error?: string }
    if (!res.ok) {
      return { ok: false, error: typeof json.error === 'string' ? json.error : `Ошибка (${res.status})` }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Сеть: не удалось сохранить на сервер' }
  }
}

export type SyncAdminUiPrefsOptions = {
  /** Prefs already loaded on the server (SSR) — used if GET fails/empty. */
  seed?: AdminUiPrefs | null
}

/**
 * Load prefs for the shell: prefer server (cross-device), else localStorage.
 * If server is empty but local has a custom layout, upload local once.
 * If local is custom and newer than remote, push local (last-write-wins).
 */
export async function syncAdminUiPrefs(options?: SyncAdminUiPrefsOptions): Promise<AdminUiPrefs> {
  const local = loadAdminUiPrefs()
  const seed = options?.seed ? sanitizeAdminUiPrefs(options.seed) : null
  const remote = (await fetchAdminUiPrefsFromServer()) ?? (seed && isCustomAdminUiPrefs(seed) ? seed : null)

  if (remote) {
    const localTs = local.updatedAt ?? 0
    const remoteTs = remote.updatedAt ?? 0
    // Local custom layout newer than server → push so phone can pick it up.
    if (isCustomAdminUiPrefs(local) && localTs > remoteTs) {
      const touched = localTs > 0 ? local : touchAdminUiPrefs(local)
      const pushed = await pushAdminUiPrefsToServer(touched)
      if (pushed.ok) {
        saveAdminUiPrefs(touched)
        return touched
      }
    }
    saveAdminUiPrefs(remote)
    return remote
  }

  if (isCustomAdminUiPrefs(local)) {
    const touched = (local.updatedAt ?? 0) > 0 ? local : touchAdminUiPrefs(local)
    await pushAdminUiPrefsToServer(touched)
    saveAdminUiPrefs(touched)
    return touched
  }

  return local
}

export function moveTab(tabs: TabLayoutItem[], key: NavTabKey, direction: -1 | 1): TabLayoutItem[] {
  const index = tabs.findIndex(item => item.key === key)
  if (index < 0) return tabs
  const next = index + direction
  if (next < 0 || next >= tabs.length) return tabs
  const copy = [...tabs]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

/** Swap with the previous/next tab that is in `allowed` (for staff-scoped reorder UI). */
export function moveTabAmong(
  tabs: TabLayoutItem[],
  key: NavTabKey,
  direction: -1 | 1,
  allowed: ReadonlySet<NavTabKey>,
): TabLayoutItem[] {
  const indexes = tabs
    .map((item, index) => (allowed.has(item.key) ? index : -1))
    .filter(index => index >= 0)
  const pos = indexes.findIndex(index => tabs[index].key === key)
  if (pos < 0) return tabs
  const targetPos = pos + direction
  if (targetPos < 0 || targetPos >= indexes.length) return tabs
  const from = indexes[pos]
  const to = indexes[targetPos]
  const copy = [...tabs]
  const tmp = copy[from]
  copy[from] = copy[to]
  copy[to] = tmp
  return copy
}

export function setTabVisible(tabs: TabLayoutItem[], key: NavTabKey, visible: boolean): TabLayoutItem[] {
  if (key === 'settings') return tabs.map(item => item.key === key ? { ...item, visible: true } : item)
  return tabs.map(item => item.key === key ? { ...item, visible } : item)
}

type AccessUser = { isOwner: boolean; pages: string[] } | null | undefined

/** Whether the user may open this tab (access control, not layout prefs). */
export function canOpenNavTab(user: AccessUser, key: NavTabKey): boolean {
  if (!user) return false
  if (key === 'settings') return true
  if (key === 'staff') return !!user.isOwner
  if (user.isOwner) return true
  return user.pages.includes(key)
}

/**
 * Ordered tabs for the shell nav: respects saved order/visibility and access.
 * Settings is always included when the user is logged in.
 */
export function visibleNavTabs(user: AccessUser, prefs: AdminUiPrefs): NavTabKey[] {
  const sanitized = sanitizeAdminUiPrefs(prefs)
  const keys: NavTabKey[] = []
  for (const item of sanitized.tabs) {
    if (!item.visible && item.key !== 'settings') continue
    if (!canOpenNavTab(user, item.key)) continue
    keys.push(item.key)
  }
  if (user && !keys.includes('settings')) keys.push('settings')
  return keys
}

export function firstVisibleNavTab(user: AccessUser, prefs: AdminUiPrefs): NavTabKey {
  const keys = visibleNavTabs(user, prefs)
  return keys[0] ?? 'settings'
}
