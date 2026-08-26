import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['attendance.view']), (req, res) => {
  res.json({ attendance: {} })
})

export default router
