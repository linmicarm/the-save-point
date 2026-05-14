import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RedirectToProfile() {
  const { user } = useAuth()
  return <Navigate to={`/u/${user.username}`} replace />
}
