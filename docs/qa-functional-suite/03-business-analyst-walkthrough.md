# Business Analyst Walkthrough Guide

## BA Goal
Understand end-to-end workflow and confirm business rules implementation.

## Suggested Walkthrough Order
1. Public landing and registration intent
2. Account creation and login per role
3. Team registration approval cycle
4. Admin test publishing and candidate attempt
5. Team progress and review loops
6. Analytics and student detail tracing

## Key Business Rules to Validate
- Only admin/super-admin can manage tests/teams/admin analytics.
- Candidate accesses only published tests.
- Team can login only when approved or pending+assigned fallback condition.
- Team registration status transitions: pending -> approved/rejected.
- Progress reset requests require admin review endpoints.

## BA Evidence Checklist
- Screenshots per route
- Request/response snapshots for critical APIs
- State transitions with timestamps
- Error behaviors for forbidden access
