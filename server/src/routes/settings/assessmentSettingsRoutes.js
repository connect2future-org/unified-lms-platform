import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { assessmentController } from '../../controllers/settings/assessmentController.js'

const router = Router()

// Assessment Types
router.get('/types', checkPermissions(['assessments.view']), asyncHandler(assessmentController.listAssessmentTypes))
router.post('/types', checkPermissions(['assessments.create']), asyncHandler(assessmentController.createAssessmentType))
router.patch('/types/:id', checkPermissions(['assessments.edit']), asyncHandler(assessmentController.updateAssessmentType))

// Report Card Templates
router.get('/report-cards', checkPermissions(['assessments.view']), asyncHandler(assessmentController.listReportCardTemplates))
router.post('/report-cards', checkPermissions(['assessments.create']), asyncHandler(assessmentController.createReportCardTemplate))

export default router
