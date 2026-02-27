import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type PromoCode = {
  id: number
  code: string
  is_used: boolean
  used_by_establishment_id: string | null
  used_at: string | null
  created_at: string
  note: string | null
  expires_at: string | null
  establishments?: { name: string } | null
}
