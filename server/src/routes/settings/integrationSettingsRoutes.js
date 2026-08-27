import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { integrationController } from '../../controllers/settings/integrationController.js'

const router = Router()

// Integrations
router.get('/', checkPermissions(['integrations.manage']), asyncHandler(integrationController.listIntegrations))
router.get('/:id', checkPermissions(['integrations.manage']), asyncHandler(integrationController.getIntegration))
router.post('/', checkPermissions(['integrations.manage']), asyncHandler(integrationController.createIntegration))
router.patch('/:id', checkPermissions(['integrations.manage']), asyncHandler(integrationController.updateIntegration))
router.post('/:id/test', checkPermissions(['integrations.manage']), asyncHandler(integrationController.testIntegration))

export default router
