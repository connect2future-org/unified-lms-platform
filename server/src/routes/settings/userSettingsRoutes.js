import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { User } from '../../models/User.js'
import { Enrollment } from '../../models/Enrollment.js'
import { logAudit } from '../../services/auditService.js'

const router = Router()

// GET /api/settings/users/students - List students
router.get('/students', checkPermissions(['students.view']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = '' } = req.query
  const skip = (page - 1) * limit

  const filter = { role: 'student' }
  if (req.user.role !== 'super-admin') filter.schoolId = req.user.schoolId
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  const [students, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).select('_id name email schoolId createdAt updatedAt'),
    User.countDocuments(filter)
  ])

  res.json({ items: students, total, page, limit, totalPages: Math.ceil(total / limit) })
}))

// GET /api/settings/users/teachers - List teachers
router.get('/teachers', checkPermissions(['users.view']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = '' } = req.query
  const skip = (page - 1) * limit

  const filter = { role: 'teacher' }
  if (req.user.role !== 'super-admin') filter.schoolId = req.user.schoolId
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  const [teachers, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).select('_id name email schoolId createdAt updatedAt'),
    User.countDocuments(filter)
  ])

  res.json({ items: teachers, total, page, limit, totalPages: Math.ceil(total / limit) })
}))

// POST /api/settings/users/students - Create student
router.post('/students', checkPermissions(['students.create']), asyncHandler(async (req, res) => {
  const { name, email, password, usn, branch, college } = req.body
  const schoolId = req.user.role === 'super-admin' ? req.body.schoolId : req.user.schoolId

  if (!name || !email || !password || !schoolId) {
    return res.status(400).json({ message: 'Name, email, password, and school are required' })
  }

  const exists = await User.findOne({ email })
  if (exists) {
    return res.status(409).json({ message: 'User already exists' })
  }

  const student = await User.create({
    name,
    email,
    password,
    role: 'student',
    schoolId,
    usn,
    branch,
    college
  })

  await logAudit({
    userId: req.user._id,
    action: 'create',
    entityType: 'User',
    entityId: student._id,
    description: `Created student: ${name}`,
    newValues: { name, email, role: 'student', schoolId }
  })

  res.status(201).json({ user: student })
}))

// PATCH /api/settings/users/:userId - Update user
router.patch('/:userId', checkPermissions(['users.edit']), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (req.user.role !== 'super-admin' && String(user.schoolId) !== String(req.user.schoolId)) {
    return res.status(403).json({ message: 'You can only manage users in your school' })
  }

  const previousValues = user.toObject()
  const updates = { ...req.body }
  delete updates.role
  delete updates.schoolId
  delete updates.linkedAdmin
  delete updates.linkedSuperAdmin
  Object.assign(user, updates)
  await user.save()

  await logAudit({
    userId: req.user._id,
    action: 'update',
    entityType: 'User',
    entityId: user._id,
    description: `Updated user: ${user.name}`,
    previousValues,
    newValues: req.body
  })

  res.json({ user })
}))

export default router
