import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdmin,
  getAdminUserFromRequest,
  issueSessionCookie,
  publicAdminUser,
  sessionCookieOptions,
} from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const user = await getAdminUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ user: publicAdminUser(user) })
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const result = await authenticateAdmin(email, password)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const session = issueSessionCookie(result.user)
  if ('error' in session) {
    return NextResponse.json({ error: session.error }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true, user: publicAdminUser(result.user) })
  res.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
    ...sessionCookieOptions,
    maxAge: session.maxAge,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...sessionCookieOptions,
    maxAge: 0,
  })
  return res
}
