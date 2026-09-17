import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase-server'

const SELECT_FIELDS = 'id, slug, name, is_enabled, priority, placement, audience, active_from, active_until, ui_type, conditions, content, show_once, created_at, updated_at'

const ALLOWED = [
  'slug', 'name', 'is_enabled', 'priority', 'placement', 'audience',
  'active_from', 'active_until', 'ui_type', 'conditions', 'content', 'show_once',
] as const

function pickFields(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key]
  }
  return patch
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'popups')
  if ('response' in auth) return auth.response

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { data, error } = await supabase
    .from('app_popup_campaigns')
    .select(SELECT_FIELDS)
    .order('priority', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'popups')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const insert = pickFields(body)
  if (!insert.slug || !insert.name) {
    return NextResponse.json({ error: 'Нужны slug и name' }, { status: 400 })
  }

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { data, error } = await supabase
    .from('app_popup_campaigns')
    .insert(insert)
    .select(SELECT_FIELDS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'popups')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { error } = await supabase
    .from('app_popup_campaigns')
    .update({ ...pickFields(body), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'popups')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as { id?: string }
  if (!body.id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { error } = await supabase.from('app_popup_campaigns').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
