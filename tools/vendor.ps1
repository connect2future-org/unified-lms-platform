#Requires -Version 5.1
<#
Copies this framework's source layer into a project repo. Run from a clone of this repo,
checked out at the tag you want to vendor:  ./tools/vendor.ps1 -TargetPath <path-to-project>

What it copies:
  Always synced (safe to overwrite every run - no per-project customisation lives here):
    skills/, tools/, sdlc/phases/, .githooks/, docs/reference.md,
    AGENTS.md.example, mcp/servers.json.example
  Copied once, never auto-overwritten (a team customises these after first vendor):
    AGENTS.md, mcp/servers.json, output-routing.json, .gitlab-ci.yml,
    .claude/settings.json (wires the Claude Code guard hooks under tools/hooks/ -
    a project with its own settings.json must merge the hooks block by hand), and each
    individual file under agents/ (a new agent added by a framework update still copies
    in even once the project has its own agents/ folder; an existing agent file with
    the same name never gets touched)

Stale-file removal is manifest-based: this script records every file it ships in
.framework-vendor-manifest.txt at the target root, and only ever deletes a file that a
previous run of this script put there. A project's own files under tools/, skills/ and
so on are never touched.

Not done here: no remote git URL/tag fetch (source is always this local clone), no
merging of an existing project's CI file or git hook path, no call into bootstrap.ps1.
Those stay manual - this script only gets the framework's files into place.

Safe to run again any time to pick up framework updates.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$TargetPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail([string]$What, [string]$Fix) {
    Write-Host ''
    Write-Host "vendor: $What" -ForegroundColor Red
    Write-Host "Fix: $Fix"
    exit 1
}

function Get-RepoRoot {
    try {
        $top = (& git rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and $top) {
            # git emits forward slashes on Windows - normalise so path comparisons work
            return (Resolve-Path -LiteralPath $top.Trim()).Path
        }
    } catch { }
    return (Get-Location).Path
}

# --- 1. Prerequisites -----------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail 'git not found on PATH.' 'Install git (https://git-scm.com/downloads), then re-run ./tools/vendor.ps1'
}

$Root = Get-RepoRoot
if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
    Fail "not running inside a git repo (resolved root: $Root)." 'cd into this framework repo, then re-run ./tools/vendor.ps1'
}

if (-not (Test-Path -LiteralPath $TargetPath)) {
    Fail "-TargetPath '$TargetPath' does not exist." 'Create the target directory first (git init it if it is a brand-new project), then re-run.'
}
$Target = (Resolve-Path -LiteralPath $TargetPath).Path

# Containment guard: compare with a trailing separator so C:\repo does not match
# C:\repo-other, and case-insensitively because Windows paths are.
$sep = [IO.Path]::DirectorySeparatorChar
$rootCmp = $Root.TrimEnd('\', '/') + $sep
$targetCmp = $Target.TrimEnd('\', '/') + $sep
if ($targetCmp.StartsWith($rootCmp, [StringComparison]::OrdinalIgnoreCase)) {
    Fail 'TargetPath resolves inside this framework repo itself.' 'Point -TargetPath at the separate project repo you want to vendor into.'
}

Write-Host "Source (this framework repo): $Root"
Write-Host "Target (project repo):        $Target"
Write-Host ''

# --- 2. Always-synced layer ------------------------------------------------------
# Everything shipped this run is recorded; only files a previous run shipped (and this
# run no longer ships) are removed as stale.
$ManifestName = '.framework-vendor-manifest.txt'
$ManifestPath = Join-Path $Target $ManifestName
$PreviousShipped = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
if (Test-Path -LiteralPath $ManifestPath) {
    foreach ($line in Get-Content -LiteralPath $ManifestPath) {
        $trimmed = $line.Trim()
        if ($trimmed) { [void]$PreviousShipped.Add($trimmed) }
    }
}
$CurrentShipped = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

function Copy-ShippedFile([string]$SrcFull, [string]$RelFromTarget) {
    [void]$script:CurrentShipped.Add($RelFromTarget)
    $destPath = Join-Path $script:Target ($RelFromTarget -replace '/', [string][IO.Path]::DirectorySeparatorChar)
    $destDir = Split-Path -Parent $destPath
    if ($destDir -and -not (Test-Path -LiteralPath $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -LiteralPath $SrcFull -Destination $destPath -Force
}

function Sync-Tree([string]$RelDir) {
    $src = Join-Path $script:Root $RelDir
    if (-not (Test-Path -LiteralPath $src)) { return }
    $files = @(Get-ChildItem -LiteralPath $src -Recurse -File)
    foreach ($f in $files) {
        $rel = $f.FullName.Substring($src.Length).TrimStart('\', '/') -replace '\\', '/'
        Copy-ShippedFile $f.FullName "$RelDir/$rel"
    }
    Write-Host "  synced $RelDir/ ($($files.Count) file(s))"
}

Write-Host 'Framework-owned layer (always synced):'
foreach ($dir in @('skills', 'tools', 'sdlc/phases', '.githooks')) { Sync-Tree $dir }

foreach ($rel in @('AGENTS.md.example', 'mcp/servers.json.example',
                   'output-routing.json.example', 'output-routing.local.json.example',
                   'docs/reference.md', 'docs/spec.md')) {
    $src = Join-Path $Root $rel
    if (-not (Test-Path -LiteralPath $src)) { continue }
    Copy-ShippedFile $src $rel
    Write-Host "  synced $rel"
}

# Stale removal: only files this script shipped before and no longer ships.
foreach ($rel in $PreviousShipped) {
    if ($CurrentShipped.Contains($rel)) { continue }
    $stalePath = Join-Path $Target ($rel -replace '/', [string]$sep)
    if (Test-Path -LiteralPath $stalePath) {
        Remove-Item -LiteralPath $stalePath -Force
        Write-Host "  removed stale $rel"
        # Prune now-empty parent directories, stopping at the target root
        $dir = Split-Path -Parent $stalePath
        while ($dir -and $dir.TrimEnd('\', '/') -ne $Target.TrimEnd('\', '/')) {
            if (Get-ChildItem -LiteralPath $dir -Force -ErrorAction SilentlyContinue) { break }
            Remove-Item -LiteralPath $dir -Force
            $dir = Split-Path -Parent $dir
        }
    }
}

$sorted = @($CurrentShipped) | Sort-Object
Set-Content -LiteralPath $ManifestPath -Value ($sorted -join "`n") -Encoding utf8

# --- 3. Team-owned layer: copy once, never overwrite ----------------------------
Write-Host ''
Write-Host 'Team-owned layer (copied once, not auto-overwritten):'
$Skipped = [System.Collections.Generic.List[string]]::new()

foreach ($rel in @('AGENTS.md', 'mcp/servers.json', 'output-routing.json', '.gitlab-ci.yml', '.claude/settings.json')) {
    $src = Join-Path $Root $rel
    if (-not (Test-Path -LiteralPath $src)) { continue }
    $dst = Join-Path $Target ($rel -replace '/', [string]$sep)
    if (Test-Path -LiteralPath $dst) {
        $Skipped.Add($rel)
        continue
    }
    $dstDir = Split-Path -Parent $dst
    if ($dstDir -and -not (Test-Path -LiteralPath $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    Copy-Item -LiteralPath $src -Destination $dst -Force
    Write-Host "  copied $rel"
}

$agentsSrc = Join-Path $Root 'agents'
$agentsDst = Join-Path $Target 'agents'
if (Test-Path -LiteralPath $agentsSrc) {
    foreach ($f in Get-ChildItem -LiteralPath $agentsSrc -File) {
        $dst = Join-Path $agentsDst $f.Name
        if (Test-Path -LiteralPath $dst) {
            $Skipped.Add("agents/$($f.Name)")
            continue
        }
        if (-not (Test-Path -LiteralPath $agentsDst)) { New-Item -ItemType Directory -Path $agentsDst -Force | Out-Null }
        Copy-Item -LiteralPath $f.FullName -Destination $dst -Force
        Write-Host "  copied agents/$($f.Name)"
    }
}

foreach ($rel in $Skipped) {
    Write-Host "  skipped $rel - already present, not overwritten. Diff manually against this framework's copy if you want the latest changes."
}

# --- 4. Summary ------------------------------------------------------------------
Write-Host ''
Write-Host 'Vendored. Known collision risks this script does not touch - check by hand if they apply:'
Write-Host '  - an existing .github/agents/*.agent.md not part of this framework''s agent set'
Write-Host '  - an existing MCP config (.vscode/mcp.json etc.) with real servers already configured'
Write-Host '  - an existing git hook path (core.hooksPath already set to something else)'
Write-Host '  - a pre-existing .gitlab-ci.yml is left alone - add the sync-check and lint jobs to it by hand'
Write-Host ''
Write-Host "Next: cd '$Target' && ./tools/bootstrap.ps1"
exit 0
