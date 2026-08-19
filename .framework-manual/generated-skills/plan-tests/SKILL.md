---
name: plan-tests
description: Builds a test strategy using the Heuristic Test Strategy Model — what gets tested, why, and by what technique — before build work begins. Use at phase 2 or as early as possible, to shift testing left.
phase: 05-testing-validation
delivery_stages: []
---

# Plan Tests

SOURCE — human-edited. Universal skill.

## What this is for

Defines the test approach before any build work starts, so what gets tested reflects what actually matters rather than just what's easy to verify. Uses the Heuristic Test Strategy Model (HTSM): four lenses that together cover environment, product, quality, and technique.

## Procedure

1. **Scope it.** Which deliverable, requirement, or work item is this strategy for? What phase? Any known constraints (timeline, tooling, team capacity)?
2. **Apply the four lenses:**

   **Project environment** — what does the deliverable need to achieve, and for whom? What information sources exist (requirements, ADRs)? Who executes tests? What does the schedule permit? Flag information gaps as testing risks.

   **Product elements** — structure (components, integrations, dependencies), data (inputs, outputs, edge cases, boundaries), interfaces (user-facing surfaces, API contracts), platform (deployment targets).

   **Quality criteria** — which quality dimensions matter most here: correctness, performance, security, accessibility, usability, maintainability, compliance. Rank by priority — they don't all carry equal weight for every deliverable.

   **Test techniques** — which apply: scripted (unit/integration/acceptance/regression), exploratory (charters for risk areas), review-based (peer review, standards check). For each, state what it covers and what it doesn't.
3. **Write the strategy**: scope and objectives, quality criteria ranking, approach per quality dimension, acceptance-criteria-to-test-case traceability, risks and gaps (what can't be tested and why), entry/exit criteria.
4. **Present for sign-off.** The human reviews and approves before it's saved.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Testing_Validation/1_Test_Strategy_Planning.md`
- `get_document`: `Documentation/Phase6_Test_Documentation.md`
- `search_documents`: query `"testing strategy"`

## Feeds into

`write-tests` — turn this strategy into actual test cases.
