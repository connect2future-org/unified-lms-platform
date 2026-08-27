import { Router } from 'express'
import { checkPermissions } from '../../services/permissionService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { academicController } from '../../controllers/settings/academicController.js'

const router = Router()

// Academic Years
router.get('/years', checkPermissions(['academic.view']), asyncHandler(academicController.listAcademicYears))
router.post('/years', checkPermissions(['academic.create']), asyncHandler(academicController.createAcademicYear))
router.patch('/years/:id', checkPermissions(['academic.edit']), asyncHandler(academicController.updateAcademicYear))
router.delete('/years/:id', checkPermissions(['academic.delete']), asyncHandler(academicController.deleteAcademicYear))

// Departments
router.get('/departments', checkPermissions(['academic.view']), asyncHandler(academicController.listDepartments))
router.post('/departments', checkPermissions(['academic.create']), asyncHandler(academicController.createDepartment))

// Subjects
router.get('/subjects', checkPermissions(['academic.view']), asyncHandler(academicController.listSubjects))
router.post('/subjects', checkPermissions(['academic.create']), asyncHandler(academicController.createSubject))

// Grade Scales
router.get('/grading', checkPermissions(['academic.view']), asyncHandler(academicController.listGradeScales))
router.post('/grading', checkPermissions(['academic.create']), asyncHandler(academicController.createGradeScale))

export default router
