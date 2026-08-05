import { redirect } from 'next/navigation'
import { isAuthenticatedAdmin } from '@/lib/admin-auth'
import LoginClient from './login-client'

export default async function LoginPage() {
  if (await isAuthenticatedAdmin()) redirect('/')
  return <LoginClient />
}
