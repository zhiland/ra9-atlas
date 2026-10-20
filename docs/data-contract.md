# PoC4 data and provenance contract

Status: implemented 2026-10-20 for the existing PoC4 sample only. This is not a
full-product data contract, a production schema decision, or game verification.
See [PoC4 coverage](notes/poc4-coverage.md), [overview/LOD slice](notes/overview-lod-slice.md)
and the [specification](spec.md).

## Acceptance checklist

- [x] This document matches the normalised PoC4 data and the validator.
- [x] Claim/evidence status is separate from chapter coverage status, with
      explicit vocabularies and a distinction between `unknown` and `conflict`.
- [x] Conditions are plain English; Meet Todd's two gates and the separate
      timing predicates stay attached to their own outcome edges.
- [x] The original 18 nodes and 16 edges remain; this bounded slice adds
      source-attributed content without changing the renderer.
- [x] Existing `?edge=N` links keep working; stable edge IDs are accepted as
      aliases.
- [x] The validator rejects deliberate fixtures for duplicate IDs, dangling
      endpoints, missing/unknown sources, invalid claim/coverage statuses,
      malformed conditions, and incomplete uncertainty/conflict records.
- [x] The real sample passes; `npm test` passes; benchmark code is untouched.

## Scope and record shape

The contract covers the three existing chapter regions, 29 nodes, 31 edges, four
condition groups, six uncertainty records and no conflict records in
`prototype/atlas-data.js`. The sample declares `meta.contractVersion: '1.0'`.

| Record | Required fields |
|---|---|
| Chapter | `id`, `name`, `code`, `frame`, `desc`, `coverage` |
| Chapter coverage | `status`, `scope`, `included`, `omitted`, `sources` |
| Node | `id`, `chapter`, `label`, `kind`, `status`, `src` (plus layout fields and optional `short`, `sub`, `options`, `note`) |
| Edge | `id`, `from`, `to`, `kind`, `src` (plus optional `label`, `note`, `via`, `labelAt`, `fromOption`) |
| Condition | `id`, `appliesTo`, `operator`, `summary`, `requirements`, `sources` |
| Uncertainty / conflict | `id`, `status`, `explanation`, `nodes` or `edges`, `sources` |
| Source reference | A `refs` key mapped to an absolute `http(s)` URL |

`src` and `sources` contain keys from `ATLAS.refs`; they never contain raw URLs.
Every node, edge, chapter coverage record, detail entry, condition and
uncertainty/conflict record must name at least one existing source key. The
validator never treats a source reference as proof of a game claim.

## Claim/evidence status versus coverage status

These are separate vocabularies. A node's `status` says what kind of evidence
supports that claim; a chapter's `coverage.status` says how much of the chapter
is represented. Neither one upgrades the other.

Node `status` values:

| Value | Meaning in this sample |
|---|---|
| `ocr` | Screenshot transcription; visible structure only |
| `guide` | Reported by secondary guides |
| `user` | User-provided claim whose wording also appears in inspected guides |
| `unresolved` | Unresolved hypothesis only |
| `mixed` | Mixed secondary evidence, explained in the details |

Chapter `coverage.status` values:

| Value | Meaning |
|---|---|
| `not-added` | No sample from this chapter is present |
| `partial` | Only the listed selected sample is present |
| `checked-against-chart` | The whole chapter was checked against a chart; not used by PoC4 |

All three sample chapters are `partial`: A New Home has a selected screenshot
sequence plus guide-reported optional actions, Stormy Night has a selected gun
confrontation and carried states, and Battle for Detroit — Kara has selected
checkpoint and meeting branches. The omitted parts are recorded per chapter.
Version and platform remain `unknown`; no transition is gameplay-verified.

Edge `kind` is a relation vocabulary, not a coverage or verification claim:

| Value | Meaning |
|---|---|
| `traced` | Link transcribed or directly guide-stated |
| `conditional` | Guide-stated link with a single-source reported condition |
| `prerequisite` | Reported access gate into a later node |
| `hypothesis` | Unresolved candidate link; never presented as causal |

Edges also carry `src` references and evidence notes where uncertainty applies.

## Conditions

Conditions group existing edges in plain English. They do not add nodes, edges,
topology or game claims. `operator` is one of:

| Operator | Rule |
|---|---|
| `SINGLE` | Exactly one reported requirement; no AND/OR grouping claimed |
| `AND` | At least two requirements that are reported together |
| `OR` | At least two alternatives; reserved and unused by the current sample |

The current sample has four records:

- `cond_key_relationship` (`SINGLE`) applies to `e_home_talk_key`: GameFAQs
  alone reports the Neutral-or-higher relationship threshold. The screenshot and
  PowerPyx do not state that threshold.
- `cond_meet_todd_access` (`AND`) applies to the two existing prerequisite edges
  `e_stormy_alive_meet` and `e_kara_terminal_meet`. The two requirements stay
  two separate edges and two separate requirements:

  1. Todd was not killed in Stormy Night.
  2. Kara and Alice reached the bus terminal.

- `cond_checkpoint_detour_late` (`AND`) applies only to
  `e_kara_detour_late`: wait before taking the detour AND the timer is reported
  below 11 minutes.
- `cond_checkpoint_detour_ontime` (`AND`) applies only to
  `e_kara_detour_terminal`: take the detour immediately AND the timer is
  reported above 11 minutes. The exact 11:00 boundary remains unknown. Separate
  records prevent either outcome from inheriting the other outcome's predicate.

No `OR` record combines the two timing outcomes. The `OR` vocabulary remains
available for a supported set of alternatives within one outcome.

## Stable IDs and permalinks

The original node and edge IDs remain. New IDs extend the sample; original edge
array order is preserved, and each edge has a stable `e_*` ID.

- `?edge=N` remains the canonical written form and continues to address the same
  array index.
- `?edge=<stable-id>` is accepted as an input alias and resolves to the same edge
  index. `hashFor` continues to write `?edge=N`, so old links and new IDs do not
  create two competing canonical forms.
- The state still stores the edge index; rendering, LOD, geometry and UI
  behaviour are unchanged by this content expansion.

The stable IDs are identifiers only. They do not add evidence or assert that an
edge is more verified than its source and status state.

## Unknown versus conflict

`unknown` and `conflict` are not synonyms:

- An `unknown` record describes incomplete evidence: the reviewed sources cannot
  settle a value, trigger or mechanism. Current records:
  `u_box_trigger`, `u_key_threshold`, `u_stormy_internal`.
- A `conflict` record would describe sources that disagree with each other. The
  current sample has no normalised source-vs-source conflict, so `conflicts` is
  empty. The schema is still validated and malformed conflict fixtures are
  rejected.

Every uncertainty or conflict record must have an explanation and at least one
existing source key plus a node or edge reference. A record without either is a
structural error, not a silent caveat.

## Validation boundary

`prototype/validate-atlas-data.js` checks:

- unique node, chapter, edge, condition, uncertainty and conflict IDs;
- known claim/evidence and coverage status vocabularies;
- valid chapter coverage records and source references;
- existing edge endpoints, relation kinds and source references;
- condition operators, requirement counts, plain-English summaries and
  `appliesTo` edge IDs;
- uncertainty/conflict status, explanation, node/edge references and sources;
- the previous graph invariants, inventory counts, layout and routing checks.

`tests/atlas-data-contract.test.js` accepts the real sample and rejects
deliberate malformed fixtures for every error class above. Structural checks do
not prove that a guide is correct, that a source is independent, or that a
transition occurs in game.

## Limits

- This contract is bounded to the existing PoC4 sample; full-game coverage and
  the full-product data contract remain open.
- No game claim, source, node, edge or topology was added by this contract.
- The conflict record shape is documented and fixture-tested but has no real
  sample instance.
- Stored evidence status describes source basis, not gameplay verification.
