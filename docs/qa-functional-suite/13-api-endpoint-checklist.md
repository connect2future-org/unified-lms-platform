# API Endpoint Checklist

Use this checklist during API validation runs.

## Auth
- [ ] /api/auth/signup
- [ ] /api/auth/login
- [ ] /api/auth/me
- [ ] /api/auth/team/login
- [ ] /api/auth/team/me
- [ ] /api/auth/team/change-password
- [ ] /api/auth/team/password-reset/request-otp
- [ ] /api/auth/team/password-reset/verify-otp
- [ ] /api/auth/team/password-reset/reset

## Tests/Attempts/Submissions
- [ ] /api/tests
- [ ] /api/tests/:id
- [ ] /api/tests/:id/publish
- [ ] /api/tests/:id/unpublish
- [ ] /api/attempts/start/:testId
- [ ] /api/attempts/:attemptId/answers
- [ ] /api/attempts/:attemptId/submit
- [ ] /api/submissions/run
- [ ] /api/submissions/:attemptId/:questionId

## Teams
- [ ] /api/teams/register
- [ ] /api/teams
- [ ] /api/teams/stats
- [ ] /api/teams/admin
- [ ] /api/teams/admin/:teamId/registration/review
- [ ] /api/teams/admin/:teamId/update-request/review
- [ ] /api/teams/admin/:teamId/custom-idea/review
- [ ] /api/teams/admin/:teamId/github-collaboration/review
- [ ] /api/teams/team/update-request
- [ ] /api/teams/team/update-request/recall
- [ ] /api/teams/team/custom-idea/request
- [ ] /api/teams/team/project-progress

## Projects/Lookups/Analytics
- [ ] /api/projects
- [ ] /api/projects/summary
- [ ] /api/lookups/registration-options
- [ ] /api/lookups/admin/registration-options
- [ ] /api/analytics/admin
- [ ] /api/analytics/admin/students/:studentId/detail
