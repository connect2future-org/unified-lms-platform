---
name: implement-from-spec
description: Implements code from an approved specification or user story — branch, test-first, small commits, verified build — pausing for human review at agreed checkpoints. Use whenever writing or changing code. For documents, use write-a-deliverable instead.
phase: 04-code-development
delivery_stages: []
---

# Implement from Spec

SOURCE — human-edited. Universal skill.

## What this is for

Turns an approved spec or user story into working code in small, reviewable steps, instead of one large change nobody can review properly. This is the entry point for all code work in phase 4. Document authoring is not this skill's job — hand that to `write-a-deliverable`.

## Procedure

1. **Confirm the spec.** Every code change traces to an approved spec or user story ID. If none exists, draft a short implementation spec first — goal, scope, acceptance criteria, out of scope — using `write-a-deliverable`, and get human approval before writing any code.
2. **Check existing context.** Read the code being changed, prior decisions (`docs/adr/`) that constrain it, and the phase 4 gate criteria the change must eventually satisfy. If the work surfaces a new design decision, flag it for `record-a-decision` before building on it.
3. **Branch.** Work on a branch named after the story or spec ID. Never commit directly to the default branch.
4. **Work test-first where the change is testable.** Where approved acceptance test cases (TC-NNN from `write-tests`) already exist for the story, implement against those — the failing test expresses the agreed test case, not a private reading of the acceptance criterion. Where none exist, write or update the failing test that expresses the acceptance criterion, then write the code that makes it pass. Where test-first is impractical (spikes, generated code, config), say so explicitly and record why.
5. **Commit small.** One logical change per commit, message stating intent and the story or spec ID. Run the build and the affected tests before each commit — never commit red.
6. **Verify against acceptance criteria.** Run the full test suite and build. For each acceptance criterion, state the evidence that satisfies it (test ID, passing run, commit). Present any unmet criterion to the human — the human decides whether to fix, descope, or defer.
7. **Open the PR.** The description states: phase and gate identified, acceptance criteria traced, tests updated, tech debt logged via `log-tech-debt` (or "none"). A missing item holds the PR.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Code_Development/Overview.md`
- `get_document`: `Code_Development/Mindset_and_Principles.md`
- `get_document`: `Documentation/Phase4_Prompt_Library.md`

## Feeds into

`scan-for-security-risks` for any change touching credentials, PII, or customer data. `log-tech-debt` for shortcuts taken along the way. `run-tests-and-report` and `check-gate-readiness` as the change heads towards the phase 4 gate.
