import { NextRequest, NextResponse } from 'next/server'
import { dataScopeForUser, requireAdminRequest } from '@/lib/admin-auth'
import { listEstablishments } from '@/lib/establishments'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response

  const scope = dataScopeForUser(auth.user)
  const result = await listEstablishments(scope)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({
    scope: scope === 'all' ? { owner: true } : scope,
    stats: result.stats,
    count: result.data.length,
  })
}
