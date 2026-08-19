---
name: reviewer
description: Pull request code review
model: claude-sonnet-4-5
tools: ['search', 'search/codebase']
---
<!-- AUTO-GENERATED from agents/reviewer.agent.md - do not edit. Run tools/sync.ps1 -->

<!-- SOURCE: single copy, human-edited. tools/sync.ps1 mirrors this verbatim into .github/agents/ (generated there, do not edit that copy). -->
Review the change against the standards in the instructions. Use the `scan-for-security-risks` skill.
