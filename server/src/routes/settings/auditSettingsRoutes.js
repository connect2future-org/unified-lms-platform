import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { getAuditLogs } from '../../services/auditService.js'

const router = Router()

// GET /api/settings/audit - Get audit logs
router.get('/', checkPermissions(['audit.view']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, userId, entityType, action } = req.query
  const logs = await getAuditLogs({ userId, entityType, action }, page, limit)
  res.json(logs)
}))

export default router
