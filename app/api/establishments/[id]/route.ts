import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { deleteEstablishment } from '@/lib/establishments'
import { createServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

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
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  const result = await deleteEstablishment(id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
