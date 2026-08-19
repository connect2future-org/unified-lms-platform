---
name: status
description: Reports project status — git state, SDLC phase position, usage-log summary, and Copilot credit spend — so an engineer can resume work or judge adoption without reconstructing state by hand. Read-only.
delivery_stages: []
---

# Status

SOURCE — human-edited. Universal cross-cutting skill — not tied to one phase. Read-only: never write, modify, or trigger anything.

## What this is for

One command that answers "where is this project and what has the framework cost so far". Reads real files and scripts; never guesses or interpolates state.

## Procedure

1. **Git state.** Run `git status`, `git branch --show-current`, `git log --oneline -5`. Report branch, uncommitted changes, recent commits.
2. **Phase position.** Identify the current SDLC phase from recent work and check its `sdlc/phases/<NN>-<slug>/gate.md` (phases 1–6) or `checkpoint.md` (phases 7–9). Report which criteria look met and which don't — for a formal assessment, use `check-gate-readiness` instead.
3. **Usage summary.** Run `./tools/report-usage.ps1`. Report total entries, breakdown by skill/agent and phase, and the credits total when the log has one.
4. **Copilot credit spend.** Run `./tools/report-copilot-credits.ps1` (add `-Detailed` if asked). Report per-session totals and the project total in credits and USD. State the limits every time: VS Code Copilot chat sessions only, undocumented log format, indicative not audited.
5. **Tech debt.** If a debt log exists (see `log-tech-debt`), report open items by severity.
6. **Recommended next action.** One line, grounded in what was read — e.g. "phase 4 gate criteria unmet: tests missing" or "usage log has no credits recorded; run report-copilot-credits and backfill new rows".

If a file or script is missing, say so — do not assume a default state.

## Feeds into

`check-gate-readiness` for a formal gate assessment; `log-tech-debt` if the status run surfaces unrecorded debt.
