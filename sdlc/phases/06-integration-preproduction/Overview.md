---
phase: 6
name: Integration & Pre-Production
type: gate
delivery_stages: []
---

<!-- SOURCE: framework-shipped, human-edited occasionally. Defines what this phase is for and its entry/exit criteria. -->

# Phase 6: Integration & Pre-Production

Prepares environments, runs the change through CI, deploys it into a production-like environment, and validates it there before production sign-off.

## Entry criteria

- Code merged with all tests passing (Phase 5 gate passed).
- Integration environment provisioned.

## Key activities

1. **Environment preparation** — automated provisioning and configuration.
2. **CI pipeline** — build, test, artefact management.
3. **Deployment orchestration** — deployment strategy execution (blue-green/canary where applicable).
4. **Integration testing** — end-to-end validation against real dependencies.
5. **Performance & load testing** — production-scale validation.
6. **Pre-production sign-off** — consolidated readiness decision.

## Exit criteria

- Environments configured consistently across dev/test/pre-prod.
- Integration and load tests pass at agreed thresholds.
- All stakeholder sign-offs (technical, business, security, operations) obtained.

## Deliverables

Deployment automation, integration test results, performance certification, pre-production sign-off record.

## Next phase

Phase 7 — Production Operations, where the change goes live and is monitored.
