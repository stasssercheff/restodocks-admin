'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, PromoCode } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

type Establishment = {
  id: string
  name: string
  address: string | null
  created_at: string
  default_currency: string
  employee_count: number
  owner_name: string
  owner_email: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isExpired(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'establishments' | 'promo'>('establishments')

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">Restodocks</span>
          <span className="text-gray-500 ml-2 text-sm">/ Admin</span>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition">
          Выйти
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {([
            { key: 'establishments', label: 'Заведения' },
            { key: 'promo', label: 'Промокоды' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'establishments' ? <EstablishmentsTab /> : <PromoTab />}
      </main>
    </div>
  )
}

// ─── Establishments Tab ───────────────────────────────────────────────────────

function EstablishmentsTab() {
  const [data, setData] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/establishments')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Заведений нет</div>
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

function PromoTab() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newExpiry, setNewExpiry] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'free' | 'used' | 'expired'>('all')

  const loadCodes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('promo_codes')
      .select('*, establishments:used_by_establishment_id(name)')
      .order('created_at', { ascending: false })
    setCodes((data as PromoCode[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCodes() }, [loadCodes])

  async function addCode() {
    if (!newCode.trim()) return
    setSaving(true)
    await supabase.from('promo_codes').insert({
      code: newCode.trim().toUpperCase(),
      note: newNote.trim() || null,
      expires_at: newExpiry || null,
    })
    setNewCode(''); setNewNote(''); setNewExpiry('')
    await loadCodes()
    setSaving(false)
  }

  async function deleteCode(id: number) {
    if (!confirm('Удалить промокод?')) return
    await supabase.from('promo_codes').delete().eq('id', id)
    await loadCodes()
  }

  async function toggleUsed(row: PromoCode) {
    await supabase.from('promo_codes').update({
      is_used: !row.is_used,
      used_at: !row.is_used ? new Date().toISOString() : null,
      used_by_establishment_id: row.is_used ? null : row.used_by_establishment_id,
    }).eq('id', row.id)
    await loadCodes()
  }

  async function setExpiry(id: number) {
    const val = prompt('Дата (YYYY-MM-DD), пусто — без срока:')
    if (val === null) return
    await supabase.from('promo_codes').update({ expires_at: val || null }).eq('id', id)
    await loadCodes()
  }

  const filtered = codes.filter(c => {
    const match = c.code.includes(search.toUpperCase()) || (c.note ?? '').toLowerCase().includes(search.toLowerCase())
    if (!match) return false
    if (filter === 'free') return !c.is_used && !isExpired(c.expires_at)
    if (filter === 'used') return c.is_used
    if (filter === 'expired') return isExpired(c.expires_at) && !c.is_used
    return true
  })

  const total = codes.length
  const usedCount = codes.filter(c => c.is_used).length
  const freeCount = codes.filter(c => !c.is_used && !isExpired(c.expires_at)).length
  const expiredCount = codes.filter(c => isExpired(c.expires_at) && !c.is_used).length

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
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
        <h2 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">Новый промокод</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <input
            type="text"
            value={newCode}
            onChange={e => setNewCode(e.target.value.toUpperCase())}
            placeholder="BETA001"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 w-36"
          />
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Заметка"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1 min-w-48"
          />
          <input
            type="date"
            value={newExpiry}
            onChange={e => setNewExpiry(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={addCode}
            disabled={saving || !newCode.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg font-medium transition"
          >
            {saving ? '...' : '+ Создать'}
          </button>
        </div>
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
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Промокодов нет</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Код</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Заметка / Заведение</th>
                <th className="px-4 py-3 text-left">Срок</th>
                <th className="px-4 py-3 text-left">Создан</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const expired = isExpired(row.expires_at)
                const status = row.is_used ? 'used' : expired ? 'expired' : 'free'
                const statusCfg = {
                  used: { label: 'Использован', cls: 'bg-blue-900/40 text-blue-300' },
                  expired: { label: 'Истёк', cls: 'bg-red-900/40 text-red-300' },
                  free: { label: 'Свободен', cls: 'bg-emerald-900/40 text-emerald-300' },
                }[status]
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
                    <td className="px-4 py-3 text-gray-400">
                      <button onClick={() => setExpiry(row.id)} className={`hover:text-white transition ${expired ? 'text-red-400' : ''}`}>
                        {formatDate(row.expires_at)}
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
