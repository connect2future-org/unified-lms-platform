import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { securityController } from '../../controllers/settings/securityController.js'

const router = Router()

// Security Configuration
router.get('/', checkPermissions(['security.manage']), asyncHandler(securityController.getSecurityConfig))
router.patch('/', checkPermissions(['security.manage']), asyncHandler(securityController.updateSecurityConfig))

export default router
