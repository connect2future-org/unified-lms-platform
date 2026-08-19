---
name: scan-for-security-risks
description: Reviews a code change for common vulnerability classes and unsafe patterns, citing evidence for each finding, and produces an accept/accept-with-follow-up/block recommendation. Use during PR review.
phase: 04-code-development
delivery_stages: []
---

# Scan for Security Risks

SOURCE — human-edited. Universal skill.

## What this is for

The `reviewer` agent needs a repeatable, evidenced way to flag vulnerabilities during code
review — not a vague "looks fine" judgement. This is scoped to review-time scanning; formal
validation against the phase 5 gate's vulnerability criterion still runs separately.

## Procedure

1. **Scope the review** — what changed (diff or files), and what touches this repo's
   higher-risk surfaces (auth, input parsing, deserialisation, file/network I/O, secrets,
   credentials, PII).
2. **Check for common vulnerability classes** relevant to the language/framework in use:
   injection (SQL, command, template), broken auth/session handling, insecure
   deserialisation, hardcoded secrets or credentials, missing input validation at trust
   boundaries, unsafe dependency usage, insufficient logging around security-relevant events.
3. **Classify each finding**: severity (critical/high/medium/low), the specific line(s), and
   the concrete exploit scenario — not a generic "this could be risky."
4. **Check against project instructions** (`CLAUDE.md` / `AGENTS.md` security section) for
   anything this repo specifically calls out.
5. **Recommend**: Accept / Accept with follow-up ticket / Block. Merge should not proceed on
   an unaccepted critical or high finding.

## Reference documentation (MCP)

When the SDLC documentation server is configured (see `mcp/servers.json`), pull current
guidance before drafting rather than relying on memorised knowledge. Known-good calls,
verified against the server in August 2026:

- `get_document`: `Security_Compliance/Phase4_Secure_Coding.md`
- `get_document`: `Architecture_Design/Security_Governance_Framework.md`
- `search_documents`: query `"secure coding security"`

## Feeds into

`log-tech-debt` for anything accepted with a follow-up rather than fixed now. `publish` if a
standalone security report is produced.
