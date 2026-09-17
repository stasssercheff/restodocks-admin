import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { dashboardLinks, fetchCloudflareSnapshot } from '@/lib/cloudflare-analytics'
import { getSupabaseServiceConfig } from '@/lib/supabase-server'

async function timed(url: string, init?: RequestInit) {
  const started = Date.now()
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' })
    return { ok: res.ok || res.status === 204, latencyMs: Date.now() - started, status: res.status, headers: res.headers }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      status: 0,
      detail: err instanceof Error ? err.message : 'fetch_failed',
      headers: null as Headers | null,
    }
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'health')
  if ('response' in auth) return auth.response

  const config = getSupabaseServiceConfig()
  const cf = await fetchCloudflareSnapshot()
  const hints: string[] = []

  let authHealth = null as { ok: boolean; latencyMs: number; status: number; detail?: string } | null
  let restSmoke = null as { ok: boolean; latencyMs: number; status: number; detail?: string } | null
  let restRowEstimate: number | null = null
  let host: string | null = null
  let projectRef: string | null = null

  if ('error' in config) {
    hints.push(config.error)
  } else {
    const url = new URL(config.url)
    host = url.host
    projectRef = url.host.split('.')[0] ?? null
    const base = config.url.replace(/\/$/, '')
    const authRes = await timed(`${base}/auth/v1/health`, {
      headers: { apikey: config.key },
    })
    authHealth = { ok: authRes.ok, latencyMs: authRes.latencyMs, status: authRes.status, detail: 'detail' in authRes ? authRes.detail : undefined }

    const restRes = await timed(`${base}/rest/v1/establishments?select=id&limit=1`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: 'count=exact',
      },
    })
    restSmoke = { ok: restRes.ok, latencyMs: restRes.latencyMs, status: restRes.status, detail: 'detail' in restRes ? restRes.detail : undefined }
    const range = restRes.headers?.get('content-range')
    const total = range?.split('/')[1]
    if (total && total !== '*') {
      const parsed = parseInt(total, 10)
      if (Number.isFinite(parsed)) restRowEstimate = parsed
    }
  }

  if (!cf.configured) hints.push('Трафик Cloudflare не подключён: добавьте cloudflare_api_token и cloudflare_zone_id в ADMIN_CONFIG.')

  const ok = !!(authHealth?.ok && restSmoke?.ok)
  const links = dashboardLinks(cf.accountId)
  return NextResponse.json({
    ok,
    generatedAt: new Date().toISOString(),
    supabaseUrlHost: host,
    supabaseProjectRef: projectRef,
    authHealth,
    restSmoke,
    restRowEstimate,
    cloudflare: {
      configured: cf.configured,
      requests24hApprox: cf.requests24hApprox,
      graphqlError: cf.graphqlError ?? null,
    },
    hints,
    links: {
      supabaseProject: links.supabaseProject,
      supabaseAdvisor: links.supabaseAdvisor,
      cloudflareAnalytics: links.cloudflareAnalytics,
      cloudflareWorkersOverview: links.cloudflareWorkersOverview,
    },
  })
}
