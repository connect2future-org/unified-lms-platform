# Gap Analysis

## Confirmed Gaps
1. No built-in email verification for user signup.
2. Team anti-cheat controls are mostly client-side.
3. No explicit refresh token flow or token revocation list.
4. Limited immutable audit trail across business-critical actions.
5. Some legacy auth compatibility paths increase complexity.
6. No formal OpenAPI/Swagger spec committed.

## Inconsistencies
- Multiple admin auth pathways (user-admin vs platform-admin).
- Legacy route aliases and compatibility middleware can confuse QA expectations.

## Missing Functionalities (Suggested)
- Centralized notification center
- Fine-grained feature flags by role
- Stronger upload scanning/validation
- Role-specific onboarding hints
