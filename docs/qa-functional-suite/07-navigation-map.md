# Navigation Map

```mermaid
flowchart TD
  A[Landing /landing] --> B[Login /login]
  A --> C[Signup /signup]
  A --> D[Team Register /register-team]
  A --> E[Public Dashboard /dashboard]

  B --> F[Candidate Dashboard /candidate]
  B --> G[Team Dashboard /team/dashboard]
  B --> H[Admin Dashboard /admin]
  B --> I[Admin Teams /admin/teams]
  B --> J[Super Admin /super-admin]

  F --> K[Test Taking /candidate/tests/:testId]
  H --> L[Student Detail /admin/students/:studentId]
  J --> M[Student Detail /super-admin/students/:studentId]
```

## Root Redirect Logic
- authenticated super-admin -> /super-admin
- authenticated admin -> /admin or /admin/teams (platform-admin authType)
- authenticated candidate -> /candidate
- authenticated team -> /team/dashboard
- unauthenticated -> /landing
