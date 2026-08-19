<!-- SOURCE: framework-shipped gate definition, human-edited occasionally. Harvested from ai-assisted-development-sdlc's 6_Test_Results_Quality_Gates.md. -->

# Gate: Test Exit

Pass/fail/conditional checkpoint before the change proceeds to integration/pre-production.

## Checklist

- [ ] Every acceptance criterion maps to at least one executed test case with a recorded result, or a consciously deferred `TEST_COVERAGE` tech-debt entry.
- [ ] Unit test coverage meets the team's agreed minimum (source of truth: team standard, not this doc).
- [ ] 100% pass rate on critical-path integration tests.
- [ ] Zero critical, and no unaccepted high-severity, security vulnerabilities.
- [ ] Performance benchmarks met, or explicitly accepted with a documented reason.
- [ ] QA sign-off recorded, with evidence (not just a verbal "looks fine").

## Recommendation

State one of:

- **Pass** — proceed to Integration & Pre-Production.
- **Conditional pass** — proceed, with named follow-up actions and owners.
- **Fail** — do not proceed; state the specific gap and who owns closing it.

## Common failure modes

- "Passing" test suite that doesn't actually cover the acceptance criteria it claims to.
- Performance testing run against a non-representative environment, masking a real production risk.
- Security scan run but findings never triaged — vulnerabilities sit open with no decision recorded.
