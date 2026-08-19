---
name: commit-a-deliverable
description: Puts a finished document into git on its own branch and opens a pull request, so someone who does not use git never has to. Handles every git operation and refuses the dangerous ones. Use after publish has written a deliverable to disk.
delivery_stages: []
---

# Commit a Deliverable

SOURCE — human-edited. Universal cross-cutting skill.

## What this is for

A document written to `docs/` is not delivered. It sits uncommitted, unreviewed and invisible
to everyone else. This skill closes that gap, and does it without the person who wrote the
document needing to know what a branch is.

`publish` decides *where* a document goes. This skill *gets it there*.

## The boundary — read this first

This is the **only** skill in the framework permitted to run git commands that change state.
Within that, it does four things and refuses everything else:

**It will:** create a branch, stage named files, commit, push, open a pull request.

**It will not:** merge, rebase, resolve a conflict, force-push, amend, reset, delete a branch,
or touch any branch other than the one it just created. If asked to do any of these, decline
and say a technical reviewer handles it.

That boundary is the whole reason this skill is safe to hand to someone who cannot read a git
error. Every operation it performs is additive and reversible by someone else. None of them
can lose work.

## Inputs

- **Document class** (e.g. `adr`, `report`, `spec`) — used for the branch name and PR title.
- **Slug** — a short kebab-case description of the document.
- **Paths to stage** — the explicit file paths this deliverable consists of. Usually one.
- **Phase and gate criterion** — for the commit body and PR description, per `AGENTS.md`.

## Preflight

Run every check before doing anything. On failure, stop and give the plain-language message.
Never retry, never loop, never work around a failure — say what is wrong and who fixes it.

| Check | If it fails, say |
|---|---|
| `git` is on PATH | "Git isn't installed on this machine. Install it from https://git-scm.com/downloads, then ask me again. Your document is safe at `<path>` — nothing is lost." |
| Inside a git repo | "This folder isn't part of a project repository: `<folder>`. Your document is saved there, but I can't share it until someone sets the project up. Nothing is lost." |
| A remote named `origin` exists | "This project has no shared home set up yet, so there's nowhere to send the document. Ask whoever set up the repository to add a remote. Your document is safe at `<path>`." |
| `git fetch origin` succeeds | "I couldn't reach the project server. That's usually the network or a sign-in that's expired. Your document is safe at `<path>` — try again once you're connected." |
| Every path to stage exists | "I was asked to share `<path>` but it isn't there. Nothing has been committed." |

Do not attempt to authenticate on the user's behalf, and never handle credentials. If a push
later fails on authentication, say: *"The project server rejected the sign-in. Run
`gh auth login` (GitHub) or `glab auth login` (GitLab) in a terminal, then ask me again.
Your document is committed locally — nothing is lost."*

## Procedure

1. **Fetch and find the default branch.**
   `git fetch origin`, then read the default branch from `origin/HEAD`
   (`git symbolic-ref refs/remotes/origin/HEAD`). Fall back to `main`, then `master`, if it
   isn't set. Never assume.

2. **Create a fresh branch from the remote default.**
   `git switch -c docs/<class>-<slug> origin/<default>`

   Branching from `origin/<default>` rather than the current HEAD is deliberate: it means a new
   document cannot conflict with anything, whatever state the local working tree is in. If the
   branch name already exists, append `-2`, `-3`. Never reuse a branch.

3. **Stage only this deliverable's paths.**
   `git add -- <path> [<path> ...]`

   **Never `git add -A`, never `git add .`, never `git commit -a`.** The working tree may hold
   unrelated changes that belong to someone else's work. Sweeping those into a document commit
   is the worst thing this skill could do. Stage the named paths and nothing else.

   Then confirm what is actually staged with `git diff --cached --name-only` and report it. If
   anything unexpected appears, stop and say so.

4. **Commit.** Subject line: `docs(<class>): <short description>`. Body states the phase, the
   gate criterion, and which skill produced the document — the same facts `AGENTS.md` requires
   in a PR description.

5. **If the pre-commit hook fails, stop.**
   `.githooks/pre-commit` runs `tools/sync.ps1 -Check` and `tools/lint.ps1`. If it blocks the
   commit, report its output verbatim and stop.

   **Never pass `--no-verify`.** A framework lint failure blocking someone's document is a real
   problem, but silently bypassing the gate is a worse one. Say which check failed, that it is
   a framework issue and not anything they did wrong, and that someone technical needs to fix
   it. The document is still safe on disk.

6. **Push the branch.** `git push -u origin <branch>`.

7. **Open the pull request.** Detect the host from `origin`'s URL:
   - GitHub → `gh pr create --title ... --body ...`
   - GitLab → `glab mr create --title ... --description ...`

   The body follows the `AGENTS.md` rule: phase and gate identified, acceptance criteria traced,
   tests updated (or "N/A — documentation change"), tech debt logged (or "none").

8. **If neither CLI is installed, do not fail.** The push already succeeded, so the work is
   safe. Print the browser URL to open the request manually — `<remote>/compare/<branch>` on
   GitHub, `<remote>/-/merge_requests/new?merge_request[source_branch]=<branch>` on GitLab —
   and say the last step has to happen in a browser.

9. **Hand back the link and stop.** One sentence, no jargon: the document is saved and shared,
   here is the link, someone needs to approve it, nothing else is needed from you.

## After the pull request is merged

If the document's class is listed under `mirror.classes` in `output-routing.json`, it can be
copied to a SharePoint folder for people without repository access. That is a separate,
consent-gated step — see `mirror-to-sharepoint`. Do not offer to do it before the merge.

## Feeds into

`mirror-to-sharepoint` once the pull request is merged, for classes that stakeholders outside
the repository need to read. `log-tech-debt` if a lint or hook failure was worked around rather
than fixed.
