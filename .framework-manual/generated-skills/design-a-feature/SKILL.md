---
name: design-a-feature
description: Turns approved stories or requirements into a reviewable solution design aligned to the phase 3 gate — components, data model with classification, integration contracts, security architecture, and traceability. Use when a story or feature needs a design before implementation starts.
phase: 03-architecture-design
delivery_stages: []
---

# Design a Feature

SOURCE — human-edited. Universal skill.

## What this is for

Phase 3's general design skill. `record-a-decision` captures a single decision; this skill produces the whole design a set of approved stories needs before `implement-from-spec` can start — structured so the output can be assessed directly against `sdlc/phases/03-architecture-design/gate.md`.

## Procedure

1. **Scope it.** Which stories or requirements is this design for? What is explicitly out of scope? What constraints apply — platform, budget, deadline, team? Greenfield, or a change to an existing system?
2. **Load inputs.**
   - The approved stories or spec, with their acceptance-criterion ids — unapproved input means stop and get it approved first.
   - Prior decisions under `docs/adr` in the consuming project. **Prior ADRs are authoritative**: a design that contradicts one either respects it or routes the reversal through `record-a-decision` — never silently overrides it.
   - Logged tech debt (see `log-tech-debt`) touching the affected subsystems.
   - If any load-bearing document is doubtful, run `rate-doc-confidence` before designing on top of it.
3. **Draft the design.** Sections mirror the gate checklist so the result is gate-ready:
   - **Approach summary** — readable on its own.
   - **Component design** — components and their responsibilities.
   - **Data model** — every entity the system touches carries a data classification: public / internal / confidential / restricted.
   - **Integration contracts** — named interfaces with their direction and shape. A contract the inputs don't define becomes an open question, never an assumption.
   - **Security architecture** — authentication, authorization, data at rest, data in transit. All four, every time.
   - **Regulatory mapping** — each applicable requirement (e.g. GDPR) mapped to a specific architectural control, not just named.
   - **Risk register** — one entry per documentation gap, low-confidence subsystem, or constraint conflict, each with a mitigation.
   - **Traceability** — one table: every acceptance criterion maps to a design element, and every design element serves at least one criterion. Orphans on either side are flagged for the human, never silently absorbed.
   - **Open questions** — everything the design cannot settle from its inputs.
4. **Surface decisions.** Every expensive-to-reverse choice — data store, integration pattern, auth model, deployment topology — goes through `record-a-decision`, stating the alternatives considered and why each was rejected. The gate requires an ADR per such decision.
5. **Self-check against the gate.** Walk the `sdlc/phases/03-architecture-design/gate.md` checklist and state which criteria the draft satisfies, which need human action (sign-offs), and which are not applicable and why.
6. **Present for human approval — never auto-save.** If a choice is contested, run `resolve-disagreements` before finalising. Once approved, hand off to `publish` (`skills/publish/SKILL.md`) with document class `spec`; report the pull request link back, not the file path.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Requirements_Design/5_Architecture_Design_Technical_Specifications.md`
- `get_document`: `Architecture_Design/Architecture_Decision_Documentation.md`
- `get_document`: `Architecture_Design/Data_Model_Flow_Design.md`
- `get_document`: `Security_Compliance/Phase3_Architecture_Security.md`
- `search_documents`: query `"architecture design"`

## Feeds into

`record-a-decision` for each decision the design surfaces. `resolve-disagreements` for contested choices. `publish` (class `spec`) once approved. `implement-from-spec` consumes the approved design in phase 4. `check-gate-readiness` assesses the phase against it.
