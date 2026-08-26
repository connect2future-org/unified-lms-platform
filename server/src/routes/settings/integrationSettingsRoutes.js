import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['integrations.manage']), (req, res) => {
  res.json({ integrations: {} })
})

export default router
