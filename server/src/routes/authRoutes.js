import { Router } from 'express'
import {
	createManagedAdmin,
	changeTeamPassword,
	forceResetTeamPassword,
	getAdminRegistrationInfo,
	getCurrentAdmin,
	getCurrentTeam,
	getUserUnifiedAuthMigrationSummary,
	getTeamPasswordResetActivity,
	importStudentsCsv,
	listAdminStudents,
	listManagedAdmins,
	login,
	loginAdmin,
	loginTeam,
	me,
	regenerateAdminCode,
	resetManagedAdminPassword,
	requestPasswordResetOtp,
	runUserUnifiedAuthMigration,
	resetTeamPassword,
	signup,
	updateManagedAdminCredentials,
	updateCandidateProfile,
	verifyPasswordResetOtp
} from '../controllers/authController.js'
import { requireAdminAuth, requireAdminRole, adminToUserCompat, requireLmsAdmin, requireTeamAuth } from '../middleware/auth.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/admin/login', loginAdmin)
router.get('/me', me)
router.patch('/candidate/profile', requireAuth, requireRole('candidate'), updateCandidateProfile)

router.get('/admin/registration', requireAdminAuth, adminToUserCompat, requireLmsAdmin, requireAdminRole('admin', 'super-admin'), getAdminRegistrationInfo)
router.post('/admin/registration/regenerate', requireAdminAuth, adminToUserCompat, requireLmsAdmin, requireAdminRole('admin', 'super-admin'), regenerateAdminCode)
router.get('/admin/students', requireAdminAuth, adminToUserCompat, requireLmsAdmin, requireAdminRole('admin', 'super-admin'), listAdminStudents)
router.post('/admin/students/import/csv', requireAdminAuth, adminToUserCompat, requireLmsAdmin, requireAdminRole('admin', 'super-admin'), importStudentsCsv)
router.get('/admin/migration/users-unified-auth', requireAdminAuth, adminToUserCompat, getUserUnifiedAuthMigrationSummary)
router.post('/admin/migration/users-unified-auth', requireAdminAuth, adminToUserCompat, runUserUnifiedAuthMigration)
router.get('/super-admin/admins', requireAdminAuth, adminToUserCompat, requireAdminRole('super-admin'), listManagedAdmins)
router.post('/super-admin/admins', requireAdminAuth, adminToUserCompat, requireAdminRole('super-admin'), createManagedAdmin)
router.patch('/super-admin/admins/:adminId', requireAdminAuth, adminToUserCompat, requireAdminRole('super-admin'), updateManagedAdminCredentials)
router.post('/super-admin/admins/:adminId/reset-password', requireAdminAuth, adminToUserCompat, requireAdminRole('super-admin'), resetManagedAdminPassword)

router.get('/platform-admin/me', requireAdminAuth, getCurrentAdmin)
router.post('/team/login', loginTeam)
router.get('/team/me', requireTeamAuth, getCurrentTeam)
router.post('/team/change-password', requireTeamAuth, changeTeamPassword)
router.post('/team/password-reset/request-otp', requestPasswordResetOtp)
router.post('/team/password-reset/verify-otp', verifyPasswordResetOtp)
router.post('/team/password-reset/reset', resetTeamPassword)
router.get('/admin/team-passwords/activity', requireAdminAuth, getTeamPasswordResetActivity)
router.post('/admin/team-passwords/:teamId/force-reset', requireAdminAuth, forceResetTeamPassword)

export default router
