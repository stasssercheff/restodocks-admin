import { getCloudflareContext } from '@opennextjs/cloudflare'
import { readEnv } from '@/lib/supabase-server'

type AdminKv = {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

async function adminConfigNamespace(): Promise<AdminKv | null> {
  try {
    const ctx = await getCloudflareContext({ async: true })
    return ctx.env.ADMIN_CONFIG ?? null
  } catch {
    return null
  }
}

export async function readAdminConfig(key: string): Promise<string | undefined> {
  const kv = await adminConfigNamespace()
  if (kv) {
    const value = await kv.get(key)
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return readEnv(key.toUpperCase())
}

export async function readAdminConfigJson<T>(key: string): Promise<T | null> {
  const raw = await readAdminConfig(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function writeAdminConfig(key: string, value: string): Promise<void> {
  const kv = await adminConfigNamespace()
  if (!kv) {
    throw new Error('ADMIN_CONFIG KV namespace is not bound')
  }
  await kv.put(key, value)
}

export async function writeAdminConfigJson(key: string, value: unknown): Promise<void> {
  await writeAdminConfig(key, JSON.stringify(value))
}
