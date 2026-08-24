import { Router } from 'express'
import {
  exportTeamsExcel,
  getDashboardStats,
  getAdminTeams,
  getRegistrationMigrationSummary,
  getTeams,
  registerTeam,
  deleteTeam,
  updateTeam,
  runRegistrationMigration,
  reconcileProjectAssignments,
  submitProfileUpdateRequest,
  recallProfileUpdateRequest,
  reviewProfileUpdateRequest,
  submitCustomProjectIdeaRequest,
  submitTeamGithubRepository,
  updateTeamProjectProgress,
  requestProjectProgressReset,
  reviewProjectProgressResetRequest,
  reviewCustomProjectIdeaRequest,
  reviewTeamGithubCollaboration,
  reviewTeamRegistrationRequest,
  previewTeamCustomIdeaUpload,
  uploadTeamCustomIdeaBulk,
  bulkUpdateTeams,
  toggleProgressStatus,
  unlockAllTeamsProgress
} from '../controllers/team/teamController.js'
import { uploadProjectFile } from '../middleware/upload.js'
import { requireAdminAuth, requireTeamAuth } from '../middleware/auth.js'
import { unlockAllProgress, deleteTeamProgress } from '../controllers/team/teamController.js'

const router = Router()


// Admin CRUD
router.post('/admin/:teamId/update-request/review', requireAdminAuth, reviewProfileUpdateRequest)
router.post('/admin/:teamId/custom-idea/review', requireAdminAuth, reviewCustomProjectIdeaRequest)
router.post('/admin/:teamId/github-collaboration/review', requireAdminAuth, reviewTeamGithubCollaboration)
router.post('/admin/:teamId/registration/review', requireAdminAuth, reviewTeamRegistrationRequest)
router.post('/admin/:teamId/project-progress/reset-request/review', requireAdminAuth, reviewProjectProgressResetRequest)
router.post('/admin/:teamId/unlock-progress', requireAdminAuth, unlockAllProgress)
router.post('/admin/progress/unlock-all', requireAdminAuth, unlockAllTeamsProgress)
router.delete('/admin/:teamId/progress', requireAdminAuth, deleteTeamProgress)
router.get('/admin', requireAdminAuth, getAdminTeams)
router.get('/admin/migration/registration-summary', requireAdminAuth, getRegistrationMigrationSummary)
router.post('/admin/migration/registration', requireAdminAuth, runRegistrationMigration)
router.delete('/:id', requireAdminAuth, deleteTeam)
router.patch('/:id', requireAdminAuth, updateTeam)
router.post('/admin/reconcile-projects', requireAdminAuth, reconcileProjectAssignments)

// Bulk update College values for selected teams
router.post('/admin/teams/bulk-update', requireAdminAuth, bulkUpdateTeams)

router.post('/admin/:teamId/toggle-progress-status', requireAdminAuth, toggleProgressStatus)

router.post('/team/update-request', requireTeamAuth, submitProfileUpdateRequest)
router.post('/team/update-request/recall', requireTeamAuth, recallProfileUpdateRequest)
router.post('/team/custom-idea/request', requireTeamAuth, submitCustomProjectIdeaRequest)
router.post('/team/github', requireTeamAuth, submitTeamGithubRepository)
router.post('/team/project-progress', requireTeamAuth, updateTeamProjectProgress)
router.post('/team/project-progress/reset-request', requireTeamAuth, requestProjectProgressReset)

// Team bulk custom project idea upload/preview (Excel/PDF)
router.post('/team/custom-idea/upload/preview', requireTeamAuth, uploadProjectFile.single('file'), previewTeamCustomIdeaUpload)
router.post('/team/custom-idea/upload', requireTeamAuth, uploadProjectFile.single('file'), uploadTeamCustomIdeaBulk)

router.post('/register', registerTeam)
router.get('/export', exportTeamsExcel)
router.get('/', getTeams)
router.get('/stats', getDashboardStats)

export default router
