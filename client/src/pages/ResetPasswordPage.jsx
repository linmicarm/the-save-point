import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--sp-bg)' }}>
        <div className="w-full max-w-sm text-center">
          <p className="text-2xl mb-3" style={{ color: '#c4b5fd' }}>✦</p>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--sp-text)' }}>invalid reset link</p>
          <p className="text-xs mb-5" style={{ color: 'var(--sp-text-muted)' }}>
            this link is missing a token. please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="text-xs underline underline-offset-2 hover:opacity-80"
            style={{ color: 'var(--sp-text-muted)' }}
          >
            request a new link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error || 'this link may have expired. please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--sp-bg)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <p className="text-2xl mb-1" style={{ color: '#c4b5fd' }}>✦</p>
          <h1
            className="text-2xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text)' }}
          >
            The Save Point
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sp-text-muted)' }}>choose a new password</p>
        </div>

        {done ? (
          <div
            className="border rounded-2xl p-6 shadow-sm text-center space-y-3"
            style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
          >
            <p className="text-2xl">✅</p>
            <p className="text-sm font-medium" style={{ color: 'var(--sp-text)' }}>password updated!</p>
            <p className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>
              your password has been changed successfully.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: '#c4b5fd' }}
            >
              sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="border rounded-2xl p-6 shadow-sm space-y-4"
            style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
          >
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--sp-text-muted)' }}
              >
                new password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="at least 8 characters"
                required
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors placeholder-[#c4b8d9]"
                style={{
                  background: 'var(--sp-bg)',
                  borderColor: 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--sp-text-muted)' }}
              >
                confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors placeholder-[#c4b8d9]"
                style={{
                  background: 'var(--sp-bg)',
                  borderColor: 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#c4b5fd' }}
            >
              {loading ? 'updating…' : 'update password'}
            </button>
          </form>
        )}

        <p className="text-center text-xs mt-4" style={{ color: 'var(--sp-text-faint)' }}>
          <Link
            to="/login"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: 'var(--sp-text-muted)' }}
          >
            back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
