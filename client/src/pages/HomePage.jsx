import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-3xl mb-4">✦</p>
        <h1 className="text-2xl font-medium text-[#2d2a35] tracking-tight mb-2">
          welcome, {user?.displayName}
        </h1>
        <p className="text-sm text-[#a89bc2] mb-1">savepoint.app/{user?.username}</p>
        <p className="text-xs text-[#c4b8d9] mb-8">your page is coming soon</p>
        <button
          onClick={handleLogout}
          className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] underline underline-offset-2 transition-colors"
        >
          sign out
        </button>
      </div>
    </div>
  )
}
