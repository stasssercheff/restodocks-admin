import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { readAdminConfigJson, writeAdminConfigJson } from '@/lib/admin-kv'
import {
  DEFAULT_ADS_SETTINGS,
  META_API_DISCONNECTED,
  buildAdsPlan,
  mergeAdsSettings,
  type AdsAgentDraft,
  type AdsAgentPlan,
  type AdsAgentSettings,
} from '@/lib/ads-agent'

function payload(settings: AdsAgentSettings, plan: AdsAgentPlan | null) {
  return {
    settings,
    plan,
    meta_api: META_API_DISCONNECTED,
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'ads_agent')
  if ('response' in auth) return auth.response

  const settings = await readAdminConfigJson<AdsAgentSettings>('ads_agent_settings') ?? { ...DEFAULT_ADS_SETTINGS }
  const plan = await readAdminConfigJson<AdsAgentPlan>('ads_agent_plan')
  return NextResponse.json(payload(settings, plan))
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'ads_agent')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as {
    action?: string
    settings?: unknown
    draft_approvals?: { id: string; approved: boolean | null }[]
  }

  const settings = mergeAdsSettings(
    body.settings,
    await readAdminConfigJson<AdsAgentSettings>('ads_agent_settings') ?? { ...DEFAULT_ADS_SETTINGS },
  )
  let plan = await readAdminConfigJson<AdsAgentPlan>('ads_agent_plan')
  const action = body.action || 'save'

  if (action === 'arm' || action === 'regenerate_offers') {
    plan = buildAdsPlan(settings, action === 'regenerate_offers' ? null : plan)
    settings.status = settings.daily_limit > 0 || settings.weekly_limit > 0 || settings.period_limit > 0
      ? 'awaiting_approval'
      : 'idle'
  }

  if (action === 'approve_plan') {
    if (plan && Array.isArray(body.draft_approvals)) {
      const approvals = new Map(body.draft_approvals.map(item => [item.id, item.approved]))
      plan = {
        ...plan,
        drafts: plan.drafts.map((draft: AdsAgentDraft) => (
          approvals.has(draft.id) ? { ...draft, approved: approvals.get(draft.id) ?? null } : draft
        )),
      }
    }
    settings.status = 'armed'
  }

  if (!action || action === 'save') {
    if (settings.status === 'idle' && (settings.daily_limit > 0 || settings.weekly_limit > 0)) {
      settings.status = 'configured'
    }
  }

  try {
    await writeAdminConfigJson('ads_agent_settings', settings)
    if (plan) await writeAdminConfigJson('ads_agent_plan', plan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось сохранить в KV'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(payload(settings, plan))
}
