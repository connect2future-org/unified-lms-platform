#Requires -Version 5.1
<#
Static checks on the framework's source layer. Catches the errors sync.ps1 cannot:
  1. SKILL.md frontmatter - name and description present, name matches its directory,
     phase (when present) names a real folder under sdlc/phases/
  2. Agent frontmatter - name and description present
  3. Backticked skill references ("the `x` skill", "skill `x`") resolve to a real skill
  4. Backticked repo paths (`skills/...`, `sdlc/...` etc.) point at files that exist
  5. Relative markdown links resolve
  6. output-routing.json is internally consistent and leaks no local path
  7. evals/ folders are well-formed - each matches a real skill and carries a prompt,
     a non-empty fixture, a valid rubric.json, and calibration/expected.json whose
     entries resolve (structure only; quality runs need an LLM - tools/run-evals.ps1)

Lints sources only (skills/, agents/, sdlc/, docs/, AGENTS.md, README.md, evals/README.md,
output-routing.json) - generated copies inherit whatever the source has, so checking them
twice adds nothing. Fixture and calibration files under evals/ are synthetic test data,
not framework prose, so their content is deliberately not linted.

Exit 0 when clean, exit 1 with one line per problem otherwise. Warnings print but never
affect the exit code - they flag config that predates a framework change and still works.
#>
[CmdletBinding()]
param()

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
$Problems = [System.Collections.Generic.List[string]]::new()
$Warnings = [System.Collections.Generic.List[string]]::new()

function Add-Problem([string]$File, [string]$What) {
    $rel = $File
    if ($File.StartsWith($Root)) { $rel = $File.Substring($Root.Length).TrimStart('\', '/') -replace '\\', '/' }
    $script:Problems.Add("$rel : $What")
}

function Add-Warning([string]$File, [string]$What) {
    $script:Warnings.Add("$File : $What")
}

function Get-Frontmatter([string]$Path) {
    $lines = Get-Content -LiteralPath $Path
    if ($lines.Count -lt 3 -or $lines[0].Trim() -ne '---') { return $null }
    $fm = @{}
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq '---') { return $fm }
        if ($lines[$i] -match '^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$') {
            $fm[$Matches[1]] = $Matches[2].Trim()
        }
    }
    return $null   # opening --- with no closing ---
}

# Paths that legitimately exist only in a consuming project, never in this repo
$DanglingAllowed = @(
    'docs/usage-log.md',
    'docs/consent-log.md',
    'docs/traceability-matrix.md',
    'docs/adr',
    'docs/adr/',
    'docs/gates',
    'docs/gates/',
    'output-routing.local.json'
)

# --- 1. Collect ground truth ------------------------------------------------------
$PhaseNames = @(Get-ChildItem -LiteralPath (Join-Path $Root 'sdlc/phases') -Directory | ForEach-Object Name)
$SkillFiles = @(Get-ChildItem -LiteralPath (Join-Path $Root 'skills') -Recurse -Filter 'SKILL.md' -File)
$SkillNames = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($sf in $SkillFiles) { [void]$SkillNames.Add($sf.Directory.Name) }

# --- 2. SKILL.md frontmatter -------------------------------------------------------
foreach ($sf in $SkillFiles) {
    $fm = Get-Frontmatter $sf.FullName
    if ($null -eq $fm) {
        Add-Problem $sf.FullName 'missing or unterminated YAML frontmatter block'
        continue
    }
    foreach ($required in @('name', 'description')) {
        if (-not $fm.ContainsKey($required) -or -not $fm[$required]) {
            Add-Problem $sf.FullName "frontmatter missing required field '$required'"
        }
    }
    if ($fm.ContainsKey('name') -and $fm['name'] -and $fm['name'] -ne $sf.Directory.Name) {
        Add-Problem $sf.FullName "frontmatter name '$($fm['name'])' does not match directory '$($sf.Directory.Name)'"
    }
    if ($fm.ContainsKey('phase') -and $fm['phase'] -and $PhaseNames -notcontains $fm['phase']) {
        Add-Problem $sf.FullName "phase '$($fm['phase'])' is not a folder under sdlc/phases/"
    }
}

# --- 3. Agent frontmatter ----------------------------------------------------------
foreach ($af in Get-ChildItem -LiteralPath (Join-Path $Root 'agents') -Filter '*.agent.md' -File) {
    $fm = Get-Frontmatter $af.FullName
    if ($null -eq $fm) {
        Add-Problem $af.FullName 'missing or unterminated YAML frontmatter block'
        continue
    }
    foreach ($required in @('name', 'description')) {
        if (-not $fm.ContainsKey($required) -or -not $fm[$required]) {
            Add-Problem $af.FullName "frontmatter missing required field '$required'"
        }
    }
}

# --- 4. References inside source markdown ------------------------------------------
$SourceMarkdown = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($dir in @('skills', 'agents', 'sdlc', 'docs')) {
    $p = Join-Path $Root $dir
    if (Test-Path -LiteralPath $p) {
        foreach ($f in Get-ChildItem -LiteralPath $p -Recurse -Filter '*.md' -File) { $SourceMarkdown.Add($f) }
    }
}
foreach ($rel in @('AGENTS.md', 'README.md', 'evals/README.md')) {
    $p = Join-Path $Root $rel
    if (Test-Path -LiteralPath $p) { $SourceMarkdown.Add((Get-Item -LiteralPath $p)) }
}

foreach ($mf in $SourceMarkdown) {
    $text = Get-Content -LiteralPath $mf.FullName -Raw

    # 4a. "`x` skill" / "skill `x`" must name a real skill
    $refs = [System.Collections.Generic.List[string]]::new()
    foreach ($m in [regex]::Matches($text, '`([a-z][a-z0-9-]*)`\s+skill')) { $refs.Add($m.Groups[1].Value) }
    foreach ($m in [regex]::Matches($text, 'skill\s+`([a-z][a-z0-9-]*)`')) { $refs.Add($m.Groups[1].Value) }
    foreach ($name in $refs | Sort-Object -Unique) {
        if (-not $SkillNames.Contains($name)) {
            Add-Problem $mf.FullName "references skill '$name' which does not exist under skills/"
        }
    }

    # 4b. Backticked repo paths must exist (root-relative)
    foreach ($m in [regex]::Matches($text, '`((?:skills|sdlc|agents|tools|mcp|docs)/[^`\s]+?)/?`')) {
        $relPath = $m.Groups[1].Value
        if ($DanglingAllowed -contains $relPath) { continue }
        if ($relPath -match '[<>*]') { continue }   # placeholder like sdlc/phases/<n>-<slug>/
        $full = Join-Path $Root ($relPath -replace '/', [string][IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $full)) {
            Add-Problem $mf.FullName "backticked path '$relPath' does not exist"
        }
    }

    # 4c. Relative markdown links must resolve (from the linking file's directory)
    foreach ($m in [regex]::Matches($text, '\[[^\]]*\]\(([^)\s]+)\)')) {
        $link = $m.Groups[1].Value
        if ($link -match '^(https?:|mailto:|#)') { continue }
        $linkPath = ($link -split '#')[0]
        if (-not $linkPath) { continue }
        if ($linkPath -match '[<>*]') { continue }
        if ($DanglingAllowed -contains $linkPath.TrimStart('./')) { continue }
        $full = Join-Path $mf.Directory.FullName ($linkPath -replace '/', [string][IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -Path $full)) {
            Add-Problem $mf.FullName "markdown link '$link' does not resolve"
        }
    }
}

# --- 5. output-routing.json -----------------------------------------------------------
# Unvalidated until now, so a typo'd destination shipped silently.
$RoutingPath = Join-Path $Root 'output-routing.json'
if (Test-Path -LiteralPath $RoutingPath) {
    $raw = Get-Content -LiteralPath $RoutingPath -Raw
    $routing = $null
    try { $routing = $raw | ConvertFrom-Json } catch {
        Add-Problem $RoutingPath "is not valid JSON: $($_.Exception.Message)"
    }

    # Leak check - the mirror path belongs in the git-ignored overlay, not here.
    if ($raw -match '(?i)[A-Z]:\\\\?Users\\\\?') {
        Add-Problem $RoutingPath 'contains a local user path. Move it to output-routing.local.json (git-ignored) - committing it leaks a path and breaks for teammates.'
    }

    if ($null -ne $routing) {
        $destNames = @()
        if ($routing.PSObject.Properties.Name -contains 'destinations') {
            $destNames = @($routing.destinations.PSObject.Properties.Name)
        } else {
            Add-Problem $RoutingPath "has no 'destinations' block"
        }

        # Pre-change config: still works via the routes fallback, but flag it.
        if ($destNames -contains 'sharepoint') {
            Add-Warning 'output-routing.json' 'has a "sharepoint" destination. That predates the git-plus-mirror model and is no longer used - SharePoint is reached via the mirror-to-sharepoint skill. Diff against output-routing.json.example to migrate. Still works as-is.'
        }

        foreach ($d in $destNames) {
            $dest = $routing.destinations.$d
            if ($dest.PSObject.Properties.Name -notcontains 'type') {
                Add-Problem $RoutingPath "destination '$d' has no 'type'"
            }
            elseif ($dest.type -eq 'mcp') {
                Add-Warning 'output-routing.json' "destination '$d' uses type 'mcp'. No MCP write destination exists in this framework - documents route to git and are mirrored after merge."
            }
            elseif ($dest.type -ne 'path') {
                Add-Problem $RoutingPath "destination '$d' has unknown type '$($dest.type)' (expected 'path')"
            }
        }

        # Every route target, and the default, must name a real destination.
        $routeClasses = @()
        if ($routing.PSObject.Properties.Name -contains 'routes') {
            foreach ($p in $routing.routes.PSObject.Properties) {
                if ($p.Name -like '_*') { continue }
                $routeClasses += $p.Name
                if ($destNames -notcontains $p.Value) {
                    Add-Problem $RoutingPath "route '$($p.Name)' points at destination '$($p.Value)' which is not defined"
                }
            }
        }
        if ($routing.PSObject.Properties.Name -contains 'default') {
            if ($destNames -notcontains $routing.default) {
                Add-Problem $RoutingPath "default destination '$($routing.default)' is not defined"
            }
        } else {
            Add-Problem $RoutingPath "has no 'default' destination"
        }

        # Mirror block.
        if ($routing.PSObject.Properties.Name -contains 'mirror') {
            $mirror = $routing.mirror
            $mClasses = @()
            $mNever = @()
            if ($mirror.PSObject.Properties.Name -contains 'classes') { $mClasses = @($mirror.classes) }
            if ($mirror.PSObject.Properties.Name -contains 'never')   { $mNever   = @($mirror.never) }

            foreach ($c in $mClasses) {
                if ($routeClasses -notcontains $c) {
                    Add-Problem $RoutingPath "mirror.classes lists '$c' which has no entry in routes"
                }
                if ($mNever -contains $c) {
                    Add-Problem $RoutingPath "'$c' is in both mirror.classes and mirror.never - one of them is wrong"
                }
            }
            if ($mirror.PSObject.Properties.Name -notcontains 'rootFrom') {
                Add-Problem $RoutingPath 'mirror block has no rootFrom naming the per-machine path file'
            }
        }
    }
}

# --- 6. evals/ structure --------------------------------------------------------------
# Structure only - whether an eval's scores mean anything needs an LLM, which stays
# on-demand via tools/run-evals.ps1. This keeps CI green without CI having model access.
$EvalsRoot = Join-Path $Root 'evals'
if (Test-Path -LiteralPath $EvalsRoot) {
    foreach ($ed in Get-ChildItem -LiteralPath $EvalsRoot -Directory) {
        if ($ed.Name -eq 'results') { continue }
        if (-not $SkillNames.Contains($ed.Name)) {
            Add-Problem $ed.FullName "eval folder '$($ed.Name)' does not match any skill under skills/"
        }
        if (-not (Test-Path -LiteralPath (Join-Path $ed.FullName 'prompt.md'))) {
            Add-Problem $ed.FullName 'has no prompt.md'
        }
        $fixtureDir = Join-Path $ed.FullName 'fixture'
        if (-not (Test-Path -LiteralPath $fixtureDir) -or
            @(Get-ChildItem -LiteralPath $fixtureDir -Recurse -File).Count -eq 0) {
            Add-Problem $ed.FullName 'has no fixture/ directory with at least one file'
        }
        $rubricPath = Join-Path $ed.FullName 'rubric.json'
        if (-not (Test-Path -LiteralPath $rubricPath)) {
            Add-Problem $ed.FullName 'has no rubric.json'
        } else {
            $rubric = $null
            try {
                # PS 5.1: ConvertFrom-Json emits a JSON array as one object - re-enumerate it.
                $rubric = @((Get-Content -LiteralPath $rubricPath -Raw | ConvertFrom-Json) | ForEach-Object { $_ })
            } catch {
                Add-Problem $rubricPath "is not valid JSON: $($_.Exception.Message)"
            }
            if ($null -ne $rubric) {
                if ($rubric.Count -eq 0) { Add-Problem $rubricPath 'has no criteria' }
                $ids = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
                foreach ($r in $rubric) {
                    foreach ($required in @('id', 'criterion', 'pass_condition')) {
                        if ($r.PSObject.Properties.Name -notcontains $required -or -not $r.$required) {
                            Add-Problem $rubricPath "criterion missing required field '$required'"
                        }
                    }
                    if ($r.PSObject.Properties.Name -contains 'id' -and $r.id -and -not $ids.Add([string]$r.id)) {
                        Add-Problem $rubricPath "duplicate criterion id '$($r.id)'"
                    }
                }
            }
        }
        $calDir = Join-Path $ed.FullName 'calibration'
        $expectedPath = Join-Path $calDir 'expected.json'
        if (-not (Test-Path -LiteralPath $expectedPath)) {
            Add-Problem $ed.FullName 'has no calibration/expected.json'
        } else {
            $expected = $null
            try { $expected = Get-Content -LiteralPath $expectedPath -Raw | ConvertFrom-Json } catch {
                Add-Problem $expectedPath "is not valid JSON: $($_.Exception.Message)"
            }
            if ($null -ne $expected) {
                foreach ($p in $expected.PSObject.Properties) {
                    if (-not (Test-Path -LiteralPath (Join-Path $calDir $p.Name))) {
                        Add-Problem $expectedPath "references '$($p.Name)' which does not exist in calibration/"
                    }
                    if (@('pass', 'borderline', 'fail') -notcontains [string]$p.Value) {
                        Add-Problem $expectedPath "'$($p.Name)' expects '$($p.Value)' - must be pass, borderline, or fail"
                    }
                }
            }
        }
    }
}

# --- 7. docs/gates/ gate-state and evidence files -------------------------------------
# Only present in consuming projects that opt into deterministic gate state
# (tools/derive-gate-state.ps1). Validated wherever they exist, since this lint is
# vendored and runs in consuming projects too.
$GatesDir = Join-Path $Root 'docs/gates'
if (Test-Path -LiteralPath $GatesDir) {
    foreach ($gf in Get-ChildItem -LiteralPath $GatesDir -Filter '*.json' -File) {
        $obj = $null
        try { $obj = Get-Content -LiteralPath $gf.FullName -Raw | ConvertFrom-Json } catch {
            Add-Problem $gf.FullName "is not valid JSON: $($_.Exception.Message)"
            continue
        }
        if ($gf.Name -like '*.gate-state.json') {
            $phase = if ($obj.PSObject.Properties.Name -contains 'phase') { [string]$obj.phase } else { '' }
            if (-not $phase -or $PhaseNames -notcontains $phase) {
                Add-Problem $gf.FullName "phase '$phase' is not a folder under sdlc/phases/"
            }
            if ($obj.PSObject.Properties.Name -notcontains 'overall' -or
                @('green', 'pending', 'red') -notcontains [string]$obj.overall) {
                Add-Problem $gf.FullName "overall must be green, pending, or red"
            }
            if ($obj.PSObject.Properties.Name -contains 'criteria') {
                foreach ($c in @($obj.criteria | ForEach-Object { $_ })) {
                    if (@('green', 'pending', 'red') -notcontains [string]$c.status) {
                        Add-Problem $gf.FullName "criterion '$($c.id)' has status '$($c.status)' - must be green, pending, or red"
                    }
                }
            }
            # Stale state is a warning, not a block - the next derive run refreshes it.
            $evTwin = Join-Path $GatesDir ($gf.Name -replace '\.gate-state\.json$', '.evidence.json')
            if ((Test-Path -LiteralPath $evTwin) -and
                (Get-Item -LiteralPath $evTwin).LastWriteTimeUtc -gt $gf.LastWriteTimeUtc) {
                Add-Warning $gf.Name 'is older than its evidence manifest - re-run tools/derive-gate-state.ps1'
            }
        }
        elseif ($gf.Name -like '*.evidence.json') {
            if ($obj.PSObject.Properties.Name -notcontains 'criteria') {
                Add-Problem $gf.FullName "has no 'criteria' array"
            } else {
                foreach ($c in @($obj.criteria | ForEach-Object { $_ })) {
                    if ($c.PSObject.Properties.Name -notcontains 'id' -or -not $c.id) {
                        Add-Problem $gf.FullName 'has a criterion with no id'
                    }
                    if ($c.PSObject.Properties.Name -contains 'evidence') {
                        foreach ($p in @($c.evidence | ForEach-Object { [string]$_ })) {
                            $full = Join-Path $Root ($p -replace '/', [string][IO.Path]::DirectorySeparatorChar)
                            if (-not (Test-Path -LiteralPath $full)) {
                                Add-Warning $gf.Name "declares evidence path '$p' which does not exist yet"
                            }
                        }
                    }
                }
            }
        }
    }
}

# --- 8. Report ----------------------------------------------------------------------
if ($Warnings.Count -gt 0) {
    Write-Host "lint: $($Warnings.Count) warning(s) - not blocking" -ForegroundColor Yellow
    foreach ($w in $Warnings) { Write-Host "  $w" }
    Write-Host ''
}
if ($Problems.Count -eq 0) {
    Write-Host "lint: clean ($($SkillFiles.Count) skills, $($SourceMarkdown.Count) markdown files checked)"
    exit 0
}
Write-Host "lint: $($Problems.Count) problem(s)" -ForegroundColor Red
foreach ($p in $Problems) { Write-Host "  $p" }
exit 1
