<!--
docs/spec.md — SOURCE, framework-shipped. The formal/audit counterpart to docs/reference.md.
More formal register, same content depth. This is the controlled document a reviewer or
auditor reads; docs/reference.md is the working reference a day-to-day user reads.
-->

# SDLC AI Framework Specification — Version 2

**Version:** 2.0
**Owner:** [EVIDENCE NEEDED: framework owner / team]
**Host:** GitLab (self-managed or gitlab.com)
**Classification:** Controlled

**Changes since Version 1 (`copilot-sdlc-framework-spec.md`):** rebuilt per the "SDLC AI framework, version 2" build brief. V1 proved the five-layer mechanism but was too complex to adopt. This version keeps the proven mechanics and removes the friction: agents now have a single source (V1 duplicated them in two places with no canonical copy), the skill mirror defaults to one universal path instead of four tool-specific copies, `output-routing.json` and the consent gate are actually implemented (V1's spec described both but neither existed in the V1 build), and the marketplace/plugin distribution path is dropped from the default in favour of vendoring — it remains a documented advanced option, not a launch deliverable. Phase content is now sourced from the company's nine-phase SDLC rather than a generic phase list.

Product features described here are current as of August 2026 and change frequently. Verify file paths, model identifiers, and CLI commands against current vendor documentation before implementation.

---

## 1. Purpose and scope

This spec defines the SDLC AI framework: a set of AI agents, skills, house instructions, and MCP connections mapped to the company's nine-phase SDLC, portable across Copilot, Claude Code, Codex, and Gemini, hosted on GitLab.

It covers:

- The layered architecture of the framework's customisation artefacts.
- Portability of those artefacts across the four target tools.
- Configuration management and single-source-of-truth authoring.
- Distribution on GitLab.
- Output document routing and the consent gate for controlled/customer data.

Cost management is documented in Section 6 for reference but remains deferred, as in Version 1. It is out of scope for this build.

---

## 2. Definitions

- **Instructions:** always-on house rules injected into every request. Source: `AGENTS.md`.
- **Skill:** a reusable procedure held in a `SKILL.md` folder. Source: `skills/**/SKILL.md`.
- **Agent:** a persona with a defined tool set and scope, held in an `.agent.md` file. Source: `agents/*.agent.md` — a single canonical location (Version 1 had no single source; see Section 5.1).
- **Phase:** one of the nine stages of the company SDLC, `sdlc/phases/<NN>-<slug>/`, each with an `Overview.md` and either a `gate.md` (phases 1–6, a one-time pass/fail/conditional transition) or a `checkpoint.md` (phases 7–9, continuous operational review with no hard block).
- **Delivery stage:** an optional engagement-lifecycle tag (`pre-sales` → `decommissioning`) attached to a phase or skill's frontmatter. Orthogonal to phase — it does not compete with the nine-phase model as a second phase list.
- **MCP server:** an external tool or data source exposed over Model Context Protocol.
- **Deliverable:** a document a skill or agent produces for people — for example an ADR or a report. Written to git via `output-routing.json` and the `publish` skill, then delivered as a pull request by `commit-a-deliverable`. Deliverables are produced and stored in the *consuming project's* repository, never committed into this framework repository (see Section 8.4).
- **Mirror:** a one-way, regenerable copy of a *merged* deliverable placed in a synced SharePoint folder for readers without repository access. Never a source of truth; edits made to a mirror are lost (see Section 8.1).

---

## 3. Architecture: five customisation layers

| # | Layer | Source (edit) | Generated (never edit) | Ports across tools? |
|---|---|---|---|---|
| 1 | Instructions | `AGENTS.md` | `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` | Yes |
| 2 | Skills | `skills/**/SKILL.md` | `.agents/skills/**` (universal mirror) | Yes |
| 3 | Agents | `agents/*.agent.md` | `.github/agents/*.agent.md` (Copilot's required path) | No — no cross-tool persona standard exists; single-sourced here so at least it doesn't drift within this repo |
| 4 | MCP servers | `mcp/servers.json` | `.vscode/mcp.json`, `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json` | Yes, via the MCP standard |
| 5 | Distribution | `distribution/` (optional, advanced — not part of the default path) | — | No — default is vendoring, not a ported mechanism at all |

### 3.1 Simplifications from Version 1

- **Single agent source.** Version 1 held agents in `.github/agents/` and duplicated them again in `plugins/v1-sdlc/agents/`, with no canonical copy and no mechanism to keep the two in sync. Version 2 sources agents once, at `agents/*.agent.md`, and `tools/sync.ps1` mirrors verbatim into `.github/agents/` as a generated file.
- **One skill mirror by default, not four.** Version 1 unconditionally mirrored every skill into `.claude/skills/`, `.agents/skills/`, and `.gemini/skills/` alongside Copilot's own path. Version 2 mirrors only into the universal `.agents/skills/` path by default. Whether Claude Code and Gemini actually need their own copy instead of reading the universal path is an open item (Section 9) — the sync script supports adding those targets back once verified, but they are not generated until then.
- **Distribution defaults to vendoring.** Version 1's spec treated the marketplace/plugin path as a documented option alongside vendoring. Version 2 does not build the marketplace path at all for launch; vendoring with a Git tag pin is the only supported distribution mechanism until a team explicitly needs the advanced path (Section 5.4).

---

## 4. Cross-tool portability model

Unchanged in substance from Version 1.

### 4.1 Ports cleanly

- **MCP servers.** All four target tools support MCP. Configure once in `mcp/servers.json`.
- **Skills.** The `SKILL.md` format is shared. Version 2 mirrors it to one universal path by default (Section 3.1).
- **Instructions.** `AGENTS.md` is read natively by Codex and others; Claude Code reads it with `CLAUDE.md` as a richer derived copy; Gemini uses `GEMINI.md`.

### 4.2 Does not port

- **Agents.** Each tool has its own persona convention; `.agent.md` is Copilot's. No shared standard exists. Version 2 accepts this and single-sources instead of solving it.
- **Distribution.** Marketplace/plugin formats are tool-specific and, per Section 3.1, out of the Version 2 default path entirely.

---

## 5. Configuration management and versioning

### 5.1 Single source of truth

| Layer | Source | Notes |
|---|---|---|
| Instructions | `AGENTS.md` | |
| Skills | `skills/**/SKILL.md` | |
| Agents | `agents/*.agent.md` | Single source — the Version 1 gap this version closes |
| MCP servers | `mcp/servers.json` | |
| Output routing | `output-routing.json` | Actually implemented in Version 2; Version 1's spec described it but the file and the `publish` skill were never built. Git delivery (`commit-a-deliverable`) was added during this revision — before it, a routed document was written to disk and left uncommitted |

Never hand-edit a derived file. Every source and every derived file states which it is in its first lines.

### 5.2 Sync tooling

`tools/sync.ps1` (renamed and harvested from Version 1's `sync-agent-config.ps1`, since removed; same core logic):

- Reads `AGENTS.md`, `skills/`, `agents/`, `mcp/servers.json`.
- Writes derived instruction files, the universal skills mirror, the `.github/agents/` agent mirror, and four MCP config formats (Copilot's `servers` key, Claude Code/Gemini's `mcpServers` key, Codex's TOML `[mcp_servers.*]` blocks).
- Removes stale derived files that no longer have a source.
- `-Check` mode exits non-zero on any drift, without writing anything.

Two enforcement points run `tools/sync.ps1 -Check`:

- `.githooks/pre-commit` — local, blocks the commit.
- `.gitlab-ci.yml` — blocks the merge request.

### 5.3 Distribution risk (marketplace/plugin path — advanced, not default)

Carried forward unchanged from Version 1's assessment, since Version 2 does not resolve it — it simply avoids depending on it by default:

- No version pinning on install; installs pull `HEAD`.
- No lockfile, no signing, no provenance check. Any user can register any repository under any name.

**Version 2 default mitigation:** vendor the source layer into each consuming repository, pinned to a Git tag of this framework repo. This is not a workaround for the marketplace's risk — it is the only distribution path Version 2 ships.

### 5.4 Distribution on GitLab, if the advanced path is ever used

- The `OWNER/REPO` shorthand resolves against GitHub.com only. A GitLab-hosted marketplace must be added by full Git URL (e.g. `https://gitlab.com/your-org/repo.git`).
- Private-repo marketplace authentication is unverified against a real GitLab instance — test before relying on it.
- Recommended path regardless: vendor + tag pin, enforced by the same `.gitlab-ci.yml` check already required for the default path. This avoids the private-auth question entirely.

### 5.5 Copilot features unavailable on GitLab

Copilot cloud agent and coding agent (assign-to-issue/PR) are GitHub.com-only and do not run against GitLab-hosted repositories. Out of scope for this build, per the build brief's non-goals.

---

## 6. Cost management

**Status: partially delivered. Local per-task credit reporting shipped; org-level cost management remains deferred.**

`tools/report-copilot-credits.ps1` reads Copilot credit spend per chat session and per request from VS Code's local chat logs (`%APPDATA%\Code\User\workspaceStorage\<hash>\chatSessions\`), and the usage-log table carries an optional `Credits` column so a task's spend can be recorded next to its outcome. Limits: VS Code chat/agent sessions only (no completions, no other tools), the `copilotCredits` field is an undocumented VS Code internal that an extension update may change, and figures are local and indicative rather than audited.

See Version 1's `copilot-sdlc-framework-spec.md` Section 7 for the full prior analysis (native usage dashboards, cost-centre attribution, OTel/gateway routes for feature-level cost). Org-level cost management stays out of scope until explicitly commissioned.

---

## 7. Governance and policy

- Enable MCP at org level and allowlist permitted servers before connecting `mcp/servers.json` entries to anything live.
- Store MCP secrets in the platform secret store, referenced by name — never committed.
- Validate framework artefacts are in sync (no drift between sources and generated files) in CI via `tools/sync.ps1 -Check` (Section 5.2).
- Customer or controlled content never gets baked into framework files (skills, agents, phase docs) — retrieve it live through an MCP server instead (Section 8.6).

---

## 8. Output document routing and the consent gate

### 8.1 Principle

Git is the system of record for every deliverable. SharePoint is a one-way mirror of merged documents, provided for readers without repository access.

Git and SharePoint address different problems. Git addresses authoring: merge, history, review, a single source of truth. SharePoint addresses distribution: a stakeholder without repository access can open a document in a browser. Treating SharePoint as a write destination sacrifices the first to obtain the second, and does so irreversibly — OneDrive does not merge markdown, it forks it into conflicted copies. A mirror is regenerable and therefore cannot lose work; a second destination would require merging.

Accessibility for non-developers is achieved by wrapping git, not by leaving it. The `commit-a-deliverable` skill performs every git operation on the user's behalf and returns a pull request link.

### 8.2 Configuration (implemented, not merely specified)

`output-routing.json` (committed, team-shared):

```json
{
  "default": "git",
  "routes": { "adr": "git", "readme": "git", "api-reference": "git",
              "report": "git", "release-notes": "git", "spec": "git" },
  "destinations": { "git": { "type": "path", "root": "docs/" } },
  "mirror": {
    "classes": ["report", "release-notes", "spec"],
    "never": ["usage-log", "consent-log", "traceability-matrix", "tech-debt"],
    "sensitivityLabel": "Controlled", "sensitivityLabelApplied": false,
    "requiresConsent": true, "rootFrom": "output-routing.local.json"
  }
}
```

`output-routing.local.json` (git-ignored, per-machine) holds only `sharepointRoot`. The separation is deliberate: that path contains a username, is machine-specific, and would leak a local path and break for teammates if committed.

`mirror.never` covers the append-only logs. Every skill run appends a row to these; a synced copy would fragment the audit trail across conflicted duplicates and is of no use to a stakeholder.

### 8.2a The delivery chain (implemented)

| Skill | Responsibility |
|---|---|
| `publish` | Resolve class against `output-routing.json`, write under `docs/`, hand off |
| `commit-a-deliverable` | Branch from `origin/<default>`, stage named paths, commit, push, open a pull request |
| `mirror-to-sharepoint` | After merge, copy to the synced SharePoint folder — consent-gated |

`commit-a-deliverable` is the only skill permitted to run state-changing git commands, and is restricted to additive ones: branch, stage, commit, push, open a pull request. Merging, rebasing, conflict resolution, force-pushing and amending are outside its remit and remain with a technical reviewer. Every operation it performs is reversible by someone else and none can lose work — that constraint is what makes it safe to place in the hands of a user who cannot interpret a git error.

Two internal rules carry disproportionate weight. The skill stages explicit paths only, never `git add -A`, because a working tree may contain unrelated in-progress work belonging to another task. And it never passes `--no-verify`: a pre-commit hook failure is reported verbatim and halts the commit.

Branching from a freshly fetched `origin/<default>` rather than local HEAD means a new document cannot conflict, whatever state the local tree is in. An updated document can conflict only at merge, where a technical reviewer resolves it. The non-technical user never encounters a rebase, a conflict, or a merge.

Version 1 specified output routing but built neither the routing file nor the skill. Version 2 implements the routing file, the `publish` skill, and — correcting a gap found during this revision — the git delivery step. Prior to it, a `git`-routed document was written to disk and left uncommitted, unreviewed and invisible.

### 8.3 The consent gate (implemented)

The consent gate sits at `mirror-to-sharepoint`, the point at which content leaves the repository boundary. Writing to git within the project repository is not a disclosure and requires no consent step.

`mirror-to-sharepoint` stops before copying and asks the human directly to confirm consent and name the applicable sensitivity label. No confirmation, no copy — silence is never treated as consent, and consent given earlier for a different document does not carry over. On confirmation it appends a record to the consuming project's own `docs/consent-log.md`: date, who confirmed, document, destination, sensitivity label named, consent basis, and the fact that the label was not applied by the copy itself. Without that final field the consent log would constitute a false audit record.

The skill additionally refuses to mirror any document not already present on the remote default branch, which prevents unreviewed content reaching a stakeholder-visible surface.

### 8.3a Two capabilities the mirror does not have

Both are stated on every run of the skill rather than recorded only here.

1. **Sensitivity labels cannot be applied by a file copy.** There is no mechanism for a filesystem write to set a Microsoft Purview label. `Controlled` is advisory; the effective label derives from the SharePoint library's default, configured by the site owner. `sensitivityLabelApplied: false` is the machine-readable statement of this.
2. **A local write does not constitute an upload.** The file is placed in a synced folder; OneDrive subsequently uploads it, or fails to. The skill reports the document as copied locally and queued, never as published or delivered.

Both gaps close only with a Microsoft Graph MCP server (Section 9).

### 8.4 Project docs stay in the project

This is a deliberate boundary, corrected explicitly during this version's design: the framework repository ships the routing *mechanism* only. It contains no output folder, no sample deliverable, and no consent log of its own. `git`-routed writes land under `docs/` in whatever repository the framework has been vendored into — the consuming project — never back into this framework repository. The same applies to `docs/consent-log.md`, created on first use in the consuming project, not shipped here. A framework repository is not a place project output accumulates.

### 8.5 Limitation (stated honestly, not glossed over)

This is process enforcement, not code-level enforcement. Nothing in this framework can prevent a human bypassing the skills and writing a file, or copying content to SharePoint, directly.

The position is nonetheless stronger than in the original design. Every deliverable now arrives as a pull request requiring human approval, and `mirror-to-sharepoint` refuses to copy anything not already merged — so no unreviewed document reaches a stakeholder-visible surface through the sanctioned path. That is a real control rather than a procedural instruction, though its value remains bounded by the quality of the review.

Sensitivity labelling is the weaker half and is not enforced at all (Section 8.3a). Genuine enforcement would require a SharePoint/Graph MCP server that rejects writes arriving without a label — out of scope until that server is chosen (Section 9).

### 8.6 Controlled-data handling

Documents built from customer or controlled data require consent before they are written to a destination that needs it (Section 8.3). Retrieval of controlled content should go through an MCP server at the point of use, not by pasting whole documents into an agent's context window.

---

## 9. Known limitations and open items

Carried forward, updated for Version 2's actual state:

- **Per-tool skill mirror unverified** — whether Claude Code and Gemini need their own skill-folder copy or genuinely read the universal `.agents/skills/` path is not yet confirmed against current tool documentation. `tools/sync.ps1` supports adding those mirror targets back; they stay off until verified.
- **Real MCP servers** — `mcp/servers.json` ships near-empty with one documented example entry. A SharePoint/Graph server is no longer load-bearing for delivery — documents route to git and are mirrored by file copy — but it remains the only route to two things: applying a sensitivity label on write (Section 8.3a), and mirroring from a headless or automated run without depending on a local OneDrive sync client.
- **Automatic mirroring on merge** — `mirror-to-sharepoint` is run manually after a pull request merges. Triggering it from CI or a merge webhook was not built.
- **Marketplace/plugin distribution not built** — Version 1's spec described it; Version 2 does not implement it at all, by design (Section 5.3). Revisit only if a team has a concrete need the vendoring default doesn't meet.
- **GitLab private-repo marketplace auth** — unverified, and only relevant if the above is ever built.
- **Which tools the team actually uses day to day** — affects how much future effort goes into agent-mirror completeness versus documenting the cross-tool persona gap (Section 4.2) and moving on.
- **No supported workflow for non-git teams.** `vendor.ps1`, every skill, `publish`, and `commit-a-deliverable` all assume a git-backed project repo. A BA or researcher working in OneDrive, SharePoint, or JIRA has no vendoring path and no skill that writes to those systems. The SharePoint mirror (Section 8) is one-way and read-only for stakeholders by design — it does not solve this.
- **Client-laptop and client-infrastructure tool usage is unaddressed.** The consent gate (Section 8.3) governs whether a document can leave the repo. It says nothing about whether the framework and the underlying AI tools may be installed and run on a client-owned laptop, under that client's contract, alongside staff who are not Version 1 employees.
- **No cadence for reviewing whether guidance is still correct.** `tools/sync.ps1 -Check` blocks configuration drift between source and generated files (Section 5.2); nothing reviews whether the *content* of that source — skills, phase docs, house rules — still reflects current best practice. No review schedule or ownership for that exists yet. The quality evals (Section 10, item 8) narrow this without closing it: `tools/run-evals.ps1` tripwires output-quality regressions for skills that have a fixture eval, but it says nothing about content currency, and the LLM judge is itself indicative rather than audited.

Deferred (cost phase, unchanged from Version 1):

- Per-model credit rates, target OTel backend, and gateway product decision.

---

## 10. Implementation status

1. **Foundations** — `AGENTS.md`, `skills/`, `agents/`, `mcp/servers.json` authored. Sync script, pre-commit hook, GitLab CI check in place. **Done.**
2. **Phase content** — all nine phases sourced from the company SDLC, canonical numbering reconciled (Section 2), two previously-missing gates authored fresh (architecture-design, code-development). **Done.**
3. **Skills and agents** — launch-set skills harvested and rewritten from the prior delivery-pipeline prompts, mapped to phases; three agents single-sourced. **Done.**
4. **Output routing, git delivery and consent gate** — `output-routing.json`, the `publish` skill, `commit-a-deliverable` and `mirror-to-sharepoint` built and demonstrated end to end via the worked example. **Done**, with the Section 8.5 limitation stated, not solved.
5. **Bootstrap** — one-command setup (`tools/bootstrap.ps1`), idempotent, fails clearly. **Done.**
6. **Real tenant configuration** — replacing placeholder MCP servers with real tenant values. **Not started — requires tenant-specific input, listed in Section 9.**
7. **Distribution rollout** — vendoring this repo's source layer into a first consuming project repo, pinned to a tag. **Not started — next action once Section 9's tenant items are resolved.**
8. **Quality evals** — fixture-based, LLM-judged output evals for skills (`evals/`, `tools/run-evals.ps1`), run on demand before merging skill changes; CI lints eval-folder structure only, because the runner has no model access. Scores are indicative, never audited. **Done for 16 of 24 skills.** The judge receives the fixture as ground truth for traceability checks; all 32 calibration cases rank correctly. Baseline: 15 of 16 skills pass their fixture eval; `resolve-disagreements` sits at borderline because its output attributed claims to a named participant that the fixture does not contain — a genuine finding, kept visible rather than tuned away. The remaining 8 skills need either harness extensions (write/execute tools for `implement-from-spec`, `run-tests-and-report`) or behavioural tests rather than output evals (`publish`, `commit-a-deliverable`, `mirror-to-sharepoint`, `status`, `record-a-decision`).

Deferred phases (cost, unchanged from Version 1): cost baseline and feature-level cost attribution.

---

## 11. Appendix: repository layout

```
repo/
├── AGENTS.md                        # source: instructions
├── mcp/servers.json                 # source: canonical MCP server list
├── output-routing.json              # source: deliverable destination + mirror map
├── output-routing.local.json        # source: per-machine mirror path — git-ignored
├── README.md                        # quickstart + five-layer page
├── docs/
│   ├── reference.md                 # depth doc
│   └── spec.md                      # this file
├── skills/
│   ├── publish/SKILL.md             # routing; hands off to commit-a-deliverable
│   ├── commit-a-deliverable/SKILL.md # the only skill that runs git
│   ├── mirror-to-sharepoint/SKILL.md # post-merge mirror; consent enforcement
│   ├── <cross-cutting-name>/SKILL.md
│   └── <phase-slug>/<skill-name>/SKILL.md
├── agents/*.agent.md                # source: single copy (fixes Version 1's duplication)
├── sdlc/phases/<NN>-<phase-slug>/
│   ├── Overview.md
│   └── gate.md | checkpoint.md
├── tools/
│   ├── sync.ps1                     # derives config
│   └── bootstrap.ps1                # one-command setup
├── .githooks/pre-commit             # runs sync.ps1 -Check locally
├── .gitlab-ci.yml                   # runs sync.ps1 -Check on merge
├── distribution/                     # optional, advanced — empty by default
│
│   ── generated, never hand-edit ──
├── CLAUDE.md  GEMINI.md
├── .github/copilot-instructions.md
├── .github/agents/*.agent.md
├── .agents/skills/**
├── .vscode/mcp.json  .mcp.json  .codex/config.toml  .gemini/settings.json
```

Note the absence, by design, of any `docs/adr/`, `docs/consent-log.md`, or sample deliverable in this repository — see Section 8.4.

---

*Classification: Controlled. Supersedes `copilot-sdlc-framework-spec.md` (Version 1).*
