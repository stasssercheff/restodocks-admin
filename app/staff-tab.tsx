'use client'

import { useCallback, useEffect, useState } from 'react'
import { ADMIN_PAGES, type AdminPageKey } from '@/lib/admin-pages'
import { useI18n } from '@/lib/i18n'

type StaffUser = {
  id: string
  email: string
  displayName: string | null
  pages: AdminPageKey[]
  isActive: boolean
  promoCodes: string[]
  referralDepth: number
}

function generatePassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('')
}

export default function StaffTab() {
  const { t } = useI18n()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [ownerEmail, setOwnerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pages, setPages] = useState<AdminPageKey[]>(['establishments'])
  const [promoCodes, setPromoCodes] = useState('')
  const [referralDepth, setReferralDepth] = useState(1)
  const [creating, setCreating] = useState(false)
  const [createdAccount, setCreatedAccount] = useState<{ email: string; password: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin-users')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUsers([])
        setError(typeof json.error === 'string' ? json.error : t.admins.loadError)
        return
      }
      setOwnerEmail(typeof json.owner?.email === 'string' ? json.owner.email : '')
      setUsers(Array.isArray(json.users) ? json.users : [])
    } catch {
      setUsers([])
      setError(t.admins.loadError)
    } finally {
      setLoading(false)
    }
  }, [t.admins.loadError])

  useEffect(() => { load() }, [load])

  function toggleNewPage(key: AdminPageKey) {
    setPages(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])
  }

  async function createUser() {
    if (!email.trim() || !password) return
    setCreating(true)
    setError(null)
    setCreatedAccount(null)
    const issuedPassword = password
    const issuedEmail = email.trim()
    const res = await fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        displayName: displayName.trim() || null,
        pages,
        promoCodes,
        referralDepth,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setCreating(false)
    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Не удалось создать учётку')
      return
    }
    setEmail('')
    setPassword('')
    setDisplayName('')
    setPages(['establishments'])
    setPromoCodes('')
    setReferralDepth(1)
    setCreatedAccount({ email: issuedEmail, password: issuedPassword })
    await load()
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    setSavingId(id)
    setError(null)
    const res = await fetch('/api/admin-users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    })
    const json = await res.json().catch(() => ({}))
    setSavingId(null)
    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Не удалось сохранить')
      await load()
      return false
    }
    if (json.user) {
      setUsers(current => current.map(user => user.id === id ? json.user : user))
    }
    return true
  }

  async function togglePage(user: StaffUser, key: AdminPageKey) {
    const next = user.pages.includes(key)
      ? user.pages.filter(item => item !== key)
      : [...user.pages, key]
    setUsers(current => current.map(item => item.id === user.id ? { ...item, pages: next } : item))
    await patchUser(user.id, { pages: next })
  }

  async function resetPassword(user: StaffUser) {
    const next = prompt(`Новый пароль для ${user.email} (минимум 8 символов):`, generatePassword())
    if (next == null) return
    if (next.trim().length < 8) {
      alert('Пароль должен быть не короче 8 символов')
      return
    }
    if (await patchUser(user.id, { password: next.trim() })) {
      setCreatedAccount({ email: user.email, password: next.trim() })
    }
  }

  async function removeUser(user: StaffUser) {
    if (!confirm(`Удалить учётку ${user.email}?`)) return
    setSavingId(user.id)
    const res = await fetch('/api/admin-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    })
    const json = await res.json().catch(() => ({}))
    setSavingId(null)
    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Не удалось удалить')
      return
    }
    setUsers(current => current.filter(item => item.id !== user.id))
  }

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6 space-y-4">
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.admins.newTitle}</h2>
          <p className="text-xs text-gray-600 mt-1">
            {t.admins.newHint}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="partner@email.com"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Пароль</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="минимум 8 символов"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-48 font-mono"
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="text-xs px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
              >
                {t.admins.generate}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t.admins.name}</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Как отображать"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">{t.admins.access}</div>
          <div className="flex flex-wrap gap-4">
            {ADMIN_PAGES.map(page => (
              <label key={page.key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={pages.includes(page.key)}
                  onChange={() => toggleNewPage(page.key)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span>{t.tabs[page.key]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">{t.admins.dataScope}</div>
          <p className="text-xs text-gray-600 mb-3 max-w-3xl">{t.admins.referralHint}</p>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t.admins.promoCodes}</label>
              <input
                type="text"
                value={promoCodes}
                onChange={e => setPromoCodes(e.target.value.toUpperCase())}
                placeholder="666, FERNI2026"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-64 font-mono"
              />
              <span className="text-[11px] text-gray-600">{t.admins.promoCodesHint}</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t.admins.referralDepth}</label>
              <select
                value={referralDepth}
                onChange={e => setReferralDepth(parseInt(e.target.value, 10))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>{t.admins.depth1}</option>
                <option value={2}>{t.admins.depth2}</option>
                <option value={3}>{t.admins.depth3}</option>
                <option value={4}>{t.admins.depth4}</option>
                <option value={5}>{t.admins.depth5}</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={createUser}
          disabled={creating || !email.trim() || password.length < 8}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg font-medium transition"
        >
          {creating ? '...' : t.admins.create}
        </button>
      </div>

      {createdAccount && (
        <div className="mb-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {t.admins.created} <span className="font-medium text-white">{createdAccount.email}</span>
          {' '}{t.admins.password} <span className="font-mono text-white">{createdAccount.password}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(createdAccount.password)}
            className="ml-3 text-xs px-2 py-1 rounded border border-emerald-800 text-emerald-300 hover:text-white hover:border-emerald-500 transition"
          >
            {t.admins.copyPass}
          </button>
          <span className="block text-xs text-emerald-500/80 mt-1">{t.admins.passOnce}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">{t.admins.colAdmin}</th>
                {ADMIN_PAGES.map(page => (
                  <th key={page.key} className="px-4 py-3 text-center">{t.tabs[page.key]}</th>
                ))}
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800/50 bg-gray-800/20">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{ownerEmail || 'Владелец'}</div>
                  <div className="text-xs text-indigo-300 mt-0.5">{t.admins.fullAccess}</div>
                </td>
                {ADMIN_PAGES.map(page => (
                  <td key={page.key} className="px-4 py-3 text-center text-gray-500">✓</td>
                ))}
                <td className="px-4 py-3 text-right text-xs text-gray-600">{t.admins.owner}</td>
              </tr>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={ADMIN_PAGES.length + 2} className="px-4 py-8 text-center text-gray-500">
                    {t.admins.empty}
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.displayName || user.email}</div>
                    {user.displayName && <div className="text-xs text-gray-500">{user.email}</div>}
                    {!user.isActive && <div className="text-xs text-red-400 mt-0.5">отключена</div>}
                    <div className="mt-2 flex flex-col gap-2 max-w-sm">
                      <input
                        type="text"
                        defaultValue={(user.promoCodes ?? []).join(', ')}
                        key={`${user.id}-codes-${(user.promoCodes ?? []).join(',')}`}
                        placeholder="666"
                        onBlur={e => {
                          const next = e.target.value
                          const current = (user.promoCodes ?? []).join(', ')
                          if (next.trim().toUpperCase() === current.toUpperCase()) return
                          void patchUser(user.id, { promoCodes: next })
                        }}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                      <select
                        value={user.referralDepth ?? 1}
                        disabled={savingId === user.id}
                        onChange={e => void patchUser(user.id, { referralDepth: parseInt(e.target.value, 10) })}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value={1}>{t.admins.depth1}</option>
                        <option value={2}>{t.admins.depth2}</option>
                        <option value={3}>{t.admins.depth3}</option>
                        <option value={4}>{t.admins.depth4}</option>
                        <option value={5}>{t.admins.depth5}</option>
                      </select>
                    </div>
                  </td>
                  {ADMIN_PAGES.map(page => (
                    <td key={page.key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.pages.includes(page.key)}
                        disabled={savingId === user.id}
                        onChange={() => togglePage(user, page.key)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => resetPassword(user)}
                        className="text-gray-500 hover:text-white transition text-xs px-2 py-1 rounded border border-gray-700 hover:border-gray-500"
                      >
                        Пароль
                      </button>
                      <button
                        onClick={() => removeUser(user)}
                        className="text-gray-500 hover:text-red-400 transition text-xs px-2 py-1 rounded border border-gray-700 hover:border-red-800"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
