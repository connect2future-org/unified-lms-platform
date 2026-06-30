# User Manual

## Landing
Route: /landing
- Start Team Registration
- Team Login
- View Live Dashboard
- Role Test Flows (Student/Team/Admin quick links)

## Login
Route: /login
- Select role radio: Student, Team, Admin
- Team uses team login endpoint
- Student/Admin use unified auth login endpoint

## Signup
Route: /signup
- Select role radio: Student, Team, Admin
- Team role routes user to /register-team
- Student/Admin complete name/email/password signup

## Team Registration
Route: /register-team
- Enter team lead and member details
- Choose college/department from lookups
- Optional custom project idea
- Submit and view success screen

## Candidate Portal
Routes: /candidate, /candidate/tests/:testId
- View published tests
- Start/resume test
- Save answers and submit
- View attempt history

## Team Portal
Route: /team/dashboard
Tabs include profile, github, idea, progress, update, password.

## Admin Portal
Routes: /admin, /admin/teams
- Manage tests/questions
- Manage teams and registration approvals
- Review student details and analytics

## Super Admin Portal
Route: /super-admin
- Manage admins
- View cross-admin insights
