import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import '../../styles/SettingsSidebar.css'

const SETTINGS_MENU = [
  {
    category: 'School',
    permission: 'school.view',
    items: [
      { label: 'Profile', path: '/settings/school/profile' },
      { label: 'Branding', path: '/settings/school/branding' },
      { label: 'Contact', path: '/settings/school/contact' },
      { label: 'Locations', path: '/settings/school/locations' },
      { label: 'Academic Calendar', path: '/settings/school/calendar' },
      { label: 'Holidays', path: '/settings/school/holidays' }
    ]
  },
  {
    category: 'Academic',
    permission: 'academic.view',
    items: [
      { label: 'Years & Terms', path: '/settings/academic/years' },
      { label: 'Classes', path: '/settings/academic/classes' },
      { label: 'Sections', path: '/settings/academic/sections' },
      { label: 'Subjects', path: '/settings/academic/subjects' },
      { label: 'Departments', path: '/settings/academic/departments' },
      { label: 'Grading', path: '/settings/academic/grading' }
    ]
  },
  {
    category: 'Users & Access',
    permission: 'users.view',
    items: [
      { label: 'Students', path: '/settings/users/students' },
      { label: 'Teachers', path: '/settings/users/teachers' },
      { label: 'Parents', path: '/settings/users/parents' },
      { label: 'Admins', path: '/settings/users/admins' },
      { label: 'Roles & Permissions', path: '/settings/users/roles' }
    ]
  },
  {
    category: 'Teaching',
    permission: 'teaching.view',
    items: [
      { label: 'Subjects', path: '/settings/teaching/subjects' },
      { label: 'Assignments', path: '/settings/teaching/assignments' },
      { label: 'Timetable', path: '/settings/teaching/timetable' },
      { label: 'Workload', path: '/settings/teaching/workload' }
    ]
  },
  {
    category: 'Students',
    permission: 'students.view',
    items: [
      { label: 'Settings', path: '/settings/students/settings' },
      { label: 'Enrollment', path: '/settings/students/enrollment' },
      { label: 'Documents', path: '/settings/students/documents' },
      { label: 'Import/Export', path: '/settings/students/import' }
    ]
  },
  {
    category: 'Attendance',
    permission: 'attendance.view',
    items: [
      { label: 'Rules', path: '/settings/attendance/rules' },
      { label: 'Statuses', path: '/settings/attendance/statuses' },
      { label: 'Schedules', path: '/settings/attendance/schedules' }
    ]
  },
  {
    category: 'Assessments',
    permission: 'assessments.view',
    items: [
      { label: 'Types', path: '/settings/assessments/types' },
      { label: 'Grading', path: '/settings/assessments/grading' },
      { label: 'Report Cards', path: '/settings/assessments/report-cards' }
    ]
  },
  {
    category: 'Content',
    permission: 'content.view',
    items: [
      { label: 'Curriculum', path: '/settings/content/curriculum' },
      { label: 'Resources', path: '/settings/content/resources' },
      { label: 'Categories', path: '/settings/content/categories' }
    ]
  },
  {
    category: 'Communication',
    permission: 'communication.view',
    items: [
      { label: 'Announcements', path: '/settings/communication/announcements' },
      { label: 'Templates', path: '/settings/communication/templates' }
    ]
  },
  {
    category: 'Finance',
    permission: 'finance.view',
    items: [
      { label: 'Fee Types', path: '/settings/finance/fees' },
      { label: 'Payments', path: '/settings/finance/payments' }
    ]
  },
  {
    category: 'Reports',
    permission: 'reports.view',
    items: [
      { label: 'Academic', path: '/settings/reports/academic' },
      { label: 'Attendance', path: '/settings/reports/attendance' },
      { label: 'Export', path: '/settings/reports/export' }
    ]
  },
  {
    category: 'Data Management',
    permission: 'data.import',
    items: [
      { label: 'Import', path: '/settings/data/import' },
      { label: 'Export', path: '/settings/data/export' },
      { label: 'History', path: '/settings/data/history' }
    ]
  },
  {
    category: 'Integrations',
    permission: 'integrations.manage',
    items: [
      { label: 'Email', path: '/settings/integrations/email' },
      { label: 'SMS', path: '/settings/integrations/sms' },
      { label: 'Storage', path: '/settings/integrations/storage' },
      { label: 'API', path: '/settings/integrations/api' }
    ]
  },
  {
    category: 'Security',
    permission: 'security.manage',
    items: [
      { label: 'Password Policies', path: '/settings/security/password' },
      { label: 'Sessions', path: '/settings/security/sessions' },
      { label: 'Activity', path: '/settings/security/activity' }
    ]
  },
  {
    category: 'Audit & Logs',
    permission: 'audit.view',
    items: [
      { label: 'Activity Log', path: '/settings/audit/activity' },
      { label: 'Login History', path: '/settings/audit/login' },
      { label: 'Changes', path: '/settings/audit/changes' }
    ]
  },
  {
    category: 'System',
    permission: 'system.manage',
    items: [
      { label: 'General', path: '/settings/system/general' },
      { label: 'Localization', path: '/settings/system/locale' },
      { label: 'Maintenance', path: '/settings/system/maintenance' }
    ]
  },
  {
    category: 'Danger Zone',
    permission: 'system.manage',
    items: [
      { label: 'Destructive Actions', path: '/settings/danger-zone' }
    ]
  }
]

export const SettingsSidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { hasPermission } = usePermissions()

  const visibleGroups = SETTINGS_MENU.filter(group => 
    hasPermission(group.permission)
  )

  return (
    <nav className={`settings-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="settings-sidebar-header">
        <h3>Settings</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close sidebar">×</button>
      </div>

      <div className="settings-sidebar-content">
        {visibleGroups.map((group) => (
          <div key={group.category} className="settings-group">
            <h4 className="settings-group-title">{group.category}</h4>
            <ul className="settings-group-items">
              {group.items.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`settings-item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
