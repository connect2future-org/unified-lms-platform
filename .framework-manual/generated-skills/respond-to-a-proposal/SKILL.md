---
name: respond-to-a-proposal
description: Runs a structured bid or tender response from client materials through to a traceable, evaluated response pack — one approved section at a time. Use when responding to an ITT, RFP, or RFI.
phase: 01-strategy-planning
delivery_stages: [pre-sales]
---

# Respond to a Proposal

SOURCE — human-edited. Universal skill.

## What this is for

Turns an invitation to tender (or RFP/RFI) into a governed, traceable response — from reading the client's ask through to a challenged first draft. Runs before any delivery engagement exists, so it produces its own working documents rather than assuming phase 1 artefacts exist yet.

## Procedure

1. **Produce a one-page bid summary** from everything the client has supplied: what they're asking for, every evaluation criterion (with weightings if stated), key constraints (timeline, budget, mandatory requirements), and open questions or ambiguities. Pause for approval before proceeding — flag anything unclear rather than assuming an answer.
2. **Extract a requirements/questions matrix.** Pull every client question, requirement, and evaluation criterion out of the client's materials — including things buried in narrative paragraphs, not just numbered lists. Give each a sequential ID (RQ-001, RQ-002…). This matrix becomes the single source every response section must trace back to. Pause for approval.
3. **Build a response scaffold** — one section per major evaluation area. For each section, note which RQ IDs it covers. Pause for approval before drafting any content — do not draft all sections at once.
4. **Draft section by section.** For each approved section, draft content, cite which RQ IDs it addresses, and flag any RQ IDs that remain unaddressed. Pause for approval after each section before moving to the next.
5. **Challenge the draft.** Once a full first draft exists, get it reviewed from a skeptical outside perspective — does it answer every criterion, where would a reviewing client push back hardest, are the commercial and delivery commitments realistic. Produce a prioritised action list before submission.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Sample_Docs_Templates/Business_Problem_Statement.md`
- `get_document`: `Sample_Docs_Templates/Project_Charter_Template.md`

No dedicated pre-sales document exists on the server as of August 2026 - the two
above are the nearest scoping templates.

## Feeds into

On a win, `kick-off-a-project` transitions the bid materials into a real delivery engagement.
