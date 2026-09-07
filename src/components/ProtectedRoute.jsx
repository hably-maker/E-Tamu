import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedRoute({ children }) {
  const { session, loading, mustChangePassword } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        Memuat...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (mustChangePassword && !location.pathname.startsWith('/admin/profile')) {
    return <Navigate to="/admin/profile?force=1" replace />
  }

  return children
}
