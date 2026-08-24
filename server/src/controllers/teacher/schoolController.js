import { asyncHandler } from '../../middleware/asyncHandler.js'
import bcrypt from 'bcryptjs'
import ExcelJS from 'exceljs'
import { parse } from 'csv-parse/sync'
import { School } from '../../models/School.js'
import { User } from '../../models/User.js'
import { Class } from '../../models/Class.js'
import { Enrollment } from '../../models/Enrollment.js'
import { ApiError } from '../../utils/apiError.js'

const normalizeSchoolIdCode = (value) => String(value || '').trim().toUpperCase()
const normalizeName = (value) => String(value || '').trim()
const normalizeClassName = (value) => normalizeName(value)
const normalizeImportHeader = (value) => String(value || '')
  .replace(/^\uFEFF/, '')
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, '_')

const findOrCreateClass = async (school, row) => {
  const title = normalizeClassName(row.class || row.class_name || row.classname || row.class_title)
  if (!title) return null

  const sourcedId = normalizeName(row.class_sourced_id || row.classid || row.class_id)
  const filter = sourcedId
    ? { schoolId: school._id, $or: [{ sourcedId }, { title }] }
    : { schoolId: school._id, title }
  const existing = await Class.findOne(filter)
  if (existing) return existing

  return Class.create({
    schoolId: school._id,
    title,
    subject: normalizeName(row.subject) || null,
    period: normalizeName(row.period) || null,
    sourcedId: sourcedId || undefined
  })
}

const readWorkbookSheets = async (file) => {
  if (!/\.xlsx$/i.test(file.originalname || '')) {
    throw new ApiError(400, 'The complete C2F roster must be an XLSX workbook')
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(file.buffer)
  const sheets = new Map()
  for (const worksheet of workbook.worksheets) {
    const headers = worksheet.getRow(1).values.slice(1).map(normalizeImportHeader)
    const rows = worksheet.values.slice(1).filter(Boolean).map((values) => Object.fromEntries(
      headers.map((header, index) => [header, values[index + 1] ?? ''])
    ))
    sheets.set(normalizeImportHeader(worksheet.name), rows)
  }
  return sheets
}

const readRosterSheets = async (file) => {
  if (/\.xlsx$/i.test(file.originalname || '')) return readWorkbookSheets(file)

  const rows = await parseImportRows(file)
  const schools = new Map()
  const students = []
  const classes = new Map()
  const enrollments = []
  for (const row of rows) {
    const schoolId = normalizeSchoolIdCode(row.school_id || row.schoolid)
    const classTitle = normalizeName(row.class || row.class_name || row.class_title)
    const classSourcedId = normalizeName(row.class_sourced_id || row.classid || row.class_id) || `${schoolId}-${classTitle}`
    const userSourcedId = normalizeName(row.sourced_id || row.userid || row.user_sourced_id) || String(row.email || '').trim().toLowerCase()
    if (schoolId) schools.set(schoolId, { school_id: schoolId, name: normalizeName(row.school_name || row.school) || schoolId })
    students.push({ ...row, sourced_id: userSourcedId })
    if (schoolId && classTitle) {
      classes.set(`${schoolId}:${classSourcedId}`, { school_id: schoolId, class_sourced_id: classSourcedId, title: classTitle, subject: row.subject, period: row.period })
      enrollments.push({ school_id: schoolId, class_sourced_id: classSourcedId, user_sourced_id: userSourcedId, email: row.email, role: 'student', status: 'active', enrollment_sourced_id: row.enrollment_sourced_id })
    }
  }
  return new Map([
    ['schools', [...schools.values()]],
    ['teachers', []],
    ['students', students],
    ['classes', [...classes.values()]],
    ['enrollments', enrollments]
  ])
}

const parseImportRows = async (file) => {
  if (!/\.(csv|xlsx)$/i.test(file.originalname || '')) {
    throw new ApiError(400, 'Only CSV and XLSX files are supported')
  }
  if (!/\.xlsx$/i.test(file.originalname || '')) {
    const content = file.buffer.toString('utf8')
    const firstLine = content.split(/\r?\n/, 1)[0] || ''
    const delimiter = firstLine.includes('\t') ? '\t' : ','
    return parse(content, {
      columns: (headers) => headers.map(normalizeImportHeader),
      delimiter,
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    })
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(file.buffer)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []
  const headers = worksheet.getRow(1).values.slice(1).map(normalizeImportHeader)
  return worksheet.values.slice(1).filter(Boolean).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index + 1] ?? ''])
  ))
}

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

export const listClassesBySchool = asyncHandler(async (req, res) => {
  const school = await resolveSchoolForScopedAdmin(req, req.params.schoolId)
  if (!school) throw new ApiError(404, 'School not found')

  const classes = await Class.find({ schoolId: school._id, status: 'active' })
    .select('_id title subject period sourcedId schoolId')
    .sort({ title: 1 })
  res.json({ school, items: classes })
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
    .select('_id name email usn branch college linkedAdmin schoolId grade sourcedId createdAt')
    .sort({ createdAt: -1 })
  const enrollments = await Enrollment.find({
    userId: { $in: students.map((student) => student._id) },
    role: 'student',
    status: 'active'
  }).populate('classId', 'title subject period status sourcedId schoolId')
  const classesByStudent = new Map()
  for (const enrollment of enrollments) {
    if (!enrollment.classId) continue
    const classes = classesByStudent.get(String(enrollment.userId)) || []
    classes.push(enrollment.classId)
    classesByStudent.set(String(enrollment.userId), classes)
  }

  res.json({
    school,
    grade,
    items: students.map((student) => ({
      ...student.toObject(),
      classes: classesByStudent.get(String(student._id)) || []
    }))
  })
})

export const downloadStudentImportTemplate = asyncHandler(async (_req, res) => {
  res.type('text/csv')
  res.attachment('school-student-import-template.csv')
  res.send('school_id,name,email,password,grade,class,usn,branch,college,sourced_id,class_sourced_id,enrollment_sourced_id\nC2F-001,Example Student,student@example.com,C2F@12345,5,5-A,,,,C2F-STUDENT-001,C2F-CLASS-005,C2F-CLASS-005-STUDENT-001\n')
})

export const downloadC2FRosterTemplate = asyncHandler(async (_req, res) => {
  const workbook = new ExcelJS.Workbook()
  const sheets = {
    Schools: [['school_id', 'name'], ['C2F-001', 'C2F Example School']],
    Teachers: [['school_id', 'sourced_id', 'name', 'email', 'password'], ['C2F-001', 'C2F-TEACHER-001', 'Example Teacher', 'teacher@example.com', 'C2F@12345']],
    Students: [['school_id', 'sourced_id', 'name', 'email', 'password', 'grade', 'usn', 'branch', 'college'], ['C2F-001', 'C2F-STUDENT-001', 'Example Student', 'student@example.com', 'C2F@12345', 5, '', '', '']],
    Classes: [['school_id', 'class_sourced_id', 'title', 'subject', 'period'], ['C2F-001', 'C2F-CLASS-005', 'Grade 5 - A', 'English', '',]],
    Enrollments: [['school_id', 'class_sourced_id', 'user_sourced_id', 'email', 'role', 'status', 'enrollment_sourced_id'], ['C2F-001', 'C2F-CLASS-005', 'C2F-STUDENT-001', 'student@example.com', 'student', 'active', 'C2F-ENROLMENT-001'], ['C2F-001', 'C2F-CLASS-005', 'C2F-TEACHER-001', 'teacher@example.com', 'teacher', 'active', 'C2F-ENROLMENT-002']]
  }
  for (const [name, rows] of Object.entries(sheets)) workbook.addWorksheet(name).addRows(rows)
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.attachment('c2f-school-roster-template.xlsx')
  await workbook.xlsx.write(res)
  res.end()
})

export const importStudentsBySchool = asyncHandler(async (req, res) => {
  const school = await resolveSchoolForScopedAdmin(req, req.body?.schoolId)
  if (!school) throw new ApiError(404, 'School not found')
  if (!req.file) throw new ApiError(400, 'CSV or Excel file is required')

  const rows = await parseImportRows(req.file)
  if (!rows.length) throw new ApiError(400, 'File has no student rows')
  let imported = 0
  let skipped = 0
  let classesCreated = 0
  let enrollmentsCreated = 0
  const errors = []
  const linkedAdminId = req.user.role === 'admin' ? req.user._id : String(req.body?.linkedAdminId || '').trim() || null

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const name = normalizeName(row.name)
    const email = String(row.email || '').trim().toLowerCase()
    const password = String(row.password || '').trim() || 'C2F@12345'
    const rowSchoolId = normalizeSchoolIdCode(row.school_id || row.schoolid)
    let grade
    try { grade = parseOptionalGrade(row.grade) } catch (error) {
      errors.push({ row: index + 2, message: error.message })
      skipped += 1
      continue
    }
    if (!name || !email || grade === null) {
      errors.push({ row: index + 2, message: 'name, email and grade are required' })
      skipped += 1
      continue
    }
    if (rowSchoolId && rowSchoolId !== school.schoolId) {
      errors.push({ row: index + 2, message: `school_id must match selected school (${school.schoolId})` })
      skipped += 1
      continue
    }
    const passwordHash = await bcrypt.hash(password, 10)
    let studentResult
    try {
      studentResult = await User.updateOne(
        { email, schoolId: school._id },
        {
          $set: {
            name,
            role: 'candidate',
            grade,
            password: passwordHash,
            linkedAdmin: linkedAdminId,
            sourcedId: normalizeName(row.sourced_id || row.userid || row.user_sourced_id) || undefined,
            usn: String(row.usn || '').trim(),
            branch: String(row.branch || '').trim(),
            college: String(row.college || '').trim()
          }
        },
        { upsert: true }
      )
    } catch (error) {
      if (error?.code === 11000) {
        errors.push({ row: index + 2, message: 'email already belongs to a different school' })
        skipped += 1
        continue
      }
      throw error
    }
    const student = await User.findOne({ email })
    if (studentResult.upsertedCount) {
      imported += 1
    } else if (!student) {
      errors.push({ row: index + 2, message: 'student could not be loaded after upsert' })
      skipped += 1
      continue
    }

    const classTitle = normalizeClassName(row.class || row.class_name || row.classname || row.class_title)
    const classRecordBefore = classTitle
      ? await Class.findOne({ schoolId: school._id, title: classTitle })
      : null
    const classRecord = await findOrCreateClass(school, row)
    if (classRecord && !classRecordBefore) classesCreated += 1
    if (classRecord) {
      const enrollmentResult = await Enrollment.updateOne(
        { classId: classRecord._id, userId: student._id, role: 'student' },
        { $set: { status: 'active', sourcedId: normalizeName(row.enrollment_sourced_id || row.enrollment_id) || undefined } },
        { upsert: true }
      )
      if (enrollmentResult.upsertedCount) enrollmentsCreated += 1
    }
  }

  res.status(201).json({ imported, skipped, classesCreated, enrollmentsCreated, errors, school: { _id: school._id, schoolId: school.schoolId, name: school.name } })
})

export const importC2FRosterWorkbook = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'XLSX roster workbook is required')
  const sheets = await readRosterSheets(req.file)
  const schools = sheets.get('schools') || []
  const teachers = sheets.get('teachers') || []
  const students = sheets.get('students') || []
  const classes = sheets.get('classes') || []
  const enrollments = sheets.get('enrollments') || []
  if (!schools.length || !students.length || !classes.length || !enrollments.length) {
    throw new ApiError(400, 'Workbook must contain Schools, Students, Classes, and Enrollments sheets')
  }

  const summary = { schoolsCreated: 0, teachersCreated: 0, studentsCreated: 0, classesCreated: 0, enrollmentsCreated: 0, skipped: 0, errors: [] }
  const schoolByCode = new Map()
  for (let index = 0; index < schools.length; index += 1) {
    const row = schools[index]
    const schoolId = normalizeSchoolIdCode(row.school_id || row.schoolid)
    const name = normalizeName(row.name || row.school_name)
    if (!schoolId || !name) {
      summary.errors.push({ sheet: 'Schools', row: index + 2, message: 'school_id and name are required' })
      summary.skipped += 1
      continue
    }
    const schoolResult = await School.updateOne(
      { schoolId },
      { $set: { name } },
      { upsert: true }
    )
    if (schoolResult.upsertedCount) summary.schoolsCreated += 1
    const school = await School.findOne({ schoolId })
    schoolByCode.set(schoolId, school)
  }

  const usersBySourceId = new Map()
  const usersByEmail = new Map()
  const importUsers = async (rows, role, sheetName) => {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]
      const school = schoolByCode.get(normalizeSchoolIdCode(row.school_id || row.schoolid))
      const email = String(row.email || '').trim().toLowerCase()
      const name = normalizeName(row.name || row.full_name)
      if (!school || !email || !name) {
        summary.errors.push({ sheet: sheetName, row: index + 2, message: 'school_id, name, and email are required' })
        summary.skipped += 1
        continue
      }
      const password = String(row.password || '').trim() || 'C2F@12345'
      const passwordHash = await bcrypt.hash(password, 10)
      let userResult
      try {
        userResult = await User.updateOne(
        { email, schoolId: school._id },
        {
          $set: {
            name,
            schoolId: school._id,
            role,
            linkedAdmin: req.user.role === 'admin' ? req.user._id : null,
            grade: role === 'candidate' ? parseOptionalGrade(row.grade) : null,
            sourcedId: normalizeName(row.sourced_id || row.userid || row.user_sourced_id) || undefined,
            usn: String(row.usn || '').trim(),
            branch: String(row.branch || '').trim(),
            college: String(row.college || '').trim(),
            password: passwordHash
          }
        },
        { upsert: true }
        )
      } catch (error) {
        if (error?.code === 11000) {
          summary.errors.push({ sheet: sheetName, row: index + 2, message: 'email already belongs to another school' })
          summary.skipped += 1
          continue
        }
        throw error
      }
      const user = await User.findOne({ email })
      if (userResult.upsertedCount) {
        if (role === 'candidate') summary.studentsCreated += 1
        else summary.teachersCreated += 1
      } else if (!user) {
        summary.errors.push({ sheet: sheetName, row: index + 2, message: 'email already belongs to another school' })
        summary.skipped += 1
        continue
      }
      const sourcedId = normalizeName(row.sourced_id || row.userid || row.user_sourced_id)
      if (sourcedId) usersBySourceId.set(`${school.schoolId}:${sourcedId}`, user)
      usersByEmail.set(`${school.schoolId}:${email}`, user)
    }
  }
  await importUsers(teachers, 'admin', 'Teachers')
  await importUsers(students, 'candidate', 'Students')

  const classesBySourceId = new Map()
  for (let index = 0; index < classes.length; index += 1) {
    const row = classes[index]
    const school = schoolByCode.get(normalizeSchoolIdCode(row.school_id || row.schoolid))
    const title = normalizeName(row.title || row.class || row.class_name)
    const sourcedId = normalizeName(row.class_sourced_id || row.sourced_id || row.classid)
    if (!school || !title) {
      summary.errors.push({ sheet: 'Classes', row: index + 2, message: 'school_id and title are required' })
      summary.skipped += 1
      continue
    }
    const classFilter = sourcedId
      ? { schoolId: school._id, sourcedId }
      : { schoolId: school._id, title }
    const classResult = await Class.updateOne(
      classFilter,
      { $set: { title, sourcedId: sourcedId || undefined, subject: normalizeName(row.subject) || null, period: normalizeName(row.period) || null, status: String(row.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active' } },
      { upsert: true }
    )
    if (classResult.upsertedCount) summary.classesCreated += 1
    const classRecord = await Class.findOne(classFilter)
    if (sourcedId) classesBySourceId.set(`${school.schoolId}:${sourcedId}`, classRecord)
  }

  for (let index = 0; index < enrollments.length; index += 1) {
    const row = enrollments[index]
    const schoolCode = normalizeSchoolIdCode(row.school_id || row.schoolid)
    const classRecord = classesBySourceId.get(`${schoolCode}:${normalizeName(row.class_sourced_id || row.classid)}`)
    const user = usersBySourceId.get(`${schoolCode}:${normalizeName(row.user_sourced_id || row.sourced_id)}`)
      || usersByEmail.get(`${schoolCode}:${String(row.email || '').trim().toLowerCase()}`)
    if (!classRecord || !user) {
      summary.errors.push({ sheet: 'Enrollments', row: index + 2, message: 'class_sourced_id and user_sourced_id/email must match imported records' })
      summary.skipped += 1
      continue
    }
    const result = await Enrollment.updateOne(
      { classId: classRecord._id, userId: user._id, role: row.role === 'teacher' ? 'teacher' : 'student' },
      { $set: { status: String(row.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active', sourcedId: normalizeName(row.enrollment_sourced_id || row.sourced_id) || undefined } },
      { upsert: true }
    )
    if (result.upsertedCount) summary.enrollmentsCreated += 1
  }

  res.status(201).json(summary)
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
  const classRecord = await findOrCreateClass(school, { class: req.body?.className || req.body?.class })
  if (classRecord) {
    await Enrollment.create({ classId: classRecord._id, userId: student._id, role: 'student' })
  }

  res.status(201).json({
    message: 'Student enrolled successfully',
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      schoolId: student.schoolId,
      grade: student.grade,
      classes: classRecord ? [classRecord] : [],
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

  let classRecord = null
  if (req.body?.className !== undefined || req.body?.class !== undefined) {
    await Enrollment.updateMany(
      { userId: student._id, role: 'student', status: 'active' },
      { $set: { status: 'inactive' } }
    )
    classRecord = await findOrCreateClass(school, { class: req.body?.className || req.body?.class })
    if (classRecord) {
      await Enrollment.updateOne(
        { classId: classRecord._id, userId: student._id, role: 'student' },
        { $set: { status: 'active' } },
        { upsert: true }
      )
    }
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
      classes: classRecord ? [classRecord] : [],
      linkedAdmin: student.linkedAdmin
    }
  })
})
