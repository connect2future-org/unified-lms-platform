#Requires -Version 5.1
<#
Claude Code PreToolUse hook for the Edit and Write tools. Three rules:

  A. gate-state files are machine-derived - deny any Edit/Write of a file named
     *.gate-state.json (matched by basename). The one legitimate writer is
     tools/derive-gate-state.ps1, which writes shell-side and so never passes
     through this hook.

  B. usage-log.md is append-only - an Edit must leave the existing text intact as a
     prefix (new_string starts with old_string); a Write must either create the file
     or keep the current disk content as a prefix. Rewriting or deleting existing
     rows is denied. If the file exists but cannot be read, the guard fails CLOSED -
     "present but unverifiable" is exactly the case an append-only guard exists for.

  C. secrets tripwire - content that looks like a private key is denied; content
     that looks like a credential token (cloud keys, PATs, bearer tokens, quoted
     password literals) asks the human. This is a tripwire, not a scanner: it
     catches the obvious shapes only, and documentation that quotes token formats
     will occasionally trip it - answering the ask is the escape hatch.

Everything else passes through silently. Fail-open on unparseable stdin (a broken
payload is an infrastructure problem, not a violation). Only Claude Code runs hooks -
other tools rely on the process rules in AGENTS.md plus PR review.
#>

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if (-not $raw) { exit 0 }
    $payload = $raw | ConvertFrom-Json
    $toolName = [string]$payload.tool_name
    $ti = $payload.tool_input
    $filePath = [string]$ti.file_path
    if (-not $filePath) { exit 0 }
} catch {
    exit 0   # fail-open: infrastructure problem, not a violation
}

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

function Get-Field($Obj, [string]$Name) {
    if ($null -ne $Obj -and $Obj.PSObject.Properties.Name -contains $Name) { return [string]$Obj.$Name }
    return ''
}

$baseName = [IO.Path]::GetFileName($filePath)

# --- A. gate-state files are machine-derived ------------------------------------------
if ($baseName -like '*.gate-state.json') {
    Emit 'deny' 'Gate-state files are derived, never hand-edited. Run tools/derive-gate-state.ps1 to refresh this file from the evidence manifest.'
}

# --- B. usage-log.md is append-only ---------------------------------------------------
if ($baseName -eq 'usage-log.md') {
    if ($toolName -eq 'Edit') {
        $old = (Get-Field $ti 'old_string') -replace "`r`n", "`n"
        $new = (Get-Field $ti 'new_string') -replace "`r`n", "`n"
        if ($old -and -not $new.StartsWith($old)) {
            Emit 'deny' 'usage-log.md is append-only. An edit must keep the existing text intact and add after it - never rewrite or delete existing rows.'
        }
    }
    elseif ($toolName -eq 'Write') {
        if (Test-Path -LiteralPath $filePath) {
            $existing = $null
            try { $existing = [IO.File]::ReadAllText($filePath) } catch {
                # Present but unreadable: fail closed - this is the case the guard is for.
                Emit 'deny' 'usage-log.md exists but could not be read to verify the write is append-only. Resolve the read problem, or use Edit to append.'
            }
            $existingNorm = ($existing -replace "`r`n", "`n").TrimEnd("`n")
            $newNorm = ((Get-Field $ti 'content') -replace "`r`n", "`n")
            if ($existingNorm -and -not $newNorm.StartsWith($existingNorm)) {
                Emit 'deny' 'usage-log.md is append-only. A Write must keep the current content intact as a prefix - rewriting existing rows is not allowed.'
            }
        }
    }
}

# --- C. secrets tripwire ---------------------------------------------------------------
$content = ''
if ($toolName -eq 'Write') { $content = Get-Field $ti 'content' }
elseif ($toolName -eq 'Edit') { $content = Get-Field $ti 'new_string' }

if ($content) {
    if ($content -match '-----BEGIN [A-Z ]*PRIVATE KEY-----') {
        Emit 'deny' 'This write contains a private key block. Never commit secrets - use the platform secret store, referenced by name (house rules in AGENTS.md).'
    }
    $tokenPatterns = @(
        'AKIA[0-9A-Z]{16}',                       # AWS access key id
        'ghp_[A-Za-z0-9]{20,}',                   # GitHub PAT (classic)
        'github_pat_[A-Za-z0-9_]{20,}',           # GitHub PAT (fine-grained)
        'glpat-[A-Za-z0-9_-]{20,}',               # GitLab PAT
        'xox[baprs]-[A-Za-z0-9-]{10,}',           # Slack token
        'Bearer [A-Za-z0-9._~+/-]{30,}',          # bearer token literal
        '(?i)(password|passwd|pwd)\s*[:=]\s*["''][^"'']{8,}["'']'   # quoted password literal
    )
    foreach ($p in $tokenPatterns) {
        if ($content -match $p) {
            Emit 'ask' "This write matches a credential-like pattern ($p). Never commit secrets (house rules in AGENTS.md) - confirm this is a placeholder or documentation, not a real credential."
        }
    }
}

exit 0
