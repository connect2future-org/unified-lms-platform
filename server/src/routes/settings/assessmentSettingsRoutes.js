import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'

const router = Router()

router.get('/', checkPermissions(['assessments.view']), (req, res) => {
  res.json({ assessments: {} })
})

export default router
