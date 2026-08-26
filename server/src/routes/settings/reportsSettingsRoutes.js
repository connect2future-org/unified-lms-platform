import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['reports.view']), (req, res) => {
  res.json({ reports: {} })
})

export default router
