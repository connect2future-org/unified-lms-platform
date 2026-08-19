---
name: publish
description: Route a finished deliverable to its destination and get it delivered — resolve the document class, write it, and hand off to commit-a-deliverable so it lands in git and opens a pull request. Use after any skill has produced a finished document.
---

<!-- SOURCE, human-edited. This is the one routing point every deliverable-producing skill hands off to. Universal path — no tool-specific syntax. -->

# Publish

Use this skill after any skill has produced a finished document, to decide where it goes and
get it there.

## The model in one line

Git is the system of record for every deliverable. SharePoint is a one-way mirror of *merged*
documents, for readers without repository access — reached through `mirror-to-sharepoint`, not
through routing.

## Procedure

1. **Resolve the destination.** Look up the document's class (e.g. `adr`, `report`, `spec`) in
   `output-routing.json` at the repo root. Its `routes` map gives the destination name; if the
   class isn't listed, use `default`. Look up that destination's config under `destinations`.

2. **Write the file.** Write it under the destination's `root` (`docs/`) in the *current* repo —
   the one this skill is actually running in, not the framework repo. Project output stays in
   the project.

3. **Hand off to `commit-a-deliverable`** (`skills/commit-a-deliverable/SKILL.md`), passing the
   document class, a kebab-case slug, the exact paths written, and the phase and gate criterion.
   It creates a branch, commits only those paths, pushes, and opens a pull request.

   Return the pull request link, not the file path. A file on disk isn't delivered; a pull
   request is. This matters most for someone who doesn't use git — they get a link and a
   sentence, and never see a git command.

   If `commit-a-deliverable` refuses at preflight (no git, no remote, no network), report its
   message as given. The document is still safe on disk and nothing is lost.

4. **Mention the mirror, don't do it.** If the class appears in `mirror.classes` in
   `output-routing.json`, tell the human the document can be copied to SharePoint for readers
   without repository access — *once the pull request is merged* — by running
   `mirror-to-sharepoint`.

   Do not mirror now. The document hasn't been reviewed yet, and putting unreviewed content on
   a stakeholder-visible surface is the thing the review gate exists to prevent.

## Consent

There is no consent step here. Writing to git inside the project repo is not a disclosure — the
content stays inside the same boundary it was produced in.

Consent is checked at the point content actually leaves that boundary, which is
`mirror-to-sharepoint`. That skill stops, asks for explicit confirmation and a sensitivity
label, refuses on silence, and logs to `docs/consent-log.md`. See its procedure for the full
gate.

## Limitation

This is process enforcement, not code-level enforcement. Nothing here stops a human bypassing
these skills and writing a file directly, or pushing to SharePoint by hand.

What it does now rest on is a real control: every deliverable arrives as a pull request that a
human has to approve, and nothing reaches a stakeholder-visible surface until that merge has
happened. That is a stronger position than a file write, but it is still procedural — the
approval is only as good as the reviewer.

## Feeds into

`commit-a-deliverable` always. `mirror-to-sharepoint` after merge, for mirrored classes.
