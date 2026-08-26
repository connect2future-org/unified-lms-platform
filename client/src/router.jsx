import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Existing pages
import { AdminDashboard } from './AdminDashboard'
import { SuperAdminDashboard } from './SuperAdminDashboard'

// Settings pages
import { SchoolProfileSettings } from './settings/SchoolProfileSettings'
import { SchoolBrandingSettings } from './settings/SchoolBrandingSettings'
import { AcademicYearsSettings } from './settings/AcademicYearsSettings'
import { StudentsManagementSettings } from './settings/StudentsManagementSettings'
import { TeachersManagementSettings } from './settings/TeachersManagementSettings'
import { GradingSettingsPage } from './settings/GradingSettingsPage'
import { AuditActivityPage } from './settings/AuditActivityPage'
import { DangerZoneSettingsPage } from './settings/DangerZoneSettingsPage'
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
} from './settings'

const ProtectedRoute = ({ element, requiredRole }) => {
  const { user } = useAuth()

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return <Navigate to="/" replace />
  }

  return element
}

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
      <Route path="/super-admin" element={<ProtectedRoute element={<SuperAdminDashboard />} requiredRole="super-admin" />} />

      {/* Settings routes */}
      <Route path="/settings/school/profile" element={<SchoolProfileSettings />} />
      <Route path="/settings/school/branding" element={<SchoolBrandingSettings />} />
      <Route path="/settings/school/contact" element={<SchoolContactSettings />} />
      <Route path="/settings/school/locations" element={<SchoolLocationsSettings />} />
      <Route path="/settings/school/calendar" element={<SchoolCalendarSettings />} />

      <Route path="/settings/academic/years" element={<AcademicYearsSettings />} />
      <Route path="/settings/academic/classes" element={<AcademicClassesSettings />} />
      <Route path="/settings/academic/sections" element={<AcademicSectionsSettings />} />
      <Route path="/settings/academic/subjects" element={<AcademicSubjectsSettings />} />
      <Route path="/settings/academic/departments" element={<AcademicDepartmentsSettings />} />
      <Route path="/settings/academic/grading" element={<GradingSettingsPage />} />

      <Route path="/settings/users/students" element={<StudentsManagementSettings />} />
      <Route path="/settings/users/teachers" element={<TeachersManagementSettings />} />
      <Route path="/settings/users/roles" element={<UserRolesSettings />} />

      <Route path="/settings/teaching/subjects" element={<TeachingSubjectsSettings />} />
      <Route path="/settings/teaching/assignments" element={<TeachingAssignmentsSettings />} />
      <Route path="/settings/teaching/timetable" element={<TeachingTimetableSettings />} />

      <Route path="/settings/attendance/rules" element={<AttendanceRulesSettings />} />
      <Route path="/settings/attendance/statuses" element={<AttendanceStatusesSettings />} />

      <Route path="/settings/assessments/types" element={<AssessmentTypesSettings />} />
      <Route path="/settings/assessments/grading" element={<GradingSettingsPage />} />
      <Route path="/settings/assessments/report-cards" element={<AssessmentReportCardsSettings />} />

      <Route path="/settings/content" element={<ContentSettingsPage />} />
      <Route path="/settings/communication/templates" element={<CommunicationTemplatesSettings />} />
      <Route path="/settings/finance" element={<FinanceSettingsPage />} />
      <Route path="/settings/reports" element={<ReportsSettingsPage />} />
      <Route path="/settings/data/import" element={<DataImportExportSettings />} />
      <Route path="/settings/integrations" element={<IntegrationSettingsPage />} />
      <Route path="/settings/security" element={<SecuritySettingsPage />} />
      <Route path="/settings/audit/activity" element={<AuditActivityPage />} />
      <Route path="/settings/system/general" element={<SystemSettingsPage />} />
      <Route path="/settings/locale" element={<LocaleSettingsPage />} />
      <Route path="/settings/danger-zone" element={<DangerZoneSettingsPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
