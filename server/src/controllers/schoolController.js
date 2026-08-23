import { asyncHandler } from '../middleware/asyncHandler.js'
import { School } from '../models/School.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'

const normalizeSchoolIdCode = (value) => String(value || '').trim().toUpperCase()
const normalizeName = (value) => String(value || '').trim()

const parseOptionalGrade = (value) => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const grade = Number(value)
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    throw new ApiError(400, 'grade must be an integer between 1 and 12')
  }

  return grade
}

const resolveSchoolForScopedAdmin = async (req, schoolId) => {
  if (!schoolId) {
    throw new ApiError(400, 'schoolId is required')
  }

  if (req.user.role === 'super-admin') {
    return School.findById(schoolId)
  }

  const admin = await User.findById(req.user._id).select('_id role schoolId')
  if (!admin || admin.role !== 'admin') {
    throw new ApiError(403, 'Admin access required')
  }

  if (!admin.schoolId || String(admin.schoolId) !== String(schoolId)) {
    throw new ApiError(403, 'You can only manage your assigned school')
  }

  return School.findById(schoolId)
}

export const listSchools = asyncHandler(async (_req, res) => {
  const schools = await School.find({}).sort({ name: 1 }).select('_id schoolId name createdAt updatedAt')
  res.json({ items: schools })
})

export const createSchool = asyncHandler(async (req, res) => {
  const schoolId = normalizeSchoolIdCode(req.body?.schoolId)
  const name = normalizeName(req.body?.name)

  if (!schoolId || !name) {
    throw new ApiError(400, 'schoolId and name are required')
  }

  const exists = await School.findOne({ $or: [{ schoolId }, { name }] }).select('_id')
  if (exists) {
    throw new ApiError(409, 'School with same id or name already exists')
  }

  const school = await School.create({ schoolId, name })
  res.status(201).json({ school })
})

export const updateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.schoolId)
  if (!school) {
    throw new ApiError(404, 'School not found')
  }

  const nextSchoolId = req.body?.schoolId !== undefined ? normalizeSchoolIdCode(req.body.schoolId) : school.schoolId
  const nextName = req.body?.name !== undefined ? normalizeName(req.body.name) : school.name

  if (!nextSchoolId || !nextName) {
    throw new ApiError(400, 'schoolId and name cannot be empty')
  }

  const duplicate = await School.findOne({
    _id: { $ne: school._id },
    $or: [{ schoolId: nextSchoolId }, { name: nextName }]
  }).select('_id')

  if (duplicate) {
    throw new ApiError(409, 'School with same id or name already exists')
  }

  school.schoolId = nextSchoolId
  school.name = nextName
  await school.save()

  res.json({ school })
})

export const listTeachersBySchool = asyncHandler(async (req, res) => {
  const school = await resolveSchoolForScopedAdmin(req, req.params.schoolId)
  if (!school) {
    throw new ApiError(404, 'School not found')
  }

  const teachers = await User.find({ role: 'admin', schoolId: school._id })
    .select('_id name email role schoolId linkedSuperAdmin createdAt')
    .sort({ createdAt: -1 })

  res.json({
    school,
    items: teachers
  })
})

export const listStudentsBySchool = asyncHandler(async (req, res) => {
  const school = await resolveSchoolForScopedAdmin(req, req.params.schoolId)
  if (!school) {
    throw new ApiError(404, 'School not found')
  }

  const grade = parseOptionalGrade(req.query.grade)
  const filter = {
    role: 'candidate',
    schoolId: school._id
  }

  if (grade !== null) {
    filter.grade = grade
  }

  const students = await User.find(filter)
    .select('_id name email usn branch college linkedAdmin schoolId grade createdAt')
    .sort({ createdAt: -1 })

  res.json({
    school,
    grade,
    items: students
  })
})

export const assignTeacherToSchool = asyncHandler(async (req, res) => {
  const school = await resolveSchoolForScopedAdmin(req, req.body?.schoolId)
  if (!school) {
    throw new ApiError(404, 'School not found')
  }

  const teacherId = String(req.body?.teacherId || '').trim()
  const teacherEmail = String(req.body?.teacherEmail || '').trim().toLowerCase()
  if (!teacherId && !teacherEmail) {
    throw new ApiError(400, 'teacherId or teacherEmail is required')
  }

  const teacher = await User.findOne({
    role: 'admin',
    ...(teacherId ? { _id: teacherId } : { email: teacherEmail })
  })

  if (!teacher) {
    throw new ApiError(404, 'Teacher (admin user) not found')
  }

  teacher.schoolId = school._id
  await teacher.save()

  res.json({
    message: 'Teacher assigned to school successfully',
    teacher: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      schoolId: teacher.schoolId
    }
  })
})

export const enrollStudent = asyncHandler(async (req, res) => {
  const school = await resolveSchoolForScopedAdmin(req, req.body?.schoolId)
  if (!school) {
    throw new ApiError(404, 'School not found')
  }

  const name = normalizeName(req.body?.name)
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '').trim()
  const grade = parseOptionalGrade(req.body?.grade)

  if (!name || !email || !password || grade === null) {
    throw new ApiError(400, 'name, email, password and grade are required')
  }

  const existing = await User.findOne({ email }).select('_id')
  if (existing) {
    throw new ApiError(409, 'Email already exists')
  }

  const linkedAdminId = req.user.role === 'admin'
    ? req.user._id
    : String(req.body?.linkedAdminId || '').trim() || null

  if (req.user.role === 'super-admin' && linkedAdminId) {
    const linkedAdmin = await User.findOne({ _id: linkedAdminId, role: 'admin' }).select('_id')
    if (!linkedAdmin) {
      throw new ApiError(400, 'linkedAdminId must reference an existing admin user')
    }
  }

  const student = await User.create({
    name,
    email,
    password,
    role: 'candidate',
    linkedAdmin: linkedAdminId,
    schoolId: school._id,
    grade,
    usn: String(req.body?.usn || '').trim(),
    branch: String(req.body?.branch || '').trim(),
    college: String(req.body?.college || '').trim()
  })

  res.status(201).json({
    message: 'Student enrolled successfully',
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      schoolId: student.schoolId,
      grade: student.grade,
      linkedAdmin: student.linkedAdmin
    }
  })
})

export const updateStudentEnrollment = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.studentId, role: 'candidate' })
  if (!student) {
    throw new ApiError(404, 'Student not found')
  }

  if (req.user.role === 'admin' && String(student.linkedAdmin || '') !== String(req.user._id)) {
    throw new ApiError(403, 'You can only manage students linked to your admin account')
  }

  const nextSchoolId = req.body?.schoolId !== undefined ? String(req.body.schoolId || '').trim() : String(student.schoolId || '')
  if (!nextSchoolId) {
    throw new ApiError(400, 'schoolId is required')
  }

  const school = await resolveSchoolForScopedAdmin(req, nextSchoolId)
  if (!school) {
    throw new ApiError(404, 'School not found')
  }

  const nextGrade = req.body?.grade !== undefined ? parseOptionalGrade(req.body.grade) : student.grade
  if (nextGrade === null) {
    throw new ApiError(400, 'grade is required')
  }

  student.schoolId = school._id
  student.grade = nextGrade
  await student.save()

  res.json({
    message: 'Student enrollment updated successfully',
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      schoolId: student.schoolId,
      grade: student.grade,
      linkedAdmin: student.linkedAdmin
    }
  })
})
