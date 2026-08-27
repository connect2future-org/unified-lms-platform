import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { localeController } from '../../controllers/settings/localeController.js'

const router = Router()

// Localization
router.get('/', checkPermissions(['system.manage']), asyncHandler(localeController.listLocales))
router.get('/:id', checkPermissions(['system.manage']), asyncHandler(localeController.getLocale))
router.post('/', checkPermissions(['system.manage']), asyncHandler(localeController.createLocale))
router.patch('/:id', checkPermissions(['system.manage']), asyncHandler(localeController.updateLocale))

export default router
