#Requires -Version 5.1
<#
Reports GitHub Copilot credit spend from VS Code chat session logs. Read-only.

VS Code stores each Copilot chat session as a JSONL event log under
%APPDATA%\Code\User\workspaceStorage\<hash>\chatSessions\. Credit events set a
cumulative per-request counter, so the last value per request index is that
request's final spend and a session's total is the sum across requests.

Known limits (state these when quoting figures):
- Covers VS Code Copilot chat/agent sessions only - not code completions, not
  Copilot CLI, not other tools.
- The copilotCredits field is an undocumented VS Code internal; a copilot-chat
  extension update may change or remove it. The script warns and skips files
  it cannot parse.
- Logs are local and per-machine - an indicative figure, never an audited one.
- 1 credit = 1 US cent (GitHub usage-based billing).

Run for the current project:      ./tools/report-copilot-credits.ps1
For a specific project:           ./tools/report-copilot-credits.ps1 -ProjectPath C:\path\to\project
For every workspace:              ./tools/report-copilot-credits.ps1 -All
Per-request breakdown:            ./tools/report-copilot-credits.ps1 -Detailed
Sessions since a date:            ./tools/report-copilot-credits.ps1 -Since 2026-08-01
#>
[CmdletBinding()]
param(
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$All,
    [datetime]$Since,
    [switch]$Detailed,
    [string[]]$CodeRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $CodeRoot) {
    $CodeRoot = @(
        (Join-Path $env:APPDATA 'Code'),
        (Join-Path $env:APPDATA 'Code - Insiders')
    )
}

# --- Locate workspaceStorage folders and map each to its project path -------------

function Get-WorkspaceFolderPath {
    param([string]$WorkspaceDir)
    $wsJson = Join-Path $WorkspaceDir 'workspace.json'
    if (-not (Test-Path -LiteralPath $wsJson)) { return $null }
    try {
        $meta = Get-Content -LiteralPath $wsJson -Raw | ConvertFrom-Json
    } catch {
        return $null
    }
    if (-not ($meta.PSObject.Properties.Name -contains 'folder')) { return $null }
    # Decode a file URI such as file:///c%3A/Users/... into C:\Users\...
    $uri = [uri]$meta.folder
    if ($uri.Scheme -ne 'file') { return $null }
    return [uri]::UnescapeDataString($uri.AbsolutePath).TrimStart('/') -replace '/', '\'
}

# --- Parse one session JSONL for credits and metadata ------------------------------
# Regex extraction, not ConvertFrom-Json: single lines run to several megabytes,
# which is slow and can exceed the PS 5.1 serialiser's maxJsonLength. We only
# need a handful of scalar fields.

$CreditPattern  = [regex]'"k":\["requests",(\d+),"copilotCredits"\],"v":([0-9][0-9.eE+-]*)'
$CreatedPattern = [regex]'"creationDate":(\d+)'
$ModelPattern   = [regex]'"modelId":"([^"]+)"'
$PromptPattern  = [regex]'"message":\{"text":"((?:[^"\\]|\\.){1,200})'

function Get-SessionReport {
    param([string]$SessionFile)

    $credits = @{}          # request index -> last cumulative value
    $prompts = New-Object System.Collections.Generic.List[string]
    $models  = New-Object System.Collections.Generic.List[string]
    $created = $null

    foreach ($line in [IO.File]::ReadLines($SessionFile)) {
        foreach ($m in $CreditPattern.Matches($line)) {
            $credits[[int]$m.Groups[1].Value] = [double]$m.Groups[2].Value
        }
        if ($null -eq $created) {
            $cm = $CreatedPattern.Match($line)
            if ($cm.Success) {
                $created = [DateTimeOffset]::FromUnixTimeMilliseconds([long]$cm.Groups[1].Value).LocalDateTime
            }
        }
        foreach ($m in $ModelPattern.Matches($line))  { $models.Add($m.Groups[1].Value) }
        foreach ($m in $PromptPattern.Matches($line)) {
            $text = $m.Groups[1].Value -replace '\\r|\\n', ' ' -replace '\\(.)', '$1'
            if ($text.Length -gt 60) { $text = $text.Substring(0, 60) + '...' }
            $prompts.Add($text)
        }
    }

    [PSCustomObject]@{
        SessionId = [IO.Path]::GetFileNameWithoutExtension($SessionFile)
        Created   = $created
        Requests  = $credits
        Prompts   = $prompts
        Models    = $models | Select-Object -Unique
    }
}

# --- Collect sessions ---------------------------------------------------------------

$targetFull = $null
if (-not $All) {
    $targetFull = (Resolve-Path -LiteralPath $ProjectPath).Path.TrimEnd('\')
}

$projects = @{}   # project path -> list of session reports
$grandTotal = 0.0

foreach ($root in $CodeRoot) {
    $storage = Join-Path $root 'User\workspaceStorage'
    if (-not (Test-Path -LiteralPath $storage)) { continue }

    foreach ($wsDir in Get-ChildItem -LiteralPath $storage -Directory) {
        $chatDir = Join-Path $wsDir.FullName 'chatSessions'
        if (-not (Test-Path -LiteralPath $chatDir)) { continue }

        $folder = Get-WorkspaceFolderPath -WorkspaceDir $wsDir.FullName
        if (-not $folder) { $folder = "(unknown workspace $($wsDir.Name))" }
        if (-not $All -and $folder.TrimEnd('\') -ne $targetFull) { continue }

        foreach ($file in Get-ChildItem -LiteralPath $chatDir -Filter '*.jsonl' -File) {
            try {
                $report = Get-SessionReport -SessionFile $file.FullName
            } catch {
                Write-Warning "Could not parse $($file.FullName): $($_.Exception.Message)"
                continue
            }
            if ($Since -and $report.Created -and $report.Created -lt $Since) { continue }
            if ($report.Requests.Count -eq 0) { continue }
            if (-not $projects.ContainsKey($folder)) {
                $projects[$folder] = New-Object System.Collections.Generic.List[object]
            }
            $projects[$folder].Add($report)
        }
    }
}

if ($projects.Count -eq 0) {
    Write-Warning 'No Copilot chat sessions with credit data found for the given scope.'
    exit 0
}

# --- Report -------------------------------------------------------------------------

foreach ($proj in ($projects.Keys | Sort-Object)) {
    Write-Host "`nProject: $proj"
    $projTotal = 0.0
    foreach ($s in ($projects[$proj] | Sort-Object Created)) {
        $sessionTotal = ($s.Requests.Values | Measure-Object -Sum).Sum
        $projTotal += $sessionTotal
        $when = if ($s.Created) { $s.Created.ToString('yyyy-MM-dd HH:mm') } else { 'unknown date' }
        $shortId = $s.SessionId.Substring(0, [Math]::Min(8, $s.SessionId.Length))
        Write-Host ("  [{0}] session {1}  {2} request(s)  {3:N1} credits" -f $when, $shortId, $s.Requests.Count, $sessionTotal)
        if ($Detailed) {
            $indices = $s.Requests.Keys | Sort-Object
            foreach ($i in $indices) {
                # Prompt/request pairing is positional and best-effort - the log
                # does not key prompts by request index.
                $prompt = if ($i -lt $s.Prompts.Count) { $s.Prompts[$i] } else { '' }
                Write-Host ("    request {0,2}  {1,8:N1} credits  {2}" -f $i, $s.Requests[$i], $prompt)
            }
            if ($s.Models) { Write-Host ("    models: {0}" -f ($s.Models -join ', ')) }
        }
    }
    $grandTotal += $projTotal
    Write-Host ("  Project total: {0:N1} credits (~USD {1:N2})" -f $projTotal, ($projTotal / 100))
}

Write-Host ("`nGrand total: {0:N1} credits (~USD {1:N2})" -f $grandTotal, ($grandTotal / 100))
Write-Host 'Note: VS Code Copilot chat/agent sessions only; copilotCredits is an undocumented'
Write-Host 'VS Code internal and this figure is indicative, not an audited record.'
