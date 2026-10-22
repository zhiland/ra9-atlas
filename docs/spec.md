# ra9-atlas — specification 0.3

Date: 2026-10-21. Status: approved product requirements; production architecture and data contract remain open.
Basis: [intent.md](intent.md), project owner decisions, [Gate 01](notes/decision-gate-01.md), and [grill round one](notes/grill-round-01.md).

## Requirements and acceptance

| ID | Requirement | Verification |
|---|---|---|
| R1 | The guide's main surface is a large connected chapter flowchart with multiple branches visible at once; hidden prerequisites appear on connections and/or in event details | In the mockup, select a chapter, inspect several connected choices and outcomes on one canvas, pan and zoom, then open event details without replacing the map |
| R2 | A selected action shows prerequisites and later consequences | Follow a cross-chapter example in both directions. Show required future choices. A conditional outcome must not appear guaranteed |
| R3 | All user-facing text is English | Check navigation, warnings, labels, and event details |
| R4 | A spoiler warning overlays the map and blocks interaction until consent; remember consent in the browser, with a way to reset it | On a new visit and direct event link, confirm the overlay is visible before interaction; after consent, the full map is available. The map may remain visible behind the overlay. Verify consent persists in that browser and can be reset; no fixed expiration is specified |
| R5 | Guide-supported and disputed claims may be published when their source and evidence status are visible; do not present them as gameplay-verified | Show a status and source on the link and in event details. Choose the visual treatment in the mockup |
| R6 | Relationship claims have traceable evidence | A selected link provides a URL, source location, verification status, and known conflicts |
| R7 | Game coverage is transparent | Account for every chapter and separate character chart. Mark verified parts and gaps. A file's existence does not prove coverage |
| R8 | Chapter and story navigation retain context | Show all chart nodes, including optional actions. Search chapters, characters, actions, outcomes, and synonyms. Support zoom, selected-chart detail, reverse prerequisites, alternatives, and event/link permalinks under spoiler consent |
| R9 | Evidence and coverage remain distinct | Show conflicting source accounts together. Track coverage as not added, partial, or checked against chart, separately from each link's evidence status |
| R10 | Publication has a review gate | Required data/unit checks and desktop/mobile browser checks must pass. Proposed changes receive automated checks and review before owner approval and publication; visitors cannot edit published data directly |

## Data verification is separate from interface verification

The 2026-10-18 mockup correction makes the map the main surface. Event clicks show secondary details. A sequence of event cards or a single-event view does not satisfy R1. The [Steam flowchart reference analysis](notes/map-reference-analysis.md) records representative OCR and visible branches; it is a structural reference, not complete gameplay evidence.

- D1: a local branch in The Hostage. Preserve distinct actions and their conditions.
- D2: a cross-chapter link. Check the initial action, state transfer, and conditions of the later event.
- D3: a complex late-game chart. Check alternate outcomes and a case where another condition changes the result.
- Use the identified detour/late-bus discrepancy to detect excessive simplification.
- Record the game version and platform when known. Mark unknown values explicitly.
- Automated structural checks validate graph shape, references, and required metadata; they do not prove that a game claim is true.
- Source review and cross-checks are the default evidence method. Record source support, status, uncertainty, and conflicts for each relationship. Similar guides are not automatically independent.
- Targeted gameplay checks are optional and useful for resolving material conflicts or specific uncertainties. Checking the whole game in-game is not a release gate or owner obligation.
- Do not describe guide-supported claims as gameplay-verified. Keep unknown conditions and conflicting evidence visible.

## First-release scope

The full game remains the target.
Fog of war is deferred. Accounts, a simulator, and save imports are not required.
A mockup using a few cases is not a complete public guide.
An incomplete public preview is allowed when its coverage gaps are visible.
Desktop is primary; mobile support is required. The first implementation milestone is a robust cross-chapter vertical slice, followed by the full chapter collection.
The initial release uses no images, analytics, or advertising trackers. Future images require rights clearance.
Error reports may open a prefilled GitHub issue; no project account system, comment system, or reporting server is planned.

## Open implementation decisions and evidence limits

- D1–D3 have been compared against guides. Some conditions and exact triggers remain unconfirmed; targeted gameplay checks may resolve specific questions.
- PoC4 exercises the map-first selection and navigation journey in a limited sample; this does not establish full-release usability or accessibility.
- The full-product stack and data contract are not selected. The bounded [PoC4 sample contract](data-contract.md) records the current 102-node/93-edge sample's coverage, claim/evidence status, conditions, source references, unknowns and stable edge IDs; it does not settle the full-product schema. The Stage 1 pilot includes the visible *The Hostage* chart and one bounded saved-cop *Public Enemy* meeting node; production review and later batches remain open, as set out in [ROADMAP.md](ROADMAP.md).
- The agreed direction is a static site on free hosting, with no server maintenance; buying a custom domain is acceptable. Hosting/provider research remains open under [issue #6](https://github.com/zhiland/ra9-atlas/issues/6).
- Chapter-level overview cross-links with stronger emphasis for the selected chapter are provisional pending a dense-map review. Replay-state help requires fact-checking before it makes claims. Agent-assisted extraction and separate source review are accepted in principle; the review procedure is still open.
- Dedicated graph keyboard navigation and personal playthrough marking are deferred. Standard control support, visible focus, search focus, Escape behavior, contrast, and non-color distinctions remain required. Player-choice percentages are also deferred with usefulness undecided.
- The author has selected MIT for original project code and documentation; this does not license source-derived samples, game material, or third-party content. See [license boundaries](license-boundary.md).
- Guide-supported links can be published with source and status. This does not establish that a source is correct or that the graph is complete.

## Change rule

Revise requirements here when a decision changes.
Tasks and checks reference requirement IDs and the specification revision.
A verification record states the expectation, observation, evidence, and verdict.
Return conflicts to the specification or research. Do not change a check merely to obtain a passing result.

Limited guide-based cross-checking of D1–D3 is complete: [Gate 02](notes/decision-gate-02.md).
Guide-supported examples may be published with evidence labels. Full-game gameplay verification is not required; full-game coverage, source accuracy, and interface checks remain separate work.

The [implementation roadmap](ROADMAP.md) breaks the full-game outcome into feature issues. It does not supersede these requirements or decide the open implementation questions.
