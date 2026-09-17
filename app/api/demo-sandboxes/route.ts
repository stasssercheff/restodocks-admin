import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
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

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'demo_sandboxes')
  if ('response' in auth) return auth.response

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
