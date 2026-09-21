import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { refreshEstablishmentGeo } from '@/lib/establishments'

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец может обновлять гео' }, { status: 403 })
  }

  const result = await refreshEstablishmentGeo()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result)
}
