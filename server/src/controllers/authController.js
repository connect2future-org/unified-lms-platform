import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { parse } from 'csv-parse/sync'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'
import { Team } from '../models/Team.js'
import { User } from '../models/User.js'
import { signToken } from '../services/tokenService.js'
import {
  createDefaultTeamPassword,
  generateOtp,
  generateResetToken,
  hashOtp,
  hashPassword,
  verifyPassword
} from '../utils/password.js'
import { sendPasswordResetOtpEmail } from '../services/mailService.js'
import { migrateUsersForUnifiedAuth } from '../services/userMigrationService.js'

const MIN_PASSWORD_LENGTH = 8

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const createAdminToken = () => {
  return jwt.sign({ role: 'admin', username: env.adminUsername }, env.jwtSecret, {
    expiresIn: '8h'
  })
}

const createTeamToken = (team) => {
  return jwt.sign(
    {
      role: 'team',
      teamId: String(team._id),
      teamName: team.teamName
    },
    env.jwtSecret,
    { expiresIn: '8h' }
  )
}

const findTeamByUsername = async (username) => {
  const normalizedUsername = String(username || '').trim()
  if (!normalizedUsername) {
    return null
  }

  const safeTeamName = escapeRegex(normalizedUsername)
  return Team.findOne({ teamName: { $regex: new RegExp(`^${safeTeamName}$`, 'i') } })
}

const sanitizeTeamAuthPayload = (team) => ({
  id: team._id,
  teamNumber: team.teamNumber,
  teamName: team.teamName,
  leadEmail: team.leadEmail,
  isDefaultPassword: Boolean(team.isDefaultPassword),
  passwordChangedAt: team.passwordChangedAt
})

const sanitizeTeamDashboardPayload = (team) => ({
  id: team._id,
  teamNumber: team.teamNumber,
  teamName: team.teamName,
  leadName: team.leadName,
  leadEmail: team.leadEmail,
  leadUsn: team.leadUsn,
  leadPhone: team.leadPhone,
  college: team.college,
  department: team.department,
  members: team.members,
  assignedProject: team.assignedProject,
  assignedAt: team.assignedAt,
  githubRepoUrl: team.githubRepoUrl,
  collaborationStatus: team.collaborationStatus,
  collaborationMarkedAt: team.collaborationMarkedAt,
  collaborationMarkedBy: team.collaborationMarkedBy,
  customProjectIdea: team.customProjectIdea,
  profileUpdateRequest: team.profileUpdateRequest,
  registrationStatus: team.registrationStatus,
  registrationReviewedAt: team.registrationReviewedAt,
  registrationReviewedBy: team.registrationReviewedBy,
  registrationReviewNote: team.registrationReviewNote,
  isDefaultPassword: Boolean(team.isDefaultPassword),
  passwordChangedAt: team.passwordChangedAt,
  securityActivity: team.securityActivity || {}
})

const ensureApprovedRegistration = (team) => {
  const registrationStatus = String(team?.registrationStatus || 'approved')
  const hasAssignedProject = Boolean(String(team?.assignedProject?.title || '').trim())

  if (registrationStatus === 'approved') {
    return
  }

  // Compatibility fallback for legacy records that became pending after schema updates.
  if (registrationStatus === 'pending' && hasAssignedProject) {
    return
  }

  if (registrationStatus === 'rejected') {
    throw new ApiError(403, 'Team registration was rejected. Please contact admin.')
  }

  throw new ApiError(403, 'Team registration is pending admin approval.')
}

const sanitizeAdminTeamSecurityRow = (team) => ({
  id: team._id,
  teamNumber: team.teamNumber,
  teamName: team.teamName,
  leadEmail: team.leadEmail,
  isDefaultPassword: Boolean(team.isDefaultPassword),
  passwordChangedAt: team.passwordChangedAt,
  securityActivity: team.securityActivity || {},
  passwordResetState: {
    hasActiveOtp: Boolean(team.passwordReset?.otpHash && team.passwordReset?.otpExpiresAt),
    otpExpiresAt: team.passwordReset?.otpExpiresAt || null,
    otpResendCount: Number(team.passwordReset?.otpResendCount || 0),
    otpVerifyAttempts: Number(team.passwordReset?.otpVerifyAttempts || 0),
    lastOtpSentAt: team.passwordReset?.lastOtpSentAt || null
  }
})

const clearPasswordResetState = (team) => {
  team.passwordReset = {
    otpHash: '',
    otpExpiresAt: null,
    otpVerifyAttempts: 0,
    otpResendCount: 0,
    lastOtpSentAt: null,
    resetTokenHash: '',
    resetTokenExpiresAt: null
  }
}

const bumpSecurityActivity = (team, updater) => {
  const current = team.securityActivity || {}
  team.securityActivity = updater(current)
}

const ensureTeamPasswordHash = async (team) => {
  if (team.passwordHash) {
    return
  }

  const defaultPassword = createDefaultTeamPassword(team.leadUsn)
  if (!defaultPassword) {
    throw new ApiError(500, 'Default credentials could not be prepared for this team')
  }

  team.passwordHash = await hashPassword(defaultPassword)
  team.passwordHistory = []
  team.isDefaultPassword = true
  team.passwordChangedAt = null
  await team.save()
}

const ensureNewPasswordAllowed = async (team, newPassword) => {
  if (String(newPassword || '').length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`)
  }

  await ensureTeamPasswordHash(team)

  if (await verifyPassword(newPassword, team.passwordHash)) {
    throw new ApiError(400, 'New password must be different from the current password')
  }

  for (const oldHash of team.passwordHistory || []) {
    if (await verifyPassword(newPassword, oldHash)) {
      throw new ApiError(400, 'New password must not match a recently used password')
    }
  }
}

const applyNewPassword = async (team, newPassword) => {
  await ensureNewPasswordAllowed(team, newPassword)

  const nextHistory = [team.passwordHash, ...(team.passwordHistory || [])].filter(Boolean).slice(0, 5)
  team.passwordHash = await hashPassword(newPassword)
  team.passwordHistory = nextHistory
  team.isDefaultPassword = false
  team.passwordChangedAt = new Date()
  bumpSecurityActivity(team, (activity) => ({
    ...activity,
    passwordResetCount: Number(activity.passwordResetCount || 0) + 1,
    lastPasswordResetAt: new Date()
  }))
  clearPasswordResetState(team)
  await team.save()
}

export const loginAdmin = asyncHandler(async (req, res) => {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required')
  }

  if (username !== env.adminUsername || password !== env.adminPassword) {
    throw new ApiError(401, 'Invalid admin credentials')
  }

  const token = createAdminToken()
  res.json({
    token,
    admin: {
      username: env.adminUsername,
      role: 'admin'
    }
  })
})

export const loginTeam = asyncHandler(async (req, res) => {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required')
  }

  const team = await findTeamByUsername(username)
  if (!team) {
    throw new ApiError(401, 'Invalid team credentials')
  }

  ensureApprovedRegistration(team)

  await ensureTeamPasswordHash(team)

  const isValidPassword = await verifyPassword(password, team.passwordHash)
  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid team credentials')
  }

  const token = createTeamToken(team)

  res.json({
    token,
    team: sanitizeTeamAuthPayload(team),
    message: team.isDefaultPassword
      ? 'Login successful. Please change your default password.'
      : 'Login successful'
  })
})

export const changeTeamPassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')
  const confirmPassword = String(req.body?.confirmPassword || '')

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'Current password, new password, and confirmation are required')
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New password and confirmation do not match')
  }

  const team = await Team.findById(req.team.teamId)
  if (!team) {
    throw new ApiError(404, 'Team account not found')
  }

  await ensureTeamPasswordHash(team)

  const isCurrentPasswordValid = await verifyPassword(currentPassword, team.passwordHash)
  if (!isCurrentPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect')
  }

  await applyNewPassword(team, newPassword)

  res.json({
    message: 'Password updated successfully',
    team: sanitizeTeamAuthPayload(team)
  })
})

export const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email) {
    throw new ApiError(400, 'Registered email is required')
  }

  const team = await Team.findOne({ leadEmail: email })
  if (!team) {
    res.json({
      message: 'If the email is registered, an OTP has been sent.'
    })
    return
  }

  const activeResendCount = Number(team.passwordReset?.otpResendCount || 0)
  const otpExpiresAt = team.passwordReset?.otpExpiresAt ? new Date(team.passwordReset.otpExpiresAt) : null
  const isExistingOtpActive = otpExpiresAt && otpExpiresAt.getTime() > Date.now()

  if (isExistingOtpActive && activeResendCount >= env.otpMaxResends) {
    throw new ApiError(429, 'OTP resend limit reached. Please wait for the current OTP to expire.')
  }

  const otp = generateOtp()
  team.passwordReset = {
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000),
    otpVerifyAttempts: 0,
    otpResendCount: isExistingOtpActive ? activeResendCount + 1 : 1,
    lastOtpSentAt: new Date(),
    resetTokenHash: '',
    resetTokenExpiresAt: null
  }
  bumpSecurityActivity(team, (activity) => ({
    ...activity,
    otpRequestCount: Number(activity.otpRequestCount || 0) + 1,
    lastOtpRequestedAt: new Date()
  }))

  await team.save()

  await sendPasswordResetOtpEmail({
    to: team.leadEmail,
    teamName: team.teamName,
    otp,
    expiresInMinutes: env.otpExpiryMinutes
  })

  res.json({
    message: 'OTP sent successfully to your registered email address.'
  })
})

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const otp = String(req.body?.otp || '').trim()

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required')
  }

  const team = await Team.findOne({ leadEmail: email })
  if (!team) {
    throw new ApiError(404, 'Registered team not found for this email')
  }

  const passwordReset = team.passwordReset || {}
  if (!passwordReset.otpHash || !passwordReset.otpExpiresAt) {
    throw new ApiError(400, 'No active OTP found. Please request a new OTP.')
  }

  if (new Date(passwordReset.otpExpiresAt).getTime() < Date.now()) {
    clearPasswordResetState(team)
    await team.save()
    throw new ApiError(400, 'OTP has expired. Please request a new one.')
  }

  if (Number(passwordReset.otpVerifyAttempts || 0) >= env.otpMaxVerifyAttempts) {
    clearPasswordResetState(team)
    await team.save()
    throw new ApiError(429, 'OTP verification limit reached. Please request a new OTP.')
  }

  if (hashOtp(otp) !== passwordReset.otpHash) {
    team.passwordReset.otpVerifyAttempts = Number(passwordReset.otpVerifyAttempts || 0) + 1
    await team.save()
    throw new ApiError(400, 'Invalid OTP')
  }

  const resetToken = generateResetToken()
  team.passwordReset = {
    otpHash: '',
    otpExpiresAt: null,
    otpVerifyAttempts: 0,
    otpResendCount: 0,
    lastOtpSentAt: passwordReset.lastOtpSentAt || new Date(),
    resetTokenHash: hashOtp(resetToken),
    resetTokenExpiresAt: new Date(Date.now() + env.passwordResetSessionMinutes * 60 * 1000)
  }
  bumpSecurityActivity(team, (activity) => ({
    ...activity,
    otpVerifySuccessCount: Number(activity.otpVerifySuccessCount || 0) + 1,
    lastOtpVerifiedAt: new Date()
  }))
  await team.save()

  res.json({
    message: 'OTP verified successfully',
    resetToken
  })
})

export const resetTeamPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const resetToken = String(req.body?.resetToken || '').trim()
  const newPassword = String(req.body?.newPassword || '')
  const confirmPassword = String(req.body?.confirmPassword || '')

  if (!email || !resetToken || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'Email, reset token, and new password are required')
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New password and confirmation do not match')
  }

  const team = await Team.findOne({ leadEmail: email })
  if (!team) {
    throw new ApiError(404, 'Registered team not found for this email')
  }

  const passwordReset = team.passwordReset || {}
  if (!passwordReset.resetTokenHash || !passwordReset.resetTokenExpiresAt) {
    throw new ApiError(400, 'Password reset session is invalid or expired')
  }

  if (new Date(passwordReset.resetTokenExpiresAt).getTime() < Date.now()) {
    clearPasswordResetState(team)
    await team.save()
    throw new ApiError(400, 'Password reset session has expired. Please request a new OTP.')
  }

  if (hashOtp(resetToken) !== passwordReset.resetTokenHash) {
    throw new ApiError(400, 'Password reset session is invalid or expired')
  }

  await applyNewPassword(team, newPassword)

  res.json({
    message: 'Password reset successful. You can now sign in with your new password.'
  })
})

export const getCurrentAdmin = asyncHandler(async (req, res) => {
  res.json({
    admin: {
      username: req.admin.username,
      role: req.admin.role
    }
  })
})

export const getCurrentTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.team.teamId)
  if (!team) {
    throw new ApiError(404, 'Team account not found')
  }

  ensureApprovedRegistration(team)

  res.json({
    team: sanitizeTeamDashboardPayload(team)
  })
})

export const getTeamPasswordResetActivity = asyncHandler(async (req, res) => {
  const teams = await Team.find()
    .select(
      'teamNumber teamName leadEmail isDefaultPassword passwordChangedAt passwordReset securityActivity'
    )
    .sort({ createdAt: -1 })

  res.json({
    teams: teams.map(sanitizeAdminTeamSecurityRow)
  })
})

export const forceResetTeamPassword = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId)
  if (!team) {
    throw new ApiError(404, 'Team not found')
  }

  const defaultPassword = createDefaultTeamPassword(team.leadUsn)
  if (!defaultPassword) {
    throw new ApiError(400, 'Could not derive default password from team lead USN')
  }

  const previousHash = team.passwordHash
  team.passwordHash = await hashPassword(defaultPassword)
  team.passwordHistory = [previousHash, ...(team.passwordHistory || [])].filter(Boolean).slice(0, 5)
  team.isDefaultPassword = true
  team.passwordChangedAt = null
  clearPasswordResetState(team)
  bumpSecurityActivity(team, (activity) => ({
    ...activity,
    adminForceResetCount: Number(activity.adminForceResetCount || 0) + 1,
    lastPasswordResetByAdminAt: new Date(),
    passwordResetCount: Number(activity.passwordResetCount || 0) + 1,
    lastPasswordResetAt: new Date()
  }))
  await team.save()

  res.json({
    message: `Password has been reset to default (lead USN in lowercase) for ${team.teamName}`,
    team: sanitizeAdminTeamSecurityRow(team)
  })
})

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

const resolveAdminForOperation = async ({ requestUser, adminId }) => {
  if (requestUser.role === 'admin') {
    return User.findOne({ _id: requestUser._id, role: 'admin' })
  }

  if (requestUser.role === 'super-admin') {
    if (!adminId) {
      return null
    }

    return User.findOne({
      _id: adminId,
      role: 'admin',
      linkedSuperAdmin: requestUser._id
    })
  }

  return null
}

const toUserAuthResponse = (user) => {
  const token = signToken({ userId: user._id, role: user.role })
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      usn: user.usn,
      branch: user.branch,
      college: user.college,
      schoolId: user.schoolId,
      grade: user.grade,
      adminCode: user.adminCode,
      linkedAdmin: user.linkedAdmin,
      linkedSuperAdmin: user.linkedSuperAdmin
    }
  }
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, adminCode, superAdminCode } = req.body

  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required')
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new ApiError(409, 'Email already exists')
  }

  const normalizedRole = role === 'super-admin' ? 'super-admin' : role === 'admin' ? 'admin' : 'candidate'
  const payload = {
    name,
    email: email.toLowerCase(),
    password,
    role: normalizedRole
  }

  if (normalizedRole === 'admin') {
    payload.adminCode = await generateUniqueAdminCode()

    if (superAdminCode) {
      const superAdmin = await User.findOne({
        adminCode: String(superAdminCode).trim().toUpperCase(),
        role: 'super-admin'
      })

      if (!superAdmin) {
        throw new ApiError(404, 'Invalid super-admin code')
      }

      payload.linkedSuperAdmin = superAdmin._id
    }
  }

  if (normalizedRole === 'candidate' && adminCode) {
    const admin = await User.findOne({
      adminCode: String(adminCode).trim().toUpperCase(),
      role: 'admin'
    })

    if (!admin) {
      throw new ApiError(404, 'Invalid admin registration code')
    }

    payload.linkedAdmin = admin._id
  }

  const user = await User.create(payload)
  res.status(201).json(toUserAuthResponse(user))
})

const tryPlatformAdminLogin = (username, password) => {
  if (!username || !password) {
    return null
  }

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return null
  }

  const token = createAdminToken()
  return {
    token,
    admin: {
      username: env.adminUsername,
      role: 'admin'
    },
    user: {
      id: env.adminUsername,
      name: env.adminUsername,
      role: 'admin',
      authType: 'platform-admin'
    }
  }
}

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')

  if (!password || (!email && !username)) {
    throw new ApiError(400, 'email/username and password are required')
  }

  if (email) {
    const user = await User.findOne({ email }).select('+password')
    if (user) {
      const isValid = await user.comparePassword(password)
      if (!isValid) {
        throw new ApiError(401, 'Invalid credentials')
      }

      res.json(toUserAuthResponse(user))
      return
    }
  }

  const platformAdminResult = tryPlatformAdminLogin(username || email, password)
  if (platformAdminResult) {
    res.json(platformAdminResult)
    return
  }

  throw new ApiError(401, 'Invalid credentials')
})

export const me = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    throw new ApiError(401, 'Unauthorized')
  }

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  if (payload?.userId) {
    const user = await User.findById(payload.userId).select(
      '_id name email role usn branch college schoolId grade adminCode linkedAdmin linkedSuperAdmin'
    )

    if (!user) {
      throw new ApiError(401, 'Invalid token user')
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        usn: user.usn,
        branch: user.branch,
        college: user.college,
        schoolId: user.schoolId,
        grade: user.grade,
        adminCode: user.adminCode,
        linkedAdmin: user.linkedAdmin,
        linkedSuperAdmin: user.linkedSuperAdmin
      }
    })
    return
  }

  if (payload?.role === 'admin' && payload?.username) {
    res.json({
      user: {
        id: payload.username,
        name: payload.username,
        role: 'admin',
        authType: 'platform-admin'
      },
      admin: {
        username: payload.username,
        role: 'admin'
      }
    })
    return
  }

  throw new ApiError(401, 'Invalid token payload')
})

export const getAdminRegistrationInfo = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id).select('_id adminCode')
  if (!admin) {
    throw new ApiError(404, 'Admin not found')
  }

  if (!admin.adminCode) {
    admin.adminCode = await generateUniqueAdminCode()
    await admin.save()
  }

  const registrationLink = `${req.protocol}://${req.get('host')}/signup?adminCode=${admin.adminCode}&role=candidate`
  res.json({ adminCode: admin.adminCode, registrationLink })
})

export const regenerateAdminCode = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id)
  if (!admin) {
    throw new ApiError(404, 'Admin not found')
  }

  admin.adminCode = await generateUniqueAdminCode()
  await admin.save()

  const registrationLink = `${req.protocol}://${req.get('host')}/signup?adminCode=${admin.adminCode}&role=candidate`
  res.json({ adminCode: admin.adminCode, registrationLink })
})

export const listAdminStudents = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1)
  const limit = Math.min(Number(req.query.limit || 20), 100)
  const skip = (page - 1) * limit
  const search = String(req.query.search || '').trim()

  const targetAdmin = await resolveAdminForOperation({
    requestUser: req.user,
    adminId: req.query.adminId
  })

  if (!targetAdmin) {
    throw new ApiError(400, 'Valid admin is required')
  }

  const filter = {
    role: 'candidate',
    linkedAdmin: targetAdmin._id,
    ...(search ? { name: { $regex: search, $options: 'i' } } : {})
  }

  const [items, total] = await Promise.all([
    User.find(filter).select('_id name email usn branch college schoolId grade linkedAdmin createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ])

  res.json({
    admin: {
      id: targetAdmin._id,
      name: targetAdmin.name,
      email: targetAdmin.email,
      adminCode: targetAdmin.adminCode
    },
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const createManagedAdmin = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super-admin') {
    throw new ApiError(403, 'Forbidden')
  }

  const { name, email, password } = req.body
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required')
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new ApiError(409, 'Email already exists')
  }

  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: 'admin',
    adminCode: await generateUniqueAdminCode(),
    linkedSuperAdmin: req.user._id
  })

  res.status(201).json({
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      adminCode: admin.adminCode
    }
  })
})

export const updateManagedAdminCredentials = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super-admin') {
    throw new ApiError(403, 'Forbidden')
  }

  const adminId = String(req.params.adminId || '').trim()
  if (!adminId) {
    throw new ApiError(400, 'Admin id is required')
  }

  const admin = await User.findOne({ _id: adminId, role: 'admin' }).select('+password')
  if (!admin) {
    throw new ApiError(404, 'Admin not found')
  }

  const nextName = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const nextEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const nextPassword = typeof req.body?.password === 'string' ? req.body.password : ''

  const hasNameUpdate = Boolean(nextName)
  const hasEmailUpdate = Boolean(nextEmail)
  const hasPasswordUpdate = Boolean(nextPassword)

  if (!hasNameUpdate && !hasEmailUpdate && !hasPasswordUpdate) {
    throw new ApiError(400, 'At least one credential field is required: name, email, or password')
  }

  if (hasEmailUpdate) {
    const existingEmailOwner = await User.findOne({ email: nextEmail, _id: { $ne: admin._id } }).select('_id')
    if (existingEmailOwner) {
      throw new ApiError(409, 'Email already exists')
    }
  }

  if (hasPasswordUpdate && String(nextPassword).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long')
  }

  if (hasNameUpdate) {
    admin.name = nextName
  }

  if (hasEmailUpdate) {
    admin.email = nextEmail
  }

  if (hasPasswordUpdate) {
    admin.password = nextPassword
  }

  await admin.save()

  res.json({
    message: 'Admin credentials updated successfully',
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      adminCode: admin.adminCode,
      linkedSuperAdmin: admin.linkedSuperAdmin
    }
  })
})

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = crypto.randomBytes(14)
  let value = ''

  for (const byte of bytes) {
    value += alphabet[byte % alphabet.length]
  }

  return value
}

export const resetManagedAdminPassword = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super-admin') {
    throw new ApiError(403, 'Forbidden')
  }

  const adminId = String(req.params.adminId || '').trim()
  if (!adminId) {
    throw new ApiError(400, 'Admin id is required')
  }

  const admin = await User.findOne({ _id: adminId, role: 'admin' }).select('+password')
  if (!admin) {
    throw new ApiError(404, 'Admin not found')
  }

  const temporaryPassword = generateTemporaryPassword()
  admin.password = temporaryPassword
  await admin.save()

  res.json({
    message: 'Temporary password generated and applied successfully',
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      adminCode: admin.adminCode,
      linkedSuperAdmin: admin.linkedSuperAdmin
    },
    temporaryPassword
  })
})

export const listManagedAdmins = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super-admin') {
    throw new ApiError(403, 'Forbidden')
  }

  const admins = await User.find({ role: 'admin' })
    .select('_id name email adminCode linkedSuperAdmin createdAt')
    .sort({ createdAt: -1 })

  res.json({ items: admins })
})

export const importStudentsCsv = asyncHandler(async (req, res) => {
  const { csvContent, adminId } = req.body

  if (!csvContent) {
    throw new ApiError(400, 'csvContent is required')
  }

  const targetAdmin = await resolveAdminForOperation({
    requestUser: req.user,
    adminId
  })

  if (!targetAdmin) {
    throw new ApiError(400, 'Valid admin is required for import')
  }

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })

  if (!rows.length) {
    throw new ApiError(400, 'CSV has no student rows')
  }

  let imported = 0
  let skipped = 0
  const errors = []

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const name = String(row.name || '').trim()
    const email = String(row.email || '').trim().toLowerCase()
    const password = String(row.password || '').trim() || 'C2F@12345'
    const usn = String(row.usn || '').trim()
    const branch = String(row.branch || '').trim()
    const college = String(row.college || '').trim()

    if (!name || !email) {
      errors.push({ row: index + 2, message: 'name and email are required' })
      skipped += 1
      continue
    }

    const exists = await User.exists({ email })
    if (exists) {
      skipped += 1
      continue
    }

    await User.create({
      name,
      email,
      password,
      role: 'candidate',
      linkedAdmin: targetAdmin._id,
      usn,
      branch,
      college
    })
    imported += 1
  }

  res.status(201).json({
    admin: {
      id: targetAdmin._id,
      name: targetAdmin.name,
      email: targetAdmin.email
    },
    imported,
    skipped,
    errors
  })
})

export const updateCandidateProfile = asyncHandler(async (req, res) => {
  const usn = String(req.body?.usn || '').trim()
  const branch = String(req.body?.branch || '').trim()
  const college = String(req.body?.college || '').trim()

  if (!usn || !branch || !college) {
    throw new ApiError(400, 'usn, branch and college are required')
  }

  const user = await User.findOne({ _id: req.user._id, role: 'candidate' })
  if (!user) {
    throw new ApiError(404, 'Candidate user not found')
  }

  user.usn = usn
  user.branch = branch
  user.college = college
  await user.save()

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      usn: user.usn,
      branch: user.branch,
      college: user.college,
      schoolId: user.schoolId,
      grade: user.grade,
      linkedAdmin: user.linkedAdmin,
      linkedSuperAdmin: user.linkedSuperAdmin
    }
  })
})

export const getUserUnifiedAuthMigrationSummary = asyncHandler(async (_req, res) => {
  const summary = await migrateUsersForUnifiedAuth({ dryRun: true })
  res.json({
    message: 'Dry-run summary generated',
    dryRun: true,
    summary
  })
})

export const runUserUnifiedAuthMigration = asyncHandler(async (_req, res) => {
  const summary = await migrateUsersForUnifiedAuth({ dryRun: false })
  res.json({
    message: 'User migration executed',
    dryRun: false,
    summary
  })
})
