<!-- SOURCE: framework-shipped gate definition, human-edited occasionally. Harvested from ai-assisted-development-sdlc's 6_Design_Validation_Stakeholder_Approval.md. -->

# Gate: Requirements Sign-off

Pass/fail/conditional checkpoint before architecture work starts.

## Checklist

- [ ] Every requirement maps to a business objective (no orphan requirements).
- [ ] Acceptance criteria exist for each user story, not just a title.
- [ ] Non-functional requirements (performance, security, scalability) are stated, not implied.
- [ ] Design reviewed by each relevant stakeholder group: business, technical architecture, security, QA.
- [ ] No open P1 conflicts between stakeholder inputs.

## Recommendation

State one of:

- **Pass** — proceed to Architecture & Design.
- **Conditional pass** — proceed, with named follow-up actions and owners.
- **Fail** — do not proceed; state the specific gap and who owns closing it.

## Common failure modes

- Acceptance criteria written after the fact to match whatever got built.
- Non-functional requirements skipped, discovered as production incidents later.
- Stakeholder "approval" was a status update, not an actual review against criteria.
