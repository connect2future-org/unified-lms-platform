import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { financeController } from '../../controllers/settings/financeController.js'

const router = Router()

// Finance Configuration
router.get('/', checkPermissions(['finance.view']), asyncHandler(financeController.getFinanceConfig))
router.patch('/', checkPermissions(['finance.manage']), asyncHandler(financeController.updateFinanceConfig))
router.post('/fee-structures', checkPermissions(['finance.manage']), asyncHandler(financeController.addFeeStructure))

export default router
