import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { deleteDemoSandbox } from '@/lib/demo'
import { normalizeDemoSandboxId } from '@/lib/demo-id'
import { createServiceClient } from '@/lib/supabase-server'

type DemoRow = {
  id: string
  email: string | null
  locale: string | null
  created_at: string
  expires_at: string | null
  first_entered_at: string | null
  tour_step: number | null
  tour_completed_at: string | null
  converted_at: string | null
  status: string | null
  last_promo_email_at: string | null
  establishment_id: string | null
}

function summarize(rows: (DemoRow & { registered: boolean })[]) {
  const now = Date.now()
  return {
    total: rows.length,
    active: rows.filter(row => row.status === 'active' && row.expires_at && new Date(row.expires_at).getTime() > now).length,
    expired: rows.filter(row => row.status === 'expired' || !row.expires_at || new Date(row.expires_at).getTime() <= now).length,
    converted: rows.filter(row => row.registered || row.converted_at).length,
    notConvertedExpired: rows.filter(row =>
      !row.registered
      && !row.converted_at
      && (row.status === 'expired' || !row.expires_at || new Date(row.expires_at).getTime() <= Date.now()),
    ).length,
  }
}

/** Local-only in-memory rows when DEMO_FIXTURE=1 (never set in production). */
let fixtureRows: (DemoRow & { registered: boolean })[] | null = null

function getFixtureRows() {
  if (!fixtureRows) {
    fixtureRows = [
      {
        id: 'fixture-demo-1',
        email: 'retest@example.com',
        locale: 'ru',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        first_entered_at: null,
        tour_step: 0,
        tour_completed_at: null,
        converted_at: null,
        status: 'active',
        last_promo_email_at: null,
        establishment_id: null,
        registered: false,
      },
    ]
  }
  return fixtureRows
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'demo_sandboxes')
  if ('response' in auth) return auth.response

  if (process.env.DEMO_FIXTURE === '1') {
    const rows = getFixtureRows().map(r => ({ ...r }))
    return NextResponse.json({ summary: summarize(rows), rows })
  }

  const supabase = createServiceClient()
  if ('error' in supabase) return NextResponse.json({ error: supabase.error }, { status: 500 })

  const { data, error } = await supabase
    .from('demo_sandboxes')
    .select('id, email, locale, created_at, expires_at, first_entered_at, tour_step, tour_completed_at, converted_at, status, last_promo_email_at, establishment_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (data ?? []).map(row => ({
    ...row,
    registered: !!row.converted_at,
  }))
  return NextResponse.json({ summary: summarize(rows), rows })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'demo_sandboxes')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as { id?: unknown }
  const id = normalizeDemoSandboxId(body.id)
  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  }

  if (process.env.DEMO_FIXTURE === '1') {
    const rows = getFixtureRows()
    const idx = rows.findIndex(r => r.id === id)
    if (idx < 0) {
      return NextResponse.json({ error: 'Песочница не найдена' }, { status: 404 })
    }
    const [removed] = rows.splice(idx, 1)
    return NextResponse.json({ ok: true, email: removed.email, deletedEstablishmentId: null })
  }

  const result = await deleteDemoSandbox(id)
  if ('error' in result) {
    const status = result.error === 'Песочница не найдена' ? 404 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }
  return NextResponse.json(result)
}
