import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { deleteOrphanOwner, listOrphanOwners } from '@/lib/orphan-owners'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец админки' }, { status: 403 })
  }

  const result = await listOrphanOwners()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ owners: result.owners })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'establishments')
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец админки' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const authUserId = typeof body.authUserId === 'string' ? body.authUserId.trim() : ''
  if (!authUserId) {
    return NextResponse.json({ error: 'authUserId обязателен' }, { status: 400 })
  }

  const result = await deleteOrphanOwner(authUserId, body.confirm)
  if ('error' in result) {
    const status = /введите слово|есть заведения|привязана/i.test(result.error) ? 400 : 500
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }
  return NextResponse.json({ ok: true })
}
