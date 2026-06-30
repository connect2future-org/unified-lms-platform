# Button Inventory

Status values: Implemented, Disabled Placeholder, Requires Data, Partial

| Page | Button | Location | Expected Behavior | API Called | Permission | Status |
|---|---|---|---|---|---|---|
| Landing | Start Team Registration | Hero CTA | Navigate to team registration | None | Public | Implemented |
| Landing | Team Login | Hero CTA | Navigate to /login?role=team | None | Public | Implemented |
| Landing | View Live Dashboard | Hero CTA | Open public dashboard | None | Public | Implemented |
| Landing | Role Test Flow buttons | Role cards | Open role-specific create/login flows | None | Public | Implemented |
| Login | Sign In | Login form | Authenticate selected role and redirect | /auth/login or /auth/team/login | Public | Implemented |
| Login | Create one here | Footer link | Open signup with role preselect | None | Public | Implemented |
| Signup | Signup / Continue to Team Registration | Signup form | Create user account or route to register-team | /auth/signup | Public | Implemented |
| Registration | Register Team | Registration submit | Create team registration | /teams/register | Public | Implemented |
| Candidate Dashboard | Start/Resume | Tests table | Open test-taking page | /attempts/start/:testId | candidate | Implemented |
| TestTaking | Run | Coding question panel | Execute code run | /submissions/run | candidate | Implemented |
| TestTaking | Submit | Top action | Submit attempt | /attempts/:attemptId/submit | candidate | Implemented |
| Team Login | Sign In | Team login form | Team auth | /auth/team/login | Public | Implemented |
| Team Login | Send OTP | Forgot password step 1 | Request reset otp | /auth/team/password-reset/request-otp | Public | Implemented |
| Team Login | Verify OTP | Forgot password step 2 | Verify otp and issue reset token | /auth/team/password-reset/verify-otp | Public | Implemented |
| Team Login | Set New Password | Forgot password step 3 | Reset password | /auth/team/password-reset/reset | Public | Implemented |
| Team Dashboard | Submit profile update | Profile tab | Raise update request | /teams/team/update-request | team | Implemented |
| Team Dashboard | Recall request | Profile tab | Recall pending request | /teams/team/update-request/recall | team | Implemented |
| Team Dashboard | Submit custom idea | Idea tab | Submit custom idea | /teams/team/custom-idea/request | team | Implemented |
| Team Dashboard | Upload/Preview idea file | Idea tab | Preview/import idea file | /teams/team/custom-idea/upload/preview, /upload | team | Implemented |
| Team Dashboard | Submit GitHub | GitHub tab | Save repository URL | /teams/team/github | team | Implemented |
| Team Dashboard | Update Progress | Progress tab | Save progress map | /teams/team/project-progress | team | Implemented |
| Team Dashboard | Change Password | Password tab | Change team password | /auth/team/change-password | team | Implemented |
| Admin Dashboard | Create Test | Overview/Test editor | Create test shell | /tests | admin/super-admin | Implemented |
| Admin Dashboard | Import CSV | Overview/Test editor | Import tests/questions | /tests/import/csv | admin/super-admin | Implemented |
| Admin Dashboard | Publish/Unpublish | Tests list | Toggle published state | /tests/:id/publish or /unpublish | admin/super-admin | Implemented |
| Admin Dashboard | Save Test Settings | Test editor | Persist test metadata | /tests/:id | admin/super-admin | Implemented |
| Admin Dashboard | Add/Update Question | Test editor | Upsert question | /tests/:id/questions | admin/super-admin | Implemented |
| Admin Dashboard | Delete Question | Test editor | Delete question from test | /tests/:id/questions/:questionId | admin/super-admin | Implemented |
| Admin Dashboard | Regenerate Code | Students section | Regenerate admin code | /auth/admin/registration/regenerate | admin/super-admin | Implemented |
| Admin Dashboard | Import Students CSV | Students section | Bulk create students | /auth/admin/students/import/csv | admin/super-admin | Implemented |
| Admin Teams | Approve/Reject registration | Approval section | Set registration decision | /teams/admin/:teamId/registration/review | admin/super-admin | Implemented |
| Admin Teams | Approve/Reject profile update | Approval section | Review update request | /teams/admin/:teamId/update-request/review | admin/super-admin | Implemented |
| Admin Teams | Approve/Reject custom idea | Approval section | Review idea | /teams/admin/:teamId/custom-idea/review | admin/super-admin | Implemented |
| Admin Teams | Review GitHub collaboration | Github section | Mark collaboration state | /teams/admin/:teamId/github-collaboration/review | admin/super-admin | Implemented |
| Admin Teams | Edit Team | Edit flow | Save team changes | /teams/:id (PATCH) | admin/super-admin | Implemented |
| Admin Teams | Revoke/Delete Team | Revoke flow | Delete team | /teams/:id (DELETE) | admin/super-admin | Implemented |
| Admin Teams | Unlock All Progress | Progress section | Unlock progress for all teams | /teams/admin/progress/unlock-all | admin/super-admin | Implemented |
| Admin Teams | Bulk Update Teams | Bulk update section | Batch update selected field | /teams/admin/teams/bulk-update | admin/super-admin | Implemented |
| Admin Teams | Lookup create/update/delete | Lookup manager | Manage colleges/departments/topics | /lookups/admin/* | admin/super-admin | Implemented |
| Super Admin | Create Admin | Super admin dashboard | Create managed admin | /auth/super-admin/admins | super-admin | Implemented |
| Super Admin | Import to Selected Admin | Super admin dashboard | Import candidates for chosen admin | /auth/admin/students/import/csv | super-admin | Implemented |

Note: Some menu items are explicitly marked Coming Soon and are intentionally disabled placeholders.
