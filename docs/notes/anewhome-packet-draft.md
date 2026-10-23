# A New Home preparation packet — bounded draft

Prepared by isolated OpenCode on 2026-10-22; patch reviewed and corrected by
Codex on 2026-10-23. Input: public runner checkpoint
`7f89e88e94af535d44c1aef4c5e31662cf3ff30a` from draft PR #22.
Output: [a-new-home.packet.json](../../packets/a-new-home.packet.json).

## Scope

This packet repackages existing public prototype evidence. It adds no runtime
content, changes no graph identity and claims no fresh source inspection.

- Ten chart-transcribed nodes and nine local edges, from WELCOME HOME to
  OPEN ALICE'S BOX. The edge IDs and legacy indices 0–8 match the current ATLAS.
- Two separate supplementary guide events: the nightstand gun sighting and the
  opened Alice-room window. No edge or prerequisite is invented for these nodes.
- One existing guide-reported key condition, attached only to the key edge.
  Its exact relationship threshold remains unknown.
- Explicit partial scope and omissions, plus unknown records for full topology
  and the key threshold. No source disagreement is fabricated.

The chart cites Steam only. The key condition cites the two guides separately.
The gun event cites PowerPyx and GameFAQs; the window event cites PowerPyx only.
Source access records say `not-accessed` by this extraction worker and identify
inherited project evidence. Rights remain `reference-only`.

## Runner and patch review

The corrected runner completed 49/49 per-run checks, including native policy,
public input admission, fixed free-provider relay and actual model tool work.
Its server stopped. The local report and original patch remain at
`/private/tmp/ra9-opencode-run-3i65aeu3/` and are not committed.

The original patch changed only the new packet. `git apply --check` passed.
Codex inspected it before application, then removed unused Fandom/Neoseeker
records, restricted chart sources to Steam, and split supplementary attribution.
The packet does not inherit approval from the Hostage packet or its code review.

## Validation and next gate

`npm run validate:packet` now validates both real packets. The A New Home packet
passes structural validation and optional ATLAS reconciliation by IDs, labels,
kinds, endpoints and legacy indices. The packet regression suite passes 56 tests.
`--require-review` returns 2: independent source review is pending and the merge
gate is blocked. Structural validation is not source approval or publication clearance.

Next: inspect the primary A New Home image and the named guide sections in a
separate source review. Verify the selected local connectors and key condition,
retain missing topology explicitly, then use both packets to decide canonical
data ownership and reproducible generation before scaling chapter extraction.

Final trusted-checkout verification: full `npm test` passed (84 contract,43 unit,
4 map,10 stable zoom,12 layout,56 packet,58 browser), both packet validators
passed, and 225 local Markdown links resolved. A stale browser-check label was
also updated from four to five uncertain Hostage claims. User draft hash is unchanged.
