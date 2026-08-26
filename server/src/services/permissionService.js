import { Permission } from '../models/Permission.js'
import { Role } from '../models/Role.js'
import { User } from '../models/User.js'

export const getPermissionMatrix = () => ({
  school: [
    { name: 'school.view', description: 'View school settings' },
    { name: 'school.edit', description: 'Edit school profile and branding' }
  ],
  academic: [
    { name: 'academic.view', description: 'View academic configuration' },
    { name: 'academic.create', description: 'Create academic entities' },
    { name: 'academic.edit', description: 'Edit academic configuration' },
    { name: 'academic.delete', description: 'Delete academic entities' }
  ],
  users: [
    { name: 'users.view', description: 'View users' },
    { name: 'users.create', description: 'Create users' },
    { name: 'users.edit', description: 'Edit users' },
    { name: 'users.delete', description: 'Delete users' },
    { name: 'roles.manage', description: 'Manage roles and permissions' }
  ],
  teaching: [
    { name: 'teaching.view', description: 'View teaching configuration' },
    { name: 'teaching.edit', description: 'Edit teaching settings' }
  ],
  students: [
    { name: 'students.view', description: 'View student records' },
    { name: 'students.create', description: 'Create students' },
    { name: 'students.edit', description: 'Edit student records' },
    { name: 'students.delete', description: 'Delete students' },
    { name: 'students.import', description: 'Import students' },
    { name: 'students.export', description: 'Export students' }
  ],
  attendance: [
    { name: 'attendance.view', description: 'View attendance' },
    { name: 'attendance.mark', description: 'Mark attendance' },
    { name: 'attendance.edit', description: 'Edit attendance' }
  ],
  assessments: [
    { name: 'assessments.view', description: 'View assessments' },
    { name: 'assessments.create', description: 'Create assessments' },
    { name: 'assessments.edit', description: 'Edit assessments' },
    { name: 'assessments.publish', description: 'Publish results' }
  ],
  content: [
    { name: 'content.view', description: 'View content' },
    { name: 'content.create', description: 'Create content' },
    { name: 'content.edit', description: 'Edit content' },
    { name: 'content.delete', description: 'Delete content' }
  ],
  communication: [
    { name: 'communication.view', description: 'View communications' },
    { name: 'communication.send', description: 'Send communications' }
  ],
  finance: [
    { name: 'finance.view', description: 'View financial data' },
    { name: 'finance.manage', description: 'Manage finance settings' }
  ],
  reports: [
    { name: 'reports.view', description: 'View reports' },
    { name: 'reports.export', description: 'Export reports' }
  ],
  data: [
    { name: 'data.import', description: 'Import data' },
    { name: 'data.export', description: 'Export data' }
  ],
  integrations: [
    { name: 'integrations.manage', description: 'Manage integrations' }
  ],
  security: [
    { name: 'security.manage', description: 'Manage security settings' },
    { name: 'security.view-activity', description: 'View security activity' }
  ],
  audit: [
    { name: 'audit.view', description: 'View audit logs' }
  ],
  system: [
    { name: 'system.manage', description: 'Manage system settings' }
  ]
})

export const initializeDefaultRoles = async () => {
  const matrix = getPermissionMatrix()
  
  // Create permissions
  for (const [category, perms] of Object.entries(matrix)) {
    for (const perm of perms) {
      const [resource, action] = perm.name.split('.')
      const exists = await Permission.findOne({ name: perm.name })
      if (!exists) {
        await Permission.create({
          name: perm.name,
          description: perm.description,
          category,
          action,
          resource
        })
      }
    }
  }

  // Create default roles
  const roleDefinitions = {
    'super-admin': ['*'], // All permissions
    'admin': [
      'school.*', 'academic.*', 'users.*', 'teaching.*', 'students.*', 'attendance.*',
      'assessments.*', 'content.*', 'communication.*', 'finance.*', 'reports.*',
      'data.*', 'integrations.manage', 'security.manage', 'audit.view', 'system.manage'
    ],
    'teacher': [
      'teaching.*', 'students.view', 'assessments.*', 'attendance.*',
      'content.view', 'communication.*', 'reports.view'
    ],
    'student': [
      'content.view', 'assessments.view', 'attendance.view', 'communication.*'
    ],
    'parent': [
      'students.view', 'assessments.view', 'attendance.view', 'communication.*'
    ]
  }

  for (const [roleName, permissionPatterns] of Object.entries(roleDefinitions)) {
    const exists = await Role.findOne({ name: roleName })
    if (!exists) {
      let permissions = []
      
      if (permissionPatterns.includes('*')) {
        permissions = await Permission.find()
      } else {
        permissions = await Promise.all(
          permissionPatterns.flatMap(pattern => {
            if (pattern.includes('*')) {
              const resource = pattern.split('.')[0]
              return Permission.find({ resource })
            } else {
              return Permission.findOne({ name: pattern })
            }
          })
        )
        permissions = permissions.filter(Boolean)
      }

      await Role.create({
        name: roleName,
        description: `Default ${roleName} role`,
        type: 'system',
        permissions: permissions.map(p => p._id),
        scope: roleName === 'super-admin' ? 'super-admin' : 'admin'
      })
    }
  }
}

export const hasPermission = async (userId, permissionName) => {
  const user = await User.findById(userId)
    .select('role')
    .populate({
      path: 'roleId',
      populate: { path: 'permissions' }
    })

  if (!user) return false

  // Fallback: check hardcoded permissions by role
  if (user.role === 'super-admin') return true
  
  if (user.role === 'admin') {
    const adminAllowed = [
      'school.', 'academic.', 'users.', 'teaching.', 'students.',
      'attendance.', 'assessments.', 'content.', 'communication.',
      'finance.', 'reports.', 'data.', 'integrations.', 'security.', 'audit.', 'system.'
    ]
    return adminAllowed.some(prefix => permissionName.startsWith(prefix))
  }

  return false
}

export const checkPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const { userId } = req.user || {}
      if (!userId) return res.status(401).json({ message: 'Unauthorized' })

      const hasAll = await Promise.all(
        requiredPermissions.map(perm => hasPermission(userId, perm))
      )

      if (!hasAll.every(Boolean)) {
        return res.status(403).json({ message: 'Insufficient permissions' })
      }

      next()
    } catch (error) {
      res.status(500).json({ message: 'Permission check failed' })
    }
  }
}
