import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Dynamic lookup so Next does not inline empty NEXT_PUBLIC_* at build time. */
export function readEnv(name: string): string | undefined {
  const value = process.env[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getSupabaseServiceConfig():
  | { url: string; key: string }
  | { error: string } {
  const url = readEnv('SUPABASE_URL') || readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (!url) {
    return {
      error:
        'Не задан SUPABASE_URL (или NEXT_PUBLIC_SUPABASE_URL) в секретах Cloudflare Worker',
    }
  }
  if (!key) {
    return {
      error: 'Не задан SUPABASE_SERVICE_ROLE_KEY в секретах Cloudflare Worker',
    }
  }
  return { url, key }
}

export function createServiceClient(): SupabaseClient | { error: string } {
  const config = getSupabaseServiceConfig()
  if ('error' in config) return config
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function fetchAllRows<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
  hardCap = 20000,
): Promise<{ data: T[] } | { error: string }> {
  const out: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await run(from, from + pageSize - 1)
    if (error) return { error: error.message }
    const chunk = data ?? []
    out.push(...chunk)
    if (chunk.length < pageSize || out.length >= hardCap) break
    from += pageSize
  }
  return { data: out }
}
