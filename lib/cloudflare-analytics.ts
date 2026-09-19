import { readAdminConfig } from '@/lib/admin-kv'
import { readEnv } from '@/lib/supabase-server'

export type CloudflareFirewallEvent = {
  action: string
  clientCountryName: string | null
  clientIP: string | null
  clientRequestPath: string | null
  datetime: string | null
  edgeResponseStatus: number | null
  source: string | null
}

export type CloudflareSnapshot = {
  configured: boolean
  requests24hApprox: number | null
  firewallEvents: CloudflareFirewallEvent[]
  graphqlErrors: string[] | null
  graphqlError?: string | null
  accountId?: string | null
  zoneId?: string | null
}

async function cloudflareCreds(): Promise<{ token: string; accountId?: string; zoneId?: string } | null> {
  const token =
    await readAdminConfig('cloudflare_api_token')
    || readEnv('CLOUDFLARE_API_TOKEN')
  if (!token) return null
  const accountId = await readAdminConfig('cloudflare_account_id') || readEnv('CLOUDFLARE_ACCOUNT_ID')
  const zoneId = await readAdminConfig('cloudflare_zone_id') || readEnv('CLOUDFLARE_ZONE_ID')
  return { token, accountId, zoneId }
}

const GRAPHQL_QUERY = `
query AdminZoneSnapshot($zoneTag: string, $since: Time, $sinceDate: Date) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(limit: 2, filter: { date_geq: $sinceDate }) {
        sum { requests }
      }
      httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: $since }) {
        sum { requests }
      }
      firewallEventsAdaptive(
        limit: 40
        filter: { datetime_geq: $since }
        orderBy: [datetime_DESC]
      ) {
        action
        clientCountryName
        clientIP
        clientRequestPath
        datetime
        edgeResponseStatus
        source
      }
    }
  }
}
`

export async function fetchCloudflareSnapshot(): Promise<CloudflareSnapshot> {
  const creds = await cloudflareCreds()
  if (!creds?.token || !creds.zoneId) {
    return {
      configured: false,
      requests24hApprox: null,
      firewallEvents: [],
      graphqlErrors: null,
      graphqlError: null,
      accountId: creds?.accountId ?? null,
      zoneId: creds?.zoneId ?? null,
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const sinceDate = since.slice(0, 10)
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { zoneTag: creds.zoneId, since, sinceDate },
      }),
    })
    const json = await res.json() as {
      errors?: { message?: string }[]
      data?: {
        viewer?: {
          zones?: {
            httpRequests1dGroups?: { sum?: { requests?: number } }[]
            httpRequestsAdaptiveGroups?: { sum?: { requests?: number } }[]
            firewallEventsAdaptive?: CloudflareFirewallEvent[]
          }[]
        }
      }
    }
    const graphqlErrors = (json.errors ?? []).map(item => item.message).filter((item): item is string => !!item)
    const zone = json.data?.viewer?.zones?.[0]
    const adaptive = zone?.httpRequestsAdaptiveGroups?.[0]?.sum?.requests
    const daily = zone?.httpRequests1dGroups?.reduce((sum, row) => sum + (row.sum?.requests ?? 0), 0)
    const requests = typeof adaptive === 'number' ? adaptive : typeof daily === 'number' ? daily : null
    return {
      configured: true,
      requests24hApprox: requests,
      firewallEvents: zone?.firewallEventsAdaptive ?? [],
      graphqlErrors: graphqlErrors.length ? graphqlErrors : null,
      graphqlError: graphqlErrors[0] ?? null,
      accountId: creds.accountId ?? null,
      zoneId: creds.zoneId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'cloudflare_graphql_failed'
    return {
      configured: true,
      requests24hApprox: null,
      firewallEvents: [],
      graphqlErrors: [message],
      graphqlError: message,
      accountId: creds.accountId ?? null,
      zoneId: creds.zoneId,
    }
  }
}

export function dashboardLinks(accountId?: string | null) {
  const account = accountId || '[REDACTED]'
  return {
    cloudflareSecurity: `https://dash.cloudflare.com/${account}/restodocks.com/security/analytics`,
    cloudflareWaf: `https://dash.cloudflare.com/${account}/restodocks.com/security/analytics`,
    cloudflareAnalytics: `https://dash.cloudflare.com/${account}/restodocks.com/analytics/traffic`,
    cloudflareWorkersOverview: `https://dash.cloudflare.com/${account}/workers-and-pages`,
    supabaseLogs: 'https://supabase.com/dashboard/project/osglfptwbuqqmqunttha/logs/explorer',
    supabaseAuth: 'https://supabase.com/dashboard/project/osglfptwbuqqmqunttha/auth/users',
    supabaseProject: 'https://supabase.com/dashboard/project/osglfptwbuqqmqunttha',
    supabaseAdvisor: 'https://supabase.com/dashboard/project/osglfptwbuqqmqunttha/advisors/recommendations',
  }
}
