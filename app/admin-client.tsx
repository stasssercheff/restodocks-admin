'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { PromoCode, PromoGrantMode } from '@/lib/supabase'
import type { EstablishmentRow } from '@/lib/establishments'
import { ADMIN_PAGES, canAccessPage, type AdminPageKey, type PublicAdminUser } from '@/lib/admin-pages'
import StaffTab from './staff-tab'

type TabKey = AdminPageKey | 'staff'

// ─── Types ───────────────────────────────────────────────────────────────────

type Establishment = EstablishmentRow

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isExpired(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

function isNotStarted(iso: string | null) {
  if (!iso) return false
  return new Date(iso) > new Date()
}

function isValidNow(startsAt: string | null, expiresAt: string | null) {
  if (startsAt && new Date(startsAt) > new Date()) return false
  if (expiresAt && new Date(expiresAt) < new Date()) return false
  return true
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function visibleTabs(user: PublicAdminUser): { key: TabKey; label: string }[] {
  const pages: { key: TabKey; label: string }[] = ADMIN_PAGES
    .filter(page => canAccessPage(user, page.key))
    .map(page => ({ key: page.key, label: page.label }))
  if (user.isOwner) pages.push({ key: 'staff', label: 'Админы' })
  return pages
}

export default function AdminClient({
  user,
  initialEstablishments = [],
  establishmentsError = null,
}: {
  user: PublicAdminUser
  initialEstablishments?: Establishment[]
  establishmentsError?: string | null
}) {
  const tabs = visibleTabs(user)
  const [tab, setTab] = useState<TabKey>(tabs[0]?.key ?? 'establishments')
  const activeTab = tabs.some(item => item.key === tab) ? tab : tabs[0]?.key

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">Restodocks</span>
          <span className="text-gray-500 ml-2 text-sm">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition">
            Выйти
          </button>
        </div>
      </header>

      {tabs.length > 0 && (
        <div className="border-b border-gray-800 px-6">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === t.key
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!activeTab ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">
            Нет доступа ни к одному разделу. Попросите владельца выдать страницы.
          </div>
        ) : activeTab === 'establishments' ? (
          <EstablishmentsTab
            initialData={initialEstablishments}
            initialError={establishmentsError}
          />
        ) : activeTab === 'promo' ? (
          <PromoTab />
        ) : (
          <StaffTab />
        )}
      </main>
    </div>
  )
}

// ─── Establishments Tab ───────────────────────────────────────────────────────

function EstablishmentsTab({
  initialData,
  initialError,
}: {
  initialData: Establishment[]
  initialError: string | null
}) {
  const router = useRouter()
  const [data, setData] = useState<Establishment[]>(Array.isArray(initialData) ? initialData : [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/establishments')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json()
      if (!res.ok) {
        setData([])
        setError(typeof json.error === 'string' ? json.error : 'Не удалось загрузить заведения')
        return
      }
      setData(Array.isArray(json) ? json : [])
    } catch {
      setData([])
      setError('Не удалось загрузить заведения')
    } finally {
      setLoading(false)
    }
  }, [router])

  // If SSR had no data (or env missing at first paint), retry once from the client.
  useEffect(() => {
    if ((!initialData || initialData.length === 0) && initialError) {
      load()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = data.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.owner_email.toLowerCase().includes(search.toLowerCase()) ||
    e.owner_name.toLowerCase().includes(search.toLowerCase())
  )

  const total = data.length
  const totalEmployees = data.reduce((s, e) => s + e.employee_count, 0)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Заведений" value={total} />
        <StatCard label="Сотрудников" value={totalEmployees} />
        <StatCard label="Подписок" value="—" dimmed />
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию, владельцу, email..."
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1"
        />
        <button onClick={load} className="text-gray-500 hover:text-white transition px-3 py-2 rounded-lg border border-gray-800 text-sm">
          ↻ Обновить
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {error ? 'Нет данных' : 'Заведений нет'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Заведение</th>
                <th className="px-4 py-3 text-left">Владелец</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Сотрудников</th>
                <th className="px-4 py-3 text-left">Страна</th>
                <th className="px-4 py-3 text-left">Дата регистрации</th>
                <th className="px-4 py-3 text-left">Подписка</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition ${i === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                  <td className="px-4 py-3 text-gray-300">{row.owner_name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{row.owner_email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-gray-800 px-2 py-0.5 rounded text-xs font-mono">
                      {row.employee_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{row.address || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-500">
                      — (скоро)
                    </span>
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

// ─── Promo Tab ────────────────────────────────────────────────────────────────

function grantLabel(row: PromoCode) {
  const mode = row.grant_mode ?? 'until_date'
  if (mode === 'days') {
    return row.grant_days != null ? `${row.grant_days} дн. с активации` : 'дней — не задано'
  }
  return row.grant_until ? `до ${formatDate(row.grant_until)}` : 'до даты — не задано'
}

function PromoTab() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newGrantMode, setNewGrantMode] = useState<PromoGrantMode>('until_date')
  const [newGrantUntil, setNewGrantUntil] = useState('')
  const [newGrantDays, setNewGrantDays] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newMaxEmployees, setNewMaxEmployees] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'free' | 'used' | 'expired'>('all')

  const router = useRouter()

  const loadCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/promo')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setCodes(Array.isArray(data) ? data : [])
    } catch {
      setCodes([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadCodes() }, [loadCodes])

  function resetForm() {
    setNewCode('')
    setNewNote('')
    setNewGrantMode('until_date')
    setNewGrantUntil('')
    setNewGrantDays('')
    setNewStartDate('')
    setNewEndDate('')
    setNewMaxEmployees('')
  }

  async function addCode() {
    if (!newCode.trim()) return
    // Как подписка: конец доступа = «Действует до» (или отдельное поле grant_until)
    const until = newGrantUntil || newEndDate
    if (newGrantMode === 'until_date' && !until) {
      setError('Для режима «как по подписке» укажи дату окончания (Действует до)')
      return
    }
    if (newGrantMode === 'days' && (!newGrantDays || parseInt(newGrantDays, 10) < 1)) {
      setError('Для режима «ограниченные дни» укажи целое число дней с активации')
      return
    }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode.trim().toUpperCase(),
        note: newNote.trim() || null,
        grant_mode: newGrantMode,
        grant_until: newGrantMode === 'until_date' ? until : null,
        grant_days: newGrantMode === 'days' ? parseInt(newGrantDays, 10) : null,
        starts_at: newStartDate || null,
        expires_at: newEndDate || null,
        max_employees: newMaxEmployees ? parseInt(newMaxEmployees) : null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Не удалось создать промокод')
      setSaving(false)
      return
    }
    resetForm()
    await loadCodes()
    setSaving(false)
  }

  async function deleteCode(id: number) {
    if (!confirm('Удалить промокод?')) return
    await fetch('/api/promo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadCodes()
  }

  async function toggleUsed(row: PromoCode) {
    await fetch('/api/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: row.id,
        is_used: !row.is_used,
        used_at: !row.is_used ? new Date().toISOString() : null,
        used_by_establishment_id: row.is_used ? null : row.used_by_establishment_id,
      }),
    })
    await loadCodes()
  }

  async function setStartDate(id: number) {
    const val = prompt('Код можно активировать с (YYYY-MM-DD), пусто — без ограничения:')
    if (val === null) return
    await fetch('/api/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, starts_at: val || null }),
    })
    await loadCodes()
  }

  async function setEndDate(id: number) {
    const val = prompt('Код можно активировать до (YYYY-MM-DD), пусто — без срока:')
    if (val === null) return
    await fetch('/api/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, expires_at: val || null }),
    })
    await loadCodes()
  }

  async function editGrant(row: PromoCode) {
    const modePick = prompt(
      'Режим доступа:\n1 — до даты (как подписка)\n2 — дней с активации\n\nВведи 1 или 2:',
      (row.grant_mode ?? 'until_date') === 'days' ? '2' : '1'
    )
    if (modePick === null) return
    const mode: PromoGrantMode = modePick.trim() === '2' ? 'days' : 'until_date'
    if (mode === 'until_date') {
      const until = prompt('Доступ до (YYYY-MM-DD) — конец как у подписки:', row.grant_until?.slice(0, 10) ?? '')
      if (until === null) return
      if (!until.trim()) { alert('Нужна дата окончания доступа'); return }
      const res = await fetch('/api/promo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, grant_mode: 'until_date', grant_until: until.trim(), grant_days: null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) alert(data.error || 'Ошибка')
    } else {
      const days = prompt('Дней с активации:', row.grant_days?.toString() ?? '')
      if (days === null) return
      const parsed = parseInt(days.trim(), 10)
      if (isNaN(parsed) || parsed < 1) { alert('Введи целое число > 0'); return }
      const res = await fetch('/api/promo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, grant_mode: 'days', grant_days: parsed, grant_until: null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) alert(data.error || 'Ошибка')
    }
    await loadCodes()
  }

  async function setMaxEmployees(id: number, current: number | null) {
    const val = prompt(`Макс. сотрудников (пусто — без ограничений):`, current?.toString() ?? '')
    if (val === null) return
    const parsed = val.trim() ? parseInt(val.trim()) : null
    if (val.trim() && (isNaN(parsed!) || parsed! < 1)) { alert('Введи целое число больше 0'); return }
    await fetch('/api/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, max_employees: parsed }),
    })
    await loadCodes()
  }

  const filtered = codes.filter(c => {
    const match = c.code.includes(search.toUpperCase()) || (c.note ?? '').toLowerCase().includes(search.toLowerCase())
    if (!match) return false
    if (filter === 'free') return !c.is_used && isValidNow(c.starts_at, c.expires_at)
    if (filter === 'used') return c.is_used
    if (filter === 'expired') return !c.is_used && !isValidNow(c.starts_at, c.expires_at)
    return true
  })

  const total = codes.length
  const usedCount = codes.filter(c => c.is_used).length
  const freeCount = codes.filter(c => !c.is_used && isValidNow(c.starts_at, c.expires_at)).length
  const expiredCount = codes.filter(c => !c.is_used && !isValidNow(c.starts_at, c.expires_at)).length
  const canCreate =
    !!newCode.trim() &&
    (newGrantMode === 'until_date'
      ? !!(newGrantUntil || newEndDate)
      : !!newGrantDays && parseInt(newGrantDays, 10) > 0)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard label="Всего" value={total} />
        <StatCard label="Свободно" value={freeCount} />
        <StatCard label="Использовано" value={usedCount} />
        <StatCard label="Истекло" value={expiredCount} />
      </div>

      {/* Add form */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6 space-y-5">
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Новый промокод</h2>
          <p className="text-xs text-gray-600 mt-1">
            Ultra до конца года → включи «как по подписке», поставь дату окончания. Дни вводить не нужно.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <input
            type="text"
            value={newCode}
            onChange={e => setNewCode(e.target.value.toUpperCase())}
            placeholder="FERNI2026"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-36"
          />
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Заметка / тариф (Ultra…)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1 min-w-48"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Макс. сотрудников</label>
            <input
              type="number"
              min="1"
              value={newMaxEmployees}
              onChange={e => setNewMaxEmployees(e.target.value)}
              placeholder="∞"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-32"
            />
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 space-y-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Срок доступа</div>

          <label className="flex items-start gap-3 cursor-pointer select-none max-w-xl">
            <input
              type="checkbox"
              checked={newGrantMode === 'until_date'}
              onChange={() => {
                setNewGrantMode('until_date')
                setNewGrantDays('')
                setError(null)
              }}
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span>
              <span className="text-sm text-white">Как по подписке (до даты)</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Доступ до выбранной даты. Дни с активации не считаются и не нужны.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none max-w-xl">
            <input
              type="checkbox"
              checked={newGrantMode === 'days'}
              onChange={() => {
                setNewGrantMode('days')
                setError(null)
              }}
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span>
              <span className="text-sm text-white">Ограниченное количество дней с активации</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Ровно N дней с момента применения кода.
              </span>
            </span>
          </label>

          <div className="flex gap-3 flex-wrap items-end pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                {newGrantMode === 'until_date' ? 'Действует с' : 'Активировать с'}
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={e => setNewStartDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                {newGrantMode === 'until_date' ? 'Действует до *' : 'Активировать до'}
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={e => {
                  setNewEndDate(e.target.value)
                  if (newGrantMode === 'until_date') setNewGrantUntil(e.target.value)
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            {newGrantMode === 'days' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Дней с активации *</label>
                <input
                  type="number"
                  min="1"
                  value={newGrantDays}
                  onChange={e => setNewGrantDays(e.target.value)}
                  placeholder="Напр. 30"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-32"
                />
              </div>
            )}
            <button
              onClick={addCode}
              disabled={saving || !canCreate}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg font-medium transition"
            >
              {saving ? '...' : '+ Создать'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1 min-w-48"
        />
        <div className="flex gap-2">
          {(['all', 'free', 'used', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
            >
              {{ all: 'Все', free: 'Свободные', used: 'Исп.', expired: 'Истекшие' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Промокодов нет</div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Код</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Заметка / Заведение</th>
                <th className="px-4 py-3 text-left">Доступ</th>
                <th className="px-4 py-3 text-left">Активировать с</th>
                <th className="px-4 py-3 text-left">Активировать до</th>
                <th className="px-4 py-3 text-center">Сотрудники</th>
                <th className="px-4 py-3 text-left">Создан</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const status = row.is_used ? 'used' : !isValidNow(row.starts_at, row.expires_at) ? 'expired' : 'free'
                const statusCfg = {
                  used: { label: 'Использован', cls: 'bg-blue-900/40 text-blue-300' },
                  expired: { label: 'Истёк', cls: 'bg-red-900/40 text-red-300' },
                  free: { label: 'Свободен', cls: 'bg-emerald-900/40 text-emerald-300' },
                }[status]
                const mode = row.grant_mode ?? 'until_date'
                return (
                  <tr key={row.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigator.clipboard.writeText(row.code)}
                        title="Копировать"
                        className="font-mono font-bold text-white hover:text-indigo-400 transition"
                      >
                        {row.code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {row.is_used && row.establishments?.name
                        ? <span className="text-white">{row.establishments.name}</span>
                        : row.note || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => editGrant(row)}
                        title="Изменить доступ"
                        className={`text-xs hover:text-indigo-300 transition ${
                          mode === 'until_date' ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {grantLabel(row)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      <button onClick={() => setStartDate(row.id)} className={`hover:text-white transition ${isNotStarted(row.starts_at) ? 'text-amber-400' : ''}`} title="Окно активации: с">
                        {formatDate(row.starts_at)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      <button onClick={() => setEndDate(row.id)} className={`hover:text-white transition ${isExpired(row.expires_at) ? 'text-red-400' : ''}`} title="Окно активации: до">
                        {formatDate(row.expires_at)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setMaxEmployees(row.id, row.max_employees)}
                        title="Изменить лимит сотрудников"
                        className="text-xs font-mono hover:text-indigo-400 transition"
                      >
                        {row.max_employees != null
                          ? <span className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded">≤ {row.max_employees}</span>
                          : <span className="text-gray-600">∞</span>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => toggleUsed(row)}
                          className="text-gray-500 hover:text-white transition text-xs px-2 py-1 rounded border border-gray-700 hover:border-gray-500"
                        >
                          {row.is_used ? '↩ Сбросить' : '✓ Исп.'}
                        </button>
                        <button
                          onClick={() => deleteCode(row.id)}
                          className="text-gray-500 hover:text-red-400 transition text-xs px-2 py-1 rounded border border-gray-700 hover:border-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StatCard({ label, value, dimmed }: { label: string; value: number | string; dimmed?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className={`text-2xl font-bold ${dimmed ? 'text-gray-600' : 'text-white'}`}>{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  )
}
