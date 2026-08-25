import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'
import { User } from '../models/User.js'

const extractBearerToken = (value) => {
  if (!value) return null
  const [scheme, token] = value.split(' ')
  return scheme === 'Bearer' && token ? token : null
}

export const requireSchoolManagementAuth = async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization)
  if (!token) return next(new ApiError(401, 'Authentication required'))

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (!payload?.userId) throw new ApiError(403, 'School management access requires an LMS user account')

    const user = await User.findById(payload.userId).select('_id name email role linkedAdmin linkedSuperAdmin schoolId grade')
    if (!user || !['admin', 'teacher', 'super-admin'].includes(user.role)) {
      throw new ApiError(403, 'School management access required')
    }

    req.user = user
    req.admin = {
      id: user._id,
      username: user.email || user.name,
      role: user.role,
      linkedAdmin: user.linkedAdmin,
      linkedSuperAdmin: user.linkedSuperAdmin,
      schoolId: user.schoolId,
      grade: user.grade
    }
    req.isPlatformAdmin = false
    next()
  } catch (error) {
    next(new ApiError(error.statusCode || 401, error.message || 'Invalid or expired token'))
  }
}
