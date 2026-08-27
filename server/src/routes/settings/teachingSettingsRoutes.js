import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { teachingController } from '../../controllers/settings/teachingController.js'

const router = Router()

// Teacher Subject Assignments
router.get('/assignments', checkPermissions(['teaching.view']), asyncHandler(teachingController.listTeacherAssignments))
router.post('/assignments', checkPermissions(['teaching.edit']), asyncHandler(teachingController.assignTeacherToSubject))
router.patch('/assignments/:id', checkPermissions(['teaching.edit']), asyncHandler(teachingController.updateAssignment))
router.delete('/assignments/:id', checkPermissions(['teaching.edit']), asyncHandler(teachingController.removeAssignment))

export default router
