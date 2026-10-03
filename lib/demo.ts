import { normalizeDemoSandboxId } from '@/lib/demo-id'
import { deleteEstablishment } from '@/lib/establishments'
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

export type DeleteDemoSandboxResult =
  | { ok: true; email: string | null; deletedEstablishmentId: string | null }
  | { error: string; code?: string }

/** Removes a demo sandbox row so the same email can request demo again. Also drops a linked is_demo kitchen when present. */
export async function deleteDemoSandbox(id: string): Promise<DeleteDemoSandboxResult> {
  const trimmed = normalizeDemoSandboxId(id)
  if (!trimmed) return { error: 'id обязателен' }

  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const { data: row, error: fetchError } = await supabase
    .from('demo_sandboxes')
    .select('id, email, establishment_id')
    .eq('id', trimmed)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message, code: fetchError.code }
  if (!row) return { error: 'Песочница не найдена' }

  const establishmentId =
    typeof row.establishment_id === 'string' && row.establishment_id.trim()
      ? row.establishment_id.trim()
      : null

  const { error: deleteError } = await supabase
    .from('demo_sandboxes')
    .delete()
    .eq('id', trimmed)

  if (deleteError) return { error: deleteError.message, code: deleteError.code }

  let deletedEstablishmentId: string | null = null
  if (establishmentId) {
    const { data: est } = await supabase
      .from('establishments')
      .select('id, is_demo')
      .eq('id', establishmentId)
      .maybeSingle()

    if (est?.is_demo) {
      const estDelete = await deleteEstablishment(establishmentId)
      if ('error' in estDelete) {
        return {
          error: `Песочница удалена, но демо-кухню не удалось убрать: ${estDelete.error}`,
          code: estDelete.code,
        }
      }
      deletedEstablishmentId = establishmentId
    }
  }

  return {
    ok: true,
    email: typeof row.email === 'string' ? row.email : null,
    deletedEstablishmentId,
  }
}
