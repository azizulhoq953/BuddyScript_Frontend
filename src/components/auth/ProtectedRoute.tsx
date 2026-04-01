import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute() {
  const { loading, user } = useAuth()

  if (loading) {
    return <div className="_padd_t24 _text_center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login?reason=auth&next=/feed" replace />
  }

  return <Outlet />
}
