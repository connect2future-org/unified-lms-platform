<!-- SOURCE: framework-shipped gate definition, human-edited occasionally. Authored for V2 -- no equivalent gate existed in the source SDLC docs (Architecture_Design had no numbered gate file, unlike most other phases). Drawn from Architecture_Decision_Documentation.md and Security_Governance_Framework.md content. -->

# Gate: Architecture Sign-off

Authored for V2 — no equivalent gate existed in the source SDLC docs. Pass/fail/conditional checkpoint before code development starts.

## Checklist

- [ ] An ADR exists for every decision that would be expensive to reverse (data store, integration pattern, auth model, deployment topology).
- [ ] Each ADR states alternatives considered and why they were rejected, not just the chosen option.
- [ ] Data classification is assigned for every data entity the system touches (public/internal/confidential/restricted).
- [ ] Security architecture addresses authentication, authorization, and data-at-rest/in-transit protection.
- [ ] Applicable regulatory requirements (e.g. GDPR) are mapped to specific architectural controls, not just named.
- [ ] Solution architect and security reviewer have both signed off.

## Recommendation

State one of:

- **Pass** — proceed to Code Development.
- **Conditional pass** — proceed, with named follow-up actions and owners.
- **Fail** — do not proceed; state the specific gap and who owns closing it.

## Common failure modes

- ADRs document only the decision, not the alternatives — future teams can't tell if it's safe to revisit.
- Security architecture is a checklist of tools, not a mapping to the system's actual data flows.
- No data classification assigned, discovered only when a consent/sensitivity question comes up mid-delivery.
