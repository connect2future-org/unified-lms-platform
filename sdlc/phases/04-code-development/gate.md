<!-- SOURCE: framework-shipped gate definition, human-edited occasionally. Authored for V2 -- no equivalent gate existed in the source SDLC docs (Code_Development had no numbered gate file -- the known gap called out in the V2 plan). Drawn from Continuous_Validation.md and Phased_Implementation.md content. -->

# Gate: Code Ready-for-Test

Authored for V2 — no equivalent gate existed in the source SDLC docs. Pass/fail/conditional checkpoint before a change moves into the Testing & Validation phase.

## Checklist

- [ ] Implementation satisfies every acceptance criterion from the originating user story.
- [ ] AI-generated code has been reviewed with the same rigour as human-written code — no unreviewed AI output merged.
- [ ] Test suite covers the change, including edge cases and error conditions, and passes.
- [ ] No new code duplication of existing implementations (checked, not assumed).
- [ ] Architectural consistency preserved — no undocumented deviation from the Phase 3 ADRs.
- [ ] Any technical debt incurred is documented with a reason, not silently introduced.

## Recommendation

State one of:

- **Pass** — proceed to Testing & Validation.
- **Conditional pass** — proceed, with named follow-up actions and owners.
- **Fail** — do not proceed; state the specific gap and who owns closing it.

## Common failure modes

- AI-generated code merged without the reviewer actually understanding it end to end.
- Duplicate logic introduced because it was faster to generate new code than find the existing implementation.
- Silent architecture drift — a shortcut taken under deadline pressure that contradicts an ADR, never flagged.
