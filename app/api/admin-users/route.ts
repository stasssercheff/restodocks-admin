import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest, ownerEmailForDisplay, ownerLoginEmail } from '@/lib/admin-auth'
import {
  createStaffUser,
  deleteStaffUser,
  listStaffUsers,
  normalizeEmail,
  updateStaffUser,
} from '@/lib/admin-users'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'staff')
  if ('response' in auth) return auth.response

  const result = await listStaffUsers()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({
    owner: {
      email: ownerEmailForDisplay(auth.user.email),
      isOwner: true,
    },
    users: result.users,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'staff')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const ownerEmail = ownerLoginEmail()
  if (email === ownerEmail) {
    return NextResponse.json({ error: 'Этот email занят владельцем' }, { status: 409 })
  }
  if (email && email === normalizeEmail(auth.user.email)) {
    return NextResponse.json({ error: 'Этот email занят владельцем' }, { status: 409 })
  }

  const result = await createStaffUser({
    email,
    password: typeof body.password === 'string' ? body.password : '',
    displayName: typeof body.displayName === 'string' ? body.displayName : null,
    pages: body.pages,
    promoCodes: body.promoCodes,
    referralDepth: body.referralDepth,
  })
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }
  return NextResponse.json({ user: result.user })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'staff')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'Не указан пользователь' }, { status: 400 })

  const result = await updateStaffUser({
    id,
    pages: body.pages,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
    password: typeof body.password === 'string' && body.password ? body.password : undefined,
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    promoCodes: body.promoCodes,
    referralDepth: body.referralDepth,
  })
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }
  return NextResponse.json({ user: result.user })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'staff')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'Не указан пользователь' }, { status: 400 })

  const result = await deleteStaffUser(id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }
  return NextResponse.json({ ok: true })
}
