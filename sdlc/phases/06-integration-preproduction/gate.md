<!-- SOURCE: framework-shipped gate definition, human-edited occasionally. Harvested from ai-assisted-development-sdlc's 6_PreProduction_Signoff_Readiness.md. -->

# Gate: Pre-Production Sign-off

Pass/fail/conditional checkpoint before production deployment.

## Checklist

- [ ] Integration test results consolidated across all test types (unit, integration, e2e, performance, security).
- [ ] Risk register updated with deployment-specific risks and named mitigations.
- [ ] Rollback procedure documented and, where practical, tested.
- [ ] Required stakeholder approvals obtained: development, QA, DevOps, security, product owner, and — for high-impact changes — executive sponsor.
- [ ] Monitoring and alerting configured for the new/changed functionality before go-live.

## Recommendation

State one of:

- **Pass** — proceed to Production Operations (go-live).
- **Conditional pass** — proceed, with named follow-up actions and owners.
- **Fail** — do not proceed; state the specific gap and who owns closing it.

## Common failure modes

- Rollback plan exists on paper but was never actually rehearsed — first real use is during an incident.
- Sign-off obtained from the wrong stakeholder level for the risk profile of the change.
- Monitoring added after go-live instead of before, leaving a blind window right when risk is highest.
