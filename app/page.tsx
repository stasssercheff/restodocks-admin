import { requireAuth } from './auth-guard'
import AdminClient from './admin-client'
import { listEstablishments, type EstablishmentRow } from '@/lib/establishments'
import { canAccessPage } from '@/lib/admin-pages'
import { publicAdminUser } from '@/lib/admin-auth'

export default async function Page() {
  const user = await requireAuth()

  let initialEstablishments: EstablishmentRow[] = []
  let establishmentsError: string | null = null

  if (canAccessPage(user, 'establishments')) {
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
  }

  return (
    <AdminClient
      user={publicAdminUser(user)}
      initialEstablishments={initialEstablishments}
      establishmentsError={establishmentsError}
    />
  )
}
