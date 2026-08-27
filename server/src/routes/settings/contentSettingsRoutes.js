import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { contentController } from '../../controllers/settings/contentController.js'

const router = Router()

// Content Management
router.get('/', checkPermissions(['content.view']), asyncHandler(contentController.listContent))
router.post('/', checkPermissions(['content.create']), asyncHandler(contentController.createContent))

export default router
