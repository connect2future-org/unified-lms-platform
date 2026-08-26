import { useAuth } from '../context/AuthContext'

const PERMISSION_MATRIX = {
  'super-admin': () => true,
  'admin': (permission) => {
    const [resource] = permission.split('.')
    return ['school', 'academic', 'users', 'teaching', 'students', 'attendance',
      'assessments', 'content', 'communication', 'finance', 'reports', 'data',
      'integrations', 'security', 'audit', 'system'].includes(resource)
  },
  'teacher': (permission) => ['teaching', 'students.view', 'assessments', 'attendance',
    'content.view', 'communication', 'reports.view'].some(p => permission.startsWith(p.split('.')[0])),
  'candidate': () => false,
  'parent': () => false
}

export const usePermissions = () => {
  const { user } = useAuth()

  const hasPermission = (permission) => {
    if (!user) return false
    const checker = PERMISSION_MATRIX[user.role]
    return checker ? checker(permission) : false
  }

  const hasAnyPermission = (permissions) => {
    return permissions.some(p => hasPermission(p))
  }

  const hasAllPermissions = (permissions) => {
    return permissions.every(p => hasPermission(p))
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, userRole: user?.role }
}
