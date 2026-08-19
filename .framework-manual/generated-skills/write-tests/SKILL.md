---
name: write-tests
description: Turns an approved test strategy into concrete test cases and exploratory charters, with preconditions, steps, and expected results. Use as soon as stories and a test strategy are approved — preferably before implementation starts; execution still waits for phase 5.
phase: 05-testing-validation
delivery_stages: []
---

# Write Tests

SOURCE — human-edited. Universal skill.

## What this is for

Converts a test strategy's intent into things you can actually run: numbered test cases for scripted testing, charters for exploratory testing.

Draft acceptance test cases before the code exists wherever the stories allow it — a test written before implementation cannot be written to match whatever got built, and it gives phase 4 a concrete target to code against. Execution still belongs to phase 5.

## Procedure

1. **Load the approved test strategy.** Extract its quality criteria ranking, approach per dimension, acceptance-criteria mappings, and entry/exit criteria.
2. **Write test cases.** For each one:

   | Field | Content |
   |---|---|
   | ID | TC-NNN |
   | Title | What's being tested |
   | Traces to | Acceptance criterion / requirement ID |
   | Priority | Critical / High / Medium / Low |
   | Preconditions | What must be true first |
   | Steps | Numbered steps to execute |
   | Expected result | Observable, measurable outcome |
   | Technique | Scripted / Exploratory / Review-based |
3. **Write exploratory charters** for risk areas the strategy flagged for exploration:

   | Field | Content |
   |---|---|
   | ID | EC-NNN |
   | Explore | What area/behaviour |
   | With | Techniques, data, tools |
   | To discover | What risk you're hunting |
   | Oracles to prioritise | Which oracles (below) will recognise a problem here |
   | Time-box | Recommended duration |
   | Debrief expectations | What the session must report back (see below) |

   **Oracles** — an oracle is the principle by which a tester recognises a problem; "it seemed wrong" is not an oracle. Name the ones most likely to fire for this charter: consistency with the **specification**, with **comparable products**, with **user expectations**, **within the product** (does it contradict itself?), with **purpose**, with **history** (regressions), with **claims** (labels, docs, tooltips) — plus the **explainability heuristic** (behaviour nobody can explain is itself a finding).

   When choosing charter focus, rotate across the HTSM quality criteria the strategy ranked (capability, reliability, usability, security, scalability, compatibility, performance) rather than fixating on one dimension.

   **Debrief expectations** — every charter states what its execution session must report: whether the charter was fulfilled, what was actually covered, gaps left unexplored (a first-class output, not a footnote), and each finding naming the oracle that flagged it.
4. **Check traceability.** Every acceptance criterion has at least one test case; every compliance requirement from the strategy has a verification test. Present any gap explicitly — the human decides whether to add a test or consciously defer it.
5. **Present for approval**, then save alongside the deliverable being verified. When run before implementation, approval includes the business/product owner, not just QA — they are agreeing "when these pass, the story is done".

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Documentation/Phase6_Test_Documentation.md`
- `get_document`: `Testing_Validation/1_Test_Strategy_Planning.md`

## Feeds into

`run-tests-and-report` — execute this suite. `log-tech-debt` if a gap is consciously deferred rather than tested.
