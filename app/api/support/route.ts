import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase-server'

async function listEvents(establishmentId: string) {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase
  const { data, error } = await supabase
    .from('support_access_event_log')
    .select('id, event_type, support_operator_login, account_login, created_at, establishment_id')
    .eq('establishment_id', establishmentId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'support')
  if ('response' in auth) return auth.response

  const establishmentId = req.nextUrl.searchParams.get('establishment_id')?.trim()
  if (!establishmentId) return NextResponse.json({ error: 'establishment_id обязателен' }, { status: 400 })

  const result = await listEvents(establishmentId)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result.data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'support')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as {
    support_operator_login?: string
    account_login?: string
    app_origin?: string
  }
  const accountLogin = (body.account_login ?? '').trim().toLowerCase()
  const operator = (body.support_operator_login ?? '').trim() || 'admin'
  const appOrigin = (body.app_origin ?? '').trim() || 'https://restodocks-beta.pages.dev'
  if (!accountLogin) return NextResponse.json({ error: 'Укажите логин учётной записи' }, { status: 400 })

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, email, full_name, establishment_id, roles')
    .ilike('email', accountLogin)
    .limit(20)

  if (empError) return NextResponse.json({ error: empError.message }, { status: 500 })
  const match = (employee ?? []).find(item => item.roles?.includes('owner')) ?? employee?.[0]
  if (!match?.establishment_id) {
    return NextResponse.json({ error: 'Учётная запись не найдена' }, { status: 404 })
  }

  const { data: establishment, error: estError } = await supabase
    .from('establishments')
    .select('id, name, pin_code')
    .eq('id', match.establishment_id)
    .maybeSingle()
  if (estError || !establishment) {
    return NextResponse.json({ error: estError?.message || 'Заведение не найдено' }, { status: 404 })
  }

  await supabase.from('establishments').update({ support_access_enabled: true }).eq('id', establishment.id)
  await supabase.from('support_access_audit_log').insert({
    establishment_id: establishment.id,
    support_operator_login: operator,
    account_login: accountLogin,
    started_at: new Date().toISOString(),
  })
  await supabase.from('support_access_event_log').insert({
    establishment_id: establishment.id,
    event_type: 'session_started',
    support_operator_login: operator,
    account_login: accountLogin,
  })

  let actionLink: string | null = null
  let warning: string | undefined
  try {
    const link = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: accountLogin,
      options: { redirectTo: appOrigin },
    })
    actionLink = link.data?.properties?.action_link ?? null
    if (link.error) warning = link.error.message
  } catch (err) {
    warning = err instanceof Error ? err.message : 'Не удалось выпустить ссылку входа'
  }

  return NextResponse.json({
    establishment: { id: establishment.id, name: establishment.name },
    action_link: actionLink,
    warning,
  })
}

async function endSession(establishmentId: string, operator = 'admin') {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  await supabase.from('establishments').update({ support_access_enabled: false }).eq('id', establishmentId)
  await supabase
    .from('support_access_audit_log')
    .update({ ended_at: new Date().toISOString() })
    .eq('establishment_id', establishmentId)
    .is('ended_at', null)
  await supabase.from('support_access_event_log').insert({
    establishment_id: establishmentId,
    event_type: 'session_ended',
    support_operator_login: operator,
  })
  return { ok: true as const }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'support')
  if ('response' in auth) return auth.response
  const body = await req.json().catch(() => ({})) as { establishment_id?: string }
  if (!body.establishment_id) return NextResponse.json({ error: 'establishment_id обязателен' }, { status: 400 })
  const result = await endSession(body.establishment_id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'support')
  if ('response' in auth) return auth.response
  const body = await req.json().catch(() => ({})) as { establishment_id?: string }
  const establishmentId = body.establishment_id || req.nextUrl.searchParams.get('establishment_id')
  if (!establishmentId) return NextResponse.json({ error: 'establishment_id обязателен' }, { status: 400 })
  const result = await endSession(establishmentId)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
