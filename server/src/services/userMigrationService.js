import { User } from '../models/User.js'

const ROLE_NORMALIZATION_MAP = {
  superadmin: 'super-admin',
  super_admin: 'super-admin',
  'super admin': 'super-admin',
  administrator: 'admin',
  'platform-admin': 'admin',
  platform_admin: 'admin',
  student: 'candidate',
  user: 'candidate'
}

const normalizeRole = (role) => {
  const raw = String(role || '').trim().toLowerCase()
  if (!raw) {
    return 'candidate'
  }

  if (['super-admin', 'admin', 'candidate'].includes(raw)) {
    return raw
  }

  return ROLE_NORMALIZATION_MAP[raw] || 'candidate'
}

const generateAdminCode = () => {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `C2F-${randomPart}`
}

const generateUniqueAdminCode = async () => {
  let code = generateAdminCode()
  let exists = await User.exists({ adminCode: code })

  while (exists) {
    code = generateAdminCode()
    exists = await User.exists({ adminCode: code })
  }

  return code
}

export const migrateUsersForUnifiedAuth = async ({ dryRun = true } = {}) => {
  const users = await User.find({}).select('_id name email role adminCode linkedAdmin linkedSuperAdmin')

  const stats = {
    totalUsers: users.length,
    updatedUsers: 0,
    roleNormalized: 0,
    emailNormalized: 0,
    nameFilled: 0,
    adminCodeBackfilled: 0,
    linkedAdminCleared: 0,
    linkedSuperAdminCleared: 0,
    candidateMissingAdminLink: 0
  }

  for (const user of users) {
    const nextRole = normalizeRole(user.role)
    const nextEmail = String(user.email || '').trim().toLowerCase()
    const nextName = String(user.name || '').trim() || String(nextEmail.split('@')[0] || 'User')

    const setOps = {}
    const unsetOps = {}

    if (nextRole !== user.role) {
      setOps.role = nextRole
      stats.roleNormalized += 1
    }

    if (nextEmail && nextEmail !== user.email) {
      setOps.email = nextEmail
      stats.emailNormalized += 1
    }

    if (nextName !== user.name) {
      setOps.name = nextName
      stats.nameFilled += 1
    }

    if ((nextRole === 'admin' || nextRole === 'super-admin') && !String(user.adminCode || '').trim()) {
      setOps.adminCode = await generateUniqueAdminCode()
      stats.adminCodeBackfilled += 1
    }

    if (nextRole !== 'candidate' && user.linkedAdmin) {
      unsetOps.linkedAdmin = ''
      stats.linkedAdminCleared += 1
    }

    if (nextRole !== 'admin' && user.linkedSuperAdmin) {
      unsetOps.linkedSuperAdmin = ''
      stats.linkedSuperAdminCleared += 1
    }

    if (nextRole === 'candidate' && !user.linkedAdmin) {
      stats.candidateMissingAdminLink += 1
    }

    const hasSet = Object.keys(setOps).length > 0
    const hasUnset = Object.keys(unsetOps).length > 0

    if (hasSet || hasUnset) {
      stats.updatedUsers += 1

      if (!dryRun) {
        const update = {}
        if (hasSet) {
          update.$set = setOps
        }
        if (hasUnset) {
          update.$unset = unsetOps
        }

        await User.updateOne({ _id: user._id }, update)
      }
    }
  }

  return stats
}
