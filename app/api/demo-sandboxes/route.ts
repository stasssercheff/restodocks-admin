import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { deleteDemoSandbox, resetDemoByEmail } from '@/lib/demo'
import { normalizeDemoEmail, normalizeDemoSandboxId } from '@/lib/demo-id'
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
  auth_user_id?: string | null
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
        auth_user_id: 'fixture-auth-1',
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
    .select('id, email, locale, created_at, expires_at, first_entered_at, tour_step, tour_completed_at, converted_at, status, last_promo_email_at, establishment_id, auth_user_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (data ?? []).map(row => ({
    ...row,
    registered: !!row.converted_at,
  }))
  return NextResponse.json({ summary: summarize(rows), rows })
}

async function allowDemoReset(req: NextRequest) {
  const resetToken = process.env.DEMO_RESET_TOKEN?.trim()
  const provided = req.headers.get('x-demo-reset-token')?.trim()
  if (resetToken && provided && resetToken === provided) {
    return { ok: true as const }
  }
  const auth = await requireAdminRequest(req, 'demo_sandboxes')
  if ('response' in auth) return auth
  return { ok: true as const }
}

export async function POST(req: NextRequest) {
  const gate = await allowDemoReset(req)
  if ('response' in gate) return gate.response

  const body = await req.json().catch(() => ({})) as { action?: unknown; email?: unknown }
  if (body.action !== 'reset_email') {
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
  }
  const email = normalizeDemoEmail(body.email)
  if (!email) {
    return NextResponse.json({ error: 'Укажите корректную почту' }, { status: 400 })
  }

  if (process.env.DEMO_FIXTURE === '1') {
    const rows = getFixtureRows()
    const before = rows.length
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if ((rows[i].email || '').toLowerCase() === email) rows.splice(i, 1)
    }
    return NextResponse.json({
      ok: true,
      email,
      deletedSandboxIds: before === rows.length ? [] : ['fixture-demo-1'],
      deletedAuthUserIds: before === rows.length ? [] : ['fixture-auth-1'],
      deletedEstablishmentIds: [],
    })
  }

  const result = await resetDemoByEmail(email)
  if ('error' in result) {
    const status = /не найдено/i.test(result.error) ? 404 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }
  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'demo_sandboxes')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as { id?: unknown; email?: unknown }
  const id = normalizeDemoSandboxId(body.id)
  const email = normalizeDemoEmail(body.email)

  if (process.env.DEMO_FIXTURE === '1') {
    const rows = getFixtureRows()
    if (email) {
      const before = rows.length
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        if ((rows[i].email || '').toLowerCase() === email) rows.splice(i, 1)
      }
      if (before === rows.length) {
        return NextResponse.json({ error: 'Песочница не найдена' }, { status: 404 })
      }
      return NextResponse.json({
        ok: true,
        email,
        deletedSandboxIds: ['fixture-demo-1'],
        deletedAuthUserIds: ['fixture-auth-1'],
        deletedEstablishmentIds: [],
      })
    }
    if (!id) {
      return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
    }
    const idx = rows.findIndex(r => r.id === id)
    if (idx < 0) {
      return NextResponse.json({ error: 'Песочница не найдена' }, { status: 404 })
    }
    const [removed] = rows.splice(idx, 1)
    return NextResponse.json({
      ok: true,
      email: removed.email,
      deletedSandboxIds: [removed.id],
      deletedAuthUserIds: removed.auth_user_id ? [removed.auth_user_id] : [],
      deletedEstablishmentIds: [],
    })
  }

  if (email && !id) {
    const result = await resetDemoByEmail(email)
    if ('error' in result) {
      const status = /не найдено/i.test(result.error) ? 404 : 500
      return NextResponse.json({ error: result.error, code: result.code }, { status })
    }
    return NextResponse.json(result)
  }

  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  }

  const result = await deleteDemoSandbox(id)
  if ('error' in result) {
    const status = result.error === 'Песочница не найдена' ? 404 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }
  return NextResponse.json(result)
}
