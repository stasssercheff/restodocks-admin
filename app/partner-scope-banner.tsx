'use client'

import { useEffect, useState } from 'react'
import type { PublicAdminUser } from '@/lib/admin-pages'
import type { ScopeStats } from '@/lib/admin-scope'
import { useI18n } from '@/lib/i18n'

export default function PartnerScopeBanner({ user }: { user: PublicAdminUser }) {
  const { t } = useI18n()
  const [stats, setStats] = useState<ScopeStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user.isOwner) return
    let cancelled = false
    fetch('/api/establishments/scope-stats')
      .then(async res => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : t.scope.statsError)
        return json.stats as ScopeStats
      })
      .then(value => {
        if (!cancelled) setStats(value)
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : t.scope.statsError)
      })
    return () => { cancelled = true }
  }, [user.isOwner, t.scope.statsError])

  if (user.isOwner) return null

  const codes = user.promoCodes ?? []
  const depth = user.referralDepth ?? 1

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        {t.scope.bannerPromo}
        {' '}
        <span className="font-mono text-white">{codes.length ? codes.join(', ') : '—'}</span>
        {' '}
        {depth > 1
          ? t.scope.bannerDepth.replace('{depth}', String(depth))
          : t.scope.bannerNoReferral}
      </div>
      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={t.scope.total} value={stats.total} />
            <Stat label={t.scope.withSub} value={stats.withSubscription} />
            <Stat label={t.scope.withoutSub} value={stats.withoutSubscription} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.byLevel.map(row => (
              <div key={row.level} className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                  {t.scope.level.replace('{n}', String(row.level))}
                </div>
                <div className="text-lg font-semibold text-white">{row.total}</div>
                <div className="text-[11px] text-gray-500">
                  {t.scope.levelShort
                    .replace('{with}', String(row.withSubscription))
                    .replace('{without}', String(row.withoutSubscription))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  )
}
