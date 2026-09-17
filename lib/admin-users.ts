import { createServiceClient, readEnv } from './supabase-server'
import { ALL_ADMIN_PAGE_KEYS, sanitizePages, type AdminPageKey } from './admin-pages'
import { hashPassword } from './password'
import { randomUUID } from 'node:crypto'

export const ADMIN_USERS_TABLE = 'admin_panel_users'

export type AdminUserRecord = {
  id: string
  email: string
  displayName: string | null
  isOwner: boolean
  pages: AdminPageKey[]
  isActive: boolean
  createdAt: string
}

type AdminUserRow = {
  id: string
  email: string
  password_hash: string
  display_name: string | null
  is_owner: boolean
  pages: string[] | null
  is_active: boolean
  created_at: string
}

const TABLE_MISSING_HINT =
  'Таблица admin_panel_users ещё не создана в Supabase. Выполни supabase/migrations/20260917_admin_panel_users.sql'

function mapRow(row: AdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    isOwner: !!row.is_owner,
    pages: row.is_owner ? [...ALL_ADMIN_PAGE_KEYS] : sanitizePages(row.pages),
    isActive: row.is_active !== false,
    createdAt: row.created_at,
  }
}

function tableMissing(message: string | undefined): boolean {
  const text = (message ?? '').toLowerCase()
  return text.includes('admin_panel_users') && (
    text.includes('does not exist')
    || text.includes('schema cache')
    || text.includes('could not find')
  )
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isDevMemoryStore() {
  return readEnv('ADMIN_USERS_DEV_STORE') === 'memory' && process.env.NODE_ENV !== 'production'
}

function memoryRows(): AdminUserRow[] {
  const g = globalThis as unknown as { __restodocksAdminUsers?: AdminUserRow[] }
  if (!g.__restodocksAdminUsers) g.__restodocksAdminUsers = []
  return g.__restodocksAdminUsers
}

function rowFromMemory(idOrEmail: { id?: string; email?: string }): AdminUserRow | undefined {
  const rows = memoryRows()
  return rows.find(row =>
    (idOrEmail.id && row.id === idOrEmail.id)
    || (idOrEmail.email && row.email === idOrEmail.email),
  )
}

function getClient() {
  const client = createServiceClient()
  if ('error' in client) return client
  return { client }
}

function found(row: AdminUserRow) {
  return { user: mapRow(row), passwordHash: row.password_hash }
}

export async function findUserByEmail(email: string): Promise<
  { user: AdminUserRecord; passwordHash: string } | { error: string } | null
> {
  const normalized = normalizeEmail(email)
  if (isDevMemoryStore()) {
    const row = rowFromMemory({ email: normalized })
    return row ? found(row) : null
  }
  const svc = getClient()
  if ('error' in svc) return svc
  const { data, error } = await svc.client
    .from(ADMIN_USERS_TABLE)
    .select('id, email, password_hash, display_name, is_owner, pages, is_active, created_at')
    .eq('email', normalized)
    .maybeSingle()

  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT }
    return { error: error.message }
  }
  if (!data) return null
  return found(data as AdminUserRow)
}

export async function findUserById(id: string): Promise<
  { user: AdminUserRecord; passwordHash: string } | { error: string } | null
> {
  if (isDevMemoryStore()) {
    const row = rowFromMemory({ id })
    return row ? found(row) : null
  }
  const svc = getClient()
  if ('error' in svc) return svc
  const { data, error } = await svc.client
    .from(ADMIN_USERS_TABLE)
    .select('id, email, password_hash, display_name, is_owner, pages, is_active, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT }
    return { error: error.message }
  }
  if (!data) return null
  return found(data as AdminUserRow)
}

export async function listStaffUsers(): Promise<
  { users: AdminUserRecord[] } | { error: string }
> {
  if (isDevMemoryStore()) {
    return {
      users: memoryRows().filter(row => !row.is_owner).map(mapRow),
    }
  }
  const svc = getClient()
  if ('error' in svc) return svc
  const { data, error } = await svc.client
    .from(ADMIN_USERS_TABLE)
    .select('id, email, password_hash, display_name, is_owner, pages, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT }
    return { error: error.message }
  }

  const users = ((data ?? []) as AdminUserRow[])
    .filter(row => !row.is_owner)
    .map(mapRow)
  return { users }
}

export async function createStaffUser(input: {
  email: string
  password: string
  displayName?: string | null
  pages: unknown
}): Promise<{ user: AdminUserRecord } | { error: string; status?: number }> {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) return { error: 'Укажи корректный email', status: 400 }
  if (!input.password || input.password.length < 8) {
    return { error: 'Пароль должен быть не короче 8 символов', status: 400 }
  }

  if (isDevMemoryStore()) {
    if (memoryRows().some(row => row.email === email)) {
      return { error: 'Пользователь с таким email уже есть', status: 409 }
    }
    const row: AdminUserRow = {
      id: randomUUID(),
      email,
      password_hash: await hashPassword(input.password),
      display_name: input.displayName?.trim() || null,
      is_owner: false,
      pages: sanitizePages(input.pages),
      is_active: true,
      created_at: new Date().toISOString(),
    }
    memoryRows().push(row)
    return { user: mapRow(row) }
  }

  const svc = getClient()
  if ('error' in svc) return svc

  const passwordHash = await hashPassword(input.password)
  const { data, error } = await svc.client
    .from(ADMIN_USERS_TABLE)
    .insert({
      email,
      password_hash: passwordHash,
      display_name: input.displayName?.trim() || null,
      is_owner: false,
      pages: sanitizePages(input.pages),
      is_active: true,
    })
    .select('id, email, password_hash, display_name, is_owner, pages, is_active, created_at')
    .single()

  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT, status: 500 }
    if (error.code === '23505' || error.message.toLowerCase().includes('duplicate')) {
      return { error: 'Пользователь с таким email уже есть', status: 409 }
    }
    return { error: error.message, status: 500 }
  }

  return { user: mapRow(data as AdminUserRow) }
}

export async function updateStaffUser(input: {
  id: string
  pages?: unknown
  isActive?: boolean
  password?: string
  displayName?: string | null
}): Promise<{ user: AdminUserRecord } | { error: string; status?: number }> {
  const existing = await findUserById(input.id)
  if (!existing) return { error: 'Пользователь не найден', status: 404 }
  if ('error' in existing) return existing
  if (existing.user.isOwner) return { error: 'Нельзя менять владельца через этот список', status: 400 }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.pages !== undefined) patch.pages = sanitizePages(input.pages)
  if (typeof input.isActive === 'boolean') patch.is_active = input.isActive
  if (input.displayName !== undefined) patch.display_name = input.displayName?.trim() || null
  if (typeof input.password === 'string') {
    if (input.password.length < 8) {
      return { error: 'Пароль должен быть не короче 8 символов', status: 400 }
    }
    patch.password_hash = await hashPassword(input.password)
  }

  if (isDevMemoryStore()) {
    const row = rowFromMemory({ id: input.id })
    if (!row) return { error: 'Пользователь не найден', status: 404 }
    if (patch.pages !== undefined) row.pages = patch.pages as string[]
    if (typeof patch.is_active === 'boolean') row.is_active = patch.is_active
    if (patch.display_name !== undefined) row.display_name = patch.display_name as string | null
    if (typeof patch.password_hash === 'string') row.password_hash = patch.password_hash
    return { user: mapRow(row) }
  }

  const svc = getClient()
  if ('error' in svc) return svc

  const { data, error } = await svc.client
    .from(ADMIN_USERS_TABLE)
    .update(patch)
    .eq('id', input.id)
    .select('id, email, password_hash, display_name, is_owner, pages, is_active, created_at')
    .single()

  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT, status: 500 }
    return { error: error.message, status: 500 }
  }
  return { user: mapRow(data as AdminUserRow) }
}

export async function deleteStaffUser(id: string): Promise<{ ok: true } | { error: string; status?: number }> {
  const existing = await findUserById(id)
  if (!existing) return { error: 'Пользователь не найден', status: 404 }
  if ('error' in existing) return existing
  if (existing.user.isOwner) return { error: 'Нельзя удалить владельца', status: 400 }

  if (isDevMemoryStore()) {
    const rows = memoryRows()
    const index = rows.findIndex(row => row.id === id)
    if (index < 0) return { error: 'Пользователь не найден', status: 404 }
    rows.splice(index, 1)
    return { ok: true }
  }

  const svc = getClient()
  if ('error' in svc) return svc
  const { error } = await svc.client.from(ADMIN_USERS_TABLE).delete().eq('id', id)
  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT, status: 500 }
    return { error: error.message, status: 500 }
  }
  return { ok: true }
}
