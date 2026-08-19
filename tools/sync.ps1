#Requires -Version 5.1
<#
Derives per-tool AI agent config from a single source of truth.

Sources (edit these; never edit derived files):
  AGENTS.md              project instructions
  skills/                canonical SKILL.md folders
  agents/                canonical *.agent.md files (single source - was duplicated in V1)
  mcp/servers.json       canonical MCP server list

Run:  ./tools/sync.ps1                          write derived files, all 4 tools
      ./tools/sync.ps1 -Tools copilot,claude    write derived files, only those tools
      ./tools/sync.ps1 -Check                   verify only, exit 1 on drift

-Tools is NOT persisted anywhere - repeat the same list on every manual run, and in
.githooks/pre-commit and .gitlab-ci.yml if you narrow it, or those will default back to
all 4 and flag the narrowed-out tools' files as drift. See docs/reference.md.
#>
[CmdletBinding()]
param(
    [switch]$Check,
    [ValidateSet('copilot', 'claude', 'codex', 'gemini')]
    [string[]]$Tools = @('copilot', 'claude', 'codex', 'gemini')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    try {
        $top = (& git rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and $top) { return $top.Trim() }
    } catch { }
    return (Get-Location).Path
}

function Fail([string]$What, [string]$Fix) {
    Write-Host ''
    Write-Host "sync: $What" -ForegroundColor Red
    Write-Host "Fix: $Fix"
    exit 1
}

$Root  = Get-RepoRoot
$Drift = [System.Collections.Generic.List[string]]::new()
$MdHeader = "<!-- AUTO-GENERATED from AGENTS.md - do not edit. Run tools/sync.ps1 -->`n`n"

function Test-Same([string]$Path, [string]$Content) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    return ([IO.File]::ReadAllText($Path) -eq $Content)
}

function Set-Derived([string]$Rel, [string]$Content) {
    $path = Join-Path $Root $Rel
    if (Test-Same $path $Content) { return }
    if ($Check) { $Drift.Add($Rel); return }
    $dir = Split-Path -Parent $path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [IO.File]::WriteAllText($path, $Content)
    Write-Host "  wrote $Rel"
}

function Test-ToolEnabled([string]$Tool) { $Tools -contains $Tool }

function Remove-IfExists([string]$Rel) {
    $path = Join-Path $Root $Rel
    if (-not (Test-Path -LiteralPath $path)) { return }
    if ($Check) { $Drift.Add("stale (tool disabled): $Rel"); return }
    Remove-Item -LiteralPath $path -Force
    Write-Host "  removed $Rel (tool disabled)"
}

function Set-DerivedIfEnabled([string]$Tool, [string]$Rel, [string]$Content) {
    if (Test-ToolEnabled $Tool) { Set-Derived $Rel $Content }
    else { Remove-IfExists $Rel }
}

function Remove-StaleMirrorFiles([string]$TargetRel, [System.Collections.Generic.HashSet[string]]$Want) {
    $tRoot = Join-Path $Root $TargetRel
    if (-not (Test-Path -LiteralPath $tRoot)) { return }
    foreach ($existing in Get-ChildItem -LiteralPath $tRoot -Recurse -File) {
        $rel = $existing.FullName.Substring($tRoot.Length).TrimStart('\', '/')
        if (-not $Want.Contains($rel)) {
            if ($Check) { $Drift.Add("stale: $TargetRel/$rel") }
            else { Remove-Item -LiteralPath $existing.FullName -Force; Write-Host "  removed $TargetRel/$rel" }
        }
    }
}

# --- 1. Instructions ---------------------------------------------------------
function Sync-Instructions {
    $src = Join-Path $Root 'AGENTS.md'
    if (-not (Test-Path -LiteralPath $src)) { Write-Warning 'AGENTS.md not found - skipping instructions'; return }
    $wrapped = $MdHeader + [IO.File]::ReadAllText($src)
    Set-DerivedIfEnabled 'claude'  'CLAUDE.md' $wrapped
    Set-DerivedIfEnabled 'gemini'  'GEMINI.md' $wrapped
    Set-DerivedIfEnabled 'copilot' '.github/copilot-instructions.md' $wrapped
}

# --- 2. Skills -----------------------------------------------------------------
# V2 default: mirror only into the universal `.agents/skills/` path. V1 mirrored
# into three tool-specific paths (.claude/skills, .agents/skills, .gemini/skills)
# unconditionally. Whether Claude Code / Gemini actually need their own copy
# instead of reading the universal path is an open question (see plan) - the
# mirror function below is written to support extra targets, but the extra-target
# list stays empty until that is verified, so we don't reintroduce the four-way
# mirror V2 is meant to cut.
$SkillMirrorTargets = @('.agents/skills')  # add '.claude/skills', '.gemini/skills' here once verified

function Sync-Skills {
    # Sources nest skills under a phase folder (skills/strategy-planning/kick-off-a-project/
    # SKILL.md) or not (skills/log-tech-debt/SKILL.md). Copilot's skill discovery only looks
    # one level deep (.agents/skills/*/SKILL.md), so the mirror must flatten every skill to
    # .agents/skills/<skill-name>/<file> regardless of source nesting - phase folders are a
    # source-side organising convenience only, not part of the discovered path.
    $src = Join-Path $Root 'skills'
    if (-not (Test-Path -LiteralPath $src)) { Write-Warning 'skills/ not found - skipping skills'; return }
    $files = Get-ChildItem -LiteralPath $src -Recurse -File
    $seen = @{}
    foreach ($f in $files) {
        $flatRel = Join-Path $f.Directory.Name $f.Name
        if ($seen.ContainsKey($flatRel) -and $seen[$flatRel] -ne $f.FullName) {
            Fail "two skill files flatten to the same path ($flatRel): $($seen[$flatRel]) and $($f.FullName)." 'Rename one of the skill folders so they no longer collide, then re-run.'
        }
        $seen[$flatRel] = $f.FullName
    }
    foreach ($t in $SkillMirrorTargets) {
        $want = [System.Collections.Generic.HashSet[string]]::new()
        foreach ($f in $files) {
            $rel = Join-Path $f.Directory.Name $f.Name
            [void]$want.Add($rel)
            Set-Derived (Join-Path $t $rel) ([IO.File]::ReadAllText($f.FullName))
        }
        Remove-StaleMirrorFiles $t $want
    }
}

# --- 3. Agents -----------------------------------------------------------------
# Single source at repo-root agents/*.agent.md. Copilot requires its own path
# (.github/agents/), so that's a generated mirror, not a second source. This is
# the fix for V1's bug where agents lived in .github/agents AND plugins/v1-sdlc,
# with no single source and drift between the two.
function Sync-Agents {
    $src = Join-Path $Root 'agents'
    if (-not (Test-Path -LiteralPath $src)) { Write-Warning 'agents/ not found - skipping agents'; return }
    $want = [System.Collections.Generic.HashSet[string]]::new()
    if (Test-ToolEnabled 'copilot') {
        foreach ($f in Get-ChildItem -LiteralPath $src -Filter '*.agent.md' -File) {
            [void]$want.Add($f.Name)
            $body = [IO.File]::ReadAllText($f.FullName)
            # Insert the generated-file notice right after the closing frontmatter
            # delimiter (can't prepend - most tools require frontmatter on line 1).
            $parts = [regex]::Split($body, '(?m)^---\s*$', 3)
            if ($parts.Count -ge 3) {
                $content = "---" + $parts[1] + "---`n<!-- AUTO-GENERATED from agents/$($f.Name) - do not edit. Run tools/sync.ps1 -->`n" + $parts[2]
            } else {
                $content = "<!-- AUTO-GENERATED from agents/$($f.Name) - do not edit. Run tools/sync.ps1 -->`n`n" + $body
            }
            Set-Derived (Join-Path '.github/agents' $f.Name) $content
        }
    }
    # Empty $want when copilot is disabled - cleans out (or flags, in -Check) the whole mirror.
    Remove-StaleMirrorFiles '.github/agents' $want
}

# --- 4. MCP --------------------------------------------------------------------
function ConvertTo-Toml($Servers) {
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.Append("# AUTO-GENERATED from mcp/servers.json - do not edit.`n")
    foreach ($p in $Servers.PSObject.Properties) {
        $s = $p.Value
        [void]$sb.Append("`n[mcp_servers.$($p.Name)]`n")
        if ($s.PSObject.Properties.Name -contains 'url') { [void]$sb.Append("url = `"$($s.url)`"`n") }
        if ($s.PSObject.Properties.Name -contains 'command') {
            [void]$sb.Append("command = `"$($s.command)`"`n")
            if ($s.PSObject.Properties.Name -contains 'args') {
                $argList = ($s.args | ForEach-Object { "`"$_`"" }) -join ', '
                [void]$sb.Append("args = [$argList]`n")
            }
        }
    }
    return $sb.ToString()
}

function Sync-Mcp {
    $src = Join-Path $Root 'mcp/servers.json'
    if (-not (Test-Path -LiteralPath $src)) { Write-Warning 'mcp/servers.json not found - skipping MCP'; return }
    $servers = (Get-Content -LiteralPath $src -Raw | ConvertFrom-Json).servers
    $claude = [ordered]@{ mcpServers = $servers } | ConvertTo-Json -Depth 8
    Set-DerivedIfEnabled 'copilot' '.vscode/mcp.json'      ([ordered]@{ servers = $servers } | ConvertTo-Json -Depth 8)
    Set-DerivedIfEnabled 'claude'  '.mcp.json'              $claude
    Set-DerivedIfEnabled 'gemini'  '.gemini/settings.json'  $claude
    Set-DerivedIfEnabled 'codex'   '.codex/config.toml'     (ConvertTo-Toml $servers)
}

Write-Host "Repo: $Root"
Write-Host ($(if ($Check) { 'Checking...' } else { 'Syncing derived config...' }))
Sync-Instructions
Sync-Skills
Sync-Agents
Sync-Mcp

if ($Check -and $Drift.Count -gt 0) {
    Write-Host ''
    Write-Warning 'Problems found:'
    $Drift | ForEach-Object { Write-Host "  - $_" }
    Write-Host 'Fix: edit sources, then run ./tools/sync.ps1'
    exit 1
}
if ($Check) { Write-Host 'In sync.' }
exit 0
