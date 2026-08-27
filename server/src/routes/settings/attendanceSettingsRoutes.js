import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { attendanceController } from '../../controllers/settings/attendanceController.js'

const router = Router()

// Attendance Rules
router.get('/rules', checkPermissions(['attendance.view']), asyncHandler(attendanceController.listAttendanceRules))
router.post('/rules', checkPermissions(['attendance.view']), asyncHandler(attendanceController.createAttendanceRule))
router.patch('/rules/:id', checkPermissions(['attendance.view']), asyncHandler(attendanceController.updateAttendanceRule))

// Attendance Statuses
router.get('/statuses', checkPermissions(['attendance.view']), asyncHandler(attendanceController.listAttendanceStatuses))
router.post('/statuses', checkPermissions(['attendance.view']), asyncHandler(attendanceController.createAttendanceStatus))

export default router
