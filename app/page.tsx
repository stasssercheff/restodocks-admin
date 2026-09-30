import { requireAuth } from './auth-guard'
import AdminClient from './admin-client'
import { publicAdminUser } from '@/lib/admin-auth'
import { readUiPrefsForUser } from '@/lib/admin-ui-prefs-server'

export default async function Page() {
  const user = await requireAuth()
  // Load tab layout from KV on the server so mobile gets PC order on first paint
  // (no dependency on a follow-up client /api/ui-prefs round-trip).
  let initialUiPrefs = null
  try {
    initialUiPrefs = await readUiPrefsForUser(user)
  } catch {
    initialUiPrefs = null
  }
  return <AdminClient user={publicAdminUser(user)} initialUiPrefs={initialUiPrefs} />
}
