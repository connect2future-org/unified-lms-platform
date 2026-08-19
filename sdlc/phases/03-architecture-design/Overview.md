---
phase: 3
name: Architecture & Design
type: gate
delivery_stages: []
---

<!-- SOURCE: framework-shipped, human-edited occasionally. Defines what this phase is for and its entry/exit criteria. -->

# Phase 3: Architecture & Design

Turns approved requirements into system architecture: component boundaries, data model, integration contracts, decisions with rationale, and the security/governance framework the system must satisfy.

## Entry criteria

- Approved requirements specification (Phase 2 gate passed).
- Enterprise technology standards and compliance requirements available.

## Key activities

1. **System architecture analysis** — requirements-to-architecture translation.
2. **Component design** — service boundaries, integration patterns.
3. **Data model & flow design** — data architecture, any AI/ML model strategy.
4. **Integration contracts** — API design, service contracts.
5. **Architecture decision records (ADRs)** — decisions with alternatives considered and rationale.
6. **Security & governance framework** — security patterns, data classification, compliance mapping.

## Exit criteria

- System architecture documented with component relationships.
- ADRs recorded for every significant decision.
- Data model and integration specifications complete.
- Security architecture and compliance mapping documented.

## Deliverables

System architecture doc, ADR set, data model, integration contracts, security architecture.

## Next phase

Phase 4 — Code Development, which implements against this architecture.
