# ra9-atlas — preparation plan

Updated: 2026-10-17.

## Goal

Create an interactive guide for all of Detroit: Become Human.
Players inspect a large connected flowchart, then select an action to see its prerequisites and later consequences without losing the surrounding branches.

## Stages and decisions

| Stage | Deliverable | Exit decision |
|---|---|---|
| 1. Compare existing solutions | Candidate comparison and available demos | Adopt, contribute, or continue research |
| 2. Assess sources | Chapter registry, coverage, reuse rights, and gaps | Continue, change the method, or stop |
| 3. Verify the data method | A local branch, a cross-chapter link, and a complex late branch | Accept the method or seek more evidence |
| 4. Review requirements with grill-with-docs | Navigation, spoilers, and scope decisions | Confirm requirements or return to evidence |
| 4a. Check navigation | A player finds a consequence and understands its conditions on a mockup | Confirm value before full data collection |
| 5. Select architecture | Options, costs, and tradeoffs | Select an approach or defer implementation |
| 6. Prepare collaboration | Repository, licenses, and contribution rules | Confirm readiness for implementation |
| 7. Build the full guide | Site and data with visible gaps | Decide whether to publish |
| 8. Assess value | Player feedback | Continue, change direction, or stop |

Record a go/no-go decision at each stage. Include evidence, gaps, and the next action.
If evidence is insufficient, name the specific check needed.
An existing solution can remove the need for a new product.
Contributing to another project requires suitable rights and technical fit.

The project owner authorized an early public repository for preparation documents.
This does not resolve licensing or implementation blockers in stage 6.

## Candidate assessment

Check whole-game coverage, action-to-consequence navigation, transition conditions, detail navigation, and a working site or dataset.
Use at least three cases: a local branch, a cross-chapter link, and a complex late branch.
Do not count identical forks as independent solutions.
Mark unavailable demos as unknown, not as evidence of missing features.
A new project needs a concrete benefit absent from the checked candidates.

## Current package

The initial candidate review and guide-based D1–D3 checks are complete.
They do not establish full coverage or gameplay verification.
[Gate 02](notes/decision-gate-02.md) permits a navigation mockup with explicit evidence labels.
The first card-based mockup did not represent the owner's intended flowchart. A map-first replacement now tests R1–R2 using visible branching examples. Check it with the owner before recording the next decision or selecting architecture.
Application implementation has not started.

A later consequence must show previous conditions and necessary future choices.
A link does not guarantee an outcome.
The acceptable amount of unverified data at release remains an open decision.

## Working rules

- Save exact sources and the verification level of each important claim.
- Separate visible game nodes from hidden conditions.
- Account for game version and state propagation when replaying chapters.
- Check rights for code, data, and images separately.
- Write project documents in clear English. Keep owner discussions concise and in Russian.
- Apply ASD-STE100 clarity principles without claiming formal compliance.
- Check account limits before and after a work package. Below 20% remaining, save progress and defer a large package.
- Start with one worker. Use Astra for a bounded independent review.
- Use an explicitly free OpenCode model only for public material. Do not send personal data.
- Maintain STATUS.md and AGENT-RUNS.md. Save partial results during work.

## Agreed requirements

- Show prerequisites with consequences. This navigation preference remains subject to a mockup check.
- Show a spoiler warning at entry. Show the full map after consent.
- Defer fog of war and its future Reveal all control.
- Show disputed links with a visible label and sources.
- Use English for the public interface and project documents. No Russian localization is planned.

## Open decisions

The exact navigation design and release policy for unverified links remain open.
Select the stack after research. A static site with separate data is a candidate.
SQLite may support data preparation. A server needs a specific requirement.

## Spec-driven development

[intent.md](intent.md) defines the purpose. [spec.md](spec.md) defines draft requirements and acceptance checks.
[Process adaptation](notes/sdd-adoption.md) defines the review and implementation gates.
Create plan.md only after the specification blockers are resolved.

## References

- [Independent review and discussion](notes/plan-review-v2.md)
- [Source survey](notes/source-survey.md)
- [Audience survey](notes/audience-survey.md)
- [Current status](STATUS.md)
- [Agent runs](AGENT-RUNS.md)
- [Historical detailed plan](notes/preparation-reference-v1.md). This current plan takes precedence.
