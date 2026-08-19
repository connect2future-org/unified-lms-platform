<!--
AGENTS.md — SOURCE. Edit 1 of 3.
This is the project's instructions file: house rules every AI agent follows on every task,
in every tool. Human-edited. Never edit the generated copies (CLAUDE.md, GEMINI.md,
.github/copilot-instructions.md) — they are derived from this file by tools/sync.ps1 and
overwritten on the next run.
-->

# Project instructions

## AI framework invocation

- Use the default coding workflow unless the user explicitly invokes `/framework` or
  names a framework skill, agent, phase/gate/checkpoint, or MCP lookup.
- Never infer, select, load, or execute framework features from task wording, files,
  keywords, or likely intent. Framework sources remain available for manual use only.
- Normal requests do not require SDLC phase, skill, gate, evidence, approval, usage-log,
  documentation-MCP, or agent steps.

## Coding standards

- British English in prose and comments.
- Active voice. Main point first.
- Small, reviewable commits — one logical change per PR.

## Security and controlled data

- Never commit secrets. Use the platform secret store, referenced by name.
- Do not run destructive Git commands unless the user explicitly requests them.

Framework procedures, governance, delivery routing, and usage logging are documented in
[`docs/framework-manual.md`](docs/framework-manual.md) and are loaded only by explicit
manual invocation.
