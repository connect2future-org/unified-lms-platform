import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['students.view']), (req, res) => {
  res.json({ students: {} })
})

export default router
