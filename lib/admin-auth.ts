import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const ADMIN_SESSION_VALUE = 'authenticated'

export function isAdminSession(value: string | undefined | null): boolean {
  return value === ADMIN_SESSION_VALUE
}

export async function getAdminSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  return isAdminSession(await getAdminSessionCookie())
}

/** Prefer request cookies in Route Handlers (more reliable on Cloudflare Workers). */
export function isAuthenticatedAdminRequest(req: NextRequest): boolean {
  return isAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}
