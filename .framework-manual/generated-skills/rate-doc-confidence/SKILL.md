---
name: rate-doc-confidence
description: Scores documentation freshness, completeness, and cross-document consistency for a phase, and surfaces contradictions before they cause a bad decision. Use before gate reviews, after bulk authoring, or whenever documentation quality is in doubt.
delivery_stages: []
---

# Rate Doc Confidence

SOURCE — human-edited. Universal cross-cutting skill. Combines a confidence score with a contradiction sweep.

## What this is for

Before committing to work that depends on a set of documents, this tells you how much to trust them — and whether any of them actually contradict each other.

## Procedure

### Part 1 — confidence scoring

1. **Scope it.** Which phase or deliverable set is being assessed? Any specific documents of concern?
2. **For each document the phase requires**, check: does it exist? Is its content a placeholder, partial draft, or complete? Is it stale relative to related documents? Does it follow the expected structure?
3. **Score each one:**

   | Rating | Criteria |
   |---|---|
   | High | Exists, complete, recently updated, consistent with related docs |
   | Medium | Exists, partial or not recently updated, no known contradictions |
   | Low | Exists but is a placeholder/stub, or significantly outdated |
   | None | Required but doesn't exist |

   Drop a document one rating level if Part 2 below finds it involved in a contradiction.
4. **Present a confidence brief**: document, phase, rating, issue (or "none"), recommended action. Call out every `None` or `Low` document that upcoming work depends on — those are blockers.

### Part 2 — contradiction sweep

1. **Read every file in scope** — don't sample. Extract stated facts, cross-references, and metadata (owner, version, date, status).
2. **Compare claims across documents.** Flag any pair where the same fact is stated differently, ownership conflicts, phase/status references disagree, or naming is inconsistent.
3. **Grade each finding:**

   | Grade | Example |
   |---|---|
   | Critical | Two documents disagree on a fact that could drive an incorrect decision |
   | High | Ownership/accountability conflict |
   | Medium | Naming, numbering, or classification inconsistency |
   | Low | Cosmetic inconsistency (e.g. date format) |
4. **Report every finding** with both conflicting sources quoted, and mark each as auto-fixable (e.g. aligning a date format — still needs sign-off) or needing a human decision.

## Feeds into

`log-tech-debt` if a gap or contradiction is accepted rather than fixed. `check-gate-readiness` — low-confidence documents are a legitimate reason to hold a gate.
