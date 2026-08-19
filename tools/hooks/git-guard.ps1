#Requires -Version 5.1
<#
Claude Code PreToolUse hook for shell commands (Bash and PowerShell tools). Enforces
the house git rules mechanically inside Claude Code sessions:

  Tier 1 - deny (forbidden in every context, so no skill signal is needed):
    git add -A / --all / .        sweeps unrelated work into a commit
    git commit -a / -am           same sweep, one step later
    --no-verify on any git call   bypasses the pre-commit checks
    git push --force / -f         rewrites shared history (--force-with-lease included)
    git commit --amend            rewrites a published commit
    git reset --hard              destroys working-tree state
    git rebase                    interactive/history rewrite, banned in agent sessions

  Tier 2 - ask (legitimate only inside commit-a-deliverable, but no deterministic
  skill-context signal exists in the hook payload, and a model-written marker would be
  self-report; the human confirming the prompt is the deterministic decider):
    git commit, git push, gh pr create/merge, glab mr create/merge

Matching is deliberately partial - whitespace-normalised regex over the command
string. It is a tripwire, not a complete control: a reworded command can slip past,
and a quoted string mentioning git can trip it. The backstops are the tier-2 human
ask and PR review. Only Claude Code runs hooks - Copilot, Codex and Gemini sessions
rely on the process rules in AGENTS.md plus PR review.

Fail-open: unparseable or empty stdin exits 0 silently (hook infrastructure problems
must not brick every shell command). Fail-closed is reserved for a parsed command
that matches a deny rule.
#>

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if (-not $raw) { exit 0 }
    $payload = $raw | ConvertFrom-Json
    $command = [string]$payload.tool_input.command
    if (-not $command) { exit 0 }
} catch {
    exit 0   # fail-open: a broken payload is an infrastructure problem, not a violation
}

# Normalise whitespace so "git  add   -A" still matches.
$cmd = ($command -replace '\s+', ' ').Trim()

function Emit([string]$Decision, [string]$Reason) {
    @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = $Decision
            permissionDecisionReason = $Reason
        }
    } | ConvertTo-Json -Compress -Depth 4
    exit 0
}

$rules = 'house rules in AGENTS.md (see also skills/commit-a-deliverable/SKILL.md)'

# --- Tier 1: deny -------------------------------------------------------------------
if ($cmd -match '\bgit\s+add\s+(-A\b|--all\b|\.(\s|$))') {
    Emit 'deny' "git add -A/--all/. is banned by the $rules - stage the named paths only."
}
if ($cmd -match '\bgit\s+commit\b[^|;&]*\s-a[m]?\b') {
    Emit 'deny' "git commit -a/-am is banned by the $rules - stage the named paths, then commit."
}
if ($cmd -match '\bgit\b[^\r\n]*--no-verify') {
    Emit 'deny' "--no-verify is banned by the $rules - if the pre-commit hook fails, fix the underlying issue."
}
if ($cmd -match '\bgit\s+push\b[^|;&]*(\s--force\b|\s-f\b)') {
    Emit 'deny' "git push --force/-f is banned by the $rules."
}
if ($cmd -match '\bgit\b[^\r\n]*--amend') {
    Emit 'deny' "git commit --amend is banned by the $rules - create a new commit instead."
}
if ($cmd -match '\bgit\s+reset\s+--hard\b') {
    Emit 'deny' "git reset --hard is banned by the $rules - it destroys working-tree state."
}
if ($cmd -match '\bgit\s+rebase\b') {
    Emit 'deny' "git rebase is banned by the $rules."
}

# --- Tier 2: ask --------------------------------------------------------------------
if ($cmd -match '\bgit\s+commit\b' -or $cmd -match '\bgit\s+push\b' -or
    $cmd -match '\bgh\s+pr\s+(create|merge)\b' -or $cmd -match '\bglab\s+mr\s+(create|merge)\b') {
    Emit 'ask' "State-changing git is reserved for the commit-a-deliverable skill ($rules). Confirm this command is running inside that skill's procedure."
}

exit 0
