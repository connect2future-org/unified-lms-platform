---
name: gather-requirements
description: Turns raw stakeholder input, interviews, and existing documentation into a structured, classified, traceable requirements specification. Use at phase 2 entry, or whenever new stakeholder input needs to be structured.
phase: 02-requirements-design
delivery_stages: []
---

# Gather Requirements

SOURCE — human-edited. Universal skill.

## What this is for

The bridge between a phase 1 problem statement and real phase 2 artefacts. Without a structured elicitation step, teams jump straight from a vague problem statement to user stories and discover the gaps late, during build. This skill drives the elicitation itself — stakeholder analysis, conflict and gap detection, classification — not just the write-up.

## Procedure

1. **Scope the elicitation.** Ask: what's the source material (transcripts, workshop notes, existing docs)? Who are the stakeholders? Any known constraints or non-negotiables carried over from phase 1? Is this a full elicitation or adding to an existing spec?
2. **Load context** — the phase 1 problem statement and project charter, any prior architectural decisions that constrain requirements, and any existing specification if this is incremental.
3. **Map stakeholders.** For each stakeholder or group: their role, primary concerns and success criteria, decision authority, and constraints they impose. Present for validation.
4. **Extract and classify every requirement** found in the source material:

   | Classification | Description | Example |
   |---|---|---|
   | Functional (FR) | What the system must do | "System shall auto-categorise tickets" |
   | Non-functional (NFR) | Quality attributes | "Response time < 2s at P95" |
   | Business rule (BR) | Policy the system enforces | "VIP customers escalated within 1hr" |
   | Technical constraint (TC) | Fixed technology/integration boundary | "Must integrate with existing SAP instance" |
   | Data requirement (DR) | Data needs, sources, retention | "7-year audit trail" |
   | Regulatory (RC) | Legal/regulatory obligation | "GDPR Article 17 right to erasure" |

   Give each a unique ID, state it unambiguously, note its source, priority (MoSCoW), and dependencies.
5. **Find conflicts and gaps.** Flag requirements that contradict each other (send to `resolve-disagreements`), implied-but-unstated needs, and ambiguities needing client clarification.
6. **Write the specification**: executive summary, stakeholder analysis, requirements by category, assumptions, outstanding questions, and traceability back to phase 1.
7. **Present section by section for human approval.** Save once approved.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Documentation/Phase2_Requirements_Standards.md`
- `get_document`: `Requirements_Design/AI_Requirements_Gathering.md`
- `get_document`: `Sample_Docs_Templates/Requirements_Backlog_Template.md`
- `search_documents`: query `"requirements"`

## Feeds into

`write-user-stories` — decompose the approved requirements into sprint-ready stories. `resolve-disagreements` for any unresolved conflicts. `record-a-decision` for any trade-off made during elicitation.
