import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { buildProviderQuotas } from '@/lib/provider-quotas'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'ai_usage')
  if ('response' in auth) return auth.response

  const url = req.nextUrl
  const payload = await buildProviderQuotas({
    tz: url.searchParams.get('tz'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  })
  if ('error' in payload) {
    return NextResponse.json({ error: payload.error }, { status: 500 })
  }
  return NextResponse.json(payload)
}
