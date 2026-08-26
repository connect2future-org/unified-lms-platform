import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['teaching.view']), (req, res) => {
  res.json({ teaching: {} })
})

export default router
