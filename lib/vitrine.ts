import { createServiceClient } from '@/lib/supabase-server'

export type VitrineVisit = {
  id: number
  created_at: string
  event_type: string | null
  path: string | null
  language_code: string | null
  country_code: string | null
}

export type VitrineCampaign = {
  id: string
  slug: string
  name: string
  is_enabled: boolean
  placement: string | null
  audience: string | null
}

export async function getVitrineData(): Promise<
  { visits: VitrineVisit[]; campaigns: VitrineCampaign[] } | { error: string }
> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const [visitsRes, campaignsRes] = await Promise.all([
    supabase
      .from('marketing_visits')
      .select('id, created_at, event_type, path, language_code, country_code')
      .or('path.ilike.%/promo%,path.ilike.%/demo%')
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('app_popup_campaigns')
      .select('id, slug, name, is_enabled, placement, audience')
      .or('placement.eq.promo_landing,slug.ilike.%promo%,slug.ilike.%welcome%')
      .order('updated_at', { ascending: false })
      .limit(40),
  ])

  if (visitsRes.error) return { error: visitsRes.error.message }
  if (campaignsRes.error) return { error: campaignsRes.error.message }

  return {
    visits: (visitsRes.data ?? []) as VitrineVisit[],
    campaigns: (campaignsRes.data ?? []) as VitrineCampaign[],
  }
}
