#Requires -Version 5.1
<#
Table-driven tests for the Claude Code hooks under tools/hooks/. Each case feeds a
PreToolUse JSON payload to a hook on stdin and asserts the decision: 'deny', 'ask',
or 'silent' (exit 0 with no output - the hook lets the call through untouched).

Runs anywhere PowerShell runs - no Claude Code needed - so it doubles as the CI job
(hook-tests in .gitlab-ci.yml). Exit 0 when all cases pass, 1 otherwise.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$HooksDir = Join-Path $PSScriptRoot 'hooks'
$Failures = [System.Collections.Generic.List[string]]::new()

# Windows dev machines have powershell.exe; the Linux CI image has pwsh only.
$Shell = if (Get-Command powershell.exe -ErrorAction SilentlyContinue) { 'powershell.exe' } else { 'pwsh' }

function Invoke-Hook([string]$HookName, [string]$PayloadJson) {
    $hookPath = Join-Path $HooksDir $HookName
    $psi = [Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $script:Shell
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$hookPath`""
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $p = [Diagnostics.Process]::Start($psi)
    $p.StandardInput.Write($PayloadJson)
    $p.StandardInput.Close()
    $stdout = $p.StandardOutput.ReadToEnd()
    $p.WaitForExit()
    return [pscustomobject]@{ ExitCode = $p.ExitCode; Stdout = $stdout.Trim() }
}

function Get-Decision($HookResult) {
    if ($HookResult.ExitCode -ne 0) { return "exit-$($HookResult.ExitCode)" }
    if (-not $HookResult.Stdout) { return 'silent' }
    try {
        $obj = $HookResult.Stdout | ConvertFrom-Json
        return [string]$obj.hookSpecificOutput.permissionDecision
    } catch {
        return "unparseable-output: $($HookResult.Stdout)"
    }
}

function Test-Cases([string]$HookName, [object[]]$Cases) {
    foreach ($case in $Cases) {
        $payload = @{ tool_name = 'Bash'; tool_input = @{ command = $case.Command } } | ConvertTo-Json -Compress
        $result = Invoke-Hook $HookName $payload
        $got = Get-Decision $result
        $mark = if ($got -eq $case.Expect) { 'ok  ' } else { 'FAIL' }
        Write-Host ("  {0} [{1,-6}] {2}" -f $mark, $case.Expect, $case.Command)
        if ($got -ne $case.Expect) {
            $script:Failures.Add("$HookName : '$($case.Command)' expected $($case.Expect), got $got")
        }
    }
}

# --- git-guard.ps1 --------------------------------------------------------------------
Write-Host 'git-guard.ps1:'
Test-Cases 'git-guard.ps1' @(
    # Tier 1: deny
    @{ Command = 'git add -A';                                Expect = 'deny' }
    @{ Command = 'git add --all';                             Expect = 'deny' }
    @{ Command = 'git add .';                                 Expect = 'deny' }
    @{ Command = 'git add . && git commit -m "x"';            Expect = 'deny' }
    @{ Command = 'git  add   -A';                             Expect = 'deny' }
    @{ Command = 'git commit -am "quick fix"';                Expect = 'deny' }
    @{ Command = 'git commit -a -m "quick fix"';              Expect = 'deny' }
    @{ Command = 'git commit -m "x" --no-verify';             Expect = 'deny' }
    @{ Command = 'git push --force origin main';              Expect = 'deny' }
    @{ Command = 'git push -f';                               Expect = 'deny' }
    @{ Command = 'git push origin main --force-with-lease';   Expect = 'deny' }
    @{ Command = 'git commit --amend --no-edit';              Expect = 'deny' }
    @{ Command = 'git reset --hard HEAD~1';                   Expect = 'deny' }
    @{ Command = 'git rebase -i HEAD~3';                      Expect = 'deny' }
    @{ Command = 'rtk git add -A';                            Expect = 'deny' }
    # Tier 2: ask
    @{ Command = 'git commit -m "docs: add report"';          Expect = 'ask' }
    @{ Command = 'git push -u origin feature/x';              Expect = 'ask' }
    @{ Command = 'gh pr create --title "x" --body "y"';       Expect = 'ask' }
    @{ Command = 'gh pr merge 42';                            Expect = 'ask' }
    @{ Command = 'glab mr create';                            Expect = 'ask' }
    # Silent: read-only git and unrelated commands pass through
    @{ Command = 'git status';                                Expect = 'silent' }
    @{ Command = 'git add docs/report.md';                    Expect = 'silent' }
    @{ Command = 'git log --oneline -5';                      Expect = 'silent' }
    @{ Command = 'git diff HEAD';                             Expect = 'silent' }
    @{ Command = 'npm test';                                  Expect = 'silent' }
    @{ Command = 'git branch feature/new-doc';                Expect = 'silent' }
)

# Fail-open: broken payloads never block
Write-Host 'git-guard.ps1 (fail-open):'
foreach ($broken in @('', 'not json at all', '{"tool_input":{}}')) {
    $result = Invoke-Hook 'git-guard.ps1' $broken
    $got = Get-Decision $result
    $label = if ($broken) { $broken } else { '<empty stdin>' }
    $mark = if ($got -eq 'silent') { 'ok  ' } else { 'FAIL' }
    Write-Host ("  {0} [silent] {1}" -f $mark, $label)
    if ($got -ne 'silent') { $Failures.Add("git-guard.ps1 : broken payload '$label' expected silent, got $got") }
}

# --- file-guard.ps1 ---------------------------------------------------------------------
Write-Host ''
Write-Host 'file-guard.ps1:'

function Test-FileCases([object[]]$Cases) {
    foreach ($case in $Cases) {
        $payload = @{ tool_name = $case.Tool; tool_input = $case.Input } | ConvertTo-Json -Compress -Depth 4
        $result = Invoke-Hook 'file-guard.ps1' $payload
        $got = Get-Decision $result
        $mark = if ($got -eq $case.Expect) { 'ok  ' } else { 'FAIL' }
        Write-Host ("  {0} [{1,-6}] {2}" -f $mark, $case.Expect, $case.Name)
        if ($got -ne $case.Expect) {
            $script:Failures.Add("file-guard.ps1 : '$($case.Name)' expected $($case.Expect), got $got")
        }
    }
}

# On-disk fixture for the append-only Write checks
$TmpDir = Join-Path ([IO.Path]::GetTempPath()) ("hooktest-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $TmpDir 'sub') | Out-Null
$TmpLog = Join-Path $TmpDir 'usage-log.md'
$LogContent = "| Date | Tool |`n|---|---|`n| 2026-08-01 | claude |"
[IO.File]::WriteAllText($TmpLog, $LogContent)

# Secret-shaped fixture strings are built by concatenation so that this test file
# itself never contains a matchable literal (the guard runs on edits to this repo too).
$FakeKeyBlock = ('-----BEGIN RSA PRIVATE ' + 'KEY-----') + "`nabc"
$FakeAwsKey = 'AKIA' + 'IOSFODNN7EXAMPLE'
$FakeGithubPat = 'ghp_' + 'abcdefghijklmnopqrstuv0123456789'
$FakePassword = 'password = ' + '"hunter2hunter2"'

Test-FileCases @(
    # A. gate-state files
    @{ Name = 'edit gate-state.json'; Tool = 'Edit'; Expect = 'deny'
       Input = @{ file_path = 'C:\proj\docs\gates\02-requirements-design.gate-state.json'; old_string = 'red'; new_string = 'green' } }
    @{ Name = 'write gate-state.json'; Tool = 'Write'; Expect = 'deny'
       Input = @{ file_path = '/repo/docs/gates/05-testing-validation.gate-state.json'; content = '{}' } }
    @{ Name = 'edit evidence manifest (allowed)'; Tool = 'Edit'; Expect = 'silent'
       Input = @{ file_path = 'C:\proj\docs\gates\02-requirements-design.evidence.json'; old_string = 'a'; new_string = 'b' } }
    # B. usage-log append-only
    @{ Name = 'append to usage-log via Edit'; Tool = 'Edit'; Expect = 'silent'
       Input = @{ file_path = $TmpLog; old_string = '| 2026-08-01 | claude |'; new_string = "| 2026-08-01 | claude |`n| 2026-08-14 | claude |" } }
    @{ Name = 'rewrite usage-log row via Edit'; Tool = 'Edit'; Expect = 'deny'
       Input = @{ file_path = $TmpLog; old_string = '| 2026-08-01 | claude |'; new_string = '| 2026-08-01 | copilot |' } }
    @{ Name = 'append to usage-log via Write'; Tool = 'Write'; Expect = 'silent'
       Input = @{ file_path = $TmpLog; content = "$LogContent`n| 2026-08-14 | claude |" } }
    @{ Name = 'truncate usage-log via Write'; Tool = 'Write'; Expect = 'deny'
       Input = @{ file_path = $TmpLog; content = '| Date | Tool |' } }
    @{ Name = 'create new usage-log via Write'; Tool = 'Write'; Expect = 'silent'
       Input = @{ file_path = (Join-Path $TmpDir 'sub\usage-log.md'); content = '| Date | Tool |' } }
    # C. secrets tripwire
    @{ Name = 'private key block'; Tool = 'Write'; Expect = 'deny'
       Input = @{ file_path = 'C:\proj\deploy\key.pem'; content = $FakeKeyBlock } }
    @{ Name = 'AWS access key id'; Tool = 'Edit'; Expect = 'ask'
       Input = @{ file_path = 'C:\proj\config.md'; old_string = 'x'; new_string = "key = $FakeAwsKey" } }
    @{ Name = 'GitHub PAT'; Tool = 'Write'; Expect = 'ask'
       Input = @{ file_path = 'C:\proj\notes.md'; content = "token: $FakeGithubPat" } }
    @{ Name = 'quoted password literal'; Tool = 'Write'; Expect = 'ask'
       Input = @{ file_path = 'C:\proj\app.config'; content = $FakePassword } }
    @{ Name = 'ordinary markdown write'; Tool = 'Write'; Expect = 'silent'
       Input = @{ file_path = 'C:\proj\docs\report.md'; content = '# Report' } }
)

# Cleanup is best-effort - a locked temp file must not fail the suite.
try { Remove-Item -Recurse -Force $TmpDir -ErrorAction Stop } catch {
    Write-Host "  (fixture cleanup skipped: $($_.Exception.Message))"
}

# --- Report -----------------------------------------------------------------------------
Write-Host ''
if ($Failures.Count -eq 0) {
    Write-Host 'test-hooks: all cases pass'
    exit 0
}
Write-Host "test-hooks: $($Failures.Count) failure(s)" -ForegroundColor Red
foreach ($f in $Failures) { Write-Host "  $f" }
exit 1
