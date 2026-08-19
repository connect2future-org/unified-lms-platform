---
name: write-user-stories
description: Decomposes an approved requirements specification into user stories with testable acceptance criteria, plus the UX flows those stories sit inside. Use after requirements are approved, or during backlog refinement.
phase: 02-requirements-design
delivery_stages: []
---

# Write User Stories

SOURCE — human-edited. Universal skill.

## What this is for

Turns approved requirements into sprint-ready stories and the user journeys they belong to. Story writing and UX flow design are treated together here because they're interdependent in practice: a story without UX context is ambiguous, and a flow without traceable acceptance criteria can't be verified.

## Procedure

1. **Scope it.** Which requirements/epics are being decomposed — all, or a subset? Existing personas, or derive them? Sprint-ready granularity, or epic-level for planning? Any UX constraints (design system, accessibility standards, device targets)?
2. **Load the approved requirements specification** and any prior decisions that constrain UX or story structure.
3. **Define or validate personas** — role, goals, pain points, and which requirement IDs each persona cares about. These become the "As a…" in every story.
4. **Decompose into epics and stories.** Each epic links back to a requirement group. Each story:
   - Has an ID, and reads "As a [persona], I want [capability] so that [value]"
   - Traces to specific requirement IDs
   - Passes an INVEST check (Independent, Negotiable, Valuable, Estimable, Small, Testable)
   - Has at least 2 acceptance criteria in Given/When/Then form — one happy path, one edge case minimum
5. **Map UX flows.** For each epic or journey: entry point, sequential steps, exit point, error paths, and which stories the journey exercises. Note accessibility considerations (keyboard nav, screen reader flow, colour contrast) and cross-journey dependencies.
6. **Check quality before presenting**: every requirement has a story, every story has ≥2 acceptance criteria and traces to a UX flow, no orphan stories or requirements.
7. **Present grouped by epic for human approval.** Save once approved.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Documentation/Phase2_User_Story_Templates.md`
- `get_document`: `Requirements_Design/User_Story_Enhancement.md`
- `search_documents`: query `"user story"`

## Feeds into

`resolve-disagreements` for contested stories or UX calls. `plan-tests` to define the test approach against these acceptance criteria.
