import { requireAuth } from './auth-guard'
import AdminClient from './admin-client'
import { listEstablishments } from '@/lib/establishments'

export default async function Page() {
  await requireAuth()
  const result = await listEstablishments()
  const initialEstablishments = 'data' in result ? result.data : []
  const establishmentsError = 'error' in result ? result.error : null
  return (
    <AdminClient
      initialEstablishments={initialEstablishments}
      establishmentsError={establishmentsError}
    />
  )
}
