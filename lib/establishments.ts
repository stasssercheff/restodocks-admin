import { createClient } from '@supabase/supabase-js'

export type EstablishmentRow = {
  id: string
  name: string
  address: string | null
  created_at: string
  default_currency: string
  employee_count: number
  owner_name: string
  owner_email: string
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function listEstablishments(): Promise<
  { data: EstablishmentRow[] } | { error: string }
> {
  const supabase = getServiceClient()

  const { data: establishments, error } = await supabase
    .from('establishments')
    .select('id, name, address, created_at, default_currency, owner_id')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  if (!establishments) return { data: [] }

  const ids = establishments.map(e => e.id)
  const { data: employees } = ids.length
    ? await supabase
        .from('employees')
        .select('id, full_name, email, roles, establishment_id')
        .in('establishment_id', ids)
    : { data: [] as { id: string; full_name: string; email: string; roles: string[] | null; establishment_id: string }[] }

  const data = establishments.map(est => {
    const estEmployees = employees?.filter(e => e.establishment_id === est.id) ?? []
    const owner = estEmployees.find(e => e.roles?.includes('owner'))
    return {
      id: est.id,
      name: est.name,
      address: est.address,
      created_at: est.created_at,
      default_currency: est.default_currency,
      employee_count: estEmployees.length,
      owner_name: owner?.full_name ?? '—',
      owner_email: owner?.email ?? '—',
    }
  })

  return { data }
}
