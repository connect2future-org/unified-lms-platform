---
name: prepare-for-release
description: Consolidates test results, updates the risk register, documents rollback, and coordinates required sign-offs ahead of a production go-live. Use once phase 5 testing is complete and before the phase 6 gate is assessed.
phase: 06-integration-preproduction
delivery_stages: []
---

# Prepare for Release

SOURCE — human-edited. Universal skill.

## What this is for

Phase 6 has a gate (`sdlc/phases/06-integration-preproduction/gate.md`) but, until now, no
skill produced the evidence that gate needs. This closes that gap — it does the pre-production
prep work; `check-gate-readiness` (via the `gatekeeper` agent) still makes the actual
pass/fail call.

## Procedure

1. **Consolidate test results.** Pull results from every test type run in phase 5 — unit,
   integration, e2e, performance, security — into one summary. Flag any type that didn't run.
   Run `trace-requirements` to complete the release column of the traceability matrix — every
   shipped change traces back to an approved requirement, and every requirement in scope shows
   its test evidence.
2. **Update the risk register** with deployment-specific risks (cutover window, data
   migration, third-party dependency availability) and a named mitigation and owner for each.
3. **Document the rollback procedure.** State the trigger conditions, the exact steps, and who
   executes them. Where practical, confirm it's actually been rehearsed, not just written —
   this is the checklist's most common failure mode.
4. **Coordinate sign-off.** Identify who needs to approve for this specific change:
   development, QA, DevOps, security, product owner, and — for high-impact changes — an
   executive sponsor. Track who has signed and who hasn't; do not proceed on partial sign-off.
5. **Confirm monitoring and alerting** are configured for the new/changed functionality
   *before* go-live, not after.
6. **Hand off** the consolidated package to the `gatekeeper` agent (`check-gate-readiness`
   skill) for the formal gate assessment.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Integration_PreProduction/6_PreProduction_Signoff_Readiness.md`
- `get_document`: `Integration_PreProduction/2_Continuous_Integration_Pipeline.md`
- `get_document`: `Integration_PreProduction/5_Performance_Load_Testing.md`

## Feeds into

`check-gate-readiness` for the phase 6 gate decision. `log-tech-debt` for anything deferred
rather than fixed before go-live.
