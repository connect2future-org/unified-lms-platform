import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['content.view']), (req, res) => {
  res.json({ content: {} })
})

export default router
