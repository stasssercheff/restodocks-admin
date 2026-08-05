import { redirect } from 'next/navigation'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'

export async function requireAuth() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login')
  }
}
