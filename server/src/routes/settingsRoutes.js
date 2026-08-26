import { Router } from 'express'
import { requireAdminAuth } from '../middleware/auth.js'
import { checkPermissions } from '../services/permissionService.js'

// Import all settings controllers (will create these)
import schoolSettingsRoutes from './settings/schoolSettingsRoutes.js'
import academicSettingsRoutes from './settings/academicSettingsRoutes.js'
import userSettingsRoutes from './settings/userSettingsRoutes.js'
import teachingSettingsRoutes from './settings/teachingSettingsRoutes.js'
import studentSettingsRoutes from './settings/studentSettingsRoutes.js'
import assessmentSettingsRoutes from './settings/assessmentSettingsRoutes.js'
import attendanceSettingsRoutes from './settings/attendanceSettingsRoutes.js'
import contentSettingsRoutes from './settings/contentSettingsRoutes.js'
import communicationSettingsRoutes from './settings/communicationSettingsRoutes.js'
import financeSettingsRoutes from './settings/financeSettingsRoutes.js'
import reportsSettingsRoutes from './settings/reportsSettingsRoutes.js'
import dataSettingsRoutes from './settings/dataSettingsRoutes.js'
import integrationSettingsRoutes from './settings/integrationSettingsRoutes.js'
import securitySettingsRoutes from './settings/securitySettingsRoutes.js'
import auditSettingsRoutes from './settings/auditSettingsRoutes.js'
import systemSettingsRoutes from './settings/systemSettingsRoutes.js'

const router = Router()

// All settings routes require admin auth
router.use(requireAdminAuth)

// Mount all settings area routes
router.use('/school', schoolSettingsRoutes)
router.use('/academic', academicSettingsRoutes)
router.use('/users', userSettingsRoutes)
router.use('/teaching', teachingSettingsRoutes)
router.use('/students', studentSettingsRoutes)
router.use('/assessments', assessmentSettingsRoutes)
router.use('/attendance', attendanceSettingsRoutes)
router.use('/content', contentSettingsRoutes)
router.use('/communication', communicationSettingsRoutes)
router.use('/finance', financeSettingsRoutes)
router.use('/reports', reportsSettingsRoutes)
router.use('/data', dataSettingsRoutes)
router.use('/integrations', integrationSettingsRoutes)
router.use('/security', securitySettingsRoutes)
router.use('/audit', auditSettingsRoutes)
router.use('/system', systemSettingsRoutes)

export default router
