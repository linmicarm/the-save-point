import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <p className="text-[#a89bc2] text-sm">loading your save point...</p>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}
