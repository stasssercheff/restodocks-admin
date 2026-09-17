import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { listDemoSandboxes } from '@/lib/demo'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'demo')
  if ('response' in auth) return auth.response

  const result = await listDemoSandboxes()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result.data)
}
