import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import OnboardingModal from '../components/OnboardingModal'

const DOTS = [
  { top: '6%',  left: '8%',  size: 14, opacity: 0.16 },
  { top: '12%', left: '90%', size: 10, opacity: 0.12 },
  { top: '78%', left: '5%',  size: 18, opacity: 0.12 },
  { top: '85%', left: '91%', size: 12, opacity: 0.10 },
  { top: '50%', left: '97%', size: 8,  opacity: 0.12 },
  { top: '60%', left: '1%',  size: 10, opacity: 0.10 },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm]                   = useState({ email: '', username: '', displayName: '', password: '' })
  const [usernameStatus, setUsernameStatus] = useState(null) // 'available' | 'taken' | 'checking'
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (e.target.name === 'username') checkUsername(e.target.value)
  }

  const checkUsername = async (value) => {
    if (value.length < 3) return setUsernameStatus(null)
    setUsernameStatus('checking')
    try {
      const res = await axios.get(`/api/auth/check-username/${value}`)
      setUsernameStatus(res.data.available ? 'available' : 'taken')
    } catch {
      setUsernameStatus(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (usernameStatus === 'taken') return
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.username, form.password, form.displayName)
      setShowOnboarding(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none"
  const inputStyle = { background: 'var(--sp-surface-2)', border: '1px solid var(--sp-border)', color: 'var(--sp-text)' }
  const labelStyle = { fontFamily: 'var(--font-hand)', color: 'var(--sp-text-muted)', fontSize: '0.85rem' }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'var(--sp-bg)' }}>

      {showOnboarding && (
        <OnboardingModal onClose={() => { setShowOnboarding(false); navigate('/home') }} />
      )}

      {/* decorative marks */}
      {DOTS.map((d, i) => (
        <span key={i} className="pointer-events-none select-none absolute"
          style={{ top: d.top, left: d.left, fontSize: d.size, opacity: d.opacity, color: '#c4b5fd' }}>
          ✦
        </span>
      ))}

      <div className="w-full max-w-sm relative z-10">

        {/* logo */}
        <div className="text-center mb-8">
          <p className="text-3xl mb-3" style={{ color: '#c4b5fd' }}>✦</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem',
            letterSpacing: '-0.03em', color: 'var(--sp-text)', lineHeight: 1.1 }}>
            The Save Point
          </h1>
          <p className="mt-2 text-base" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-muted)' }}>
            create your cozy corner ✨
          </p>
        </div>

        {/* form card */}
        <form onSubmit={handleSubmit}
          className="rounded-3xl p-7 space-y-4"
          style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
            boxShadow: '0 4px 24px rgba(59,47,47,0.06), 0 1px 4px rgba(59,47,47,0.04)' }}>

          <div>
            <label className="block mb-1.5" style={labelStyle}>display name</label>
            <input
              name="displayName" value={form.displayName} onChange={handleChange}
              placeholder="how you'll appear to others"
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>username</label>
            <div className="relative">
              <input
                name="username" value={form.username} onChange={handleChange}
                placeholder="your unique handle" required
                className={inputClass} style={inputStyle}
              />
              {usernameStatus && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs`}
                  style={{
                    fontFamily: 'var(--font-hand)',
                    color: usernameStatus === 'available' ? '#6dbb8a'
                         : usernameStatus === 'taken'     ? '#f87171'
                         : 'var(--sp-text-faint)',
                  }}>
                  {usernameStatus === 'available' ? '✓ available'
                 : usernameStatus === 'taken'     ? '✗ taken'
                 : 'checking…'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>email</label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="your@email.com" required
              className={inputClass} style={inputStyle}
            />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>password</label>
            <input
              name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="at least 8 characters" required minLength={8}
              className={inputClass} style={inputStyle}
            />
          </div>

          {error && <p className="text-xs text-rose-400 text-center">{error}</p>}

          <button type="submit"
            disabled={loading || usernameStatus === 'taken'}
            className="w-full py-3 rounded-2xl text-white text-sm transition-opacity disabled:opacity-50 mt-1"
            style={{ background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
              fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em',
              boxShadow: '0 2px 12px rgba(167,139,250,0.35)' }}>
            {loading ? 'creating your space…' : 'create account'}
          </button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--sp-text-faint)' }}>
          already have an account?{' '}
          <Link to="/login"
            className="underline underline-offset-2"
            style={{ color: 'var(--sp-text-muted)' }}>
            sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
