import { redirect } from 'next/navigation'
import { getAdminUser, type AdminUser } from '@/lib/admin-auth'

export async function requireAuth(): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) redirect('/login')
  return user
}
