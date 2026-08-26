import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

const router = Router()

// GET /api/settings/academic - List academic configuration
router.get('/', checkPermissions(['academic.view']), asyncHandler(async (req, res) => {
  res.json({
    years: [],
    terms: [],
    classes: [],
    sections: [],
    subjects: [],
    departments: [],
    grading: {}
  })
}))

// POST /api/settings/academic/years - Create academic year
router.post('/years', checkPermissions(['academic.create']), asyncHandler(async (req, res) => {
  res.json({ message: 'Academic year created' })
}))

// POST /api/settings/academic/terms - Create term
router.post('/terms', checkPermissions(['academic.create']), asyncHandler(async (req, res) => {
  res.json({ message: 'Term created' })
}))

export default router
