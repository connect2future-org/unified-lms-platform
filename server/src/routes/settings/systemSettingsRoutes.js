import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['system.manage']), (req, res) => {
  res.json({ system: {} })
})

export default router
