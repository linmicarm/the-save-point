import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// soft decorative scatter — pure CSS, no images needed
const DOTS = [
  { top: '8%',  left: '6%',  size: 18, opacity: 0.18 },
  { top: '15%', left: '88%', size: 10, opacity: 0.12 },
  { top: '72%', left: '4%',  size: 12, opacity: 0.14 },
  { top: '82%', left: '92%', size: 20, opacity: 0.10 },
  { top: '40%', left: '96%', size: 8,  opacity: 0.12 },
  { top: '55%', left: '2%',  size: 14, opacity: 0.10 },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--sp-bg)' }}>

      {/* scattered decorative marks */}
      {DOTS.map((d, i) => (
        <span key={i} className="pointer-events-none select-none absolute"
          style={{ top: d.top, left: d.left, fontSize: d.size, opacity: d.opacity, color: '#c4b5fd' }}>
          ✦
        </span>
      ))}

      <div className="w-full max-w-sm relative z-10">

        {/* logo */}
        <div className="text-center mb-10">
          <p className="text-3xl mb-3" style={{ color: '#c4b5fd' }}>✦</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem',
            letterSpacing: '-0.03em', color: 'var(--sp-text)', lineHeight: 1.1 }}>
            The Save Point
          </h1>
          <p className="mt-2 text-base" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-muted)' }}>
            welcome back ♡
          </p>
        </div>

        {/* form card */}
        <form onSubmit={handleSubmit}
          className="rounded-3xl p-7 space-y-5"
          style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
            boxShadow: '0 4px 24px rgba(59,47,47,0.06), 0 1px 4px rgba(59,47,47,0.04)' }}>

          <div>
            <label className="block mb-1.5 text-[12px]"
              style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-muted)', fontSize: '0.85rem' }}>
              email
            </label>
            <input
              name="email" type="email"
              value={form.email} onChange={handleChange}
              placeholder="your@email.com" required
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none"
              style={{ background: 'var(--sp-surface-2)', border: '1px solid var(--sp-border)',
                color: 'var(--sp-text)' }}
            />
          </div>

          <div>
            <label className="block mb-1.5"
              style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-muted)', fontSize: '0.85rem' }}>
              password
            </label>
            <input
              name="password" type="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••" required
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none"
              style={{ background: 'var(--sp-surface-2)', border: '1px solid var(--sp-border)',
                color: 'var(--sp-text)' }}
            />
          </div>

          {error && <p className="text-xs text-rose-400 text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl text-white text-sm transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
              fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em',
              boxShadow: '0 2px 12px rgba(167,139,250,0.35)' }}>
            {loading ? 'signing in…' : 'sign in'}
          </button>
        </form>

        <div className="text-center mt-5 space-y-2">
          <p className="text-xs" style={{ color: 'var(--sp-text-faint)' }}>
            new here?{' '}
            <Link to="/register"
              className="underline underline-offset-2 transition-colors"
              style={{ color: 'var(--sp-text-muted)' }}>
              create an account
            </Link>
          </p>
          <p className="text-xs" style={{ color: 'var(--sp-text-faint)' }}>
            <Link to="/forgot-password"
              className="underline underline-offset-2 transition-colors"
              style={{ color: 'var(--sp-text-muted)' }}>
              forgot password?
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
