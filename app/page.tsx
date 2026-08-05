import { requireAuth } from './auth-guard'
import AdminClient from './admin-client'
import { listEstablishments, type EstablishmentRow } from '@/lib/establishments'

export default async function Page() {
  await requireAuth()

  let initialEstablishments: EstablishmentRow[] = []
  let establishmentsError: string | null = null

  try {
    const result = await listEstablishments()
    if ('data' in result) {
      initialEstablishments = result.data
    } else {
      establishmentsError = result.error
    }
  } catch (err) {
    establishmentsError = err instanceof Error ? err.message : 'Ошибка загрузки'
  }

  return (
    <AdminClient
      initialEstablishments={initialEstablishments}
      establishmentsError={establishmentsError}
    />
  )
}
