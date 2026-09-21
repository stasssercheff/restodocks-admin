import { NextRequest, NextResponse } from 'next/server'
import { dataScopeForUser, requireAdminRequest } from '@/lib/admin-auth'
import { deleteEstablishment, listEstablishments } from '@/lib/establishments'
import { createServiceClient } from '@/lib/supabase-server'

async function assertEstablishmentAccess(user: Parameters<typeof dataScopeForUser>[0], id: string) {
  const scoped = await listEstablishments(dataScopeForUser(user))
  if ('error' in scoped) return NextResponse.json({ error: scoped.error }, { status: 500 })
  if (!scoped.data.some(row => row.id === id)) {
    return NextResponse.json({ error: 'Нет доступа к этому заведению' }, { status: 403 })
  }
  return null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец может менять заведения' }, { status: 403 })
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  const denied = await assertEstablishmentAccess(auth.user, id)
  if (denied) return denied

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const allowed = [
    'name', 'address', 'support_access_enabled', 'max_additional_establishments_override',
    'subscription_type', 'pro_paid_until', 'is_demo',
  ] as const
  const patch = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key as typeof allowed[number])),
  )
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нет полей для обновления' }, { status: 400 })
  }

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })
  const { error } = await supabase.from('establishments').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец может удалять заведения' }, { status: 403 })
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  const denied = await assertEstablishmentAccess(auth.user, id)
  if (denied) return denied
  const result = await deleteEstablishment(id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
