#Requires -Version 5.1
<#
Summarises a consuming project's docs/usage-log.md (self-reported skill/agent
usage, see AGENTS.md "Tracking skill and agent usage"). Read-only.

Run from the consuming project root:  ./tools/report-usage.ps1
Or point at a specific file:          ./tools/report-usage.ps1 -Path path\to\usage-log.md
#>
[CmdletBinding()]
param(
    [string]$Path = 'docs/usage-log.md'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) {
    Write-Warning "No usage log at $Path - nothing logged yet."
    exit 0
}

$rows = @()
foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -notmatch '^\s*\|(.+)\|\s*$') { continue }
    $cells = $line.Trim().Trim('|') -split '\|' | ForEach-Object { $_.Trim() }
    if ($cells.Count -lt 7) { continue }
    if ($cells[0] -eq 'Date') { continue }               # header row
    if ($cells[0] -match '^-+$') { continue }            # separator row
    $rows += [PSCustomObject]@{
        Date         = $cells[0]
        Tool         = $cells[1]
        Type         = $cells[2]
        Name         = $cells[3]
        Phase        = $cells[4]
        Outcome      = $cells[5]
        EffortSaved  = $cells[6]
        Credits      = if ($cells.Count -ge 8) { $cells[7] } else { '' }
    }
}

if ($rows.Count -eq 0) {
    Write-Host "No entries found in $Path."
    exit 0
}

Write-Host "Total entries: $($rows.Count)"

# Credits column is optional (see AGENTS.md) - only report it when present.
$creditTotal = 0.0
$creditRows = 0
foreach ($r in $rows) {
    $parsed = 0.0
    if ([double]::TryParse($r.Credits, [ref]$parsed)) {
        $creditTotal += $parsed
        $creditRows++
    }
}
if ($creditRows -gt 0) {
    Write-Host ("Copilot credits logged: {0:N1} (~USD {1:N2}) across {2} entr{3}" -f `
        $creditTotal, ($creditTotal / 100), $creditRows, $(if ($creditRows -eq 1) { 'y' } else { 'ies' }))
}

Write-Host "`nBy skill/agent name:"
$rows | Group-Object Name | Sort-Object Count -Descending | ForEach-Object {
    Write-Host ("  {0,-30} {1}" -f $_.Name, $_.Count)
}

Write-Host "`nBy tool:"
$rows | Group-Object Tool | Sort-Object Count -Descending | ForEach-Object {
    Write-Host ("  {0,-15} {1}" -f $_.Name, $_.Count)
}

Write-Host "`nBy phase:"
$rows | Where-Object { $_.Phase } | Group-Object Phase | Sort-Object Count -Descending | ForEach-Object {
    Write-Host ("  {0,-30} {1}" -f $_.Name, $_.Count)
}

Write-Host "`nOutcomes and effort saved, by name:"
foreach ($g in ($rows | Group-Object Name | Sort-Object Name)) {
    Write-Host "  $($g.Name):"
    foreach ($r in $g.Group) {
        Write-Host "    [$($r.Date)] $($r.Outcome) ($($r.EffortSaved))"
    }
}
