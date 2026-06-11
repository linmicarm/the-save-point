import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
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
          <p className="text-sm mt-1" style={{ color: 'var(--sp-text-muted)' }}>reset your password</p>
        </div>

        {sent ? (
          <div
            className="border rounded-2xl p-6 shadow-sm text-center space-y-3"
            style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
          >
            <p className="text-2xl">📬</p>
            <p className="text-sm font-medium" style={{ color: 'var(--sp-text)' }}>check your email</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--sp-text-muted)' }}>
              if an account exists for <span className="font-medium">{email}</span>, we sent a password reset link.
            </p>
            <p className="text-xs" style={{ color: 'var(--sp-text-faint)' }}>
              didn't get it? check your spam folder.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="border rounded-2xl p-6 shadow-sm space-y-4"
            style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--sp-text-muted)' }}>
              enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--sp-text-muted)' }}
              >
                email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
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

            {error && (
              <p className="text-xs text-rose-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#c4b5fd' }}
            >
              {loading ? 'sending…' : 'send reset link'}
            </button>
          </form>
        )}

        <p className="text-center text-xs mt-4" style={{ color: 'var(--sp-text-faint)' }}>
          remembered it?{' '}
          <Link
            to="/login"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: 'var(--sp-text-muted)' }}
          >
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
