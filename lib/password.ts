import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const pbkdf2Async = promisify(pbkdf2)

const HASH_PREFIX = 'pbkdf2'
const HASH_DIGEST = 'sha256'
const ITERATIONS = 31_000
const KEY_BYTES = 32
const SALT_BYTES = 16

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await pbkdf2Async(password, salt, ITERATIONS, KEY_BYTES, HASH_DIGEST)
  return `${HASH_PREFIX}$${HASH_DIGEST}$${ITERATIONS}$${salt.toString('hex')}$${key.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 5 || parts[0] !== HASH_PREFIX || parts[1] !== HASH_DIGEST) {
    return false
  }
  const iterations = Number(parts[2])
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 1_000_000) {
    return false
  }
  const salt = Buffer.from(parts[3], 'hex')
  const expected = Buffer.from(parts[4], 'hex')
  if (salt.length < 8 || expected.length < 16) return false
  const actual = await pbkdf2Async(password, salt, iterations, expected.length, HASH_DIGEST)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export function safeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) {
    timingSafeEqual(left, Buffer.alloc(left.length, 0))
    return false
  }
  return timingSafeEqual(left, right)
}
