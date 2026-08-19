---
description: "Manually run one named SDLC framework workflow"
name: "framework"
argument-hint: "Skill, agent, phase gate, or MCP lookup to run"
agent: "agent"
---

Treat this prompt as the user's explicit invocation of one framework workflow.

Use only the skill, agent, phase gate/checkpoint, or MCP lookup named in the user's
prompt argument. Do not select related workflows automatically. Read the requested
source from `skills/`, `agents/`, `sdlc/phases/`, or `mcp/` only when needed to carry
out that named request.