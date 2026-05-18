import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const getRoleHomePath = (role) => {
  if (role === 'super-admin') {
    return '/super-admin'
  }

  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'candidate') {
    return '/candidate'
  }

  if (role === 'team') {
    return '/team/dashboard'
  }

  return '/login'
}

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { loading, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="center-state">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />
  }

  return children
}
