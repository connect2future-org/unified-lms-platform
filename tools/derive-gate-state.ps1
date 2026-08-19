#Requires -Version 5.1
<#
Derives a deterministic gate-state file from declared evidence - never from prose and
never from a model's self-report. Optional, per consuming project: nothing happens
unless the project commits an evidence manifest.

How it works:
  1. The project declares docs/gates/<NN>-<slug>.evidence.json - one entry per gate
     criterion, each naming the evidence paths that satisfy it and, optionally, a
     check command whose exit code verifies it.
  2. This script reads the matching sdlc/phases/<NN>-<slug>/gate.md (or checkpoint.md)
     ONLY to count its checklist lines - it never interprets the prose.
  3. Each criterion derives to: red (an evidence path is missing, or the check exited
     non-zero), pending (nothing declared for it), or green (all paths exist and the
     check, if any, exited 0).
  4. A manifest declaring fewer criteria than the gate lists caps the rollup at
     pending - a gate is never green by omission.
  5. Rollup: any red -> red; any pending or under-declaration -> pending; else green.

Output: docs/gates/<NN>-<slug>.gate-state.json. Nothing else may write that file
(the file-guard hook blocks Edit/Write of *.gate-state.json in Claude Code; this
script writes shell-side, so it is the one legitimate writer).

Honest limits: path existence plus an exit code proves the evidence is PRESENT, not
that it is SUFFICIENT. A green state feeds check-gate-readiness as its starting
point; it never replaces the human sign-off that skill requires.

Exit codes: 0 = green, 1 = red, 2 = pending (or no manifest found).

Usage:
  tools/derive-gate-state.ps1 -Phase 02-requirements-design
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Phase
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    try {
        $top = (& git rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and $top) { return (Resolve-Path -LiteralPath $top.Trim()).Path }
    } catch { }
    return (Get-Location).Path
}

$Root = Get-RepoRoot

$phaseDir = Join-Path $Root "sdlc/phases/$Phase"
if (-not (Test-Path -LiteralPath $phaseDir)) {
    Write-Host "derive-gate-state: phase '$Phase' is not a folder under sdlc/phases/" -ForegroundColor Red
    exit 1
}
$gateFile = Join-Path $phaseDir 'gate.md'
if (-not (Test-Path -LiteralPath $gateFile)) { $gateFile = Join-Path $phaseDir 'checkpoint.md' }
if (-not (Test-Path -LiteralPath $gateFile)) {
    Write-Host "derive-gate-state: $Phase has neither gate.md nor checkpoint.md" -ForegroundColor Red
    exit 1
}

# The only thing read from the gate document is the number of checklist items.
$gateCriteriaCount = @(
    Get-Content -LiteralPath $gateFile | Where-Object { $_ -match '^\s*-\s*\[[ xX]\]' }
).Count

$gatesDir = Join-Path $Root 'docs/gates'
$evidencePath = Join-Path $gatesDir "$Phase.evidence.json"
if (-not (Test-Path -LiteralPath $evidencePath)) {
    Write-Host "derive-gate-state: no manifest at docs/gates/$Phase.evidence.json - nothing to derive (state: pending)"
    exit 2
}

try {
    $manifest = Get-Content -LiteralPath $evidencePath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Host "derive-gate-state: docs/gates/$Phase.evidence.json is not valid JSON: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$declared = @()
if ($manifest.PSObject.Properties.Name -contains 'criteria') {
    # PS 5.1: re-enumerate so a single-entry array still behaves as one.
    $declared = @($manifest.criteria | ForEach-Object { $_ })
}

$criteriaOut = [System.Collections.Generic.List[object]]::new()
$anyRed = $false
$anyPending = $false

foreach ($c in $declared) {
    $id = if ($c.PSObject.Properties.Name -contains 'id' -and $c.id) { [string]$c.id } else { "criterion-$($criteriaOut.Count + 1)" }
    $paths = @()
    if ($c.PSObject.Properties.Name -contains 'evidence') { $paths = @($c.evidence | ForEach-Object { [string]$_ }) }
    $check = $null
    if ($c.PSObject.Properties.Name -contains 'check' -and $c.check) { $check = [string]$c.check }

    $status = 'green'
    $detail = [System.Collections.Generic.List[string]]::new()

    if ($paths.Count -eq 0 -and -not $check) {
        $status = 'pending'
        $detail.Add('nothing declared - no evidence paths and no check')
    }

    foreach ($p in $paths) {
        $full = Join-Path $Root ($p -replace '/', [string][IO.Path]::DirectorySeparatorChar)
        if (Test-Path -LiteralPath $full) {
            $detail.Add("present: $p")
        } else {
            $status = 'red'
            $detail.Add("missing: $p")
        }
    }

    if ($check -and $status -ne 'red') {
        $shell = if (Get-Command powershell.exe -ErrorAction SilentlyContinue) { 'powershell.exe' } else { 'pwsh' }
        & $shell -NoProfile -NonInteractive -Command $check *> $null
        if ($LASTEXITCODE -eq 0) {
            $detail.Add("check exited 0: $check")
        } else {
            $status = 'red'
            $detail.Add("check exited $($LASTEXITCODE): $check")
        }
    }

    if ($status -eq 'red') { $anyRed = $true }
    if ($status -eq 'pending') { $anyPending = $true }

    $criteriaOut.Add([ordered]@{
        id       = $id
        status   = $status
        evidence = $paths
        detail   = @($detail)
    })
}

$underDeclared = $declared.Count -lt $gateCriteriaCount
$overall = 'green'
if ($anyRed) { $overall = 'red' }
elseif ($anyPending -or $underDeclared -or $declared.Count -eq 0) { $overall = 'pending' }

$state = [ordered]@{
    phase             = $Phase
    gateFile          = ($gateFile.Substring($Root.Length).TrimStart('\', '/') -replace '\\', '/')
    derivedAtUtc      = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    generator         = 'tools/derive-gate-state.ps1'
    criteriaInGate    = $gateCriteriaCount
    criteriaDeclared  = $declared.Count
    underDeclared     = $underDeclared
    overall           = $overall
    criteria          = @($criteriaOut)
    note              = 'Derived from declared evidence paths and check exit codes only. Presence is not sufficiency - human sign-off via check-gate-readiness still applies.'
}

if (-not (Test-Path -LiteralPath $gatesDir)) { [void](New-Item -ItemType Directory -Path $gatesDir) }
$outPath = Join-Path $gatesDir "$Phase.gate-state.json"
[IO.File]::WriteAllText($outPath, (($state | ConvertTo-Json -Depth 6) + "`n"))

Write-Host "derive-gate-state: $Phase -> $overall ($($declared.Count)/$gateCriteriaCount criteria declared) - docs/gates/$Phase.gate-state.json"
switch ($overall) {
    'green'   { exit 0 }
    'red'     { exit 1 }
    'pending' { exit 2 }
}
