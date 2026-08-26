import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { School } from '../../models/School.js'
import { logAudit } from '../../services/auditService.js'

const router = Router()

// GET /api/settings/school - Get school settings
router.get('/', checkPermissions(['school.view']), asyncHandler(async (req, res) => {
  const schools = await School.find().select('_id schoolId name createdAt updatedAt')
  res.json({ items: schools })
}))

// POST /api/settings/school - Create school
router.post('/', checkPermissions(['school.edit']), asyncHandler(async (req, res) => {
  const { schoolId, name, logo, favicon, address, contact, website, principal } = req.body
  
  if (!schoolId || !name) {
    return res.status(400).json({ message: 'School ID and name required' })
  }

  const school = await School.create({
    schoolId,
    name,
    logo,
    favicon,
    address,
    contact,
    website,
    principal
  })

  await logAudit({
    userId: req.user._id,
    action: 'create',
    entityType: 'School',
    entityId: school._id,
    description: `Created school: ${name}`,
    newValues: { schoolId, name },
    schoolId: school._id
  })

  res.status(201).json({ school })
}))

// PATCH /api/settings/school/:schoolId - Update school
router.patch('/:schoolId', checkPermissions(['school.edit']), asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.schoolId)
  if (!school) return res.status(404).json({ message: 'School not found' })

  const previousValues = school.toObject()
  Object.assign(school, req.body)
  await school.save()

  await logAudit({
    userId: req.user._id,
    action: 'update',
    entityType: 'School',
    entityId: school._id,
    description: `Updated school: ${school.name}`,
    previousValues,
    newValues: req.body,
    schoolId: school._id
  })

  res.json({ school })
}))

export default router
