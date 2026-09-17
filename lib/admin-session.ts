import { createHmac, timingSafeEqual } from 'node:crypto'

function readSecret(name: string): string | undefined {
  const value = process.env[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export type SessionRole = 'owner' | 'staff'

export type SessionPayload = {
  v: 1
  uid: string
  email: string
  role: SessionRole
  exp: number
}

const SESSION_TTL_SECONDS = 60 * 60 * 24

function getSessionSecret(): string | { error: string } {
  const secret = readSecret('ADMIN_SESSION_SECRET') || readSecret('ADMIN_PASSWORD')
  if (!secret) {
    return { error: 'Не задан ADMIN_SESSION_SECRET или ADMIN_PASSWORD' }
  }
  return secret
}

function encodePart(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodePart(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url')
}

function signaturesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function createSessionToken(input: {
  uid: string
  email: string
  role: SessionRole
}): { token: string; maxAge: number } | { error: string } {
  const secret = getSessionSecret()
  if (typeof secret !== 'string') return secret
  const payload: SessionPayload = {
    v: 1,
    uid: input.uid,
    email: input.email.toLowerCase(),
    role: input.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encodedPayload = encodePart(JSON.stringify(payload))
  return {
    token: `${encodedPayload}.${sign(encodedPayload, secret)}`,
    maxAge: SESSION_TTL_SECONDS,
  }
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null
  const secret = getSessionSecret()
  if (typeof secret !== 'string') return null
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null
  const expected = sign(encodedPayload, secret)
  if (!signaturesMatch(signature, expected)) return null
  try {
    const parsed = JSON.parse(decodePart(encodedPayload)) as SessionPayload
    if (parsed.v !== 1 || !parsed.uid || !parsed.email || !parsed.role || !parsed.exp) {
      return null
    }
    if (parsed.role !== 'owner' && parsed.role !== 'staff') return null
    if (parsed.exp * 1000 <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}
