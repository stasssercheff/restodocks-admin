import { normalizeDemoEmail, normalizeDemoSandboxId } from '@/lib/demo-id'
import { deleteEstablishment } from '@/lib/establishments'
import { createServiceClient, getSupabaseServiceConfig } from '@/lib/supabase-server'

export type DemoSandbox = {
  id: string
  email: string | null
  locale: string | null
  status: string | null
  created_at: string
  expires_at: string | null
  converted_at: string | null
}

type DemoSandboxRow = {
  id: string
  email: string | null
  auth_user_id: string | null
  establishment_id: string | null
}

export async function listDemoSandboxes(): Promise<
  { data: DemoSandbox[] } | { error: string }
> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const { data, error } = await supabase
    .from('demo_sandboxes')
    .select('id, email, locale, status, created_at, expires_at, converted_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return { error: error.message }
  return { data: (data ?? []) as DemoSandbox[] }
}

export type ResetDemoResult =
  | {
      ok: true
      email: string
      deletedSandboxIds: string[]
      deletedAuthUserIds: string[]
      deletedEstablishmentIds: string[]
    }
  | { error: string; code?: string }

async function deleteDemoEstablishment(
  establishmentId: string | null | undefined,
): Promise<{ id: string } | { error: string; code?: string } | null> {
  if (!establishmentId?.trim()) return null
  const id = establishmentId.trim()
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const { data: est } = await supabase
    .from('establishments')
    .select('id, is_demo')
    .eq('id', id)
    .maybeSingle()

  if (!est?.is_demo) return null

  const estDelete = await deleteEstablishment(id)
  if ('error' in estDelete) {
    return { error: estDelete.error, code: estDelete.code }
  }
  return { id }
}

function isDemoAuthUser(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): boolean {
  const meta = user.user_metadata ?? {}
  return meta.demo_sandbox === true
}

/** Only demo auth users (user_metadata.demo_sandbox), never real accounts. */
async function findDemoAuthUserIdsByEmail(email: string): Promise<
  { ids: string[] } | { error: string; code?: string }
> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const ids = new Set<string>()

  // Fast path: GoTrue email filter (supported on current Supabase Auth).
  const config = getSupabaseServiceConfig()
  if (!('error' in config)) {
    const url = new URL(`${config.url.replace(/\/$/, '')}/auth/v1/admin/users`)
    url.searchParams.set('email', email)
    url.searchParams.set('per_page', '50')
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: config.key,
      },
    })
    if (res.ok) {
      const json = await res.json().catch(() => ({})) as {
        users?: { id?: string; email?: string; user_metadata?: Record<string, unknown> }[]
      }
      for (const user of json.users ?? []) {
        const userEmail = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
        if (userEmail === email && typeof user.id === 'string' && isDemoAuthUser(user)) {
          ids.add(user.id)
        }
      }
    }
  }

  if (ids.size > 0) return { ids: [...ids] }

  // Fallback: paginate admin listUsers and match demo users by email.
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      return { error: error.message, code: error.status ? String(error.status) : undefined }
    }
    const users = data?.users ?? []
    for (const user of users) {
      const userEmail = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
      if (userEmail === email && typeof user.id === 'string' && isDemoAuthUser(user)) {
        ids.add(user.id)
      }
    }
    if (users.length < 200) break
  }

  return { ids: [...ids] }
}

async function deleteAuthUsers(ids: string[]): Promise<
  { deleted: string[] } | { error: string; code?: string }
> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const deleted: string[] = []
  for (const id of ids) {
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) {
      // Already gone is fine for re-test cleanup.
      if (/not\s*found|user\s*not\s*found/i.test(error.message)) continue
      return { error: error.message, code: error.status ? String(error.status) : undefined }
    }
    deleted.push(id)
  }
  return { deleted }
}

/**
 * Full cleanup so the same email can call /demo again.
 * create-demo-sandbox returns 410 demo_period_expired when an old demo auth user /
 * expired sandbox still exists — deleting only the admin table row is not enough.
 */
export async function resetDemoByEmail(emailRaw: string): Promise<ResetDemoResult> {
  const email = normalizeDemoEmail(emailRaw)
  if (!email) return { error: 'Укажите корректную почту' }

  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const { data: rows, error: fetchError } = await supabase
    .from('demo_sandboxes')
    .select('id, email, auth_user_id, establishment_id')
    .eq('email', email)

  if (fetchError) return { error: fetchError.message, code: fetchError.code }

  const sandboxes = (rows ?? []) as DemoSandboxRow[]
  const authIds = new Set<string>()
  const establishmentIds = new Set<string>()

  for (const row of sandboxes) {
    if (row.auth_user_id?.trim()) authIds.add(row.auth_user_id.trim())
    if (row.establishment_id?.trim()) establishmentIds.add(row.establishment_id.trim())
  }

  const authLookup = await findDemoAuthUserIdsByEmail(email)
  if ('error' in authLookup) {
    // Don't hard-fail if Admin Users API shape differs; sandbox rows still get removed.
    console.warn('[resetDemoByEmail] auth lookup:', authLookup.error)
  } else {
    for (const id of authLookup.ids) authIds.add(id)
  }

  // If sandbox pointed at an auth user, only delete it when it is a demo user.
  if (authIds.size > 0) {
    const verified = new Set<string>()
    for (const id of authIds) {
      const { data, error } = await supabase.auth.admin.getUserById(id)
      if (error || !data?.user) continue
      if (isDemoAuthUser(data.user)) verified.add(id)
    }
    authIds.clear()
    for (const id of verified) authIds.add(id)
  }

  const deletedEstablishmentIds: string[] = []
  for (const establishmentId of establishmentIds) {
    const removed = await deleteDemoEstablishment(establishmentId)
    if (removed && 'error' in removed) {
      return {
        error: `Не удалось удалить демо-кухню ${establishmentId}: ${removed.error}`,
        code: removed.code,
      }
    }
    if (removed && 'id' in removed) deletedEstablishmentIds.push(removed.id)
  }

  const deletedSandboxIds: string[] = []
  if (sandboxes.length > 0) {
    const ids = sandboxes.map(row => row.id)
    const { error: deleteError } = await supabase
      .from('demo_sandboxes')
      .delete()
      .in('id', ids)
    if (deleteError) return { error: deleteError.message, code: deleteError.code }
    deletedSandboxIds.push(...ids)
  }

  const authDelete = await deleteAuthUsers([...authIds])
  if ('error' in authDelete) {
    return {
      error: `Песочницы очищены, но auth-пользователя демо не удалось удалить: ${authDelete.error}`,
      code: authDelete.code,
    }
  }

  if (
    deletedSandboxIds.length === 0
    && authDelete.deleted.length === 0
    && deletedEstablishmentIds.length === 0
  ) {
    return {
      error: `По почте ${email} демо-записей не найдено (ни песочницы, ни demo auth). Если /demo всё ещё даёт 410 — напишите, разберём create-demo-sandbox.`,
    }
  }

  return {
    ok: true,
    email,
    deletedSandboxIds,
    deletedAuthUserIds: authDelete.deleted,
    deletedEstablishmentIds,
  }
}

/** Removes one sandbox row + linked demo kitchen + demo auth user. */
export async function deleteDemoSandbox(id: string): Promise<ResetDemoResult> {
  const trimmed = normalizeDemoSandboxId(id)
  if (!trimmed) return { error: 'id обязателен' }

  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const { data: row, error: fetchError } = await supabase
    .from('demo_sandboxes')
    .select('id, email, auth_user_id, establishment_id')
    .eq('id', trimmed)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message, code: fetchError.code }
  if (!row) return { error: 'Песочница не найдена' }

  const email = normalizeDemoEmail(row.email) || (typeof row.email === 'string' ? row.email : '')
  if (email) {
    // Prefer full email reset so orphaned auth users are cleared too.
    return resetDemoByEmail(email)
  }

  const establishmentRemove = await deleteDemoEstablishment(row.establishment_id)
  if (establishmentRemove && 'error' in establishmentRemove) {
    return {
      error: `Не удалось убрать демо-кухню: ${establishmentRemove.error}`,
      code: establishmentRemove.code,
    }
  }

  const { error: deleteError } = await supabase
    .from('demo_sandboxes')
    .delete()
    .eq('id', trimmed)
  if (deleteError) return { error: deleteError.message, code: deleteError.code }

  const authIds = row.auth_user_id?.trim() ? [row.auth_user_id.trim()] : []
  const authDelete = await deleteAuthUsers(authIds)
  if ('error' in authDelete) {
    return {
      error: `Песочница удалена, но auth-пользователя не удалось убрать: ${authDelete.error}`,
      code: authDelete.code,
    }
  }

  return {
    ok: true,
    email: typeof row.email === 'string' ? row.email : '',
    deletedSandboxIds: [trimmed],
    deletedAuthUserIds: authDelete.deleted,
    deletedEstablishmentIds:
      establishmentRemove && 'id' in establishmentRemove ? [establishmentRemove.id] : [],
  }
}
