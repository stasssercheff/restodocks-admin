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
  return createClient(config.url, config.key)
}
