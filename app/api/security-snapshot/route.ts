import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { dashboardLinks, fetchCloudflareSnapshot } from '@/lib/cloudflare-analytics'

const PROBE_RE = /(wp-config|xmlrpc|\.php|phpmyadmin|wp-login|wp-admin|\.env|actuator|vendor\/phpunit)/i

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'security')
  if ('response' in auth) return auth.response

  const cf = await fetchCloudflareSnapshot()
  const events = cf.firewallEvents
  const blocks = events.filter(item => item.action === 'block').length
  const challenges = events.filter(item => /challenge/i.test(item.action)).length
  const ipCounts = new Map<string, number>()
  for (const event of events) {
    if (!event.clientIP) continue
    ipCounts.set(event.clientIP, (ipCounts.get(event.clientIP) ?? 0) + 1)
  }
  const noisy = [...ipCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  const probe = events.find(item => item.clientRequestPath && PROBE_RE.test(item.clientRequestPath))

  const alertReasons: string[] = []
  if (blocks >= 15) alertReasons.push(`WAF: ${blocks} блокировок (порог attention 15)`)
  if (probe?.clientRequestPath) alertReasons.push(`Сканирование уязвимостей: ${probe.clientRequestPath}`)
  const alertLevel = blocks >= 80 ? 'alert' : alertReasons.length ? 'attention' : 'ok'
  const alertLevelLabel = alertLevel === 'alert' ? 'Тревога' : alertLevel === 'attention' ? 'Стоит посмотреть' : 'Спокойно'

  const insights: Record<string, unknown>[] = [
    { kind: 'traffic_volume', severity: 'info', requests24h: cf.requests24hApprox ?? 0 },
  ]
  if (blocks || challenges) insights.push({ kind: 'waf_activity', severity: blocks >= 15 ? 'warning' : 'info', blocks, challenges })
  if (noisy && noisy[1] >= 5) insights.push({ kind: 'ip_noisy', severity: 'warning', ip: noisy[0], events: noisy[1] })
  if (probe?.clientRequestPath) insights.push({ kind: 'probe_path', severity: 'warning', pathSample: probe.clientRequestPath })
  insights.push({ kind: 'db_attack_note', severity: 'info' })

  const links = dashboardLinks(cf.accountId)
  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    monitoring: {
      watchdogSchedule: 'GitHub Actions security-watchdog — раз в сутки (06:00 UTC)',
      alertLevel,
      alertLevelLabel,
      alertReasons,
      docPath: 'docs/security/SECURITY_AUTOMATION_ONE_TIME_RU.md',
    },
    cloudflare: {
      configured: cf.configured,
      requests24hApprox: cf.requests24hApprox,
      firewallEvents: events,
      graphqlErrors: cf.graphqlErrors,
    },
    insights,
    links: {
      cloudflareSecurity: links.cloudflareSecurity,
      cloudflareWaf: links.cloudflareWaf,
      supabaseLogs: links.supabaseLogs,
      supabaseAuth: links.supabaseAuth,
    },
    hint: cf.configured ? null : 'API Cloudflare не настроен. Задайте cloudflare_api_token и cloudflare_zone_id в ADMIN_CONFIG.',
  })
}
