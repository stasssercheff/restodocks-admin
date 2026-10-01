'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAdminTr } from '@/lib/admin-tr'
import {
  type AdminUiPrefs,
  type NavTabKey,
  type TabLayoutItem,
  defaultAdminUiPrefs,
  loadAdminUiPrefs,
  moveTabAmong,
  pushAdminUiPrefsToServer,
  saveAdminUiPrefs,
  sanitizeAdminUiPrefs,
  setTabVisible,
  canOpenNavTab,
  syncAdminUiPrefs,
  touchAdminUiPrefs,
} from '@/lib/admin-ui-prefs'
import {
  defaultRegistrationNotifyPrefs,
  sanitizeRegistrationNotifyPrefs,
  type RegistrationNotifyField,
  type RegistrationNotifyPrefs,
} from '@/lib/registration-notify-prefs'
import type { PublicAdminUser } from '@/lib/admin-pages'

type Props = {
  user: PublicAdminUser
  onPrefsChange: (prefs: AdminUiPrefs) => void
}

function tabLabel(key: NavTabKey, tabs: Record<string, string>, settingsLabel: string): string {
  if (key === 'settings') return settingsLabel
  if (key === 'staff') return tabs.admins
  return tabs[key] ?? key
}

const NOTIFY_FIELDS: RegistrationNotifyField[] = [
  'establishmentName',
  'ownerName',
  'ownerEmail',
  'place',
  'ip',
  'createdAtLocal',
  'totalEstablishments',
]

export default function SettingsTab({ user, onPrefsChange }: Props) {
  const { t } = useI18n()
  const tr = useAdminTr()
  const s = t.settings
  const [prefs, setPrefs] = useState<AdminUiPrefs>(() => loadAdminUiPrefs())
  const [savedFlash, setSavedFlash] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [notify, setNotify] = useState<RegistrationNotifyPrefs>(() => defaultRegistrationNotifyPrefs())
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifySaving, setNotifySaving] = useState(false)
  const [notifyFlash, setNotifyFlash] = useState(false)
  const [notifyError, setNotifyError] = useState<string | null>(null)
  const [notifyResult, setNotifyResult] = useState<string | null>(null)
  const [notifyChecking, setNotifyChecking] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setSyncing(true)
      const synced = await syncAdminUiPrefs()
      if (cancelled) return
      setPrefs(synced)
      onPrefsChange(synced)
      setSyncing(false)
    })()
    return () => {
      cancelled = true
    }
  }, [onPrefsChange])

  useEffect(() => {
    if (!user.isOwner) return
    let cancelled = false
    ;(async () => {
      setNotifyLoading(true)
      try {
        const res = await fetch('/api/registration-notify', { cache: 'no-store', credentials: 'same-origin' })
        const json = await res.json().catch(() => ({})) as { prefs?: unknown; error?: string }
        if (cancelled) return
        if (!res.ok) {
          setNotifyError(typeof json.error === 'string' ? json.error : `${tr('Ошибка (')}${res.status})`)
        } else {
          setNotify(sanitizeRegistrationNotifyPrefs(json.prefs))
          setNotifyError(null)
        }
      } catch {
        if (!cancelled) setNotifyError(tr('Сеть: не удалось загрузить настройки писем'))
      } finally {
        if (!cancelled) setNotifyLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user.isOwner, tr])

  const allowed = useMemo(() => {
    const set = new Set<NavTabKey>()
    for (const item of prefs.tabs) {
      if (canOpenNavTab(user, item.key)) set.add(item.key)
    }
    return set
  }, [prefs.tabs, user])

  const rows = prefs.tabs.filter(item => allowed.has(item.key))

  async function commit(next: AdminUiPrefs) {
    const clean = touchAdminUiPrefs(sanitizeAdminUiPrefs(next))
    setPrefs(clean)
    saveAdminUiPrefs(clean)
    onPrefsChange(clean)
    setSyncError(null)
    const pushed = await pushAdminUiPrefsToServer(clean)
    if (!pushed.ok) {
      setSyncError(pushed.error)
      return
    }
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  async function forcePush() {
    setSyncError(null)
    setSyncing(true)
    const clean = touchAdminUiPrefs(prefs)
    setPrefs(clean)
    saveAdminUiPrefs(clean)
    onPrefsChange(clean)
    const pushed = await pushAdminUiPrefsToServer(clean)
    setSyncing(false)
    if (!pushed.ok) {
      setSyncError(pushed.error)
      return
    }
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  function updateTabs(updater: (tabs: TabLayoutItem[]) => TabLayoutItem[]) {
    void commit({ ...prefs, tabs: updater(prefs.tabs) })
  }

  function resetDefaults() {
    void commit(defaultAdminUiPrefs())
  }

  async function saveNotify() {
    setNotifySaving(true)
    setNotifyError(null)
    try {
      const res = await fetch('/api/registration-notify', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefs: notify }),
      })
      const json = await res.json().catch(() => ({})) as { prefs?: unknown; error?: string }
      if (!res.ok) {
        setNotifyError(typeof json.error === 'string' ? json.error : `${tr('Ошибка (')}${res.status})`)
        return
      }
      setNotify(sanitizeRegistrationNotifyPrefs(json.prefs))
      setNotifyFlash(true)
      window.setTimeout(() => setNotifyFlash(false), 1600)
    } catch {
      setNotifyError(tr('Сеть: не удалось сохранить'))
    } finally {
      setNotifySaving(false)
    }
  }

  async function runNotifyCheck() {
    setNotifyChecking(true)
    setNotifyError(null)
    try {
      const res = await fetch('/api/registration-notify', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const json = await res.json().catch(() => ({})) as {
        error?: string
        enabled?: boolean
        checked?: number
        sent?: number
        skipped?: number
        errors?: string[]
      }
      if (!res.ok) {
        setNotifyError(typeof json.error === 'string' ? json.error : `${tr('Ошибка (')}${res.status})`)
        return
      }
      const parts = [
        `${tr('проверено: ')}${json.checked ?? 0}`,
        `${tr('писем: ')}${json.sent ?? 0}`,
        json.skipped ? `${tr('пропущено: ')}${json.skipped}` : null,
        json.errors?.length ? `${tr('ошибки: ')}${json.errors.join('; ')}` : null,
      ].filter(Boolean)
      setNotifyResult(parts.join(' · '))
    } catch {
      setNotifyError(tr('Сеть: проверка не удалась'))
    } finally {
      setNotifyChecking(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">{s.title}</h1>
        <p className="text-sm text-gray-400 mt-1">{s.hint}</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-medium text-white">{s.tabsTitle}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{s.tabsHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void forcePush()}
              disabled={syncing}
              className="text-xs text-indigo-300 hover:text-white border border-indigo-800 rounded-lg px-3 py-1.5 transition disabled:opacity-40"
            >
              {s.forceSync}
            </button>
            <button
              type="button"
              onClick={resetDefaults}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition"
            >
              {s.reset}
            </button>
          </div>
        </div>

        <ul className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden">
          {rows.map((item, index) => {
            const isSettings = item.key === 'settings'
            const label = tabLabel(item.key, t.tabs, s.title)
            return (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2.5">
                <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    disabled={isSettings}
                    onChange={e => updateTabs(tabs => setTabVisible(tabs, item.key, e.target.checked))}
                    className="rounded border-gray-600 disabled:opacity-40"
                    title={isSettings ? s.settingsAlwaysOn : undefined}
                  />
                  <span className={`text-sm truncate ${item.visible ? 'text-white' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {isSettings ? (
                    <span className="text-[10px] text-gray-600 shrink-0">{s.settingsAlwaysOn}</span>
                  ) : null}
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => updateTabs(tabs => moveTabAmong(tabs, item.key, -1, allowed))}
                    className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300"
                    title={s.moveUp}
                    aria-label={s.moveUp}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === rows.length - 1}
                    onClick={() => updateTabs(tabs => moveTabAmong(tabs, item.key, 1, allowed))}
                    className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300"
                    title={s.moveDown}
                    aria-label={s.moveDown}
                  >
                    ↓
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {syncError ? (
          <p className="text-xs text-amber-300">{syncError}</p>
        ) : savedFlash ? (
          <p className="text-xs text-emerald-400">{s.saved}</p>
        ) : (
          <p className="text-xs text-gray-600">{syncing ? s.syncing : s.localNote}</p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium text-white">{s.notifyTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{s.notifyHint}</p>
        </div>

        {!user.isOwner ? (
          <p className="text-sm text-gray-500">{s.notifyOwnerOnly}</p>
        ) : notifyLoading ? (
          <p className="text-sm text-gray-500">{s.syncing}</p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={notify.enabled}
                onChange={e => setNotify(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-600"
              />
              {s.notifyEnabled}
            </label>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">{s.notifyRecipients}</label>
              <input
                type="text"
                value={notify.recipients}
                onChange={e => setNotify(prev => ({ ...prev, recipients: e.target.value }))}
                placeholder={s.notifyRecipientsPlaceholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">{s.notifyTimeZone}</label>
              <select
                value={notify.timeZone}
                onChange={e => setNotify(prev => ({ ...prev, timeZone: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (VN)</option>
                <option value="Europe/Moscow">Europe/Moscow</option>
                <option value="Europe/London">Europe/London</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notify.excludeDemo}
                onChange={e => setNotify(prev => ({ ...prev, excludeDemo: e.target.checked }))}
                className="rounded border-gray-600"
              />
              {s.notifyExcludeDemo}
            </label>

            <div className="space-y-2">
              <p className="text-xs text-gray-500">{s.notifyFields}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NOTIFY_FIELDS.map(key => {
                  const label =
                    key === 'establishmentName' ? s.notifyFieldEstablishment
                      : key === 'ownerName' ? s.notifyFieldOwnerName
                        : key === 'ownerEmail' ? s.notifyFieldOwnerEmail
                          : key === 'place' ? s.notifyFieldPlace
                            : key === 'ip' ? s.notifyFieldIp
                              : key === 'createdAtLocal' ? s.notifyFieldTime
                                : s.notifyFieldTotal
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notify.fields[key]}
                        onChange={e => setNotify(prev => ({
                          ...prev,
                          fields: { ...prev.fields, [key]: e.target.checked },
                        }))}
                        className="rounded border-gray-600"
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => void saveNotify()}
                disabled={notifySaving}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-3 py-1.5 rounded-lg"
              >
                {notifySaving ? s.syncing : s.notifySave}
              </button>
              <button
                type="button"
                onClick={() => void runNotifyCheck()}
                disabled={notifyChecking || !notify.enabled}
                className="text-sm border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40 px-3 py-1.5 rounded-lg"
              >
                {notifyChecking ? s.notifyChecking : s.notifyCheck}
              </button>
              {notifyFlash ? <span className="text-xs text-emerald-400">{s.notifySaved}</span> : null}
            </div>

            {notifyError ? <p className="text-xs text-amber-300">{notifyError}</p> : null}
            {notifyResult ? (
              <p className="text-xs text-gray-500">
                {s.notifyLastResult}: {notifyResult}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
