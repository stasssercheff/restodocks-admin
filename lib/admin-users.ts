import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createServiceClient, readEnv } from './supabase-server'
import { ALL_ADMIN_PAGE_KEYS, sanitizePages, type AdminPageKey } from './admin-pages'
import { readAdminConfigJson, writeAdminConfigJson } from './admin-kv'
import { sanitizeDataScope, sanitizePromoCodes, sanitizeReferralDepth, type DataScope } from './admin-scope'
import { hashPassword } from './password'

export const ADMIN_USERS_TABLE = 'admin_panel_users'

export type AdminUserRecord = {
  id: string
  email: string
  displayName: string | null
  isOwner: boolean
  pages: AdminPageKey[]
  isActive: boolean
  createdAt: string
  promoCodes: string[]
  referralDepth: number
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
  promo_codes?: string[] | null
  referral_depth?: number | null
}

const TABLE_MISSING_HINT =
  'Таблица admin_panel_users ещё не создана в Supabase. Выполни supabase/migrations/20260917_admin_panel_users.sql'

const DEFAULT_STAFF_PAGES: AdminPageKey[] = ['establishments']

function staffPages(input: unknown): AdminPageKey[] {
  const pages = sanitizePages(input)
  return pages.length > 0 ? pages : [...DEFAULT_STAFF_PAGES]
}

function mapRow(row: AdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    isOwner: !!row.is_owner,
    pages: row.is_owner ? [...ALL_ADMIN_PAGE_KEYS] : sanitizePages(row.pages),
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    promoCodes: sanitizePromoCodes(row.promo_codes),
    referralDepth: sanitizeReferralDepth(row.referral_depth),
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

function scopeColumnsMissing(message: string | undefined): boolean {
  const text = (message ?? '').toLowerCase()
  return text.includes('promo_codes') || text.includes('referral_depth')
}

const USER_COLUMNS = 'id, email, password_hash, display_name, is_owner, pages, is_active, created_at, promo_codes, referral_depth'
const USER_COLUMNS_LEGACY = 'id, email, password_hash, display_name, is_owner, pages, is_active, created_at'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const DEV_STORE_PATH = '/tmp/restodocks-admin-users.json'

function isDevMemoryStore() {
  return readEnv('ADMIN_USERS_DEV_STORE') === 'memory' && process.env.NODE_ENV !== 'production'
}

function memoryRows(): AdminUserRow[] {
  try {
    if (!existsSync(DEV_STORE_PATH)) return []
    const parsed = JSON.parse(readFileSync(DEV_STORE_PATH, 'utf8'))
    return Array.isArray(parsed) ? parsed as AdminUserRow[] : []
  } catch {
    return []
  }
}

function saveMemoryRows(rows: AdminUserRow[]) {
  writeFileSync(DEV_STORE_PATH, JSON.stringify(rows, null, 2))
}

function rowFromMemory(idOrEmail: { id?: string; email?: string }): AdminUserRow | undefined {
  return memoryRows().find(row =>
    (idOrEmail.id && row.id === idOrEmail.id)
    || (idOrEmail.email && row.email === idOrEmail.email),
  )
}

function getClient() {
  const client = createServiceClient()
  if ('error' in client) return client
  return { client }
}

function scopeKey(id: string) {
  return `admin_user_scope:${id}`
}

function omitScopeColumns<T extends Record<string, unknown>>(row: T) {
  const next = { ...row }
  delete next.promo_codes
  delete next.referral_depth
  return next
}

async function saveScopeOverlay(id: string, scope: DataScope) {
  try {
    await writeAdminConfigJson(scopeKey(id), scope)
  } catch {
    // KV is optional; SQL columns are the source of truth when present.
  }
}

async function mergeScope(record: AdminUserRecord): Promise<AdminUserRecord> {
  if (record.isOwner || record.promoCodes.length > 0) return record
  const overlay = await readAdminConfigJson<DataScope>(scopeKey(record.id))
  if (!overlay) return record
  const sanitized = sanitizeDataScope(overlay)
  return { ...record, promoCodes: sanitized.promoCodes, referralDepth: sanitized.referralDepth }
}

async function found(row: AdminUserRow) {
  return { user: await mergeScope(mapRow(row)), passwordHash: row.password_hash }
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
  let query = await svc.client
    .from(ADMIN_USERS_TABLE)
    .select(USER_COLUMNS)
    .eq('email', normalized)
    .maybeSingle()
  if (query.error && scopeColumnsMissing(query.error.message)) {
    query = await svc.client
      .from(ADMIN_USERS_TABLE)
      .select(USER_COLUMNS_LEGACY)
      .eq('email', normalized)
      .maybeSingle() as typeof query
  }

  if (query.error) {
    if (tableMissing(query.error.message)) return { error: TABLE_MISSING_HINT }
    return { error: query.error.message }
  }
  if (!query.data) return null
  return found(query.data as AdminUserRow)
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
  let query = await svc.client
    .from(ADMIN_USERS_TABLE)
    .select(USER_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (query.error && scopeColumnsMissing(query.error.message)) {
    query = await svc.client
      .from(ADMIN_USERS_TABLE)
      .select(USER_COLUMNS_LEGACY)
      .eq('id', id)
      .maybeSingle() as typeof query
  }

  if (query.error) {
    if (tableMissing(query.error.message)) return { error: TABLE_MISSING_HINT }
    return { error: query.error.message }
  }
  if (!query.data) return null
  return found(query.data as AdminUserRow)
}

export async function listStaffUsers(): Promise<
  { users: AdminUserRecord[] } | { error: string }
> {
  if (isDevMemoryStore()) {
    return {
      users: await Promise.all(memoryRows().filter(row => !row.is_owner).map(row => mergeScope(mapRow(row)))),
    }
  }
  const svc = getClient()
  if ('error' in svc) return svc
  let query = await svc.client
    .from(ADMIN_USERS_TABLE)
    .select(USER_COLUMNS)
    .order('created_at', { ascending: true })
  if (query.error && scopeColumnsMissing(query.error.message)) {
    query = await svc.client
      .from(ADMIN_USERS_TABLE)
      .select(USER_COLUMNS_LEGACY)
      .order('created_at', { ascending: true }) as typeof query
  }

  if (query.error) {
    if (tableMissing(query.error.message)) return { error: TABLE_MISSING_HINT }
    return { error: query.error.message }
  }
  const data = query.data

  const users = await Promise.all(
    ((data ?? []) as AdminUserRow[])
      .filter(row => !row.is_owner)
      .map(row => mergeScope(mapRow(row))),
  )
  return { users }
}

export async function createStaffUser(input: {
  email: string
  password: string
  displayName?: string | null
  pages: unknown
  promoCodes?: unknown
  referralDepth?: unknown
}): Promise<{ user: AdminUserRecord } | { error: string; status?: number }> {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) return { error: 'Укажи корректный email', status: 400 }
  if (!input.password || input.password.length < 8) {
    return { error: 'Пароль должен быть не короче 8 символов', status: 400 }
  }

  const pages = staffPages(input.pages)
  const scope: DataScope = {
    promoCodes: sanitizePromoCodes(input.promoCodes),
    referralDepth: sanitizeReferralDepth(input.referralDepth),
  }

  if (isDevMemoryStore()) {
    const rows = memoryRows()
    if (rows.some(item => item.email === email)) {
      return { error: 'Пользователь с таким email уже есть', status: 409 }
    }
    const row: AdminUserRow = {
      id: randomUUID(),
      email,
      password_hash: await hashPassword(input.password),
      display_name: input.displayName?.trim() || null,
      is_owner: false,
      pages,
      is_active: true,
      created_at: new Date().toISOString(),
      promo_codes: scope.promoCodes,
      referral_depth: scope.referralDepth,
    }
    rows.push(row)
    saveMemoryRows(rows)
    return { user: mapRow(row) }
  }

  const svc = getClient()
  if ('error' in svc) return svc

  const passwordHash = await hashPassword(input.password)
  const payload = {
    email,
    password_hash: passwordHash,
    display_name: input.displayName?.trim() || null,
    is_owner: false,
    pages,
    is_active: true,
    promo_codes: scope.promoCodes,
    referral_depth: scope.referralDepth,
  }
  let inserted = await svc.client
    .from(ADMIN_USERS_TABLE)
    .insert(payload)
    .select(USER_COLUMNS)
    .single()
  if (inserted.error && scopeColumnsMissing(inserted.error.message)) {
    inserted = await svc.client
      .from(ADMIN_USERS_TABLE)
      .insert(omitScopeColumns(payload))
      .select(USER_COLUMNS_LEGACY)
      .single() as typeof inserted
  }

  if (inserted.error) {
    if (tableMissing(inserted.error.message)) return { error: TABLE_MISSING_HINT, status: 500 }
    if (inserted.error.code === '23505' || inserted.error.message.toLowerCase().includes('duplicate')) {
      return { error: 'Пользователь с таким email уже есть', status: 409 }
    }
    return { error: inserted.error.message, status: 500 }
  }
  const row = inserted.data as AdminUserRow
  await saveScopeOverlay(row.id, scope)
  return { user: await mergeScope({ ...mapRow(row), ...scope }) }
}

export async function updateStaffUser(input: {
  id: string
  pages?: unknown
  isActive?: boolean
  password?: string
  displayName?: string | null
  promoCodes?: unknown
  referralDepth?: unknown
}): Promise<{ user: AdminUserRecord } | { error: string; status?: number }> {
  const existing = await findUserById(input.id)
  if (!existing) return { error: 'Пользователь не найден', status: 404 }
  if ('error' in existing) return existing
  if (existing.user.isOwner) return { error: 'Нельзя менять владельца через этот список', status: 400 }

  const nextScope: DataScope = {
    promoCodes: input.promoCodes !== undefined
      ? sanitizePromoCodes(input.promoCodes)
      : existing.user.promoCodes,
    referralDepth: input.referralDepth !== undefined
      ? sanitizeReferralDepth(input.referralDepth)
      : existing.user.referralDepth,
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.pages !== undefined) patch.pages = sanitizePages(input.pages)
  if (typeof input.isActive === 'boolean') patch.is_active = input.isActive
  if (input.displayName !== undefined) patch.display_name = input.displayName?.trim() || null
  if (input.promoCodes !== undefined) patch.promo_codes = nextScope.promoCodes
  if (input.referralDepth !== undefined) patch.referral_depth = nextScope.referralDepth
  if (typeof input.password === 'string') {
    if (input.password.length < 8) {
      return { error: 'Пароль должен быть не короче 8 символов', status: 400 }
    }
    patch.password_hash = await hashPassword(input.password)
  }

  if (isDevMemoryStore()) {
    const rows = memoryRows()
    const row = rows.find(item => item.id === input.id)
    if (!row) return { error: 'Пользователь не найден', status: 404 }
    if (patch.pages !== undefined) row.pages = patch.pages as string[]
    if (typeof patch.is_active === 'boolean') row.is_active = patch.is_active
    if (patch.display_name !== undefined) row.display_name = patch.display_name as string | null
    if (typeof patch.password_hash === 'string') row.password_hash = patch.password_hash
    if (patch.promo_codes !== undefined) row.promo_codes = patch.promo_codes as string[]
    if (typeof patch.referral_depth === 'number') row.referral_depth = patch.referral_depth
    saveMemoryRows(rows)
    return { user: mapRow(row) }
  }

  const svc = getClient()
  if ('error' in svc) return svc

  let updated = await svc.client
    .from(ADMIN_USERS_TABLE)
    .update(patch)
    .eq('id', input.id)
    .select(USER_COLUMNS)
    .single()
  if (updated.error && scopeColumnsMissing(updated.error.message)) {
    updated = await svc.client
      .from(ADMIN_USERS_TABLE)
      .update(omitScopeColumns(patch))
      .eq('id', input.id)
      .select(USER_COLUMNS_LEGACY)
      .single() as typeof updated
  }

  if (updated.error) {
    if (tableMissing(updated.error.message)) return { error: TABLE_MISSING_HINT, status: 500 }
    return { error: updated.error.message, status: 500 }
  }
  await saveScopeOverlay(input.id, nextScope)
  return { user: await mergeScope({ ...mapRow(updated.data as AdminUserRow), ...nextScope }) }
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
    saveMemoryRows(rows)
    return { ok: true }
  }

  const svc = getClient()
  if ('error' in svc) return svc
  const { error } = await svc.client.from(ADMIN_USERS_TABLE).delete().eq('id', id)
  if (error) {
    if (tableMissing(error.message)) return { error: TABLE_MISSING_HINT, status: 500 }
    return { error: error.message, status: 500 }
  }
  try {
    await writeAdminConfigJson(scopeKey(id), { promoCodes: [], referralDepth: 1 })
  } catch {
    // overlay cleanup is best-effort
  }
  return { ok: true }
}
