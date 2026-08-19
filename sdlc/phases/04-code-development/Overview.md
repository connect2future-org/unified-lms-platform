---
phase: 4
name: Code Development
type: gate
delivery_stages: []
---

<!-- SOURCE: framework-shipped, human-edited occasionally. Defines what this phase is for and its entry/exit criteria. -->

# Phase 4: Code Development

Implements against the approved architecture: problem specification, design discussion, phased (test-driven) implementation, and continuous validation of the resulting code.

## Entry criteria

- Approved architecture and ADRs (Phase 3 gate passed).
- Ready-to-implement user story with acceptance criteria.

## Key activities

1. **Problem specification** — story analysis, task breakdown.
2. **Design discussion** — technical design decisions before coding starts.
3. **Phased implementation** — test-driven, start small, iterate.
4. **Continuous validation** — AI-assisted first-pass review plus human review for business logic, architecture fit, and maintainability.

## Exit criteria

- Working implementation with a passing test suite.
- Code reviewed by both AI first-pass and a human reviewer.
- No known regressions against acceptance criteria.

## Deliverables

Tested, reviewed code merged to main; test suite; documented implementation decisions and any technical debt incurred.

## Next phase

Phase 5 — Testing & Validation, which independently verifies the implementation against quality gates.
