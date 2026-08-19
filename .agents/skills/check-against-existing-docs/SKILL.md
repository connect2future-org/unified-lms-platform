---
name: check-against-existing-docs
description: Answers a question by searching the full documentation corpus, weighting sources by authority tier, and citing evidence for every finding. Use whenever a question needs grounding in existing client or project documentation rather than assumption.
delivery_stages: []
---

# Check Against Existing Docs

SOURCE — human-edited. Universal cross-cutting skill.

## What this is for

Stops answers from being guessed when the real answer is sitting in a document somewhere. Searches everything, in order of authority, and cites tier + path for every finding so the reader knows how much to trust it.

## Authority tiers

| Tier | Authority | What's in it |
|---|---|---|
| 🥇 Gold | Highest | Curated, reviewed project artefacts. The engagement's Terms of Reference is the supreme authority within Gold. |
| 🥈 Silver | Enriched context | Client-supplied clarifications, delivery-team annotations, analysis notes |
| 🥉 Bronze | Raw baseline | Bulk client-supplied documentation, meeting/workshop transcripts |

When tiers conflict, Gold overrides Silver overrides Bronze. Any finding that contradicts the Terms of Reference gets flagged, with the ToR position stated first.

## Procedure

1. **Define the query.** What's being investigated? Which deliverable will the answer feed? Full corpus, or a specific subset?
2. **Search Gold first** (start with the ToR), then **Silver**, then **Bronze** — never skip a tier unless the question is explicitly scoped to one. Don't stop at the first match; keep looking for corroborating or contradicting evidence.
3. **Cite every finding** with a file path and its tier symbol (🥇/🥈/🥉).
4. **Flag every conflict explicitly**: "Bronze states X (path), but Gold (ToR) states Y (path). Gold position applies."
5. **State gaps plainly.** If nothing was found in any tier, say so — a gap is a finding, not a failure.
6. **Produce a comparison table** if the question spans multiple products or systems, with an explicit confidence rating per row (High/Medium/Low/N/A).

## Feeds into

`gather-requirements` — feed findings into a structured spec. `rate-doc-confidence` if the search reveals gaps worth scoring formally.
