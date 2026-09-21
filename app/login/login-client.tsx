'use client'

import { useState } from 'react'
import { LanguageSwitcher, useI18n } from '@/lib/i18n'

export default function LoginClient() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      window.location.href = '/'
    } else {
      setError(typeof data.error === 'string' ? data.error : t.login.invalid)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-white mb-1">Restodocks</div>
          <div className="text-gray-400 text-sm">{t.login.subtitle}</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <label className="block text-sm text-gray-400 mb-2">{t.login.email}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="stassser@gmail.com"
            autoComplete="username"
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition mb-4"
          />

          <label className="block text-sm text-gray-400 mb-2">{t.login.password}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition mb-4"
          />

          {error && (
            <div className="text-red-400 text-sm mb-4">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? t.login.checking : t.login.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
