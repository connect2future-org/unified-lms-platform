---
name: write-a-deliverable
description: Guides the creation of any SDLC deliverable or artefact — classify it, check for existing templates and prior decisions, draft with human validation, keep the enclosing README in sync. Use whenever creating, populating, or drafting a project document.
delivery_stages: []
---

# Write a Deliverable

SOURCE — human-edited. Universal cross-cutting skill.

## What this is for

A consistent way to produce any project document, so quality doesn't depend on which skill happened to trigger the writing. Other phase skills (`implement-from-spec`, `record-a-decision`, etc.) can invoke this for the actual authoring mechanics.

## Procedure

1. **Classify the artefact** — is it a phase deliverable, a governance document, a cross-cutting artefact (e.g. a traceability matrix), or a decision record?
2. **Check for an existing template or prior version** before drafting from scratch. Ask the human for any existing documentation, templates, or standards to incorporate — never assume there's nothing to reuse.
3. **State the principle behind it.** Before drafting, say plainly what requirement or convention is driving this artefact's shape, and confirm the human agrees before producing content.
4. **Draft it**, citing evidence sources for anything factual, and including basic governance metadata (owner, version, status) where the artefact needs it.
5. **Human validation — never auto-save.** Present the artefact for review; only save once explicitly approved.
6. **Update the enclosing README if one exists and lists folder contents** — new file gets added, updated file gets its description refreshed, deleted file gets removed. If no README exists in that folder, skip this step.

## Feeds into

`record-a-decision` if drafting surfaces a decision. `check-gate-readiness` if this deliverable is required for an upcoming gate.
