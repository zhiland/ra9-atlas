# The Hostage packet — independent source review

Reviewed: 2026-10-22. Reviewer: separate Codex source-review agent.
Baseline: local commit `b75ea04`, before the review corrections.
Scope: [the Hostage preparation packet](../../packets/hostage.packet.json),
its chart inventory, selected connector readings, and the bounded saved-cop
prerequisite. This review does not verify gameplay or grant reuse rights.

**Initial verdict: changes requested.** The packet omits the pre-release
context of its alternate chart. That chart does not establish the claimed
option-specific Cold connector. The saved-cop prerequisite has the stated
guide support. The primary image supports the FAIL-to-jumps connector directly.

## Sources actually inspected

| Source | Access and locator | Result and boundary |
|---|---|---|
| [Steam Community guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882), StongLory | Guide page accessed through the web tool on 2026-10-22. Credits section and Hostage heading inspected. Existing local Hostage image inspected at full resolution and in temporary crops. | The page still displays its removal notice. Credits name throwawaydeviant9 and Krystal109. The local 7288×2648 image supports the chart inventory below. The web text extraction did not expose its chapter image URL, so this review does not claim a fresh image download from Steam. |
| [Shazoo article](https://shazoo.ru/2018/04/24/64787/polnoe-prohozhdenie-detroit-become-human-zajmet-25-30-chasov) and [linked chart image](https://cdn.shazoo.ru/255202_rAFsabVh4Q_41663243971_12ae17c3f7_o.jpg) | Article accessed through the web tool. The public JPEG was downloaded into temporary storage and inspected at 3840×2160, including a negotiation-area crop. | The article date is 2018-04-24. Its text describes the game as forthcoming, a demo as available, and release as 2018-05-25. This is pre-release/demo-era context. The exact image build is unknown. Blue selected events do not establish a direct option-specific connector or released-build equivalence. |
| [PowerPyx Hostage walkthrough](https://www.powerpyx.com/detroit-become-human-the-hostage-opening-walkthrough-100/) | Web access succeeded. Under negotiation, the cross-chapter wounded-cop entry, extracted line 42. | Supports the report that the saved officer appears in Public Enemy. |
| [PowerPyx Public Enemy walkthrough](https://www.powerpyx.com/detroit-become-human-public-enemy-walkthrough-100/) | Web access succeeded. Under broadcast-room investigation, the saved-state entry and following meeting entry, extracted lines 65–66. | Supports saving the officer as a prerequisite for the bounded meeting. It does not make the meeting an automatic gameplay transition. |
| [GameFAQs/Mogg Public Enemy guide](https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/public-enemy) | Web access succeeded. Version 1.8, updated 2018-10-15. Under Broadcast Room and Kitchen, paragraph before the magazine step, extracted line 192. | Separately reports the saved officer stopping Connor and thanking him. The text also mentions dialogue variation associated with Connor's prior deaths. That variation is outside the packet scope and is not an additional meeting prerequisite. Historical executor HTTP 403 remains a separate access outcome. |

Extracted line numbers are access-specific aids, not publisher section numbers.
Use the headings and item descriptions above as the repeatable locators.

The ignored primary image has SHA-256
`2d9c33bed33d367c7d670d725b7a61f68cd8e792a883a9508d63c5fae04d755a`.
The temporary alternate image has SHA-256
`7b3ef9e7f3f5ca834f611542a24749f212240edba3dc009fbdbe6ff3ebf34a7e`.
Neither image nor the temporary crops are added to the repository.

## Inventory and connector findings

The primary image accounts for 33 boxes and 40 visible labels. Seven boxes
contain two options. The other boxes contain one start, three stages, sixteen
action/flag labels, and six endings. The packet preserves that inventory.
The existing ledger accounts for 36 pictured connector readings, including
ambiguous tap points. This is not a claim that all 36 endpoints are certain.

The packet represents 37 chart-edge claims because it separates two approach
candidates. Neither candidate creates a newly confirmed screenshot connector.
The fish tap, SWAT tap, stage-to-FAIL tap, and Friendly candidate remain unknown.
No outgoing connector is visible from `GET CLOSE ENOUGH`; retain that non-edge.

Required correction for `e_hostage_cold_approach_fail`: change `traced` to
`uncertain`. Both images show the approach line descending into the shared
negotiation area. A selected Cold event and selected FAIL event do not isolate
a directed connector between those two endpoints. Preserve ID, option index 1,
and legacy index 92. Add this ambiguity and the alternate-image build boundary
to the unknown record. The corrected inventory is 32 traced and 5 uncertain
claims, with 37 total chart-edge claims.

Retain `e_hostage_fail_jumps` as traced using the primary Steam image. In
7288×2648 coordinates, inspect approximately x=4450–6100, y=800–1250:
the connector leaves the right side of the FAIL box, moves right, rises,
then runs right to the jumps flag. The continuous line is visible independently
of the alternate image. This establishes a pictured connector reading only.
Record this source-specific observation instead of depending on demo-era
equivalence. Preserve its ID and legacy index 90.

## Independence, attribution, and rights

PowerPyx provides two pages from one publisher. GameFAQs has a separate author,
but this review cannot establish independence of the authors' underlying
research. The two chart hosts also do not establish independent gameplay
observations. Their agreement must not become an independent-verification label.

Retain the existing chart credits and guide attribution. Every source remains
reference-only. Public access and attribution do not establish permission.
The [rights audit](source-license-audit.md) and
[license boundary](../license-boundary.md) leave source-derived chart expression
outside MIT. Publication of that material still needs a documented decision.
This unresolved decision is not a finding that all chart use is forbidden.
It is also not a reason to label the checked guide facts unsupported.

## Closure criteria

1. Record the access outcomes and stable textual locators above.
2. Record the alternate chart's pre-release context and unknown build.
3. Downgrade the Cold candidate and update the count and unknown record.
4. Record the primary-image basis for the traced FAIL-to-jumps connector.
5. Keep source-review approval separate from publication readiness and rights.

No contradictory source assertion was established. Use an unknown for chart
ambiguity or build correspondence, not a fabricated source-conflict record.
## Follow-up verdict

Follow-up completed on 2026-10-22 against the corrected working-tree packet
and runtime. **Source interpretation approved within the recorded scope.**
The Cold candidate is uncertain, the packet records 32 traced and 5 uncertain
claims, and the unknown record includes both approach candidates. The traced
FAIL-to-jumps connector now cites only the primary Steam image. Source records
include this review's access outcomes, stable textual locators, and the
alternate image's pre-release boundary. The saved-cop prerequisite retains its
guide-reported status and single edge-local requirement.

No chart node or edge ID, option index, endpoint, or legacy index changed in
the corrections. Chart coverage remains separate from gameplay verification.
The packet is now `reviewed` with independent review `approved`. Its merge
gate remains `blocked` because the publication decision for source-derived
material is unresolved. This approval does not grant permission, establish
independence of guide research, or remove the five explicit chart unknowns.
