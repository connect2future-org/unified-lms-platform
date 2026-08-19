---
name: kick-off-a-project
description: Starts a new project delivery engagement — reviews initial documents, confirms how code and documentation will be organised, and scaffolds phase 1 artefacts one at a time with human approval. Use once, at the very start of a new engagement.
phase: 01-strategy-planning
delivery_stages: []
---

# Kick Off a Project

SOURCE — human-edited. Universal skill.

## What this is for

The first thing you run on a new engagement. Turns a folder of initial documents (terms of reference, client briefings) into a working phase 1 setup, and gets an explicit decision on how code will relate to this documentation before any build work starts.

## Procedure

1. **Read everything supplied so far** — terms of reference, client briefings, any existing documentation.
2. **Summarise it.** Write a short summary of what the team has been asked to do and where the source material lives.
3. **Identify key deliverables, workstreams, and timeline** from the terms of reference.
4. **Confirm repository structure before any build work begins.** Ask the human directly:
   > "How do you want application code organised relative to this documentation? A monorepo (code alongside docs, e.g. `src/` at the root) or a separate code repository (or repositories) linked from here?"
   Record the answer. If code will live in one or more separate repos, note every repo name and link so future work can reference them.
5. **Scaffold phase 1 artefacts one at a time**, pausing for human review and approval after each before moving to the next. Never bulk-produce a phase's artefacts up front.
6. **Phases 1 → 2 → 3 must be completed in strict sequence** — do not start phase 2 artefacts until phase 1's gate has passed. Phases 4 onward may run in parallel where team capacity allows, but every phase still needs its own entry/exit approval.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Sample_Docs_Templates/Project_Charter_Template.md`
- `get_document`: `Sample_Docs_Templates/Business_Problem_Statement.md`
- `get_document`: `Documentation/Phase1_Strategy_Templates.md`

## Feeds into

`assess-risks` — surface failure risks before the first phase of real work begins.
