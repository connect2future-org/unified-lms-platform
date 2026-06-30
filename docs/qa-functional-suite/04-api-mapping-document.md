# API Mapping Document

Base Prefix: /api

## Auth
- POST /auth/signup
- POST /auth/login
- POST /auth/admin/login
- GET /auth/me
- GET /auth/admin/registration
- POST /auth/admin/registration/regenerate
- GET /auth/admin/students
- POST /auth/admin/students/import/csv
- GET /auth/admin/migration/users-unified-auth
- POST /auth/admin/migration/users-unified-auth
- GET /auth/super-admin/admins
- POST /auth/super-admin/admins
- GET /auth/platform-admin/me
- POST /auth/team/login
- GET /auth/team/me
- POST /auth/team/change-password
- POST /auth/team/password-reset/request-otp
- POST /auth/team/password-reset/verify-otp
- POST /auth/team/password-reset/reset
- GET /auth/admin/team-passwords/activity
- POST /auth/admin/team-passwords/:teamId/force-reset

## Tests
- GET /tests
- GET /tests/:id
- POST /tests/import/csv
- POST /tests
- GET /tests/:id/questions
- POST /tests/:id/questions
- PATCH /tests/:id/questions/:questionId
- DELETE /tests/:id/questions/:questionId
- PATCH /tests/:id
- DELETE /tests/:id
- PATCH /tests/:id/publish
- PATCH /tests/:id/unpublish

## Attempts
- GET /attempts
- GET /attempts/:attemptId
- POST /attempts/start/:testId
- PATCH /attempts/:attemptId/answers
- POST /attempts/:attemptId/logs
- POST /attempts/:attemptId/submit

## Submissions
- POST /submissions/run
- POST /submissions/:attemptId/:questionId

## Analytics
- GET /analytics/admin
- GET /analytics/admin/activity
- GET /analytics/admin/students/:studentId/detail

## Teams
- POST /teams/register
- GET /teams/export
- GET /teams
- GET /teams/stats
- GET /teams/admin
- GET /teams/admin/migration/registration-summary
- POST /teams/admin/migration/registration
- DELETE /teams/:id
- PATCH /teams/:id
- POST /teams/admin/reconcile-projects
- POST /teams/admin/teams/bulk-update
- POST /teams/admin/:teamId/toggle-progress-status
- POST /teams/admin/:teamId/update-request/review
- POST /teams/admin/:teamId/custom-idea/review
- POST /teams/admin/:teamId/github-collaboration/review
- POST /teams/admin/:teamId/registration/review
- POST /teams/admin/:teamId/project-progress/reset-request/review
- POST /teams/admin/:teamId/unlock-progress
- POST /teams/admin/progress/unlock-all
- DELETE /teams/admin/:teamId/progress
- POST /teams/team/update-request
- POST /teams/team/update-request/recall
- POST /teams/team/custom-idea/request
- POST /teams/team/github
- POST /teams/team/project-progress
- POST /teams/team/project-progress/reset-request
- POST /teams/team/custom-idea/upload/preview
- POST /teams/team/custom-idea/upload

## Projects
- POST /projects
- POST /projects/upload/preview
- POST /projects/upload
- GET /projects/template
- GET /projects
- GET /projects/summary

## Lookups
- GET /lookups/registration-options
- GET /lookups/admin/registration-options
- POST /lookups/admin/registration-options/:type
- PATCH /lookups/admin/registration-options/:type/:id
- DELETE /lookups/admin/registration-options/:type/:id
