import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { readAdminConfig } from '@/lib/admin-kv'
import { createServiceClient, fetchAllRows, readEnv } from '@/lib/supabase-server'

type EmployeeRow = {
  id: string
  email: string | null
  roles: string[] | null
  is_active: boolean | null
  created_at: string | null
  establishment_id: string
}

type EstRow = {
  id: string
  subscription_type: string | null
  pro_paid_until: string | null
  owner_id: string | null
}

function isOwner(roles: string[] | null): boolean {
  return !!roles?.includes('owner')
}

function hasPaidLike(est: EstRow | undefined): boolean {
  if (!est) return false
  const type = (est.subscription_type ?? 'free').toLowerCase()
  if (type && type !== 'free') return true
  return !!(est.pro_paid_until && new Date(est.pro_paid_until).getTime() > Date.now())
}

async function matchingRecipients(params: {
  userKind: string
  subscriptionMode: string
  subscriptionTypes: string[]
  registeredFrom: string | null
  registeredTo: string | null
}): Promise<{ emails: string[] } | { error: string }> {
  const supabase = createServiceClient()
  if ('error' in supabase) return supabase

  const employeesRes = await fetchAllRows<EmployeeRow>((from, to) => {
    let query = supabase
      .from('employees')
      .select('id, email, roles, is_active, created_at, establishment_id')
      .eq('is_active', true)
      .not('email', 'is', null)
      .range(from, to)
    if (params.registeredFrom) query = query.gte('created_at', `${params.registeredFrom}T00:00:00.000Z`)
    if (params.registeredTo) query = query.lte('created_at', `${params.registeredTo}T23:59:59.999Z`)
    return query
  })
  if ('error' in employeesRes) return employeesRes

  let employees = employeesRes.data.filter(row => row.email && row.email.includes('@'))
  if (params.userKind === 'owners') employees = employees.filter(row => isOwner(row.roles))
  if (params.userKind === 'line') employees = employees.filter(row => !isOwner(row.roles))

  const estIds = [...new Set(employees.map(row => row.establishment_id))]
  const estRes = estIds.length
    ? await fetchAllRows<EstRow>((from, to) =>
        supabase.from('establishments').select('id, subscription_type, pro_paid_until, owner_id').in('id', estIds).range(from, to),
      )
    : { data: [] as EstRow[] }
  if ('error' in estRes) return estRes
  const estById = new Map(estRes.data.map(item => [item.id, item]))

  if (params.subscriptionMode === 'with_any_subscription') {
    employees = employees.filter(row => hasPaidLike(estById.get(row.establishment_id)))
  } else if (params.subscriptionMode === 'without_subscription') {
    employees = employees.filter(row => !hasPaidLike(estById.get(row.establishment_id)))
  } else if (params.subscriptionMode === 'with_specific_subscriptions' && params.subscriptionTypes.length) {
    const wanted = new Set(params.subscriptionTypes.map(item => item.toLowerCase()))
    employees = employees.filter(row => wanted.has((estById.get(row.establishment_id)?.subscription_type ?? '').toLowerCase()))
  }

  const emails = [...new Set(employees.map(row => row.email!.trim().toLowerCase()))]
  return { emails }
}

function filtersFrom(req: NextRequest, body?: Record<string, unknown>) {
  const url = req.nextUrl
  const userKind = String(body?.userKind ?? url.searchParams.get('userKind') ?? 'all')
  const subscriptionMode = String(body?.subscriptionMode ?? url.searchParams.get('subscriptionMode') ?? 'all')
  const typesRaw = body?.subscriptionTypes ?? url.searchParams.get('subscriptionTypes') ?? ''
  const subscriptionTypes = Array.isArray(typesRaw)
    ? typesRaw.map(item => String(item))
    : String(typesRaw).split(',').map(item => item.trim()).filter(Boolean)
  const registeredFrom = (body?.registeredFrom as string | null | undefined) ?? url.searchParams.get('registeredFrom')
  const registeredTo = (body?.registeredTo as string | null | undefined) ?? url.searchParams.get('registeredTo')
  return {
    userKind,
    subscriptionMode,
    subscriptionTypes,
    registeredFrom: registeredFrom || null,
    registeredTo: registeredTo || null,
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'broadcast')
  if ('response' in auth) return auth.response

  const result = await matchingRecipients(filtersFrom(req))
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ count: result.emails.length })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'broadcast')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!subject || !text) {
    return NextResponse.json({ error: 'Укажите тему и текст письма' }, { status: 400 })
  }

  const result = await matchingRecipients(filtersFrom(req, body))
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  const apiKey = await readAdminConfig('resend_api_key') || readEnv('RESEND_API_KEY')
  const fromEmail = await readAdminConfig('resend_from_email') || readEnv('RESEND_FROM_EMAIL') || 'Restodocks <info@restodocks.com>'
  if (!apiKey) {
    return NextResponse.json({
      error: 'Resend не настроен: в ADMIN_CONFIG нет ключа resend_api_key (или RESEND_API_KEY).',
      recipientCount: result.emails.length,
    }, { status: 503 })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const email of result.emails) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject,
          text,
        }),
      })
      if (res.ok) sent += 1
      else {
        failed += 1
        if (errors.length < 8) errors.push(`${email}: HTTP ${res.status}`)
      }
    } catch (err) {
      failed += 1
      if (errors.length < 8) errors.push(`${email}: ${err instanceof Error ? err.message : 'send_failed'}`)
    }
  }

  return NextResponse.json({
    sent,
    failed,
    recipientCount: result.emails.length,
    errors,
    message: `Отправлено: ${sent}${failed > 0 ? `, не доставлено (ошибки API): ${failed}` : ''}. В списке было: ${result.emails.length}.`,
  })
}
