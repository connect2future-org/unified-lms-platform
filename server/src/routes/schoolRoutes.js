import { Router } from 'express'
import {
  assignTeacherToSchool,
  createSchool,
  enrollStudent,
  listSchools,
  listStudentsBySchool,
  importStudentsBySchool,
  listTeachersBySchool,
  updateSchool,
  updateStudentEnrollment,
  downloadStudentImportTemplate
} from '../controllers/teacher/schoolController.js'
import { adminToUserCompat, requireAdminAuth, requireAdminRole, requireLmsAdmin } from '../middleware/auth.js'
import { uploadSchoolStudentFile } from '../middleware/upload.js'

const router = Router()

router.use(requireAdminAuth)
router.use(adminToUserCompat)
router.use(requireLmsAdmin)
router.use(requireAdminRole('admin', 'super-admin'))

router.get('/', listSchools)
router.post('/', createSchool)
router.patch('/:schoolId', updateSchool)

router.get('/:schoolId/teachers', listTeachersBySchool)
router.patch('/teachers/assign-school', assignTeacherToSchool)

router.get('/:schoolId/students', listStudentsBySchool)
router.get('/students/import/template', downloadStudentImportTemplate)
router.post('/students/import', uploadSchoolStudentFile.single('file'), importStudentsBySchool)
router.post('/students/enroll', enrollStudent)
router.patch('/students/:studentId/enrollment', updateStudentEnrollment)

export default router
