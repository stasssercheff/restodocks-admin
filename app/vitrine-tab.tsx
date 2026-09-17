'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import type { VitrineCampaign, VitrineVisit } from '@/lib/vitrine'

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

export default function VitrineTab() {
  const { t } = useI18n()
  const router = useRouter()
  const [visits, setVisits] = useState<VitrineVisit[]>([])
  const [campaigns, setCampaigns] = useState<VitrineCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/vitrine')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : t.vitrine.loadError)
        return
      }
      setVisits(Array.isArray(json.visits) ? json.visits : [])
      setCampaigns(Array.isArray(json.campaigns) ? json.campaigns : [])
    } catch {
      setError(t.vitrine.loadError)
    } finally {
      setLoading(false)
    }
  }, [router, t.vitrine.loadError])

  useEffect(() => { load() }, [load])

  const localePicks = visits.filter(row => row.event_type === 'locale_chosen').length

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500">{t.vitrine.hint}</p>
        <div className="flex gap-4">
          <a href="https://restodocks.com/promo" target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300">
            {t.vitrine.open} ↗
          </a>
          <button onClick={load} className="text-gray-500 hover:text-white text-sm">
            {t.common.refresh}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Stat label={t.vitrine.visits} value={visits.length} />
        <Stat label={t.vitrine.locales} value={localePicks} />
        <Stat label={t.vitrine.campaigns} value={campaigns.length} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{t.vitrine.campaigns}</h2>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-8">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t.common.loading}</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t.vitrine.emptyCampaigns}</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {campaigns.map(row => (
                <tr key={row.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded ${row.is_enabled ? 'bg-emerald-900/40 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>
                      {row.is_enabled ? t.vitrine.enabled : t.vitrine.disabled}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{t.vitrine.visits}</h2>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t.common.loading}</div>
        ) : visits.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t.vitrine.emptyVisits}</div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">{t.vitrine.colWhen}</th>
                <th className="px-4 py-3 text-left">{t.vitrine.colPath}</th>
                <th className="px-4 py-3 text-left">{t.vitrine.colEvent}</th>
                <th className="px-4 py-3 text-left">{t.vitrine.colLang}</th>
                <th className="px-4 py-3 text-left">{t.vitrine.colCountry}</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(row => (
                <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.path || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{row.event_type || '—'}</td>
                  <td className="px-4 py-3 uppercase text-gray-400">{row.language_code || '—'}</td>
                  <td className="px-4 py-3 uppercase text-gray-400">{row.country_code || '—'}</td>
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
