import type { PublicAdminUser } from '@/lib/admin-pages'
import type { AdminUiPrefs } from '@/lib/admin-ui-prefs'

type Props = {
  user: PublicAdminUser
  initialUiPrefs?: AdminUiPrefs | null
}

export default function AdminClient(props: Props): JSX.Element
