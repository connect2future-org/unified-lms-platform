---
name: log-tech-debt
description: Records a conscious trade-off, shortcut, or deferral with a structured category and severity, so it gets tracked instead of forgotten. Use whenever a suboptimal decision is knowingly accepted.
delivery_stages: []
---

# Log Tech Debt

SOURCE — human-edited. Universal cross-cutting skill.

## What this is for

Every conscious trade-off — an accepted shortcut, a deferred test, a documentation gap left for later — gets a structured record instead of living only in someone's memory.

## When to use it

- A test execution reports a failure that's accepted rather than fixed
- A risk assessment identifies something accepted rather than mitigated
- A human or agent makes a conscious shortcut
- A documentation confidence check reveals a stale or missing document that's accepted for now

## Procedure

1. **Capture the item**: what's the suboptimal decision or gap; why (the constraint that stopped the ideal approach); source (human decision / agent recommendation / test deferral / risk acceptance / doc gap); which deliverables it affects; which phase.
2. **Classify it:**

   | Category | Description |
   |---|---|
   | DESIGN | Architectural shortcut constraining future work |
   | SECURITY | Accepted risk below blocker threshold |
   | PERFORMANCE | Known inefficiency, sufficient for now |
   | MAINTAINABILITY | Works, but costly to change later |
   | TEST_COVERAGE | Acceptance criterion deliberately left untested |
   | COMPLIANCE | Requirement acknowledged but not yet implemented |
   | DOCUMENTATION | Known gap or staleness accepted for now |

   | Severity | Meaning |
   |---|---|
   | CRITICAL | Will block future work or create compliance exposure |
   | HIGH | Significant cost — resolve within the current phase if possible |
   | MEDIUM | Meaningful cost — backlog for scheduled resolution |
   | LOW | Minor — resolve opportunistically |
3. **Check for duplicates** before creating a new record — if one exists, add context to it instead.
4. **Present to the human** for classification confirmation before saving.
5. **Save the record**, and note it in any deliverable it affects.

## Feeds into

`record-a-decision` if the trade-off is significant enough to also warrant a formal decision record. `assess-risks` — accepted debt changes the risk profile of future work.
