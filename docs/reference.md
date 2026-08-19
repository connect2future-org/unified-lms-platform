<!--
docs/reference.md — SOURCE, framework-shipped. Human-edited occasionally, not day-to-day.
This is the depth doc: everything the README's 15-minute quickstart doesn't cover.
-->

# Reference

The README gets you set up and running the worked example. This is everything else: the full phase table, every skill, distribution options, and the output-routing/consent-gate mechanics in full.

## The nine phases

| # | Phase | Type | Purpose | Gate/checkpoint feeds on |
|---|---|---|---|---|
| 01 | strategy-planning | gate | Business case, stakeholder alignment, risk picture before anything else starts | Business case + success metrics agreed, risk register populated, RACI drafted |
| 02 | requirements-design | gate | Business need → testable requirements, personas, UX flows | Requirements traced to objectives with acceptance criteria; stakeholder approval recorded |
| 03 | architecture-design | gate | Approved requirements → system architecture, ADRs, security/governance framework | Architecture documented, ADR per significant decision, security/compliance mapping complete |
| 04 | code-development | gate | Implementation against the approved architecture, test-driven, continuously validated | Passing test suite, AI + human review both done, no known regressions |
| 05 | testing-validation | gate | Independent verification: strategy, generation, execution, quality/perf/security assessment | Critical/high test cases pass, perf benchmarks met, security issues resolved or explicitly accepted |
| 06 | integration-preproduction | gate | Environments, CI, deployment orchestration, integration/load testing in a prod-like environment | Environments consistent, integration/load tests pass thresholds, all stakeholder sign-offs obtained |
| 07 | production-operations | checkpoint | Running the live system: monitoring, alerting, incident response, capacity, tuning | Periodic review — continuous work, no one-time exit criterion |
| 08 | observe-improve | checkpoint | Operational data → strategic improvement decisions and a prioritised roadmap | Periodic review |
| 09 | maintain-evolve | checkpoint | Long-horizon health: debt paydown, maintenance, model lifecycle, architectural evolution | Periodic review — findings routinely loop back into phase 1 or phase 3 |

Phases 1–6 get a `gate.md`: a one-time pass/fail/conditional decision, checked by the `check-gate-readiness` skill before moving on. Phases 7–9 get a `checkpoint.md` instead — they're continuous operational work, not a one-time transition, so forcing a hard pass/fail gate there would be fake precision. Each phase's full entry/exit criteria and deliverables live in its own `sdlc/phases/<NN>-<slug>/Overview.md`.

Two gates were authored fresh for V2 rather than harvested — no equivalent existed in the source SDLC documentation: **architecture-design** and **code-development**. Both are noted as such at the top of their `gate.md`.

**Skill coverage ends at release.** Phases 1–6 each have at least one skill producing their gate evidence; phases 7–9 have phase docs and checkpoints but no skills. That is a deliberate scope line, not an oversight — the framework's repeatable workflows currently run requirements through testing to release. Operational skills (incident response, post-incident review, debt paydown) are candidates for the backlog below.

## The delivery-stage tag

Every phase `Overview.md` and every `SKILL.md` carries an optional frontmatter field:

```yaml
delivery_stages: [pre-sales, pre-discovery, discovery, proof-of-concept, pilot, production, decommissioning]
```

This is engagement-lifecycle metadata, not a second phase list. The nine phases above are the spine every skill and agent maps to; delivery stage is an orthogonal tag for the rare skill that only makes sense at one point in the commercial lifecycle — for example a bid response only happens pre-sales, but recording a decision or writing tests can happen at any stage of any engagement. An empty array (the default on every phase doc and nearly every skill) means "applies at any stage."

Currently only one skill sets it: `respond-to-a-proposal` (`delivery_stages: [pre-sales]`) — everything else, including all nine phase docs, ships with it empty.

## Skill index

### Phase-mapped

| Skill | Phase | Purpose |
|---|---|---|
| `assess-risks` | 01-strategy-planning | Surfaces top failure risks before a sprint, deliverable, or phase begins |
| `kick-off-a-project` | 01-strategy-planning | First skill run on a new engagement — turns intake docs into a working phase 1 setup |
| `respond-to-a-proposal` | 01-strategy-planning (`pre-sales`) | Structured bid/tender response, section by section, through to a challenged draft |
| `gather-requirements` | 02-requirements-design | Structured elicitation — stakeholder mapping, classification, conflict/gap detection |
| `write-user-stories` | 02-requirements-design | Decomposes approved requirements into sprint-ready stories with acceptance criteria and UX flows |
| `design-a-feature` | 03-architecture-design | Turns approved stories into a gate-ready solution design — components, classified data model, security, traceability |
| `record-a-decision` | 03-architecture-design | **Worked example.** Records a decision as a formal ADR, hands off to `publish` |
| `implement-from-spec` | 04-code-development | Implements code from an approved spec or story — branch, test-first, small commits, verified build |
| `scan-for-security-risks` | 04-code-development | Reviews a change for vulnerabilities before it merges |
| `plan-tests` | 05-testing-validation | Builds a test strategy (Heuristic Test Strategy Model) before build work begins |
| `write-tests` | 05-testing-validation | Turns an approved strategy into concrete test cases and exploratory charters |
| `run-tests-and-report` | 05-testing-validation | Executes tests, reports pass/fail with evidence, routes failures to fix/defer/accept |
| `prepare-for-release` | 06-integration-preproduction | Consolidates test evidence, rollback, and sign-offs ahead of the phase 6 gate |

### Typical sequence: requirements through implementation

The phase-mapped skills above already chain together via each `SKILL.md`'s own `## Feeds into` line — nothing new to invoke, just the order a feature normally moves through:

1. **`gather-requirements`** (phase 2) — elicit and classify the need. Feeds into `write-user-stories`.
2. **`write-user-stories`** (phase 2) — decompose into sprint-ready stories with acceptance criteria. Feeds into `resolve-disagreements` (contested stories) and `plan-tests`.
3. **`design-a-feature`** (phase 3) — turn the approved stories into a gate-ready solution design: components, data model with per-entity classification, integration contracts, security architecture, regulatory mapping, and an AC-to-design traceability table. Expensive-to-reverse choices route through `record-a-decision` (one ADR each); contested choices through `resolve-disagreements`. Feeds into `implement-from-spec` and `publish` (class `spec`). This closes what earlier versions documented as the phase 3 gap.
4. **`implement-from-spec`** (phase 4) — implement the approved deliverable (story + design output from steps 2–3) section by section, human review at each step. Feeds into `record-a-decision` (decisions made along the way) and `plan-tests`.
5. **`plan-tests` → `write-tests` → `run-tests-and-report`** (phase 5) — strategy, then concrete cases, then execution and reporting.

Any deliverable produced along this chain (a requirements doc, a story set, an ADR, a design doc) routes through `publish` per the destination rules below, not by direct file write — and ends up as a pull request, not a file on someone's disk.

### Cross-cutting (apply at any phase)

| Skill | Purpose |
|---|---|
| `check-gate-readiness` | Validates a phase's exit criteria against real evidence, produces pass/conditional/fail |
| `write-a-deliverable` | Consistent authoring mechanics for any SDLC document — classify, check for existing templates, draft, human-approve |
| `resolve-disagreements` | Three-perspective (business/technical/delivery) structured debate on a contested decision |
| `log-tech-debt` | Records a conscious trade-off or deferral with category and severity, so it's tracked not forgotten |
| `check-against-existing-docs` | Answers a question from the documentation corpus, weighted by authority tier (Gold/Silver/Bronze), cited |
| `trace-requirements` | Maintains the requirement → story → test → release traceability matrix; cited as gate and release evidence |
| `rate-doc-confidence` | Scores documentation freshness/completeness and sweeps for cross-document contradictions |
| `publish` | The one routing point every deliverable-producing skill hands off to — see below |
| `commit-a-deliverable` | Branches, commits, pushes and opens a pull request, so nobody has to run git. The only skill allowed to run state-changing git commands |
| `mirror-to-sharepoint` | Copies a merged deliverable to a synced SharePoint folder for readers without repo access. One-way, consent-gated |

### Backlog — not built for V2 launch

These existed as prompts/skills in the source pipeline repo but weren't carried into the V2 launch set, either because the structure they assumed was dropped (councils, multi-repo scaffolding) or because there's no stated demand yet. Add them later using the template below if a real need shows up:

- `sdlc-onboard` / `sdlc-resume` — folded into `tools/bootstrap.ps1`'s summary output instead of a separate skill
- `traceability_sync` — built in August 2026 as the cross-cutting `trace-requirements` skill
- `readme_sync_audit` — was for auditing *other* repos' READMEs, out of scope for this framework's core
- Council-of-agents personas (Bid Strategy, Delivery Assurance, Capability Development, Red Team) — structure dropped as unneeded complexity; individual persona framing could inform a future skill but wasn't force-fitted into one

**Template shape for a new skill** — copy an existing `SKILL.md`, keep this structure:
1. Frontmatter: `name`, `description` (one line, when to use this), `phase` (omit if cross-cutting), `delivery_stages` (usually `[]`)
2. `## What this is for` — the problem it solves, in plain language
3. `## When to use it` (optional if obvious from the description)
4. `## Procedure` — the actual steps, human checkpoints called out explicitly
5. `## Feeds into` — which other skills this hands off to

## Choosing which tools to generate for

By default `tools/sync.ps1` (and `tools/bootstrap.ps1`, which calls it) generates config for all four supported tools every run. Narrow this with `-Tools`:

```powershell
./tools/bootstrap.ps1 -Tools copilot,claude
./tools/sync.ps1 -Tools copilot,claude
./tools/sync.ps1 -Tools copilot,claude -Check
```

Accepted values: `copilot`, `claude`, `codex`, `gemini`. Default is all four. What each tool owns:

| Tool | Generated files |
|---|---|
| `copilot` | `.github/copilot-instructions.md`, `.github/agents/*.agent.md`, `.vscode/mcp.json` |
| `claude` | `CLAUDE.md`, `.mcp.json` |
| `gemini` | `GEMINI.md`, `.gemini/settings.json` |
| `codex` | `.codex/config.toml` |

The skills mirror (`.agents/skills/**`) is ungated — it's the one universal path already, not tied to a single tool. A tool left out of `-Tools` has its files removed on the next `sync.ps1` run (or flagged as stale under `-Check`), not just skipped.

**`-Tools` is not persisted anywhere** — it's a flag, not a config file, by deliberate choice. Repeat the same list on every manual run. If you narrow it, also hand-edit `.githooks/pre-commit` and `.gitlab-ci.yml`'s `sync.ps1 -Check` calls to add the same `-Tools` list — both default to all four with no arguments, so left unedited they'll flag your narrowed-out tools' missing files as drift on every commit and merge request.

## Distribution

**Default: vendor + tag pin.** Check out the desired Git tag of this framework repo, then run `./tools/vendor.ps1 -TargetPath <path-to-project-repo>` to copy the source layer (`AGENTS.md`, `skills/`, `agents/`, `mcp/servers.json`, `tools/`, `sdlc/phases/`) into the consuming project repo. It never overwrites a project's own `AGENTS.md`, `mcp/servers.json`, or an existing agent file — only the framework-owned parts (`skills/`, `tools/`, `sdlc/phases/`, the `.example` templates) refresh on every run, and a new agent the framework adds still copies in per-file even once the project has its own `agents/` folder. Update by bumping the tag and re-running it. This is the controlled-work default because it avoids every open question below — no marketplace auth, no unpinned installs, no signing gap.

**Advanced: marketplace/plugin distribution — not built for V2 launch.** V1 had a `.github/plugin/marketplace.json` + `plugins/v1-sdlc/` path with known unresolved risk (no version pinning, no lockfile, no signing — any user can register any repo, including a fork that copies a real plugin's name) and an unverified GitLab private-repo auth story. V2 does not ship this path. If your team wants it later: GitLab requires the full Git URL (`https://gitlab.com/your-org/repo.git`), not GitHub's `owner/repo` shorthand — test private-repo auth against your actual GitLab instance before relying on it, and treat vendoring as the fallback if it doesn't work.

## Output routing and the consent gate

**Git is the system of record for every deliverable. SharePoint is a one-way mirror of merged documents, for readers without repository access.**

Three skills, one chain:

| Skill | Job |
|---|---|
| `publish` | Resolve the class against `output-routing.json`, write the file under `docs/`, hand off |
| `commit-a-deliverable` | Branch, stage the named paths, commit, push, open a pull request, hand back the link |
| `mirror-to-sharepoint` | After merge, copy the document to a synced SharePoint folder for stakeholders — consent-gated |

**Nobody has to run git.** `commit-a-deliverable` wraps every git operation and returns a pull request link and one plain-language sentence. That was the point: a business analyst gets their document reviewed and shared without knowing what a branch is. The skill will branch, stage, commit, push and open a PR. It will *not* merge, rebase, resolve a conflict, force-push or amend — those stay with a technical reviewer, which is what makes it safe to hand over.

Two rules inside that skill matter more than the rest. It stages **explicit paths only** — never `git add -A`, because a working tree may hold someone else's unrelated changes. And it never passes `--no-verify`: if the pre-commit hook fails, it reports which check failed and stops.

**Why SharePoint is a mirror and not a destination.** Git's three-way merge is the thing you give up by writing documents somewhere else, and nothing in SharePoint replaces it — OneDrive does not merge markdown, it forks it into conflicted copies named after whichever laptop wrote second. A mirror is regenerable, so it cannot lose work; a second destination would need merging. The mirror refuses to copy anything that is not already merged on the default branch, which keeps unreviewed content off a stakeholder-visible surface.

**The consent gate lives at the mirror**, because that is where content actually leaves the repository boundary. `mirror-to-sharepoint` stops before copying, asks for explicit confirmation and a sensitivity label, refuses on silence, and logs to the consuming project's `docs/consent-log.md`. Writing to git inside the project repo is not a disclosure and needs no consent step.

**Two things the mirror cannot do**, stated on every run rather than glossed:

- **It cannot apply a sensitivity label.** A file copy has no way to set a Microsoft Purview label. `Controlled` in the config is advisory — the real label comes from the SharePoint library's default. `sensitivityLabelApplied: false` records this.
- **A local write is not an upload.** The file lands in a synced folder; OneDrive uploads it afterwards, or fails to. The skill reports "copied locally, queued", never "published".

Both close only with a Microsoft Graph MCP server, which this framework does not have.

**Configuration.** `output-routing.json` (committed, team-shared) holds routes and the `mirror` block. `output-routing.local.json` (git-ignored) holds only this machine's SharePoint folder path — separate because that path contains a username and would break for teammates if committed. `./tools/bootstrap.ps1` asks for it once, on a first run; skipping is a first-class answer and turns mirroring off.

**Project docs stay in the project, not the framework repo.** This was a deliberate correction made during V2's design: the framework repo ships the routing *mechanism* only — the `output-routing.json` config and the `publish` skill's procedure. It does not ship an output folder, a sample ADR, or its own consent log. When `publish` resolves a `git` destination, it writes under `docs/` in whatever repo it's actually running in — the consuming project, once the framework has been vendored in — never back into this framework repo. Same for the consent log: `docs/consent-log.md` is created on first use in the consuming project, not shipped here. This keeps the framework repo's own history free of any team's actual project output, and matches the wider "source vs generated, never confused" principle — a framework repo isn't supposed to accumulate anyone's deliverables.

**Honest limitation:** this is mostly process enforcement, not code-level enforcement. Nothing here stops someone bypassing the skills and writing a file, or copying to SharePoint, by hand. What it does rest on is a real control — every deliverable arrives as a pull request a human has to approve, and nothing reaches a stakeholder-visible surface until that merge happens. Stronger than a bare file write, but the approval is still only as good as the reviewer. Hard enforcement of sensitivity labelling would need a SharePoint/Graph MCP server that rejects unlabelled writes; that server does not exist here (see `mcp/servers.json`).

**Claude Code guard hooks narrow this gap — for Claude Code only.** `.claude/settings.json` wires PreToolUse hooks under `tools/hooks/` (tested by `tools/test-hooks.ps1`, run in CI): `git-guard.ps1` denies always-forbidden git shapes (`add -A`/`--all`/`.`, `commit -a`/`-am`, `--no-verify`, `push --force`, `--amend`, `reset --hard`, `rebase`) and turns any `git commit`/`git push`/PR-create into an explicit human confirmation, since no deterministic signal exists to prove a command is running inside `commit-a-deliverable`. The matching is a tripwire, not a complete control — a reworded command can slip past it. Copilot, Codex, and Gemini run no hooks at all: those sessions still rely on the process rules plus PR review. And the git pre-commit hook cannot defend itself against `--no-verify` — only the Claude Code hook sees that flag before it runs.

`file-guard.ps1` covers Edit/Write: it denies hand-edits of machine-derived `*.gate-state.json` files (the one legitimate writer is `tools/derive-gate-state.ps1`), enforces append-only on `usage-log.md` (an edit must keep existing rows intact — present-but-unreadable fails closed), and trips on secret-shaped content (private key blocks are denied; credential-token shapes ask the human). Same honesty applies: it catches obvious shapes, not everything, and only in Claude Code.

## Controlled-data handling

- Customer or controlled content never gets baked into framework files — skills, agents, phase docs stay generic and reusable across engagements.
- Retrieve controlled content live through an MCP server when you need it, rather than pasting whole documents into an agent's context.
- Consent and sensitivity labelling are checked at the point content leaves the repository — `mirror-to-sharepoint`, not `publish` — and never assumed from earlier in a conversation or carried over from a different document.

## Formal spec

[`docs/spec.md`](spec.md) is the audit/controlled-document version of this design — same content, more formal register, revised from the V1 `copilot-sdlc-framework-spec.md`.
