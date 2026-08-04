import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    _supabase = createClient(url, key)
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type PromoGrantMode = 'until_date' | 'days'

export type PromoCode = {
  id: number
  code: string
  is_used: boolean
  used_by_establishment_id: string | null
  used_at: string | null
  created_at: string
  note: string | null
  starts_at: string | null
  expires_at: string | null
  max_employees: number | null
  /**
   * until_date — доступ до grant_until (как подписка), дни не нужны
   * days — ровно grant_days дней с момента активации
   */
  grant_mode: PromoGrantMode
  grant_until: string | null
  grant_days: number | null
  establishments?: { name: string } | null
}
