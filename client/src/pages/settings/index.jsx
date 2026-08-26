import { SettingsLayout } from '../SettingsLayout'

const createStubSettingsPage = (title, description) => {
  const Component = () => (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="settings-section">
          <p>This settings area is under development.</p>
        </div>
      </div>
    </SettingsLayout>
  )
  return Component
}

export const SchoolContactSettings = createStubSettingsPage('School Contact', 'Manage school contact information')
export const SchoolLocationsSettings = createStubSettingsPage('School Locations', 'Configure school branches and locations')
export const SchoolCalendarSettings = createStubSettingsPage('Academic Calendar', 'Set up academic calendar and holidays')
export const AcademicClassesSettings = createStubSettingsPage('Classes', 'Manage classes and grade levels')
export const AcademicSectionsSettings = createStubSettingsPage('Sections', 'Configure class sections')
export const AcademicSubjectsSettings = createStubSettingsPage('Subjects', 'Manage subjects and curriculum')
export const AcademicDepartmentsSettings = createStubSettingsPage('Departments', 'Configure academic departments')
export const UserRolesSettings = createStubSettingsPage('Roles & Permissions', 'Manage user roles and permissions')
export const TeachingSubjectsSettings = createStubSettingsPage('Teaching Subjects', 'Configure subject-teacher assignments')
export const TeachingAssignmentsSettings = createStubSettingsPage('Assignment Settings', 'Configure assignment defaults')
export const TeachingTimetableSettings = createStubSettingsPage('Timetable', 'Manage school timetable')
export const AttendanceRulesSettings = createStubSettingsPage('Attendance Rules', 'Configure attendance policies')
export const AttendanceStatusesSettings = createStubSettingsPage('Attendance Statuses', 'Define attendance status types')
export const AssessmentTypesSettings = createStubSettingsPage('Assessment Types', 'Configure assessment types')
export const AssessmentReportCardsSettings = createStubSettingsPage('Report Cards', 'Manage report card templates')
export const ContentSettingsPage = createStubSettingsPage('Content Management', 'Manage learning content')
export const CommunicationTemplatesSettings = createStubSettingsPage('Communication Templates', 'Create message templates')
export const FinanceSettingsPage = createStubSettingsPage('Finance Settings', 'Configure fee management')
export const ReportsSettingsPage = createStubSettingsPage('Reports', 'Configure reports and exports')
export const DataImportExportSettings = createStubSettingsPage('Data Import/Export', 'Manage data import and export')
export const IntegrationSettingsPage = createStubSettingsPage('Integrations', 'Configure third-party integrations')
export const SecuritySettingsPage = createStubSettingsPage('Security', 'Manage security policies')
export const SystemSettingsPage = createStubSettingsPage('System Settings', 'Configure system settings')
export const LocaleSettingsPage = createStubSettingsPage('Localization', 'Manage language and locale settings')
