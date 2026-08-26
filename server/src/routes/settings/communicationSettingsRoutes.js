import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['communication.view']), (req, res) => {
  res.json({ communication: {} })
})

export default router
