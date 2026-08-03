import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'
import { User } from '../models/User.js'

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export const requireAdminAuth = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization)

  if (!token) {
    next(new ApiError(401, 'Authentication required'))
    return
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (payload?.userId) {
      const user = await User.findById(payload.userId).select('_id name email role')
      if (!user) {
        throw new ApiError(401, 'Invalid token user')
      }

      if (!['admin', 'super-admin'].includes(user.role)) {
        throw new ApiError(403, 'Admin access required')
      }

      req.admin = {
        id: user._id,
        username: user.email || user.name,
        role: user.role
      }

      next()
      return
    }

    // Backward compatibility for legacy platform-admin token shape.
    if (payload.role !== 'admin') {
      throw new ApiError(403, 'Admin access required')
    }

    const legacyUsername = String(payload.username || '').trim()
    if (legacyUsername) {
      const usernameRegex = new RegExp(`^${escapeRegex(legacyUsername)}$`, 'i')
      const mappedAdminUser = await User.findOne({
        role: { $in: ['admin', 'super-admin'] },
        $or: [
          { email: usernameRegex },
          { name: usernameRegex }
        ]
      }).select('_id name email role')

      if (mappedAdminUser) {
        req.admin = {
          id: mappedAdminUser._id,
          username: mappedAdminUser.email || mappedAdminUser.name,
          role: mappedAdminUser.role
        }

        next()
        return
      }
    }

    req.admin = {
      id: `platform-admin-${payload.username}`,
      username: payload.username,
      role: payload.role
    }

    next()
  } catch (error) {
    next(new ApiError(error.statusCode || 401, 'Invalid or expired token'))
  }
}

export const requireTeamAuth = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization)

  if (!token) {
    next(new ApiError(401, 'Authentication required'))
    return
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (payload.role !== 'team' || !payload.teamId) {
      throw new ApiError(403, 'Team access required')
    }

    req.team = {
      teamId: payload.teamId,
      teamName: payload.teamName,
      role: payload.role
    }

    next()
  } catch (error) {
    next(new ApiError(error.statusCode || 401, 'Invalid or expired token'))
  }
}

export const requireAdminRole = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    next(new ApiError(403, 'Admin access required'))
    return
  }
  next()
}

export const adminToUserCompat = (req, res, next) => {
  // Convert req.admin to req.user for backward compatibility with controllers
  if (req.admin && !req.user) {
    // Check if this is a platform-admin token (id starts with "platform-admin-")
    const isPlatformAdmin = String(req.admin.id).startsWith('platform-admin-')
    
    req.user = {
      _id: req.admin.id,
      role: req.admin.role,
      email: req.admin.username,
      name: req.admin.username,
      authType: isPlatformAdmin ? 'platform-admin' : 'user'
    }
    req.isPlatformAdmin = isPlatformAdmin
  }
  next()
}

export const requireLmsAdmin = (req, res, next) => {
  // Only allow LMS admins (users with User documents), reject platform-admins
  if (req.isPlatformAdmin) {
    next(new ApiError(403, 'This feature is only available to LMS admins'))
    return
  }
  next()
}
