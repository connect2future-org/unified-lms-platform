<!--
AGENTS.md — SOURCE. Edit 1 of 3.
This is the project's instructions file: house rules every AI agent follows on every task,
in every tool. Human-edited. Never edit the generated copies (CLAUDE.md, GEMINI.md,
.github/copilot-instructions.md) — they are derived from this file by tools/sync.ps1 and
overwritten on the next run.
-->

# Project instructions

Single source of truth for AI agent behaviour in this repository.

## AI framework invocation

- Use the default coding workflow for every request unless the user explicitly asks to
  run a named SDLC skill, a named custom agent, a phase/gate/checkpoint assessment, or
  an MCP-backed documentation lookup.
- Do not infer, select, trigger, recommend, load, or execute a skill or agent solely
  because a task, prompt, query, filename, or keyword resembles its description.
- Treat skills, agents, SDLC phases, gates, checkpoints, output routing, and the usage
  log as opt-in framework features. They run only when the user explicitly names the
  feature or invokes its endpoint/command.
- Explicit examples include: `/status`, "run `run-tests-and-report`", "use the
  `reviewer` agent", "assess the Phase 05 gate", or "query the documentation MCP".
- A normal request to implement, fix, test, review, explain, or search does not invoke
  any framework feature. Do not ask for SDLC phase, skill, gate, evidence paths, or
  human approval unless the user has explicitly invoked the framework.
- Retain all framework files and tooling. Manual invocation remains available.

## Coding standards

- British English in prose and comments.
- Active voice. Main point first.
- Small, reviewable commits — one logical change per PR.
- Describe intent in a PR, not just the diff.
- Every PR description states: phase and gate identified, acceptance criteria traced,
  tests updated, tech debt logged (or "none"). Missing any of these is a reason to hold
  the PR, not merge it — this is a process rule, not a CI check.

## Security and controlled data

- Never commit secrets. Use the platform secret store, referenced by name.
- Flag any code or content that handles credentials, PII, or customer data.
- Customer or controlled content never gets baked into framework files (skills, agents,
  phase docs). Retrieve it live through an MCP server instead of pasting it into context.
- Before copying a document anywhere outside the repository (see `output-routing.json`
  and `skills/mirror-to-sharepoint/SKILL.md`), get explicit human confirmation and a
  sensitivity label — do not assume consent from earlier in the conversation, and do not
  carry consent over from a different document.
- `commit-a-deliverable` is the only skill permitted to run git commands that change
  state, and only additive ones — branch, stage named paths, commit, push, open a PR.
  Never `git add -A` when committing a deliverable; stage the named paths only, or you
  sweep someone's unrelated work into a documentation commit. Never `--no-verify`.
  In Claude Code these rules are also enforced mechanically by `tools/hooks/git-guard.ps1`
  (wired via `.claude/settings.json`): forbidden shapes are denied, and any commit, push,
  or PR-create asks the human to confirm. The hook is a tripwire, not a complete control,
  and other tools (Copilot, Codex, Gemini) run no hooks — for them this rule stays
  process-only, backed by PR review.

## Working with the SDLC phases

- This section applies only after the user explicitly invokes an SDLC phase, gate,
  checkpoint, skill, agent, or other framework workflow.
- Phase definitions live in `sdlc/phases/`. Check the current phase's `gate.md` (phases
  1–6) or `checkpoint.md` (phases 7–9) before treating a phase as complete.
- Before making any code change, tool edit, or SDLC-governed output, identify which
  skill, phase, and gate/checkpoint criterion applies. If any of these is unclear, stop
  and ask one clarifying question — do not guess or proceed on assumption.
- Before starting implementation, state this checklist and stop if any field is blank:

  ```
  Phase:
  Skill:
  Gate/checkpoint criterion:
  Evidence paths:
  Proceed approved by human: Yes/No
  ```

- Reusable kickoff prompt: "Before doing any implementation, identify SDLC phase,
  skill, and gate criterion, then wait for approval."
- Do not start implementation work without a linked, approved spec or user story. If
  none exists, draft a short implementation spec via `implement-from-spec` and get
  human approval before writing code.
- Present the relevant principle or gate criterion, and get human validation before
  treating output as final — don't decide silently on the user's behalf.
- Ask whether existing documentation already covers something before creating a new
  artefact from scratch.
- When several open questions exist, ask one at a time, and recap what's still
  unanswered at the end of a response.
- When a standards or documentation MCP server is configured (see `mcp/servers.json`),
  query it for current guidance rather than relying on memorised knowledge — MCP content
  changes independently of this repo.

## Tracking skill and agent usage

- This section applies only to an explicitly invoked skill or agent task.
- After finishing any skill or agent task, append one row to the *consuming
  project's own* `docs/usage-log.md` — git-tracked, append-only, created on
  first use (never in the framework repo) with this exact table:

  ```
  | Date | Tool | Type | Name | Phase | Outcome | Effort saved | Credits |
  |---|---|---|---|---|---|---|---|
  | 2026-08-07 | copilot | skill | kick-off-a-project | 01-strategy-planning | Produced initial charter, merged in PR #12 | est. 2h | 105.6 |
  ```

  - Tool: copilot / claude / codex / gemini
  - Type: skill / agent
  - Phase: the skill's phase folder, or blank for agents
  - Outcome: one sentence on what was actually produced (PR merged, doc
    shipped, bug fixed) — not what was attempted
  - Effort saved: rough estimate only, marked "est." — never invent a number,
    write "unknown" if you can't judge it
  - Credits: optional — Copilot credit spend for the task, read from
    `tools/report-copilot-credits.ps1` (1 credit = 1 US cent). Leave blank when
    unknown; never rewrite existing rows to add it
  - Keep the pipe-table shape exact — `tools/report-usage.ps1` parses it as a
    markdown table (old seven-column rows still parse)
- This is self-reported, not enforced. Do not claim it's a complete or audited
  record.
- If a preflight step above is skipped and later caught, log it as a row in the same
  `docs/usage-log.md` table — Type: `process-miss`, Outcome: what was skipped and why.
  This turns one-off misses into visible process history instead of losing them.

## Team-specific rules

<!-- Add your team's own rules below this line. Everything above ships as a working
     default and should rarely need to change. -->
