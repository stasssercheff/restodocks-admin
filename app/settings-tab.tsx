'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  type AdminUiPrefs,
  type NavTabKey,
  type TabLayoutItem,
  defaultAdminUiPrefs,
  loadAdminUiPrefs,
  moveTabAmong,
  saveAdminUiPrefs,
  sanitizeAdminUiPrefs,
  setTabVisible,
  canOpenNavTab,
} from '@/lib/admin-ui-prefs'
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

export default function SettingsTab({ user, onPrefsChange }: Props) {
  const { t } = useI18n()
  const s = t.settings
  const [prefs, setPrefs] = useState<AdminUiPrefs>(() => defaultAdminUiPrefs())
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setPrefs(loadAdminUiPrefs())
  }, [])

  const allowed = useMemo(() => {
    const set = new Set<NavTabKey>()
    for (const item of prefs.tabs) {
      if (canOpenNavTab(user, item.key)) set.add(item.key)
    }
    return set
  }, [prefs.tabs, user])

  const rows = prefs.tabs.filter(item => allowed.has(item.key))

  function commit(next: AdminUiPrefs) {
    const clean = sanitizeAdminUiPrefs(next)
    setPrefs(clean)
    saveAdminUiPrefs(clean)
    onPrefsChange(clean)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  function updateTabs(updater: (tabs: TabLayoutItem[]) => TabLayoutItem[]) {
    commit({ ...prefs, tabs: updater(prefs.tabs) })
  }

  function resetDefaults() {
    commit(defaultAdminUiPrefs())
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
          <button
            type="button"
            onClick={resetDefaults}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition"
          >
            {s.reset}
          </button>
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

        {savedFlash ? (
          <p className="text-xs text-emerald-400">{s.saved}</p>
        ) : (
          <p className="text-xs text-gray-600">{s.localNote}</p>
        )}
      </section>

      <section className="border border-dashed border-gray-800 rounded-xl px-4 py-5 text-sm text-gray-500">
        <p className="font-medium text-gray-400">{s.moreTitle}</p>
        <p className="mt-1">{s.moreHint}</p>
      </section>
    </div>
  )
}
