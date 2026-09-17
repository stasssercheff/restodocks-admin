import { requireAuth } from './auth-guard'
import AdminClient from './admin-client'
import { publicAdminUser } from '@/lib/admin-auth'

export default async function Page() {
  const user = await requireAuth()
  return <AdminClient user={publicAdminUser(user)} />
}
