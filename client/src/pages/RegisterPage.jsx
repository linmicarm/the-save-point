import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import OnboardingModal from '../components/OnboardingModal'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [usernameStatus, setUsernameStatus] = useState(null) // 'available' | 'taken' | 'checking'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      {showOnboarding && <OnboardingModal onClose={() => { setShowOnboarding(false); navigate('/home') }} />}
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <p className="text-2xl mb-1" style={{ color: '#c4b5fd' }}>✦</p>
          <h1 className="text-2xl font-medium text-[#2d2a35] tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>The Save Point</h1>
          <p className="text-sm text-[#a89bc2] mt-1">create your cozy corner</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#ede9f5] rounded-2xl p-6 shadow-sm space-y-4">

          <div>
            <label className="block text-xs font-medium text-[#7c6f9b] mb-1.5">display name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="how you'll appear to others"
              className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#7c6f9b] mb-1.5">username</label>
            <div className="relative">
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="your unique handle"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] transition-colors"
              />
              {usernameStatus && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  usernameStatus === 'available' ? 'text-emerald-500' :
                  usernameStatus === 'taken' ? 'text-rose-400' : 'text-[#c4b8d9]'
                }`}>
                  {usernameStatus === 'available' ? '✓ available' :
                   usernameStatus === 'taken' ? '✗ taken' : 'checking...'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#7c6f9b] mb-1.5">email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#7c6f9b] mb-1.5">password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="at least 8 characters"
              required
              minLength={8}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || usernameStatus === 'taken'}
            className="w-full py-2.5 rounded-xl bg-[#c4b5fd] hover:bg-[#b39ef7] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'creating your space...' : 'create account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#b0a3c8] mt-4">
          already have an account?{' '}
          <Link to="/login" className="text-[#a89bc2] hover:text-[#7c6f9b] underline underline-offset-2">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
