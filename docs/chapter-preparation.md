# Chapter preparation packet

Status: implemented 2026-10-21 for the bounded Stage 2 pilot. This is a
**preparation gate**. Canonical graph authoring now uses
[data/atlas.source.json](../data/atlas.source.json) under [ADR 0002](adr/0002-canonical-atlas-source.md).
[prototype/atlas-data.js](../prototype/atlas-data.js) is generated. Packets remain
separate evidence documents and do not automatically change the graph.

Files:

- [packets/hostage.packet.json](../packets/hostage.packet.json) — the real
  *The Hostage* pilot packet.
- [packets/a-new-home.packet.json](../packets/a-new-home.packet.json) — partial
  reviewed selection corrected against the chart; publication gate blocked.
- [packets/shades-of-color.packet.json](../packets/shades-of-color.packet.json) —
  bounded next-chapter preparation; detached icon origins remain unknown.
- [packets/chapter-template.json](../packets/chapter-template.json) — a valid
  empty draft for another chapter.
- [prototype/validate-chapter-packet.js](../prototype/validate-chapter-packet.js)
  — dependency-free Node CLI.
- [tests/chapter-packet.test.js](../tests/chapter-packet.test.js) and
  [tests/fixtures/hostage-pilot-expectations.json](../tests/fixtures/hostage-pilot-expectations.json)
  — structural, reconciliation and pilot regression checks.

## Purpose and shape

A packet inventories one chapter for review before any runtime merge. It is an
evidence-preparation document, not a second graph.

- `chart` contains chart-transcribed structure only: stable node IDs, labels,
  kinds, choice options, stable edge IDs, endpoints and optional legacy edge
  indices.
- `supplementary` contains guide-reported claims separately. The Hostage packet
  uses it only for the saved-cop prerequisite into the existing *Public Enemy*
  meeting node.
- `sources` records URL, source class, role, locator, access date/outcome,
  attribution and a rights review state. A rights state records review status;
  it does not assert legal clearance.
- `conditions` attach to exactly one edge ID. Route-wide requirements are not
  allowed.
- `unknowns` and `conflicts` are separate records with an explanation, a node or
  edge reference, and at least one source. `unknown` means incomplete evidence;
  `conflict` means reviewed sources disagree.
- `coverage` records the chapter scope, included items, omitted items and source
  references.
- `review` records the independent source review and merge gate separately from
  automated structural validation.

The packet version is `1.0`. `packetStatus` is `draft`, `prepared` or `reviewed`.
A `reviewed` packet with approved independent review and a ready merge gate can
be review-ready when coverage is `partial` or `checked-against-chart`. Partial
coverage must retain its explicit scope, included items and omissions. The gate
does not mean the chapter is complete. A `not-added` packet is never review-ready.

An approved independent source review may retain a `blocked` merge gate.
Record the remaining publication, integration or rights concern in the gate's
reason. Approval alone does not open the merge gate. Structural validation can
pass in this state, but `--require-review` still exits 2.

## Workflow

1. **Extraction** — transpose chart structure into `chart`; keep guide-reported
   claims in `supplementary`; record locators, access outcomes and rights states.
2. **Structural validation** — run the CLI. It checks version, schema, unique
   stable IDs, source references, access/rights vocabularies, endpoints,
   edge-local conditions, coverage, unknown/conflict shape, legacy indices and
   optional ATLAS reconciliation.
3. **Independent source review** — a reviewer checks source support,
   independence, attribution and rights boundaries. The CLI cannot perform this
   step and does not treat a structural pass as approval.
4. **Merge gate** — only after review approval may the packet become `reviewed`
   and its gate `ready`. `--require-review` enforces that state and exits 2
   otherwise.

## Commands

```sh
# Validate the real Hostage packet against the current ATLAS.
npm run validate:packet
node prototype/validate-chapter-packet.js packets/hostage.packet.json

# Validate any packet; --json prints a machine-readable summary.
node prototype/validate-chapter-packet.js packets/hostage.packet.json --json

# Emit a fresh draft template for the next chapter.
node prototype/validate-chapter-packet.js --emit-template a-new-chapter \
  --title "A New Chapter" --out packets/a-new-chapter.packet.json

# Copy the checked-in empty draft instead, if preferred.
cp packets/chapter-template.json packets/a-new-chapter.packet.json

# Enforce the independent review gate (non-zero until approved and ready).
node prototype/validate-chapter-packet.js packets/hostage.packet.json --require-review
```

Draft packets may contain no evidence. They remain structurally valid but the
validator reports `review-ready: no` and warns that structural validity does not
make them merge-ready.

## Hostage pilot boundary

The pilot packet reconciles with the current ATLAS chapter by node IDs, labels,
kinds, choice options, edge IDs, endpoints and `?edge=N` indices. The exact
33-box / 40-label / 36-connector regression lives in the test fixture, not in the
generic validator.

- Independent source review completed on 2026-10-22. Its requested corrections
  were checked in a separate follow-up. See [the report](notes/hostage-packet-source-review.md).
- The source chart still has 33 boxes, 40 labels and 36 pictured connectors.
  The 37 modeled claims contain 32 traced and 5 uncertain links. Both approach
  origins are uncertain. The alternate chart is pre-release/demo-era.
- The primary Steam image directly supports the FAIL-to-JUMPS connector.
  `GET CLOSE ENOUGH` keeps no outgoing edge. All IDs and legacy indices remain fixed.
- The saved-cop prerequisite is supplementary and guide-reported. No consequence
  for `LEAVE WOUNDED COP` or gameplay verification is claimed.
- Independent review is `approved` and packet status is `reviewed`. The merge gate
  remains `blocked` for the unresolved source-derived publication decision.
  `--require-review` therefore still exits 2.

## What this package does not establish

- It does not prove that a source is correct, complete, independent or
  authoritative.
- It does not clear reuse rights or replace the
  [source-license audit](notes/source-license-audit.md).
- It does not verify any transition in game; game version and platform remain
  unknown.
- It does not finalize the full-product data contract, choose a database, migrate
  runtime ownership by itself or change `?edge=N` to a new canonical permalink form.
- The packet workflow itself does not change graph content, IDs, edge order,
  geometry, UI, or screenshots. The separate selected-path review has narrowed
  the Friendly candidate at index 89 and left five Hostage edge claims uncertain after the independent correction.

Stage 2 remains in progress. This package provides a repeatable preparation gate.
Canonical JSON ownership and generation are now decided separately; extending
the full-product schema and canonical permalink output remains open.

## Second packet trial — 2026-10-23

The [A New Home draft](notes/anewhome-packet-draft.md) exercises a partial
chapter, same-chapter supplementary nodes, one edge-local guide condition and
legacy-index reconciliation. `npm run validate:packet` validates both real packets.
It does not migrate runtime ownership or approve the new packet sources.

## Second packet source correction — 2026-10-23

Independent image review found two wrong traces inherited by both the draft
and runtime. The [corrected selection](notes/anewhome-packet-source-review.md)
contains eleven nodes and ten relations, with two stage kinds and the trash
intermediate explicitly represented. Two historical runtime traces are withdrawn
from active topology. The packet excludes them from `chart` and records their
old indices/replacements in `legacy.note`. [ADR 0001](adr/0001-withdrawn-edge-permalinks.md)
explains why their old IDs and endpoints remain for permalink notices.
The packet is `reviewed` with source approval; its publication gate is blocked.
This repeatable correction exposed why validation against runtime cannot prove
source accuracy. The later [authoring decision](authoring-data.md) establishes canonical JSON
and generation without changing this source-review boundary.

## Third packet — Shades of Color

The [source-reviewed packet](notes/shades-of-color-source-review.md) contains
12 chart boxes and 5 continuous box-to-box edges. Six icon-origin segments remain
unknown instead of becoming invented edges. Its initial preparation had no ATLAS reconciliation. The later
[integration](notes/shades-runtime-integration.md) adds exact runtime reconciliation
with new edges appended at 96–100, without changing source interpretation. Source approval retains a
blocked publication gate. `npm run validate:packet` includes all four packets;
`npm run test:shades` pins the source-reviewed bounds and review-required exit 2.

## Fourth packet — The Painter opening

The [reviewed preparation](notes/painter-packet-source-review.md) selects nine
opening boxes, five continuous traces and three detached segments with unknown
origins. Two checkpoints are stages. The later leisure/studio/painting chart is
outside scope. Four unknown records preserve origins, ordering, clothes
eligibility and platform/build gaps. The guide-reported harassment prerequisite
is not a cross-chapter edge or game verification. The later [runtime integration](notes/painter-runtime-integration.md) declares
exact reconciliation with appended indices101–105. All four packet CLIs run in `validate:packet`.
Independent source approval keeps publication blocked.
