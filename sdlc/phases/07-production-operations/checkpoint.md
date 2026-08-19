<!-- SOURCE: framework-shipped checkpoint definition, human-edited occasionally. Harvested from ai-assisted-development-sdlc's 6_Continuous_Operations_Improvement.md. -->

# Checkpoint: Operations

This phase is continuous operational work, not a one-time transition — there is no single pass/fail gate. Instead, review periodically (recommended: monthly, or after any significant incident) against the questions below.

## Review questions

- Is production monitoring covering all critical paths, or are there known blind spots?
- What's the current mean-time-to-detect and mean-time-to-resolve for incidents, and is it trending better or worse?
- Are there recurring incident patterns that indicate a systemic fix is overdue rather than repeated firefighting?
- Is capacity planning ahead of actual growth, or reactive?
- Has anything from this period's incidents fed back into the phase 3/4 ADRs or code review standards?

## Why no hard gate

Gates model one-time pass/fail transitions between phases. Production operations is ongoing — forcing a pass/fail checkpoint here would be fake precision. Use this checkpoint to structure a recurring review, not to block anything.

## Escalation trigger

If a review surfaces a systemic risk (recurring critical incidents, a monitoring blind spot on a critical path, capacity heading toward exhaustion), escalate to the phase 8 (Observe & Improve) improvement backlog rather than letting it sit as a checkpoint note.
