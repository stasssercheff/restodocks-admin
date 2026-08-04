import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { PromoGrantMode } from '@/lib/supabase'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAuth() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === 'authenticated'
}

function normalizeGrant(body: {
  grant_mode?: string | null
  grant_until?: string | null
  grant_days?: number | string | null
}) {
  const mode: PromoGrantMode = body.grant_mode === 'days' ? 'days' : 'until_date'
  if (mode === 'until_date') {
    const until = typeof body.grant_until === 'string' && body.grant_until.trim()
      ? body.grant_until.trim()
      : null
    return { grant_mode: mode, grant_until: until, grant_days: null as number | null }
  }
  const raw = body.grant_days
  const days = typeof raw === 'number' ? raw : raw != null && String(raw).trim() ? parseInt(String(raw), 10) : null
  if (days == null || isNaN(days) || days < 1) {
    return { error: 'Для режима «дней с активации» укажи целое число дней > 0' }
  }
  return { grant_mode: mode, grant_until: null as string | null, grant_days: days }
}

export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*, establishments:used_by_establishment_id(name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const grant = normalizeGrant(body)
  if ('error' in grant) return NextResponse.json({ error: grant.error }, { status: 400 })
  if (grant.grant_mode === 'until_date' && !grant.grant_until) {
    return NextResponse.json({ error: 'Укажи дату «Доступ до» — как конец подписки' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: body.code,
      note: body.note || null,
      starts_at: body.starts_at || null,
      expires_at: body.expires_at || null,
      max_employees: body.max_employees ?? null,
      grant_mode: grant.grant_mode,
      grant_until: grant.grant_until,
      grant_days: grant.grant_days,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  const allowed = [
    'code', 'note', 'starts_at', 'expires_at', 'is_used', 'used_at',
    'used_by_establishment_id', 'max_employees',
    'grant_mode', 'grant_until', 'grant_days',
  ] as const

  const patch: Record<string, unknown> = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k as typeof allowed[number]))
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

  const supabase = getServiceClient()
  const { error } = await supabase
    .from('promo_codes')
    .update(patch)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
