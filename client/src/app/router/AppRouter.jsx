import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../shared/constants/roles'
import { LandingPage } from '../../pages/LandingPage'
import { RegistrationPage } from '../../pages/RegistrationPage'
import { TeamLoginPage } from '../../modules/team'
import { SuccessPage } from '../../pages/SuccessPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { LoginPage } from '../../pages/LoginPage'
import { SignupPage } from '../../pages/SignupPage'
import { TeamDashboardPage } from '../../modules/team'
import { CandidateDashboard, TestTakingPage } from '../../modules/student'
import { AdminDashboard, AdminTeamsPage, StudentDetailPage as AdminStudentDetail } from '../../modules/admin'
import { SuperAdminDashboard, StudentDetailPage as SuperAdminStudentDetail } from '../../modules/super-admin'
import { RoleTestFlowsPage } from '../../pages/RoleTestFlowsPage'

function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="center-state">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/landing" replace />
  }

  if (user.role === ROLES.SUPER_ADMIN) {
    return <Navigate to="/super-admin" replace />
  }

  if (user.role === ROLES.ADMIN) {
    return <Navigate to={user?.authType === 'platform-admin' ? '/admin/teams' : '/admin'} replace />
  }

  if (user.role === ROLES.CANDIDATE) {
    return <Navigate to="/candidate" replace />
  }

  if (user.role === ROLES.TEAM) {
    return <Navigate to="/team/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/home" element={<Navigate to="/landing" replace />} />

      <Route path="/landing" element={<LandingPage />} />
      <Route path="/role-test-flows" element={<RoleTestFlowsPage />} />
      <Route path="/register-team" element={<RegistrationPage />} />
      <Route path="/register" element={<Navigate to="/register-team" replace />} />
      <Route path="/success" element={<SuccessPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/team/login" element={<TeamLoginPage />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      <Route
        path="/team/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TEAM]}>
            <TeamDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/tests/:testId"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
            <TestTakingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <AdminTeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <AdminStudentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/students/:studentId"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminStudentDetail />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
