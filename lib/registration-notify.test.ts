import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRegistrationEmail,
  defaultRegistrationNotifyPrefs,
  recipientList,
  sanitizeRegistrationNotifyPrefs,
} from './registration-notify-prefs.ts'

test('sanitizeRegistrationNotifyPrefs keeps recipients and fields', () => {
  const prefs = sanitizeRegistrationNotifyPrefs({
    enabled: true,
    recipients: 'a@x.com, b@y.com',
    timeZone: 'Europe/Moscow',
    excludeDemo: false,
    fields: { ownerEmail: false, totalEstablishments: true },
  })
  assert.equal(prefs.enabled, true)
  assert.equal(prefs.timeZone, 'Europe/Moscow')
  assert.equal(prefs.excludeDemo, false)
  assert.equal(prefs.fields.ownerEmail, false)
  assert.equal(prefs.fields.ownerName, true)
  assert.equal(prefs.fields.totalEstablishments, true)
  assert.deepEqual(recipientList(prefs), ['a@x.com', 'b@y.com'])
})

test('buildRegistrationEmail includes selected fields and total', () => {
  const prefs = defaultRegistrationNotifyPrefs()
  prefs.fields.ip = false
  const mail = buildRegistrationEmail({
    prefs,
    est: {
      id: 'est-1',
      name: 'Test Kitchen',
      created_at: '2026-09-30T05:00:00.000Z',
      registration_ip: '1.2.3.4',
      registration_country: 'VN',
      registration_city: 'Da Nang',
      is_demo: false,
      owner_id: 'o1',
    },
    ownerName: 'Ivan',
    ownerEmail: 'ivan@example.com',
    totalEstablishments: 42,
  })
  assert.match(mail.subject, /Test Kitchen/)
  assert.match(mail.text, /Ivan/)
  assert.match(mail.text, /ivan@example.com/)
  assert.match(mail.text, /Da Nang/)
  assert.match(mail.text, /Всего заведений/)
  assert.match(mail.text, /42/)
  assert.equal(mail.text.includes('IP:'), false)
})
