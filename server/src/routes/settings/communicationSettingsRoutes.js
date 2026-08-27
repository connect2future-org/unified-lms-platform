import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { communicationController } from '../../controllers/settings/communicationController.js'

const router = Router()

// Communication Templates
router.get('/templates', checkPermissions(['communication.view']), asyncHandler(communicationController.listCommunicationTemplates))
router.post('/templates', checkPermissions(['communication.send']), asyncHandler(communicationController.createCommunicationTemplate))
router.patch('/templates/:id', checkPermissions(['communication.send']), asyncHandler(communicationController.updateCommunicationTemplate))

export default router
