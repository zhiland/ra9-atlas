# A New Home source correction and legacy links

Date: 2026-10-23. Baseline: `2334d58`, the PR #24 checkpoint.
This package applies the [independent source review](anewhome-packet-source-review.md)
and [ADR 0001](../adr/0001-withdrawn-edge-permalinks.md).

## Corrected behavior

The old direct first-floor-to-ask trace skipped TAKE OUT TRASH. The old
Alice-room-to-conversation trace had the wrong origin. Both cleaning headings
are stage containers. The corrected partial packet contains eleven chart nodes
and ten pictured relations, two separate guide clues and one key condition.
Its source interpretation is approved after a separate image-review follow-up.
Its publication gate remains blocked for unresolved source-derived rights.

| Existing record | Historical identity retained | Active replacement |
| --- | --- | --- |
| index 2, `e_home_clean1_ask` | original first-floor stage → ask endpoints | index 93 stage → trash, then index 94 trash → ask |
| index 6, `e_home_room_talk` | original room → conversation endpoints | index 95 second-floor stage → conversation |

The two old records are `withdrawn`, not uncertain. Their old permalinks open
an explanation and replacement buttons. They create no active path, neighbour,
chapter link or ordinary connection row. All 93 earlier edge IDs, endpoints,
option indices and array positions remain intact. No node or layout box moved.
The active graph has 102 nodes and 94 connectors; the data keeps 96 edge records.

Authored orthogonal point routes keep the replacement connectors out of other
node boxes. They do not add conditions or gameplay semantics. Stage/chore
branches do not establish mandatory cleaning order or conversation eligibility.
The key threshold remains unknown; the gun clue remains a sighting, not possession.

## OpenCode implementation

The corrected runner worked from confirmed public commit `2334d58`. Its task
changed only `atlas-app.js` and `atlas-core.js`. The run passed 49/49 boundary,
native-policy and provider/task checks, then stopped its server. Original patch
and report remain local at `/private/tmp/ra9-opencode-run-d5jp3tzo/`.
Codex inspected the patch and ran `git apply --check` before application.
Data corrections, validator guards, authored routes and tests were handled in
the trusted checkout. Raw logs and source images are excluded from Git.

## Standards

Two independent review findings were corrected:

- Local replacements initially received the cross-chapter heading. The heading
  now uses endpoint chapter identity. Browser assertions cover the local case.
- The current contract still described 93 edges and omitted withdrawal and
  authored-route fields. It now documents the 96/94/2 distinction and ADR.

Follow-up closed both findings and found no new concrete standards mismatch.
No additional baseline smell warranted a finding.

## Spec

One functional finding was corrected: the generated UI called an internal
resolver that was absent from the public core API. Browser tests reproduced the
error. Exporting the existing resolver restored the old-link notice and active
replacement navigation. Follow-up confirmed replacement indices 93–95.
The source role and historical OCR description were also corrected to match
11 nodes and 10 relations. This review does not substitute for image inspection.

Standards: 2 findings closed. Spec: 1 functional finding closed, descriptive
corrections complete. The separate source review approved the corrected partial scope.

## Verification boundary

Data/packet validation checks shape, references, historical identities and
reconciliation. Regression fixtures reject withdrawal cycles, missing reasons,
dangling/duplicate replacements, live conditions on withdrawn claims, and
malformed, diagonal or unanchored route points. Browser checks cover old-link
notices, every replacement, local connector classification, stable-world
inventory and a mobile-width withdrawal interaction.

Full `npm test` passed: 94 contract, 44 unit, 4 map, 10 stable zoom, 12 layout,
59 packet and 62 browser checks. Desktop screenshots of the corrected map and
withdrawal notice were inspected locally. A final authored-route gutter adjustment
was then checked by data validation and layout tests. See [STATUS](../STATUS.md). Chromium viewport
emulation does not verify physical touch, Safari/iOS, assistive technology or
gameplay. Source review does not prove guide independence or grant publication
rights. The runtime graph remains its own source of truth; this correction
only informs the upcoming production-format decision.
