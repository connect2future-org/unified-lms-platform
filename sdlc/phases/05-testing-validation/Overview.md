---
phase: 5
name: Testing & Validation
type: gate
delivery_stages: []
---

<!-- SOURCE: framework-shipped, human-edited occasionally. Defines what this phase is for and its entry/exit criteria. -->

# Phase 5: Testing & Validation

Independently verifies the implementation: test strategy, test generation, execution, quality assessment, performance/security validation, and a final quality-gate decision on production readiness.

## Entry criteria

- Code development complete and merged (Phase 4 gate passed).
- Test environment provisioned.

Entry criteria gate test *execution*. Test *authoring* (`plan-tests`, `write-tests`) may — and preferably does — happen earlier, from approved stories, so implementation codes against agreed acceptance tests rather than the tests being written to match the code.

## Key activities

1. **Test strategy & planning** — approach and tooling for this change.
2. **Test generation** — unit, integration, end-to-end test suites.
3. **Test execution** — orchestrated across environments.
4. **Quality assessment** — defect pattern analysis, coverage review.
5. **Performance & security validation** — non-functional requirements checked against real thresholds.
6. **Test results & quality gate** — consolidated go/no-go recommendation.

## Exit criteria

- All critical and high-priority test cases pass.
- Performance benchmarks met, security vulnerabilities addressed or explicitly accepted.
- Test evidence documented and accessible.

## Deliverables

Test suites, quality assessment report, performance/security validation report, quality gate decision record.

## Next phase

Phase 6 — Integration & Pre-Production, which validates the change in a production-like environment.
