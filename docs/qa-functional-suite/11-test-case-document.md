# Test Case Document

## Positive Cases
1. Candidate signup with valid inputs -> account created, token issued, redirect to /candidate.
2. Team registration valid 2+ members -> success page shown.
3. Admin creates test and publishes -> candidate can see test.
4. Candidate starts attempt, saves answers, submits -> score persisted.
5. Team login approved team -> dashboard opens.
6. Team custom idea request -> pending status visible in admin review.

## Negative Cases
1. Candidate login with admin credentials while Student radio selected -> role mismatch error.
2. Team login before approval -> 403 with pending approval message.
3. Duplicate team name/lead email/lead USN -> validation error.
4. Invalid OTP / expired OTP -> reset flow blocked.
5. Unauthorized API call (candidate hitting admin endpoints) -> 403.
6. Invalid file type upload for project/custom idea -> 400.

## Boundary Cases
- Team members exactly 2 and exactly 6 pass; 1 or 7 fail.
- Progress update values 0 and 100 pass; <0 or >100 fail.
- OTP resend/verify limits at threshold boundaries.

## Regression Smoke
- Login per role
- Public dashboard loads
- Admin dashboard test list renders
- Candidate can start one attempt
- Team dashboard tabs render without 500s
