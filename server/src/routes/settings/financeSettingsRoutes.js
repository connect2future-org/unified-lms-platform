import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['finance.view']), (req, res) => {
  res.json({ finance: {} })
})

export default router
