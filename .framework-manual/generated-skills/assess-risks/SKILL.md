---
name: assess-risks
description: Surfaces the most likely ways a piece of work could fail, before it starts, so the team can acknowledge and mitigate risk consciously rather than discover it late. Use before a sprint, a major deliverable, or entering a new phase.
phase: 01-strategy-planning
delivery_stages: []
---

# Assess Risks

SOURCE — human-edited. Universal skill, works the same in Claude Code, Copilot, Codex, or Gemini.

## What this is for

Before starting a sprint, task, or major deliverable, this skill surfaces the most likely failure modes and puts them in front of a human before any work begins. It is most valuable at phase 1 (kicking off), phase 4 (before a build sprint), and phase 7 (before go-live), but can be run before any risky piece of work in any phase.

## Procedure

1. **Gather context.** Read the relevant phase's `Overview.md` and `gate.md`/`checkpoint.md` under `sdlc/phases/`, plus any project documentation for the work about to start.
2. **Scan for known gaps.** Look for contradictions or stale documentation touching the work (see `rate-doc-confidence` and `check-against-existing-docs`).
3. **Check for prior deferrals.** Look for previously logged tech debt (see `log-tech-debt`) or past risk acceptances that affect this work.
4. **Synthesise the top 3 failure risks.** Be specific: "tests might fail" is not a failure mode; a failure mode names the concrete local evidence that exposes this work to it. Local history means what the project actually records (its `docs/usage-log.md`, past gate reports, incident notes) — never invent history. For each risk, state:
   - **Risk** — what could go wrong
   - **Source** — which document, gap, or deferred item surfaced it
   - **Impact** — what happens if it materialises
   - **Mitigation** — what the team can do before starting to reduce the likelihood
   - **Confidence** — High / Medium / Low, how sure you are this risk is real
5. **Present to the human and wait.** Display the risk brief and get explicit acknowledgement before proceeding. The human may add risks, dismiss risks, or ask for deeper investigation on any item.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Strategy_Planning/Risk_Assessment.md`
- `get_document`: `Security_Compliance/Phase1_Risk_Assessment.md`
- `search_documents`: query `"risk assessment"`

## Feeds into

Run `resolve-disagreements` if a risk surfaces a contested approach, or go straight into the work with risks acknowledged.
