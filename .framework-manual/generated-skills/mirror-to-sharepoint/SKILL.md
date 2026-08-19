---
name: mirror-to-sharepoint
description: Copies a merged deliverable from git to a synced SharePoint folder, so stakeholders without repository access can read it. One-way only, merged content only, consent-gated. Use after a document's pull request has been merged.
delivery_stages: []
---

# Mirror to SharePoint

SOURCE — human-edited. Universal cross-cutting skill.

## What this is for

Git is where deliverables live. It is not where a stakeholder reads them. Someone in
procurement, a client reviewer, or a delivery lead without repository access needs a document
in a browser, not a merge request.

This skill copies a merged document into a OneDrive-synced SharePoint library folder for those
readers.

## The direction is one-way, and that matters

Git → SharePoint. Never the reverse. The SharePoint copy is a **mirror**, not a source of
truth. Nothing in it is ever read back, and no edit made there is ever preserved — a re-run
overwrites it.

That is a deliberate constraint, not a limitation. A mirror is regenerable, so it cannot lose
work. A second destination would need merging, and OneDrive does not merge markdown — it forks
it into conflicted copies named after whichever laptop wrote second. Keeping SharePoint one-way
is what makes it safe.

Tell anyone who asks: edits made in SharePoint will be lost. Changes go through git.

## Two things this cannot do

State both on every run. Do not soften them.

1. **It cannot apply a sensitivity label.** A file copy has no way to set a Microsoft Purview
   label. The `Controlled` label in `output-routing.json` is advisory — the real label comes
   from the SharePoint library's default, set by whoever owns the site. `sensitivityLabelApplied`
   is `false` in the config for exactly this reason.

2. **A local write is not an upload.** The file lands in a synced folder. OneDrive uploads it
   afterwards, or fails to. Never report a document as published, delivered, or in SharePoint —
   report it as copied locally and queued.

Both gaps close only with a Microsoft Graph MCP server, which this framework does not have.

## Procedure

1. **Check the class is allowed to be mirrored.** Read `output-routing.json`. The class must be
   in `mirror.classes`. If it is in `mirror.never`, refuse:
   *"`<class>` is never mirrored. It's an append-only log — a synced copy would fragment the
   audit trail across conflicted duplicates, and it isn't useful to a stakeholder anyway."*

2. **Refuse to mirror unmerged work.** Confirm the file exists on the remote default branch:
   `git fetch origin` then `git cat-file -e origin/<default>:<path>`. If it does not:
   *"`<file>` hasn't been merged yet — it's still in <PR reference>. Nothing has been mirrored.
   Ask a reviewer to approve it first."*

   This is what keeps unreviewed content off a stakeholder-visible surface. Do not offer to
   mirror the working-tree copy instead.

3. **Consent gate. Stop here.** This is the point where content leaves the repository boundary,
   so consent is checked here rather than at `publish`.
   - Ask the human directly: confirm they have consent to place this data in this location, and
     which sensitivity label applies.
   - If they do not confirm, or cannot answer: refuse. State exactly what is missing — *"Need
     consent confirmation and a sensitivity label before this goes to SharePoint. Nothing has
     been copied."*
   - Never proceed on assumed or implied consent. Silence is not consent, and consent given
     earlier in the conversation for a different document does not carry over.

4. **Log the consent.** Append one line to the *consuming project's own* `docs/consent-log.md`
   — git-tracked, append-only, created on first use in whatever repo this is running in.
   Record: date, who confirmed, document path, destination, sensitivity label named, one-sentence
   consent basis, and **that the label was not applied by this copy**. Without that last field
   the consent log becomes a false audit record.

5. **Preflight the folder.** Each failure stops before anything is written:
   - `output-routing.local.json` exists and `sharepointRoot` is non-empty → otherwise
     *"No SharePoint folder is configured on this machine. Run `./tools/bootstrap.ps1`, or set
     `sharepointRoot` in `output-routing.local.json`. Nothing has been copied."*
   - The root path exists on disk → otherwise name it. This is usually a teammate who has not
     synced the library yet, or a path from a different machine.
   - The full target path is under 240 characters → otherwise name the length. Windows breaks
     at 260 and OneDrive breaks earlier.

6. **Copy the file.** Overwriting an existing copy is fine — the mirror is regenerable, so the
   worst case is a stale copy that a re-run fixes.

   If two people mirror at the same time, OneDrive may produce a conflicted duplicate named
   after one of their machines. That is harmless noise here rather than lost work, because the
   original is in git. Say so if it happens; do not pretend it cannot.

7. **Report honestly.** Every run ends with, in substance:

   > Copied to `<full path>`. That's a local OneDrive folder — the file is queued for upload,
   > not confirmed in SharePoint. The `Controlled` label was **not** applied by this copy; it
   > depends on the library's default. Check both in SharePoint before treating this as
   > delivered.

## Feeds into

`log-tech-debt` if a document was mirrored without a confirmed sensitivity label in place on the
library — that is an accepted control gap and should be recorded, not forgotten.
