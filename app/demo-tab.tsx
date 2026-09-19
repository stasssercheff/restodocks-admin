'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import type { DemoSandbox } from '@/lib/demo'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DemoTab() {
  const { t } = useI18n()
  const router = useRouter()
  const [rows, setRows] = useState<DemoSandbox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRows([])
        setError(typeof json.error === 'string' ? json.error : t.demo.loadError)
        return
      }
      setRows(Array.isArray(json) ? json : [])
    } catch {
      setRows([])
      setError(t.demo.loadError)
    } finally {
      setLoading(false)
    }
  }, [router, t.demo.loadError])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(row =>
    (row.email ?? '').toLowerCase().includes(search.toLowerCase())
    || (row.status ?? '').toLowerCase().includes(search.toLowerCase())
    || (row.locale ?? '').toLowerCase().includes(search.toLowerCase()),
  )
  const active = rows.filter(row => row.status === 'active').length
  const converted = rows.filter(row => row.status === 'converted' || row.converted_at).length
  const expired = rows.filter(row => row.status === 'expired').length

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500">{t.demo.hint}</p>
        <a
          href="https://restodocks.com/demo"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {t.demo.open} ↗
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label={t.demo.total} value={rows.length} />
        <Stat label={t.demo.active} value={active} />
        <Stat label={t.demo.converted} value={converted} />
        <Stat label={t.demo.expired} value={expired} />
      </div>

      <div className="flex gap-3 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.common.search}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1"
        />
        <button onClick={load} className="text-gray-500 hover:text-white transition px-3 py-2 rounded-lg border border-gray-800 text-sm">
          {t.common.refresh}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t.demo.empty}</div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">{t.demo.colEmail}</th>
                <th className="px-4 py-3 text-left">{t.demo.colLocale}</th>
                <th className="px-4 py-3 text-left">{t.demo.colStatus}</th>
                <th className="px-4 py-3 text-left">{t.demo.colCreated}</th>
                <th className="px-4 py-3 text-left">{t.demo.colExpires}</th>
                <th className="px-4 py-3 text-left">{t.demo.colConverted}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">{row.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 uppercase">{row.locale || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800">{row.status || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(row.expires_at)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(row.converted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  )
}
