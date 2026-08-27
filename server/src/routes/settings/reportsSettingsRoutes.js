import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { reportsController } from '../../controllers/settings/reportsController.js'

const router = Router()

// Reports
router.get('/', checkPermissions(['reports.view']), asyncHandler(reportsController.listReports))
router.post('/generate', checkPermissions(['reports.export']), asyncHandler(reportsController.generateReport))
router.get('/export/:reportId', checkPermissions(['reports.export']), asyncHandler(reportsController.exportReport))

export default router
