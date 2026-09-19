import { createServiceClient } from '@/lib/supabase-server'

export type DemoSandbox = {
  id: string
  email: string | null
  locale: string | null
  status: string | null
  created_at: string
  expires_at: string | null
  converted_at: string | null
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
