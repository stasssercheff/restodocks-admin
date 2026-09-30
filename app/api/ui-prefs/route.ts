import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { defaultAdminUiPrefs, sanitizeAdminUiPrefs, type AdminUiPrefs } from '@/lib/admin-ui-prefs'
import { readUiPrefsForUser, writeUiPrefsForUser } from '@/lib/admin-ui-prefs-server'

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req)
  if ('response' in auth) return auth.response

  try {
    const stored = await readUiPrefsForUser(auth.user)
    if (!stored) {
      return NextResponse.json({ prefs: null, source: 'empty' as const })
    }
    return NextResponse.json({
      prefs: stored,
      source: 'kv' as const,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось прочитать настройки'
    return NextResponse.json({ error: message, prefs: defaultAdminUiPrefs() }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminRequest(req)
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as { prefs?: unknown }
  const prefs = sanitizeAdminUiPrefs(body.prefs)
  // Ensure a timestamp so newer devices win on sync.
  const withTime: AdminUiPrefs = {
    ...prefs,
    updatedAt: prefs.updatedAt && prefs.updatedAt > 0 ? prefs.updatedAt : Date.now(),
  }

  try {
    const saved = await writeUiPrefsForUser(auth.user, withTime)
    return NextResponse.json({ prefs: saved, source: 'kv' as const })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось сохранить в KV'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
