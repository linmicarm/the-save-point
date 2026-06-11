import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
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
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <p className="text-2xl mb-1" style={{ color: '#c4b5fd' }}>✦</p>
          <h1 className="text-2xl font-medium text-[#2d2a35] tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>The Save Point</h1>
          <p className="text-sm text-[#a89bc2] mt-1">welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#ede9f5] rounded-2xl p-6 shadow-sm space-y-4">

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
              placeholder="••••••••"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#c4b5fd] hover:bg-[#b39ef7] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'signing in...' : 'sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-[#b0a3c8] mt-4">
          new here?{' '}
          <Link to="/register" className="text-[#a89bc2] hover:text-[#7c6f9b] underline underline-offset-2">
            create an account
          </Link>
        </p>
        <p className="text-center text-xs text-[#b0a3c8] mt-2">
          <Link to="/forgot-password" className="text-[#a89bc2] hover:text-[#7c6f9b] underline underline-offset-2">
            forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
