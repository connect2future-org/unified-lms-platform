import { Router } from 'express'
import {
  assignTeacherToSchool,
  createSchool,
  enrollStudent,
  listSchools,
  listStudentsBySchool,
  listTeachersBySchool,
  updateSchool,
  updateStudentEnrollment
} from '../controllers/schoolController.js'
import { adminToUserCompat, requireAdminAuth, requireAdminRole, requireLmsAdmin } from '../middleware/auth.js'

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
router.post('/students/enroll', enrollStudent)
router.patch('/students/:studentId/enrollment', updateStudentEnrollment)

export default router
