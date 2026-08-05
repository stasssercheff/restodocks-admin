import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedAdminRequest } from '@/lib/admin-auth'
import { listEstablishments } from '@/lib/establishments'

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await listEstablishments()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json(result.data)
}
