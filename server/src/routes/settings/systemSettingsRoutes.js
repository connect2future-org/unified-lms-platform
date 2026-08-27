import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { systemController } from '../../controllers/settings/systemController.js'

const router = Router()

// System Configuration
router.get('/', checkPermissions(['system.manage']), asyncHandler(systemController.getSystemConfig))
router.patch('/', checkPermissions(['system.manage']), asyncHandler(systemController.updateSystemConfig))
router.post('/features/:feature/toggle', checkPermissions(['system.manage']), asyncHandler(systemController.toggleFeature))

export default router
