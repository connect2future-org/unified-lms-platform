# Role & Permission Matrix

Legend: R=Read, C=Create, U=Update, D=Delete, A=Approve/Reject, X=No Access

| Feature | super-admin | admin | candidate (student) | team | platform-admin |
|---|---|---|---|---|---|
| Landing/Login/Signup | R | R | R | R | R |
| Team Registration | R | R | R | R | R |
| Candidate Dashboard | X | X | R/U | X | X |
| Start/Save/Submit Attempt | X | X | C/U | X | X |
| Team Dashboard | X | X | X | R/U | X |
| Team Password Reset OTP | X | X | X | C/U | X |
| Admin Dashboard Tests | R/C/U/D | R/C/U/D | X | X | limited (legacy path) |
| Admin Teams Management | R/C/U/D/A | R/C/U/D/A | X | X | limited |
| Student Detail Analytics | R | R | X | X | limited |
| Super Admin Dashboard | R/C/U | X | X | X | X |
| Manage Admin Accounts | R/C/U | X | X | X | X |
| Lookups Admin Endpoints | R/C/U/D | R/C/U/D | X | X | X |
| Projects Admin Endpoints | R/C/U/D | R/C/U/D | X | X | X |
| Public Teams/Stats | R | R | R | R | R |

## Restricted Routes by Role
- candidate cannot access /admin, /admin/teams, /super-admin
- team cannot access /candidate, /admin, /super-admin
- admin cannot access /team/dashboard unless team role token
- super-admin can access admin-scoped pages
