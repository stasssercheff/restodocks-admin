import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'reviews')
  if ('response' in auth) return auth.response

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { data, error } = await supabase
    .from('app_reviews')
    .select('id, body, email, name, locale, platform, country_code, location_label, created_at, establishment_id, is_demo, allow_public_display, show_on_promo')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data ?? []
  return NextResponse.json({
    summary: {
      total: rows.length,
      demo: rows.filter(row => row.is_demo).length,
      on_promo: rows.filter(row => row.show_on_promo).length,
    },
    rows,
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'reviews')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  if (typeof body.show_on_promo !== 'boolean') {
    return NextResponse.json({ error: 'show_on_promo обязателен' }, { status: 400 })
  }

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  if (body.show_on_promo) {
    const { data: current, error: readError } = await supabase
      .from('app_reviews')
      .select('allow_public_display')
      .eq('id', id)
      .maybeSingle()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    if (current && current.allow_public_display === false) {
      return NextResponse.json({ error: 'Нет согласия на публикацию — отзыв нельзя показать на промо.' }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('app_reviews')
    .update({ show_on_promo: body.show_on_promo })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
