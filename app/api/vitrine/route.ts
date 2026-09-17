import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { getVitrineData } from '@/lib/vitrine'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'vitrine')
  if ('response' in auth) return auth.response

  const result = await getVitrineData()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result)
}
