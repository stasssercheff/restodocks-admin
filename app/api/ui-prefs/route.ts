import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { readAdminConfigJson, writeAdminConfigJson } from '@/lib/admin-kv'
import { defaultAdminUiPrefs, sanitizeAdminUiPrefs, type AdminUiPrefs } from '@/lib/admin-ui-prefs'

function prefsKey(userId: string): string {
  return `ui_prefs:${userId}`
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req)
  if ('response' in auth) return auth.response

  try {
    const stored = await readAdminConfigJson<AdminUiPrefs>(prefsKey(auth.user.id))
    if (!stored) {
      return NextResponse.json({ prefs: null, source: 'empty' as const })
    }
    return NextResponse.json({
      prefs: sanitizeAdminUiPrefs(stored),
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

  try {
    await writeAdminConfigJson(prefsKey(auth.user.id), prefs)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось сохранить в KV'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ prefs, source: 'kv' as const })
}
