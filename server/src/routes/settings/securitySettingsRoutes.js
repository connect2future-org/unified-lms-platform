import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['security.manage']), (req, res) => {
  res.json({ security: {} })
})

export default router
