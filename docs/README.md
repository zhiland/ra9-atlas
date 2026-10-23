# Documentation index

Use these documents for current work:

| Document | Authority and scope |
| --- | --- |
| [STATUS](STATUS.md) | Current checkpoint, verification results and next package |
| [Specification](spec.md) | Approved product requirements and acceptance boundaries |
| [Roadmap](ROADMAP.md) | Stage order and completion gates |
| [Authoring package review](notes/authoring-pipeline-review.md) | Separate code/source review and execution boundary |
| [Canonical authoring](authoring-data.md) | Versioned JSON, identity ledger and deterministic generation |
| [Painter source review](notes/painter-packet-source-review.md) | Fourth packet: bounded opening, independent source check and gates |
| [Painter acceptance plan](notes/painter-packet-plan.md) | Completed preparation plan, historical baseline |
| [Chapter inventory](notes/chapter-inventory-reconciliation.md) | Partial source-index reconciliation and explicit gaps |
| [CI](ci.md) | Hosted checks and verification boundaries |
| [Data contract](data-contract.md) | Bounded runtime sample contract |
| [Chapter preparation](chapter-preparation.md) | Packet extraction, validation, source review and merge gate |
| [Source register](SOURCES.md) | Evidence provenance and access limitations |
| [License boundary](license-boundary.md) | Original MIT work and excluded material |
| [OpenCode runner](opencode-runner.md) | Current external-agent launch procedure |
| [Sol handoff](handoff-sol.md) | Continuation checklist; recheck its dated Git/PR snapshot |
| [Repository review](notes/repository-review-2026-10-22.md) | Code findings, cleanup and verification |
| [A New Home extraction](notes/anewhome-packet-draft.md) | Historical second-packet draft |
| [A New Home source review](notes/anewhome-packet-source-review.md) | Corrected partial topology and independent follow-up |
| [A New Home implementation](notes/anewhome-correction-implementation.md) | Legacy withdrawal behavior and code-review findings |
| [Withdrawal decision](adr/0001-withdrawn-edge-permalinks.md) | Preserve old claims without drawing false connectors |
| [Shades runtime integration](notes/shades-runtime-integration.md) | Appended region, preserved old objects and source fences |
| [Shades of Color source review](notes/shades-of-color-source-review.md) | Third preparation packet; icon-origin gaps and runtime separation |
| [Hostage source review](notes/hostage-packet-source-review.md) | Independent evidence review and corrections |

## Historical records

[PREPARATION-PLAN](PREPARATION-PLAN.md), [PoC4 plan](poc4-plan.md), and
[PoC4 execution checklist](poc4-execution-checklist.md) retain their original stage checkpoints.
They do not override the current specification, roadmap or status.

The [isolation study](notes/opencode-macos-isolation.md) and
[offline preflight](notes/isolation-preflight.md) explain earlier isolation work.
Their old launch templates and incomplete-gate lists are historical.
Use the current runner guide for execution.

Other files under `notes/` record bounded research, decisions and earlier UI checks.
Check their dates and scope before treating a statement as current.
Raw agent logs and downloaded evidence remain local and ignored by Git.
Do not delete evidence records merely because a later checkpoint supersedes them.
