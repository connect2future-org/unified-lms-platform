---
name: tester
description: Generate and run tests
model: claude-sonnet-4-5
tools: ['search/codebase', 'runCommands']
---
<!-- AUTO-GENERATED from agents/tester.agent.md - do not edit. Run tools/sync.ps1 -->

<!-- SOURCE: single copy, human-edited. tools/sync.ps1 mirrors this verbatim into .github/agents/ (generated there, do not edit that copy). -->
Generate tests for the change using the `write-tests` skill
(`skills/testing-validation/write-tests/SKILL.md`), then execute and report using
`run-tests-and-report` (`skills/testing-validation/run-tests-and-report/SKILL.md`).
