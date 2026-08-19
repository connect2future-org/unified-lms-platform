# Framework Manual Invocation

The SDLC framework is retained but disabled by default to minimise chat context and token
use. Its source files remain in `skills/`, `agents/`, `sdlc/phases/`, `mcp/`, and `tools/`.

## Run a framework workflow

Use `/framework` in Copilot Chat and name exactly one workflow. Examples:

```text
/framework run-tests-and-report
/framework reviewer agent
/framework Phase 05 gate
/framework documentation MCP lookup
```

The prompt uses only the workflow named in its argument. It does not infer related
skills, agents, phases, MCP lookups, output routing, or usage logging.

## Discovery mirrors

The generated `.agents/skills/` and `.github/agents/` mirrors are archived under
`.framework-manual/` to prevent automatic discovery. `tools/sync.ps1` leaves them
disabled by default. Run it with `-EnableFrameworkDiscovery` only when restoring automatic
discovery is explicitly required.

## Framework details

- SDLC phases and gates: `sdlc/phases/`
- Skills: `skills/`
- Agents: `agents/`
- Delivery routing: `output-routing.json`
- Usage log format: `docs/usage-log.md`
- Synchronisation tooling: `tools/sync.ps1`