import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['data.import', 'data.export']), (req, res) => {
  res.json({ data: {} })
})

export default router
