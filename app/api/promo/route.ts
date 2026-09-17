import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdminRequest } from '@/lib/admin-auth'
import type { PromoGrantMode } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

function getServiceClient(): { client: SupabaseClient } | { error: string } {
  const client = createServiceClient()
  if ('error' in client) return client
  return { client }
}

function normalizeGrant(body: {
  grant_mode?: string | null
  grant_until?: string | null
  grant_days?: number | string | null
  expires_at?: string | null
}) {
  const mode: PromoGrantMode = body.grant_mode === 'days' ? 'days' : 'until_date'
  if (mode === 'until_date') {
    const raw = (typeof body.grant_until === 'string' && body.grant_until.trim())
      || (typeof body.expires_at === 'string' && body.expires_at.trim())
      || null
    return { grant_mode: mode, grant_until: raw, grant_days: null as number | null }
  }
  const raw = body.grant_days
  const days = typeof raw === 'number' ? raw : raw != null && String(raw).trim() ? parseInt(String(raw), 10) : null
  if (days == null || isNaN(days) || days < 1) {
    return { error: 'Для режима «ограниченные дни» укажи целое число дней > 0 (или переключись на «как по подписке»)' }
  }
  return { grant_mode: mode, grant_until: null as string | null, grant_days: days }
}

const PATCH_ALLOWED = [
  'code', 'note', 'starts_at', 'expires_at', 'is_used', 'used_at',
  'used_by_establishment_id', 'max_employees',
  'grant_mode', 'grant_until', 'grant_days',
  'activation_duration_days', 'grants_additive_only', 'grants_branch_slot_packs',
  'grants_employee_slot_packs', 'grants_subscription_type', 'is_disabled',
  'max_branches', 'max_redemptions',
] as const

type PromoRow = Record<string, unknown> & {
  id: number
  used_by_establishment_id: string | null
  establishments?: { name: string } | null
}

async function withRedemptions(client: SupabaseClient, rows: PromoRow[]) {
  if (!rows.length) return rows
  const ids = rows.map(row => row.id)
  const { data: redemptions, error } = await client
    .from('promo_code_redemptions')
    .select('promo_code_id, establishment_id, redeemed_at, establishments:establishment_id(name)')
    .in('promo_code_id', ids)
  if (error) return rows

  const estIds = [...new Set((redemptions ?? []).map(item => item.establishment_id).filter(Boolean))]
  const { data: employees } = estIds.length
    ? await client
        .from('employees')
        .select('establishment_id, full_name, email, roles')
        .in('establishment_id', estIds)
    : { data: [] as { establishment_id: string; full_name: string | null; email: string | null; roles: string[] | null }[] }

  const ownerByEst = new Map<string, { owner_name: string; owner_email: string }>()
  for (const employee of employees ?? []) {
    if (!employee.roles?.includes('owner')) continue
    ownerByEst.set(employee.establishment_id, {
      owner_name: employee.full_name || '—',
      owner_email: employee.email || '—',
    })
  }

  const byPromo = new Map<number, {
    establishment_id: string
    establishment_name: string
    owner_email: string
    owner_name: string
    redeemed_at: string
  }[]>()
  for (const row of redemptions ?? []) {
    const owner = ownerByEst.get(row.establishment_id)
    const list = byPromo.get(row.promo_code_id) ?? []
    const estRel = row.establishments as { name?: string } | { name?: string }[] | null
    const estName = Array.isArray(estRel) ? estRel[0]?.name : estRel?.name
    list.push({
      establishment_id: row.establishment_id,
      establishment_name: estName || '—',
      owner_email: owner?.owner_email || '—',
      owner_name: owner?.owner_name || '—',
      redeemed_at: row.redeemed_at,
    })
    byPromo.set(row.promo_code_id, list)
  }

  return rows.map(row => {
    const details = byPromo.get(row.id) ?? []
    return {
      ...row,
      redemption_count: details.length,
      redemption_details: details,
    }
  })
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'promo')
  if ('response' in auth) return auth.response

  const svc = getServiceClient()
  if ('error' in svc) return NextResponse.json({ error: svc.error }, { status: 500 })

  const { data, error } = await svc.client
    .from('promo_codes')
    .select('*, establishments:used_by_establishment_id(name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const enriched = await withRedemptions(svc.client, (data ?? []) as PromoRow[])
  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'promo')
  if ('response' in auth) return auth.response

  const body = await req.json()
  const insert: Record<string, unknown> = {
    code: typeof body.code === 'string' ? body.code.trim().toUpperCase() : body.code,
    note: body.note || null,
    starts_at: body.starts_at || null,
    expires_at: body.expires_at || null,
    max_employees: body.max_employees ?? null,
    max_branches: body.max_branches ?? null,
    activation_duration_days: body.activation_duration_days ?? null,
    grants_subscription_type: body.grants_subscription_type ?? 'ultra',
    grants_employee_slot_packs: body.grants_employee_slot_packs ?? 0,
    grants_branch_slot_packs: body.grants_branch_slot_packs ?? 0,
    grants_additive_only: !!body.grants_additive_only,
    max_redemptions: body.max_redemptions ?? 1,
    is_disabled: false,
  }

  if (body.grant_mode) {
    const grant = normalizeGrant(body)
    if ('error' in grant) return NextResponse.json({ error: grant.error }, { status: 400 })
    if (grant.grant_mode === 'until_date' && !grant.grant_until && !body.expires_at) {
      return NextResponse.json({
        error: 'Для режима «как по подписке» укажи дату окончания — дни вводить не нужно',
      }, { status: 400 })
    }
    Object.assign(insert, grant)
  }

  const svc = getServiceClient()
  if ('error' in svc) return NextResponse.json({ error: svc.error }, { status: 500 })

  const { data, error } = await svc.client
    .from('promo_codes')
    .insert(insert)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'promo')
  if ('response' in auth) return auth.response

  const body = await req.json()
  const { id, ...updates } = body
  const patch: Record<string, unknown> = Object.fromEntries(
    Object.entries(updates).filter(([k]) => PATCH_ALLOWED.includes(k as typeof PATCH_ALLOWED[number]))
  )

  if ('grant_mode' in patch || 'grant_until' in patch || 'grant_days' in patch) {
    const grant = normalizeGrant({
      grant_mode: (patch.grant_mode as string | undefined) ?? updates.grant_mode,
      grant_until: (patch.grant_until as string | null | undefined) ?? updates.grant_until,
      grant_days: (patch.grant_days as number | null | undefined) ?? updates.grant_days,
    })
    if ('error' in grant) return NextResponse.json({ error: grant.error }, { status: 400 })
    Object.assign(patch, grant)
  }

  const svc = getServiceClient()
  if ('error' in svc) return NextResponse.json({ error: svc.error }, { status: 500 })

  const { error } = await svc.client
    .from('promo_codes')
    .update(patch)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'promo')
  if ('response' in auth) return auth.response

  const { id } = await req.json()
  const svc = getServiceClient()
  if ('error' in svc) return NextResponse.json({ error: svc.error }, { status: 500 })

  const { error } = await svc.client
    .from('promo_codes')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
