import { ProtectedRoute } from '../app/guards/ProtectedRoute'

export function TeamProtectedRoute({ children }) {
  return <ProtectedRoute allowedRoles={['team']}>{children}</ProtectedRoute>
}