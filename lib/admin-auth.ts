import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ALL_ADMIN_PAGE_KEYS, canAccessPage, type AdminPageKey } from '@/lib/admin-pages'
import { type DataScope } from '@/lib/admin-scope'
import { createSessionToken, verifySessionToken, type SessionPayload } from '@/lib/admin-session'
import { findUserByEmail, findUserById, normalizeEmail, type AdminUserRecord } from '@/lib/admin-users'
import { safeStringEqual, verifyPassword } from '@/lib/password'
import { readEnv } from '@/lib/supabase-server'

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const ENV_OWNER_UID = 'env-owner'
export const DEFAULT_OWNER_EMAIL = 'stassser@gmail.com'

export type AdminUser = {
  id: string
  email: string
  displayName: string | null
  isOwner: boolean
  pages: AdminPageKey[]
  isActive: boolean
  promoCodes: string[]
  referralDepth: number
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'lax' as const,
  path: '/',
}

export function publicAdminUser(user: AdminUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isOwner: user.isOwner,
    pages: user.isOwner ? [...ALL_ADMIN_PAGE_KEYS] : user.pages,
    promoCodes: user.isOwner ? [] : user.promoCodes,
    referralDepth: user.referralDepth,
  }
}

export function dataScopeForUser(user: { isOwner: boolean; promoCodes?: string[]; referralDepth?: number } | null | undefined): DataScope | 'all' {
  if (!user || user.isOwner) return 'all'
  return {
    promoCodes: user.promoCodes ?? [],
    referralDepth: user.referralDepth ?? 1,
  }
}

export function ownerLoginEmail(): string {
  return normalizeEmail(readEnv('ADMIN_EMAIL') || DEFAULT_OWNER_EMAIL)
}

function envOwnerPassword(): string | undefined {
  return readEnv('ADMIN_PASSWORD')
}

export function ownerEmailForDisplay(sessionEmail?: string): string {
  return ownerLoginEmail() || sessionEmail || DEFAULT_OWNER_EMAIL
}

function ownerUser(email: string): AdminUser {
  return {
    id: ENV_OWNER_UID,
    email,
    displayName: 'Владелец',
    isOwner: true,
    pages: [...ALL_ADMIN_PAGE_KEYS],
    isActive: true,
    promoCodes: [],
    referralDepth: 5,
  }
}

function fromRecord(record: AdminUserRecord): AdminUser {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    isOwner: record.isOwner,
    pages: record.isOwner ? [...ALL_ADMIN_PAGE_KEYS] : record.pages,
    isActive: record.isActive,
    promoCodes: record.promoCodes,
    referralDepth: record.referralDepth,
  }
}

function isEnvOwnerCredentials(email: string, password: string): boolean {
  const adminPassword = envOwnerPassword()
  if (!adminPassword || !safeStringEqual(password, adminPassword)) return false
  return normalizeEmail(email) === ownerLoginEmail()
}

export async function authenticateAdmin(emailRaw: string, password: string): Promise<
  { user: AdminUser } | { error: string; status: number }
> {
  const email = normalizeEmail(emailRaw)
  if (!email || !password) {
    return { error: 'Укажи email и пароль', status: 400 }
  }

  const existing = await findUserByEmail(email)
  if (existing && 'error' in existing) {
    // Table/config errors should not block the env owner login.
    if (!isEnvOwnerCredentials(email, password)) {
      return { error: existing.error, status: 500 }
    }
  } else if (existing) {
    if (existing.user.isOwner) {
      const hashOk = await verifyPassword(password, existing.passwordHash)
      if (!hashOk && !isEnvOwnerCredentials(email, password)) {
        return { error: 'Неверный логин или пароль', status: 401 }
      }
      return { user: fromRecord(existing.user) }
    }
    if (!existing.user.isActive) {
      return { error: 'Учётная запись отключена', status: 403 }
    }
    const ok = await verifyPassword(password, existing.passwordHash)
    if (!ok) return { error: 'Неверный логин или пароль', status: 401 }
    return { user: fromRecord(existing.user) }
  }

  if (isEnvOwnerCredentials(email, password)) {
    return { user: ownerUser(email) }
  }

  return { error: 'Неверный логин или пароль', status: 401 }
}

export async function resolveSessionUser(payload: SessionPayload): Promise<AdminUser | null> {
  if (payload.role === 'owner' || payload.uid === ENV_OWNER_UID) {
    return ownerUser(payload.email)
  }
  const found = await findUserById(payload.uid)
  if (!found || 'error' in found) return null
  if (!found.user.isActive) return null
  return fromRecord(found.user)
}

export async function getAdminUserFromToken(token: string | undefined | null): Promise<AdminUser | null> {
  const payload = verifySessionToken(token)
  if (!payload) return null
  return resolveSessionUser(payload)
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  return getAdminUserFromToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  return (await getAdminUser()) != null
}

export async function getAdminUserFromRequest(req: NextRequest): Promise<AdminUser | null> {
  return getAdminUserFromToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

export function isAuthenticatedAdminRequest(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value) != null
}

export async function requireAdminRequest(
  req: NextRequest,
  page?: AdminPageKey | 'staff',
): Promise<{ user: AdminUser } | { response: NextResponse }> {
  const user = await getAdminUserFromRequest(req)
  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (page === 'staff') {
    if (!user.isOwner) {
      return { response: NextResponse.json({ error: 'Нет доступа' }, { status: 403 }) }
    }
    return { user }
  }
  if (page && !canAccessPage(user, page)) {
    return { response: NextResponse.json({ error: 'Нет доступа' }, { status: 403 }) }
  }
  return { user }
}

export function issueSessionCookie(user: AdminUser): { token: string; maxAge: number } | { error: string } {
  return createSessionToken({
    uid: user.id,
    email: user.email,
    role: user.isOwner ? 'owner' : 'staff',
  })
}

export { canAccessPage }
