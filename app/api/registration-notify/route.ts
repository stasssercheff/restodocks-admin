import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import {
  armRegistrationNotifyWatermark,
  checkAndSendRegistrationNotify,
  readRegistrationNotifyPrefs,
  recipientList,
  sanitizeRegistrationNotifyPrefs,
  writeRegistrationNotifyPrefs,
} from '@/lib/registration-notify'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req)
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец' }, { status: 403 })
  }

  const prefs = await readRegistrationNotifyPrefs()
  return NextResponse.json({
    prefs,
    recipients: recipientList(prefs),
  })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminRequest(req)
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as { prefs?: unknown; armWatermark?: boolean }
  const prev = await readRegistrationNotifyPrefs()
  const next = sanitizeRegistrationNotifyPrefs(body.prefs)
  const turningOn = !prev.enabled && next.enabled

  try {
    const saved = await writeRegistrationNotifyPrefs(next)
    let watermarkIso: string | null = null
    // When enabling, skip backlog so only future establishments trigger mail.
    if (turningOn || body.armWatermark === true) {
      watermarkIso = await armRegistrationNotifyWatermark()
    }
    return NextResponse.json({
      prefs: saved,
      recipients: recipientList(saved),
      watermarkIso,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось сохранить'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Manual / periodic check from the admin shell. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req)
  if ('response' in auth) return auth.response
  if (!auth.user.isOwner) {
    return NextResponse.json({ error: 'Только владелец' }, { status: 403 })
  }

  try {
    const result = await checkAndSendRegistrationNotify()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка проверки'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
