---
name: run-tests-and-report
description: Executes test cases against a deliverable and reports pass/fail with cited evidence, routing failures to a fix/defer/accept decision. Use once test cases exist and the deliverable is ready to validate.
phase: 05-testing-validation
delivery_stages: []
---

# Run Tests and Report

SOURCE — human-edited. Universal skill.

## What this is for

Executes a test suite against a deliverable, cites evidence for every result, and forces an explicit human decision on every failure rather than letting it slide silently.

## Procedure

1. **Load the test suite and the deliverable(s)** to test against. Confirm whether this is a full run or a re-run of specific failed tests.
2. **Execute each test case.** Record one of:

   | Result | Meaning |
   |---|---|
   | PASS | Expected result fully met — cite the specific evidence |
   | FAIL | Expected result not met — cite expected vs. found |
   | PARTIAL | Some elements met, others missing — cite both |
   | BLOCKED | Preconditions not met — state which, and why |
   | NOT_RUN | Skipped — state why |
3. **Run exploratory charters.** Record observations as Issue / Risk / Observation / No issues found.
4. **Write the execution report**: summary counts by result, detailed per-test-case results with evidence, exploratory findings, and acceptance-criteria coverage.
5. **For every FAIL or PARTIAL, present three options to the human**: Fix (return to implementation), Defer (accept now, log as debt), Accept (the result is actually correct — update the test instead).
6. **Log every deferral** via `log-tech-debt` with category `TEST_COVERAGE`.
7. **If this run is for a gate**, feed the report into `check-gate-readiness` to assess whether results meet exit criteria.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Testing_Validation/6_Test_Results_Quality_Gates.md`
- `get_document`: `Testing_Validation/4_Quality_Assessment_Analysis.md`
- `search_documents`: query `"quality gate"`

## Feeds into

`log-tech-debt` for deferrals. `check-gate-readiness` if this run gates a phase transition.
