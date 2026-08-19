---
name: resolve-disagreements
description: Runs a structured three-perspective debate (business, technical, delivery/QA) on a contested decision before it's committed to. Use when a decision needs challenge from multiple angles before proceeding.
delivery_stages: []
---

# Resolve Disagreements

SOURCE — human-edited. Universal cross-cutting skill (a "three amigos" session).

## What this is for

Forces a decision through three distinct lenses before it's locked in, instead of one person's (or one agent's) framing going unchallenged. The agent facilitates the session structure; the human makes the final call.

## Attribution rule

Every position in the session output is attributed either to one of the three session perspectives or to a named source in the input documents. Never attribute a claim, agreement, or withdrawal to a person who does not appear in the inputs. Never claim consensus the record does not contain — if a named person's objection stands in the inputs and nothing in the inputs resolves it, it stands in the output.

## Procedure

1. **Identify the subject.** What deliverable, decision, or approach is being debated? What's the specific concern to focus on?
2. **Load context** — the document or approach under debate, and any prior decisions that constrain it.
3. **Open as facilitator.** Summarise the contested decision and its context in 3 bullets, and state the session goal: a recommendation all three perspectives have tested, with dissent preserved, for the human's call.
4. **Generate three perspectives, in this fixed order, each arguing from its own lens with evidence cited from the inputs:**

   **Business/product** — what user need does this serve? What acceptance criteria are non-negotiable? What must not be compromised? Where does the current approach drift from intent?

   **Technical/architecture** — what's the proposed approach and its rationale? What are the failure modes and highest-risk choices? What alternatives were considered?

   **Delivery/QA** — is this feasible in the current timeline? What hidden dependencies exist? What will be painful to execute even though it looks clean on paper? Can it actually be verified?
5. **Present all three, highlighting agreement and disagreement.** Points all three agree on are settled — record them and do not relitigate them.
6. **Debate contested points only, up to 3 further rounds.** Each round addresses only the points still in disagreement; settled points never reopen. Remaining disagreement after 3 rounds goes to the human for resolution. The human's call is final — no further debate on a resolved point.
7. **Escalate to the human what the session cannot resolve** — at most 5 escalations per session. Each escalation presents the contested decision, each perspective's position, and why it matters. If the cap is reached with points still unresolved, pause and ask the human whether to continue or send the decision back for rework.

   Valid escalations: trade-offs where both options are viable and the answer depends on business priority; scope ambiguity; conflicts between quality and feasibility.

   Not escalations: tool or library choices where one option is clearly better; naming; minor patterns; anything the perspectives can resolve themselves.
8. **Capture every resolution** via `record-a-decision`, with source noted as "resolved debate" and all three perspectives' positions recorded — including the position that lost.

## Feeds into

`record-a-decision` for every resolution reached.
