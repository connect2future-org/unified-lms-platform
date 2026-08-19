---
name: record-a-decision
description: Records an architectural or design decision as a formal, traceable ADR — the decision, why it was made, and what was rejected. Use whenever a significant decision is made in any phase, then publishes it via the publish skill.
phase: 03-architecture-design
delivery_stages: []
---

# Record a Decision

SOURCE — human-edited. Universal skill. This is the framework's worked example — run it end to end to see all five layers work together (see the README's quickstart).

## What this is for

Every decision that shapes the project's direction — whether it came from a human directive, an agent's recommendation, or a debate resolved by `resolve-disagreements` — gets a permanent, traceable record. Without this, "why did we choose X" becomes folklore within a month.

## When to use it

- A human directs a particular architectural or design approach
- An agent recommends an approach and the human approves it
- A debate (`resolve-disagreements`) resolves a contested point
- Any other skill's workflow reaches a choice between named alternatives

## Procedure

1. **Identify the decision.** Capture:
   - The question being decided
   - The decision made
   - Its source: human directive / agent recommendation (approved) / resolved debate
   - The rationale — why this approach and not another
   - The alternatives considered, and why each was rejected
2. **Draft the ADR** using this structure:
   - **Context** — what situation prompted this decision
   - **Decision** — the chosen approach, stated plainly
   - **Alternatives considered** — each one, with the reason it was rejected
   - **Consequences** — what this commits the project to, including trade-offs accepted
   - **Status** — `Proposed` until approved
3. **Present the full draft to the human.** No ADR is saved without explicit approval. The human may amend before confirming.
4. **Hand off to `publish`** (`skills/publish/SKILL.md`) with document class `adr`. `publish` resolves the destination from `output-routing.json` (ADRs route to `git` — no consent step needed, this isn't leaving the repo), writes the file, then hands off to `commit-a-deliverable`, which branches, commits, pushes and opens a pull request. Report the pull request link back, not the file path — the ADR isn't recorded until someone approves it.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Sample_Docs_Templates/Architecture_Decision_Records_Template.md`
- `get_document`: `Architecture_Design/Architecture_Decision_Documentation.md`
- `search_documents`: query `"architecture decision record"`

## Feeds into

`resolve-disagreements` if the decision needs challenge before it's finalised. `log-tech-debt` if the decision involved accepting a known trade-off rather than the ideal approach.
