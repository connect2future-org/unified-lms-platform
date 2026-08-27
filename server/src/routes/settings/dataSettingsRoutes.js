import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { dataController } from '../../controllers/settings/dataController.js'

const router = Router()

// Data Import/Export
router.get('/imports', checkPermissions(['data.import']), asyncHandler(dataController.listImports))
router.post('/import', checkPermissions(['data.import']), asyncHandler(dataController.uploadData))
router.post('/export', checkPermissions(['data.export']), asyncHandler(dataController.exportData))

export default router
