import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../shared/constants/roles'
import { LandingPage } from '../../pages/LandingPage'
import { RegistrationPage } from '../../pages/RegistrationPage'
import { TeamLoginPage } from '../../pages/TeamLoginPage'
import { SuccessPage } from '../../pages/SuccessPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { LoginPage } from '../../pages/LoginPage'
import { SignupPage } from '../../pages/SignupPage'
import { TeamDashboardPage } from '../../pages/TeamDashboardPage'
import { CandidateDashboard } from '../../pages/CandidateDashboard'
import { TestTakingPage } from '../../pages/TestTakingPage'
import { AdminDashboard } from '../../pages/AdminDashboard'
import AdminTeamsPage from '../../pages/AdminTeamsPage'
import { StudentDetailPage } from '../../pages/StudentDetailPage'
import { SuperAdminDashboard } from '../../pages/SuperAdminDashboard'
import { RoleTestFlowsPage } from '../../pages/RoleTestFlowsPage'

// Settings pages
import { SchoolProfileSettings } from '../../pages/settings/SchoolProfileSettings'
import { SchoolBrandingSettings } from '../../pages/settings/SchoolBrandingSettings'
import { AcademicYearsSettings } from '../../pages/settings/AcademicYearsSettings'
import { StudentsManagementSettings } from '../../pages/settings/StudentsManagementSettings'
import { TeachersManagementSettings } from '../../pages/settings/TeachersManagementSettings'
import { GradingSettingsPage } from '../../pages/settings/GradingSettingsPage'
import { AuditActivityPage } from '../../pages/settings/AuditActivityPage'
import { DangerZoneSettingsPage } from '../../pages/settings/DangerZoneSettingsPage'
import {
  SchoolContactSettings,
  SchoolLocationsSettings,
  SchoolCalendarSettings,
  AcademicClassesSettings,
  AcademicSectionsSettings,
  AcademicSubjectsSettings,
  AcademicDepartmentsSettings,
  UserRolesSettings,
  TeachingSubjectsSettings,
  TeachingAssignmentsSettings,
  TeachingTimetableSettings,
  AttendanceRulesSettings,
  AttendanceStatusesSettings,
  AssessmentTypesSettings,
  AssessmentReportCardsSettings,
  ContentSettingsPage,
  CommunicationTemplatesSettings,
  FinanceSettingsPage,
  ReportsSettingsPage,
  DataImportExportSettings,
  IntegrationSettingsPage,
  SecuritySettingsPage,
  SystemSettingsPage,
  LocaleSettingsPage
} from '../../pages/settings/index.jsx'

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

  if (user.role === ROLES.TEACHER) {
    return <Navigate to="/admin" replace />
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
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.SUPER_ADMIN]}>
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
            <StudentDetailPage />
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
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Settings Routes */}
      <Route path="/settings/school/profile" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SchoolProfileSettings /></ProtectedRoute>} />
      <Route path="/settings/school/branding" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SchoolBrandingSettings /></ProtectedRoute>} />
      <Route path="/settings/school/contact" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SchoolContactSettings /></ProtectedRoute>} />
      <Route path="/settings/school/locations" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SchoolLocationsSettings /></ProtectedRoute>} />
      <Route path="/settings/school/calendar" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SchoolCalendarSettings /></ProtectedRoute>} />

      <Route path="/settings/academic/years" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AcademicYearsSettings /></ProtectedRoute>} />
      <Route path="/settings/academic/classes" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AcademicClassesSettings /></ProtectedRoute>} />
      <Route path="/settings/academic/sections" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AcademicSectionsSettings /></ProtectedRoute>} />
      <Route path="/settings/academic/subjects" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AcademicSubjectsSettings /></ProtectedRoute>} />
      <Route path="/settings/academic/departments" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AcademicDepartmentsSettings /></ProtectedRoute>} />
      <Route path="/settings/academic/grading" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><GradingSettingsPage /></ProtectedRoute>} />

      <Route path="/settings/users/students" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><StudentsManagementSettings /></ProtectedRoute>} />
      <Route path="/settings/users/teachers" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><TeachersManagementSettings /></ProtectedRoute>} />
      <Route path="/settings/users/roles" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><UserRolesSettings /></ProtectedRoute>} />

      <Route path="/settings/teaching/subjects" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.SUPER_ADMIN]}><TeachingSubjectsSettings /></ProtectedRoute>} />
      <Route path="/settings/teaching/assignments" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.SUPER_ADMIN]}><TeachingAssignmentsSettings /></ProtectedRoute>} />
      <Route path="/settings/teaching/timetable" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.SUPER_ADMIN]}><TeachingTimetableSettings /></ProtectedRoute>} />

      <Route path="/settings/attendance/rules" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AttendanceRulesSettings /></ProtectedRoute>} />
      <Route path="/settings/attendance/statuses" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AttendanceStatusesSettings /></ProtectedRoute>} />

      <Route path="/settings/assessments/types" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AssessmentTypesSettings /></ProtectedRoute>} />
      <Route path="/settings/assessments/grading" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><GradingSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/assessments/report-cards" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AssessmentReportCardsSettings /></ProtectedRoute>} />

      <Route path="/settings/content" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><ContentSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/communication/templates" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><CommunicationTemplatesSettings /></ProtectedRoute>} />
      <Route path="/settings/finance" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><FinanceSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/reports" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><ReportsSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/data/import" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><DataImportExportSettings /></ProtectedRoute>} />
      <Route path="/settings/integrations" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><IntegrationSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/security" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SecuritySettingsPage /></ProtectedRoute>} />
      <Route path="/settings/audit/activity" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><AuditActivityPage /></ProtectedRoute>} />
      <Route path="/settings/system/general" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><SystemSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/locale" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><LocaleSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/danger-zone" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}><DangerZoneSettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
