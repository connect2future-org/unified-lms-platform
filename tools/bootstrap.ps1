#Requires -Version 5.1
<#
One-command setup. Run this first, from the repo root:  ./tools/bootstrap.ps1

What it does:
  1. Checks PowerShell + git are present.
  2. Creates the 3 source files you may want to edit (AGENTS.md, mcp/servers.json,
     output-routing.json) from their .example templates, if they don't already exist.
     Never touches a source file that already exists - your edits are always safe to re-run against.
  3. Seeds docs/usage-log.md with its header row if missing, so agents can append to it
     with a terminal one-liner even when they have no file-write tool.
  4. On a first run only, asks for an optional SharePoint mirror folder and writes it to the
     git-ignored output-routing.local.json. Skipping is fine - mirroring is optional.
  5. Runs tools/sync.ps1 to generate every per-tool file, then tools/sync.ps1 -Check to confirm.
  6. Turns on the pre-commit check (git config core.hooksPath .githooks).
  7. Prints what you got and the next command to run.

Safe to run again any time - it only ever writes derived files or missing example templates,
and it never re-asks a question you have already answered.

-Tools narrows which tools get generated config (default: all 4). NOT persisted - repeat
the same list on every future ./tools/bootstrap.ps1 or ./tools/sync.ps1 call, and update
.githooks/pre-commit and .gitlab-ci.yml to match if you narrow it, or those default back
to all 4 and flag the narrowed-out tools' files as drift. See docs/reference.md.

-SharePointMirrorRoot answers step 4 non-interactively, so CI and scripted runs never block
on a prompt. Pass '' to explicitly skip mirroring.
#>
[CmdletBinding()]
param(
    [ValidateSet('copilot', 'claude', 'codex', 'gemini')]
    [string[]]$Tools = @('copilot', 'claude', 'codex', 'gemini'),

    [string]$SharePointMirrorRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail([string]$What, [string]$Fix) {
    Write-Host ''
    Write-Host "bootstrap: $What" -ForegroundColor Red
    Write-Host "Fix: $Fix"
    exit 1
}

function Get-RepoRoot {
    try {
        $top = (& git rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and $top) { return $top.Trim() }
    } catch { }
    return (Get-Location).Path
}

function Test-ToolInList([string]$Tool) { $Tools -contains $Tool }

# --- 1. Prerequisites -----------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail 'git not found on PATH.' 'Install git (https://git-scm.com/downloads), then re-run ./tools/bootstrap.ps1'
}

$Root = Get-RepoRoot
if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
    Fail "not running inside a git repo (resolved root: $Root)." 'cd into the cloned repo, then re-run ./tools/bootstrap.ps1'
}

Write-Host "Repo: $Root"

# --- 2. Source files from .example templates, never overwrite an existing one ---
$SourceFiles = @('AGENTS.md', 'mcp/servers.json', 'output-routing.json')
$Created = @()
foreach ($rel in $SourceFiles) {
    $path = Join-Path $Root $rel
    $example = "$path.example"
    if (Test-Path -LiteralPath $path) { continue }
    if (-not (Test-Path -LiteralPath $example)) {
        Fail "$rel is missing and $rel.example does not exist to seed it from." "Restore $rel.example from the repo, or hand-author $rel, then re-run ./tools/bootstrap.ps1"
    }
    $dir = Split-Path -Parent $path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item -LiteralPath $example -Destination $path
    Write-Host "  created $rel (from $rel.example - edit this to configure your setup)"
    $Created += $rel
}
$CreatedAny = $Created.Count -gt 0
if (-not $CreatedAny) { Write-Host "  all $($SourceFiles.Count) source files already present - untouched" }

# --- 2b. Usage log - seed the header row so agents can append without a write tool ---
$UsageLog = Join-Path $Root 'docs/usage-log.md'
if (-not (Test-Path -LiteralPath $UsageLog)) {
    $dir = Split-Path -Parent $UsageLog
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $header = "| Date | Tool | Type | Name | Phase | Outcome | Effort saved | Credits |`n|---|---|---|---|---|---|---|---|`n"
    [IO.File]::WriteAllText($UsageLog, $header)
    Write-Host '  created docs/usage-log.md (header row only - see AGENTS.md "Tracking skill and agent usage")'
}

# --- 2c. Optional SharePoint mirror folder (git-ignored, per-machine) ---------------
# Deliverables always go to git. This is only the folder a merged document gets COPIED to
# for readers without repo access. Skipping is a first-class answer.
$LocalRouting = Join-Path $Root 'output-routing.local.json'

# Make sure it can never be committed. Append to the project's .gitignore rather than
# shipping one - a consuming project has its own and overwriting it would be destructive.
$GitIgnore = Join-Path $Root '.gitignore'
$ignoreLine = 'output-routing.local.json'
$alreadyIgnored = $false
if (Test-Path -LiteralPath $GitIgnore) {
    $alreadyIgnored = @(Get-Content -LiteralPath $GitIgnore) -contains $ignoreLine
}
if (-not $alreadyIgnored) {
    $block = "`n# Per-machine SharePoint mirror path. Contains a local user path - never commit it.`n$ignoreLine`n"
    if (Test-Path -LiteralPath $GitIgnore) {
        [IO.File]::AppendAllText($GitIgnore, $block)
        Write-Host '  appended output-routing.local.json to .gitignore'
    } else {
        [IO.File]::WriteAllText($GitIgnore, $block.TrimStart("`n"))
        Write-Host '  created .gitignore (ignores output-routing.local.json)'
    }
}

if (-not (Test-Path -LiteralPath $LocalRouting)) {
    $mirrorRoot = $null

    if ($PSBoundParameters.ContainsKey('SharePointMirrorRoot')) {
        # Explicit answer - including '' meaning "skip". Never prompt.
        $mirrorRoot = $SharePointMirrorRoot
    }
    elseif ([Environment]::UserInteractive -and -not $env:CI) {
        Write-Host ''
        Write-Host 'Optional: some deliverables can be copied to a SharePoint folder after merge,'
        Write-Host 'so people without repo access can read them. This is a one-way copy - git stays'
        Write-Host 'the source of truth. The path is stored locally and never committed.'
        $answer = Read-Host 'Path to your synced SharePoint library folder (Enter to skip)'
        $mirrorRoot = $answer.Trim().Trim('"')
    }
    else {
        $mirrorRoot = ''   # non-interactive and unanswered: skip quietly
    }

    if ($mirrorRoot -and -not (Test-Path -LiteralPath $mirrorRoot)) {
        Write-Host "  warning: '$mirrorRoot' does not exist on this machine." -ForegroundColor Yellow
        Write-Host '  Saved anyway - the mirror-to-sharepoint skill will refuse until it does.'
        Write-Host '  Fix it by editing output-routing.local.json.'
    }

    $example = "$LocalRouting.example"
    if (-not (Test-Path -LiteralPath $example)) {
        Fail 'output-routing.local.json.example is missing.' 'Restore it from the repo, then re-run ./tools/bootstrap.ps1'
    }
    # ReadAllText, not Get-Content -Raw: PS 5.1 reads as ANSI by default and would mangle
    # the em-dashes in the template into mojibake on the round-trip back out as UTF-8.
    $json = [IO.File]::ReadAllText($example) | ConvertFrom-Json
    $json.sharepointRoot = [string]$mirrorRoot
    [IO.File]::WriteAllText($LocalRouting, ($json | ConvertTo-Json -Depth 5))

    if ($mirrorRoot) {
        Write-Host "  created output-routing.local.json (mirror folder: $mirrorRoot) - git-ignored"
    } else {
        Write-Host '  created output-routing.local.json (mirroring off) - git-ignored'
    }
}

# --- 3. Sync + verify -------------------------------------------------------------
$syncScript = Join-Path $Root 'tools/sync.ps1'
if (-not (Test-Path -LiteralPath $syncScript)) {
    Fail 'tools/sync.ps1 not found.' 'Restore tools/sync.ps1 from the repo, then re-run ./tools/bootstrap.ps1'
}

Write-Host ''
& $syncScript -Tools $Tools
if ($LASTEXITCODE -ne 0) {
    Fail 'tools/sync.ps1 failed while writing derived files.' 'Read the error above, fix the named source file, then re-run ./tools/bootstrap.ps1'
}

Write-Host ''
& $syncScript -Tools $Tools -Check
$checkExit = $LASTEXITCODE
if ($checkExit -ne 0) {
    Fail 'tools/sync.ps1 -Check found a problem (see above).' 'Fix the named issue in the source file it names, then re-run ./tools/bootstrap.ps1'
}

# --- 4. Enable the pre-commit hook -------------------------------------------------
& git -C $Root config core.hooksPath .githooks
Write-Host ''
Write-Host 'Pre-commit check enabled (git config core.hooksPath .githooks).'

# --- 5. Summary --------------------------------------------------------------------
$InstructionFiles = @()
if (Test-ToolInList 'claude')  { $InstructionFiles += 'CLAUDE.md' }
if (Test-ToolInList 'gemini')  { $InstructionFiles += 'GEMINI.md' }
if (Test-ToolInList 'copilot') { $InstructionFiles += '.github/copilot-instructions.md' }

$McpFiles = @()
if (Test-ToolInList 'copilot') { $McpFiles += '.vscode/mcp.json' }
if (Test-ToolInList 'claude')  { $McpFiles += '.mcp.json' }
if (Test-ToolInList 'gemini')  { $McpFiles += '.gemini/settings.json' }
if (Test-ToolInList 'codex')   { $McpFiles += '.codex/config.toml' }

Write-Host ''
Write-Host "Setup complete for: $($Tools -join ', '). The five layers:"
Write-Host "  instructions   source: AGENTS.md                 generated: $($InstructionFiles -join ', ')"
Write-Host '  skills         source: skills/**/SKILL.md         generated: .agents/skills/** (universal, not tool-gated)'
if (Test-ToolInList 'copilot') {
    Write-Host '  agents         source: agents/*.agent.md          generated: .github/agents/*.agent.md'
} else {
    Write-Host '  agents         source: agents/*.agent.md          generated: (none - copilot not selected)'
}
Write-Host "  mcp servers    source: mcp/servers.json           generated: $($McpFiles -join ', ')"
Write-Host '  distribution   source: distribution/ (optional, advanced - most teams never touch this)'
Write-Host ''
if ($CreatedAny) {
    Write-Host "You may want to edit the $($Created.Count) file(s) just created before doing real work:"
    Write-Host "  $($Created -join ', ')"
    Write-Host ''
}
Write-Host 'Deliverables: written to docs/, then committed to a branch and opened as a pull'
Write-Host 'request by the "commit-a-deliverable" skill. Nobody needs to run git themselves.'
Write-Host ''
Write-Host 'Try the worked example: ask your AI tool to use the "record-a-decision" skill'
Write-Host '(skills/architecture-design/record-a-decision/SKILL.md). See docs/reference.md for'
Write-Host 'how to invoke a skill in your specific tool.'
exit 0
