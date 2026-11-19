import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin-auth'
import { readAdminConfig } from '@/lib/admin-kv'
import {
  matchingBroadcastRecipients,
  parseBroadcastFilters,
  searchBroadcastUsers,
  type BroadcastRecipient,
} from '@/lib/broadcast-recipients'
import { createServiceClient, readEnv } from '@/lib/supabase-server'

const INBOX_CHUNK = 400

function filtersFrom(req: NextRequest, body?: Record<string, unknown>) {
  const url = req.nextUrl
  const statusesParam = body?.statuses ?? body?.subscriptionStatuses ?? url.searchParams.get('statuses')
  const typesParam = body?.subscriptionTypes ?? url.searchParams.get('subscriptionTypes')
  return parseBroadcastFilters({
    userKind: body?.userKind ?? url.searchParams.get('userKind'),
    statuses: statusesParam,
    subscriptionMode: body?.subscriptionMode ?? url.searchParams.get('subscriptionMode'),
    subscriptionTypes: typesParam,
    registeredFrom: body?.registeredFrom ?? url.searchParams.get('registeredFrom'),
    registeredTo: body?.registeredTo ?? url.searchParams.get('registeredTo'),
    excludeDemo: body?.excludeDemo ?? url.searchParams.get('excludeDemo'),
    employeeId: body?.employeeId ?? url.searchParams.get('employeeId'),
  })
}

function channelsFrom(body?: Record<string, unknown>, url?: URL) {
  const inboxRaw = body?.channelInbox ?? url?.searchParams.get('channelInbox')
  const emailRaw = body?.channelEmail ?? url?.searchParams.get('channelEmail')
  // Defaults: inbox on, email off (new primary channel is in-app system DM).
  const channelInbox = inboxRaw === undefined || inboxRaw === null || inboxRaw === ''
    ? true
    : inboxRaw === true || inboxRaw === '1' || inboxRaw === 'true'
  const channelEmail = emailRaw === true || emailRaw === '1' || emailRaw === 'true'
  return { channelInbox, channelEmail }
}

function inboxContent(subject: string, body: string): string {
  const s = subject.trim()
  const b = body.trim()
  if (s && b) return `${s}\n\n${b}`
  return s || b
}

async function sendSystemInbox(
  recipients: BroadcastRecipient[],
  content: string,
): Promise<{ inserted: number; error?: string }> {
  const supabase = createServiceClient()
  if ('error' in supabase) return { inserted: 0, error: supabase.error }

  let inserted = 0
  const ids = recipients.map(r => r.employeeId)
  for (let i = 0; i < ids.length; i += INBOX_CHUNK) {
    const chunk = ids.slice(i, i + INBOX_CHUNK)
    const { data, error } = await supabase.rpc('admin_broadcast_system_dm', {
      p_employee_ids: chunk,
      p_content: content,
      p_links: [],
    })
    if (error) {
      return { inserted, error: error.message }
    }
    const n = Number((data as { inserted?: number } | null)?.inserted) || 0
    inserted += n
  }
  return { inserted }
}

async function sendEmails(
  recipients: BroadcastRecipient[],
  subject: string,
  text: string,
): Promise<{ sent: number; failed: number; skippedNoEmail: number; errors: string[] }> {
  const withEmail = recipients.filter(r => r.email)
  const skippedNoEmail = recipients.length - withEmail.length
  const uniqueEmails = [...new Set(withEmail.map(r => r.email!))]

  const apiKey = await readAdminConfig('resend_api_key') || readEnv('RESEND_API_KEY')
  const fromEmail = await readAdminConfig('resend_from_email') || readEnv('RESEND_FROM_EMAIL') || 'Restodocks <info@restodocks.com>'
  if (!apiKey) {
    return {
      sent: 0,
      failed: uniqueEmails.length,
      skippedNoEmail,
      errors: ['Resend не настроен: нет resend_api_key / RESEND_API_KEY'],
    }
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const email of uniqueEmails) {
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
  return { sent, failed, skippedNoEmail, errors }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'broadcast')
  if ('response' in auth) return auth.response

  const mode = req.nextUrl.searchParams.get('mode')
  if (mode === 'search') {
    const q = req.nextUrl.searchParams.get('q') ?? ''
    const result = await searchBroadcastUsers(q, { limit: 30, excludeDemo: true })
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ users: result.users })
  }

  const filters = filtersFrom(req)
  const result = await matchingBroadcastRecipients(filters)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  const withEmail = result.recipients.filter(r => r.email).length
  const PREVIEW_CAP = 200
  const recipients = result.recipients.slice(0, PREVIEW_CAP).map(r => ({
    employeeId: r.employeeId,
    fullName: r.fullName ?? null,
    email: r.email,
    establishmentId: r.establishmentId,
    establishmentName: r.establishmentName ?? null,
    isOwner: r.isOwner,
  }))
  return NextResponse.json({
    count: result.recipients.length,
    withEmail,
    owners: result.recipients.filter(r => r.isOwner).length,
    recipients,
    recipientsTruncated: result.recipients.length > PREVIEW_CAP,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminRequest(req, 'broadcast')
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const { channelInbox, channelEmail } = channelsFrom(body)

  if (!channelInbox && !channelEmail) {
    return NextResponse.json({ error: 'Выберите канал: сообщения в аккаунт и/или email' }, { status: 400 })
  }
  if (!text) {
    return NextResponse.json({ error: 'Укажите текст сообщения' }, { status: 400 })
  }
  if (channelEmail && !subject) {
    return NextResponse.json({ error: 'Для email укажите тему письма' }, { status: 400 })
  }

  const filters = filtersFrom(req, body)
  if (filters.subscriptionTypes.length > 0 && filters.statuses.length === 0) {
    // types alone are fine (OR branch)
  }

  const result = await matchingBroadcastRecipients(filters)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

  const recipients = result.recipients
  if (filters.employeeId && recipients.length === 0) {
    return NextResponse.json({ error: 'Пользователь не найден или недоступен (демо / неактивен)' }, { status: 404 })
  }
  let inboxInserted = 0
  let inboxError: string | undefined
  let emailSent = 0
  let emailFailed = 0
  let emailSkipped = 0
  let emailErrors: string[] = []

  if (channelInbox) {
    const inbox = await sendSystemInbox(recipients, inboxContent(subject, text))
    inboxInserted = inbox.inserted
    inboxError = inbox.error
  }

  if (channelEmail) {
    const mail = await sendEmails(recipients, subject || 'Restodocks', text)
    emailSent = mail.sent
    emailFailed = mail.failed
    emailSkipped = mail.skippedNoEmail
    emailErrors = mail.errors
  }

  const parts: string[] = []
  if (channelInbox) {
    parts.push(inboxError
      ? `Входящие: ошибка после ${inboxInserted} (${inboxError})`
      : `Входящие (системные): ${inboxInserted}`)
  }
  if (channelEmail) {
    parts.push(`Email: отправлено ${emailSent}${emailFailed ? `, ошибок ${emailFailed}` : ''}${emailSkipped ? `, без email ${emailSkipped}` : ''}`)
  }

  const status = inboxError && inboxInserted === 0 && emailSent === 0 ? 500 : 200
  return NextResponse.json({
    recipientCount: recipients.length,
    inboxInserted,
    inboxError: inboxError ?? null,
    emailSent,
    emailFailed,
    emailSkippedNoEmail: emailSkipped,
    errors: emailErrors,
    message: `${parts.join('. ')}. Получателей в фильтре: ${recipients.length}.`,
  }, { status })
}
