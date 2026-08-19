---
name: check-gate-readiness
description: Assesses whether a phase is ready to pass its gate (or checkpoint) by validating every exit criterion against real evidence and producing a pass/conditional/fail report. Use before any phase transition.
delivery_stages: []
---

# Check Gate Readiness

SOURCE — human-edited. Universal cross-cutting skill — not tied to one phase, since every phase 1–6 has a `gate.md` and phases 7–9 have a `checkpoint.md`.

## What this is for

A repeatable way to answer "are we actually ready to move on" instead of assuming it. Checks every required artefact and criterion — never by sampling — and forces explicit human sign-off before a gate is declared passed.

## Procedure

1. **Scope it.** Which phase's gate or checkpoint is being assessed? Full formal assessment, or a progress check? Any known blockers to focus on?
2. **Read the relevant `sdlc/phases/<NN>-<slug>/gate.md` (or `checkpoint.md` for phases 7–9)** to get the actual exit criteria for that phase.
3. **Check for carried-over items.** Scan any previous gate report for items marked Deferred or Conditional Pass — every phase entry must explicitly address what was deferred from the last one.
3a. **Load derived gate state if the project opted in.** If `docs/gates/<NN>-<slug>.evidence.json` exists in the consuming project, ask the human to run `tools/derive-gate-state.ps1 -Phase <NN>-<slug>` (or run it where permitted) and read the resulting `docs/gates/<NN>-<slug>.gate-state.json` as the deterministic starting column for step 4. Derived statuses come from evidence paths and check exit codes only. Prose assessment may add caveats or downgrade, but never upgrades a derived red or pending — and a green rollup still proves only that evidence is present, not sufficient. If no evidence manifest exists, proceed as normal; the derived state is optional.
4. **Validate every exit criterion**, one row per criterion, following the same protocol for each: open the artefact the criterion depends on, apply the status anchors below, record the specific evidence, then assign the status. Never assess on impression — "seemed fine" is not evidence, and every status must cite what was actually read.

   | Criterion | Status | Evidence | Notes |
   |---|---|---|---|
   | [criterion] | ✅ Complete / ⚠️ Partial / ❌ Missing | [file/path or note] | [caveats] |

   **Status anchors:**
   - ✅ **Complete** — the artefact exists, was opened, and satisfies the criterion in full. Evidence names the file and the specific content that satisfies it.
   - ⚠️ **Partial** — the artefact exists but the criterion is only partly met. Evidence names both what is present and exactly what is missing.
   - ❌ **Missing** — no artefact satisfies the criterion. Evidence states explicitly that none was found and where you looked.

   An honest Partial is worth more than a flattering Complete — never upgrade a status to make the report comfortable, and never mark Complete without having opened the evidence.
5. **Check documentation consistency** for the phase's artefacts using `rate-doc-confidence` if there's any doubt.
6. **Produce the readiness report**: recommendation (Pass / Pass with Conditions / Fail), blocking issues, non-blocking issues, deferred items carried forward, and the full criteria table. The recommendation must follow from the table: any Missing criterion is a blocking issue, and if more than half the criteria are Partial or Missing the recommendation cannot be better than Fail.
7. **Get explicit human sign-off** before recording the gate outcome. Never declare a gate passed unilaterally.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Testing_Validation/6_Test_Results_Quality_Gates.md` (phase 5 gate baseline)
- `get_document`: `Integration_PreProduction/6_PreProduction_Signoff_Readiness.md` (phase 6 gate baseline)
- `search_documents`: query `"quality gate"`

Fetch the server document matching the phase under review and use it as the evidence
baseline alongside the local `gate.md`. Prefer `get_document` with an exact path -
the server's fuzzy search misses valid documents, and its `phase` filter currently
returns identical results for every phase, so do not rely on it.

## Feeds into

Whatever the next phase's kick-off skill is, once the gate passes.
