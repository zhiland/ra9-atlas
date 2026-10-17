# ra9-atlas — specification 0.2

Date: 2026-10-17. Status: draft, not ready for implementation.
Basis: [intent.md](intent.md), project owner decisions, and [Gate 01](notes/decision-gate-01.md).

## Requirements and acceptance

| ID | Requirement | Verification |
|---|---|---|
| R1 | The guide provides a chapter overview and access to detailed charts | In the mockup, select a chapter, open an event, and return without losing the selected context |
| R2 | A selected action shows prerequisites and later consequences | Follow a cross-chapter example in both directions. Show required future choices. A conditional outcome must not appear guaranteed |
| R3 | All user-facing text is English | Check navigation, warnings, labels, and event details |
| R4 | A spoiler warning appears before map content | Check a new visit and a direct event link. Show the full map after consent. Consent retention is not yet decided |
| R5 | Disputed claims differ visibly from confirmed claims | Show a status and source on the link and in event details. Choose the visual treatment in the mockup |
| R6 | Relationship claims have traceable evidence | A selected link provides a URL, source location, verification status, and known conflicts |
| R7 | Game coverage is transparent | Account for every chapter and separate character chart. Mark verified parts and gaps. A file's existence does not prove coverage |

## Data verification is separate from interface verification

- D1: a local branch in The Hostage. Preserve distinct actions and their conditions.
- D2: a cross-chapter link. Check the initial action, state transfer, and conditions of the later event.
- D3: a complex late-game chart. Check alternate outcomes and a case where another condition changes the result.
- Use the identified detour/late-bus discrepancy to detect excessive simplification.
- Record the game version and platform when known. Mark unknown values explicitly.
- Structural data checks do not prove accuracy against the game. Check evidence separately.

## First-release scope

The full game remains the target.
Fog of war is deferred. Accounts, a simulator, and save imports are not required.
A mockup using a few cases is not a complete public guide.

## Implementation blockers

- D1–D3 have been compared against guides. Direct game evidence and complete conditions remain unconfirmed.
- The R1–R2 user journey has not been tested in a mockup.
- Architecture and data format are not selected.
- Publication licenses are not settled.
- The release policy for unverified links is not agreed.

## Change rule

Revise requirements here when a decision changes.
Tasks and checks reference requirement IDs and the specification revision.
A verification record states the expectation, observation, evidence, and verdict.
Return conflicts to the specification or research. Do not change a check merely to obtain a passing result.

Limited guide-based verification of D1–D3 is complete: [Gate 02](notes/decision-gate-02.md).
The examples may support a mockup with evidence labels. Full game verification and interface checks remain pending.
