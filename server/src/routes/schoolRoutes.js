import { Router } from 'express'
import {
  assignTeacherToSchool,
  createSchool,
  enrollStudent,
  listSchools,
  listStudentsBySchool,
  listClassesBySchool,
  importStudentsBySchool,
  importC2FRosterWorkbook,
  listTeachersBySchool,
  updateSchool,
  updateStudentEnrollment,
  downloadStudentImportTemplate,
  downloadC2FRosterTemplate
} from '../controllers/teacher/schoolController.js'
import { requireAdminRole, requireLmsAdmin } from '../middleware/auth.js'
import { requireSchoolManagementAuth } from '../middleware/schoolManagementAuth.js'
import { uploadSchoolStudentFile } from '../middleware/upload.js'

const router = Router()

router.use(requireSchoolManagementAuth)
router.use(requireLmsAdmin)
router.use(requireAdminRole('admin', 'teacher', 'super-admin'))

router.get('/', listSchools)
router.post('/', createSchool)
router.patch('/:schoolId', updateSchool)

router.get('/:schoolId/teachers', listTeachersBySchool)
router.patch('/teachers/assign-school', assignTeacherToSchool)

router.get('/:schoolId/students', listStudentsBySchool)
router.get('/:schoolId/classes', listClassesBySchool)
router.get('/students/import/template', downloadStudentImportTemplate)
router.get('/roster/import/template', downloadC2FRosterTemplate)
router.post('/students/import', uploadSchoolStudentFile.single('file'), importStudentsBySchool)
router.post('/roster/import', uploadSchoolStudentFile.single('file'), importC2FRosterWorkbook)
router.post('/students/enroll', enrollStudent)
router.patch('/students/:studentId/enrollment', updateStudentEnrollment)

export default router
