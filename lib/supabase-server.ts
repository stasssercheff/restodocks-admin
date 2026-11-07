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

/** PostgREST puts `.in(...)` in the URL — too many UUIDs → HTTP 400 Bad Request. */
export function chunkIds<T>(items: T[], size = 120): T[][] {
  if (items.length === 0) return []
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function fetchAllRowsByIdChunks<T>(
  ids: string[],
  run: (
    idChunk: string[],
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  idChunkSize = 120,
  pageSize = 1000,
  hardCap = 50000,
): Promise<{ data: T[] } | { error: string }> {
  if (ids.length === 0) return { data: [] }
  const out: T[] = []
  for (const idChunk of chunkIds(ids, idChunkSize)) {
    const part = await fetchAllRows<T>((from, to) => run(idChunk, from, to), pageSize, hardCap)
    if ('error' in part) return part
    out.push(...part.data)
    if (out.length >= hardCap) break
  }
  return { data: out }
}

export async function selectByIdChunks<T, Id extends string | number = string>(
  ids: Id[],
  run: (idChunk: Id[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  idChunkSize = 120,
): Promise<{ data: T[] } | { error: string }> {
  if (ids.length === 0) return { data: [] }
  const out: T[] = []
  for (const idChunk of chunkIds(ids, idChunkSize)) {
    const { data, error } = await run(idChunk)
    if (error) return { error: error.message }
    out.push(...(data ?? []))
  }
  return { data: out }
}
