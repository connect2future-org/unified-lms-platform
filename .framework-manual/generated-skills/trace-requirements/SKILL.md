---
name: trace-requirements
description: Builds and maintains the requirement → story → test → release traceability matrix, closing the loop from phase 2 through to release. Use before any gate review or release to verify nothing approved was dropped and nothing shipped is untraced.
delivery_stages: []
---

# Trace Requirements

SOURCE — human-edited. Universal cross-cutting skill.

## What this is for

Each phase skill records its own local links — a story traces to a requirement, a test case traces to an acceptance criterion — but nothing joins those links end to end. This skill maintains the one matrix that does, so a gate review can see the full requirement-to-release chain and exactly where it breaks.

## Procedure

1. **Locate or create the matrix.** It lives at `docs/traceability-matrix.md` in the consuming project, created on first use via `write-a-deliverable`. Keep this exact table shape:

   | Requirement ID | Story ID(s) | Test case ID(s) | Latest test result | Release/version | Evidence |
   |---|---|---|---|---|---|
   | FR-012 | ST-034, ST-035 | TC-101, TC-102 | Pass (run 2026-08-07) | v1.4.0 | PR #58, test report link |

2. **Walk the chain forwards.** Every approved requirement maps to at least one story; every story's acceptance criteria to at least one test case; every test case to its latest result; every shipped change to a release identifier.
3. **Walk the chain backwards.** Everything in the release candidate maps back to an approved requirement. A change with no requirement behind it is a finding, not a footnote.
4. **Present breaks — never patch silently.** For each gap (requirement with no story, criterion with no test, failing test in a release candidate, untraced change), the human decides: fix, descope, or accept. Record the decision in the Evidence column; route accepted gaps to `log-tech-debt`.
5. **Refresh at every gate.** Update the matrix before each phase 2–6 gate review so `check-gate-readiness` and `prepare-for-release` can cite it as evidence rather than reconstructing the links.

## Feeds into

`check-gate-readiness` uses the matrix as gate evidence. `prepare-for-release` completes the release column. `log-tech-debt` records accepted gaps.
