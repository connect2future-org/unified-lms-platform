# Functional Specification Document

## Product Overview
Unified LMS is a monorepo MERN application with role-based portals for Admin, Super Admin, Student (candidate), and Team.

## Scope
- Authentication and authorization
- Team registration and team workflow
- Test authoring and test-taking lifecycle
- Attempts, code submissions, cheating logs
- Analytics and student detail views
- Lookup and project management

## Roles
- super-admin: global admin governance
- admin: LMS operations for tests, teams, students
- candidate: student test-taking
- team: team portal for project lifecycle
- platform-admin (legacy authType): env-credential admin compatibility path

## Business Capabilities
1. User Signup/Login
2. Team Registration/Login/Password Reset
3. Test CRUD + Publish/Unpublish
4. Candidate Attempt Lifecycle
5. Admin Analytics and Student Drilldown
6. Team Profile/Idea/GitHub/Progress flows
7. Lookups and Projects configuration

## Core Constraints
- Public teams listing only includes approved or pending-with-assigned-project teams.
- Team login blocks rejected and pure pending teams.
- Candidate attempt actions restricted to attempt owner.
- Admin operations protected by multiple middleware gates.

## Non-Functional Baseline
- Express + Helmet + rate limiting
- JWT Bearer authentication
- Vite proxy for /api and /socket.io in local dev
- Root-level .env as source of truth
