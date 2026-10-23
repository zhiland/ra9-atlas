# PoC4 data and provenance contract

Status: implemented 2026-10-21 for the existing PoC4 sample only. This is not a
full-product data contract, a production schema decision, or game verification.
The Stage 1 pilot appends the complete visible *The Hostage* chart and one
bounded *Public Enemy* meeting node. See [PoC4 coverage](notes/poc4-coverage.md),
[Hostage coverage](notes/hostage-poc3-coverage.md),
[overview/LOD slice](notes/overview-lod-slice.md) and the
[specification](spec.md).

## Acceptance checklist

- [x] This document matches the normalised PoC4 data and the validator.
- [x] Claim/evidence status is separate from chapter coverage status, with
      explicit vocabularies and a distinction between `unknown` and `conflict`.
- [x] Conditions are plain English; Meet Todd's two gates and the separate
      timing predicates stay attached to their own outcome edges.
- [x] Every previously published node and edge ID and its array order remain;
      bounded expansions append source-attributed content. Source corrections
      may explicitly withdraw a claim while retaining its identity and geometry.
- [x] The Stage 1 pilot keeps all 33 Hostage chart boxes, 40 visible labels and
      all 36 pictured Steam connectors. Independent review supports
      FAIL-to-JUMPS in the primary image and retains both approach origins as uncertain. The atlas records 37
      internal Hostage edge claims, with both approach candidates marked
      uncertain. It adds only one saved-cop prerequisite into one bounded
      Public Enemy meeting node.
- [x] Existing `?edge=N` links keep working; stable edge IDs are accepted as
      aliases.
- [x] The validator rejects deliberate fixtures for duplicate IDs, dangling
      endpoints, missing/unknown sources, invalid claim/coverage statuses,
      malformed conditions, and incomplete uncertainty/conflict records.
- [x] The real sample passes its validator, contract, unit, map, stable-zoom,
      layout and browser checks. The synthetic benchmark implementation is
      unchanged. See [STATUS](STATUS.md) for the current test boundary.

## Scope and record shape

The contract covers five chapter regions, 102 nodes, 96 edge records (94 active connectors and two withdrawn claims), six condition
groups, ten uncertainty records and no conflict records in
`data/atlas.source.json` and its generated `prototype/atlas-data.js` artifact.
See [authoring ownership](authoring-data.md). The sample declares `meta.contractVersion: '1.0'`.

| Record | Required fields |
|---|---|
| Chapter | `id`, `name`, `code`, `frame`, `desc`, `coverage` |
| Chapter coverage | `status`, `scope`, `included`, `omitted`, `sources` |
| Node | `id`, `chapter`, `label`, `kind`, `status`, `src` (plus layout fields and optional `short`, `sub`, `heading`, `options`, `children`, `note`) |
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
| `checked-against-chart` | Every visible box, label and connector was checked against a chart; still not gameplay verification |

Four sample chapters are `partial`. A New Home has eleven selected screenshot-derived nodes, including two
stage containers and the trash action, plus two guide-reported clues, ten
additional first-floor guide events and twelve second-floor guide events. Six local progressions are
drawn: four first-floor and two second-floor. The two guides list the
second-floor chores in different orders, so that difference stays an explicit
unknown rather than a universal room-cleaning gate. Stormy Night has a selected ordered entry sequence with response
branches, a non-deviant fatal outcome, a selected gun confrontation, two
successful non-gun escape routes and inferred Todd states. Battle for Detroit —
Kara has selected checkpoint and meeting branches. The *Public Enemy* region is
a single guide-reported meeting node, not a chapter transcription.

*The Hostage* is `checked-against-chart`: all 33 visible boxes, 40 labels and 36
connectors from the Steam chart are represented. Independent review traces FAIL-to-JUMPS in the primary Steam image. Both
approach origins remain uncertain; the alternate image is pre-release/demo-era. The atlas stores
37 Hostage edge claims: 32 are `traced`; five are `uncertain` and drawn dashed
with `?` badges. `GET CLOSE
ENOUGH` remains a chart-visible dead end. The omitted parts are recorded per
chapter. Version and platform remain `unknown`; no transition is
gameplay-verified.

Edge `kind` is a relation vocabulary, not a coverage or verification claim:

| Value | Meaning |
|---|---|
| `traced` | Link transcribed or directly guide-stated |
| `conditional` | Guide-stated link with a reported condition; the note explains the source and condition |
| `prerequisite` | Reported access gate into a later node |
| `hypothesis` | Unresolved candidate link; never presented as causal |
| `uncertain` | Connector visible in the chart but not confidently traceable; dashed, `?`-badged and explained |

Edges also carry `src` references and evidence notes where uncertainty applies.
The first-floor event sample uses only directly reported local progressions. It
does not create generic activity spokes or infer order, requirements, or
exclusivity from guide omissions.

## Conditions

Conditions group existing edges in plain English. They do not add nodes, edges,
topology or game claims. `operator` is one of:

| Operator | Rule |
|---|---|
| `SINGLE` | Exactly one reported requirement; no AND/OR grouping claimed |
| `AND` | At least two requirements that are reported together |
| `OR` | At least two alternatives; reserved and unused by the current sample |

The current sample has six records:

- `cond_key_relationship` (`SINGLE`) applies to `e_home_talk_key`: GameFAQs
  reports that Alice trusts Kara enough to give the key but does not name a
  relationship level. PowerPyx lists favorable conversation choices without a
  threshold. The exact level stays unknown; the screenshot shows the key link.
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
- `cond_window_qte_success` (`SINGLE`) applies only to
  `e_stormy_go_out_qte`: pass the reported window-climb QTE. Exact prompts and
  difficulty are not stated.
- `cond_hostage_save_cop_meet` (`SINGLE`) applies only to
  `e_hostage_save_cop_public_enemy`: `SAVE WOUNDED COP` was chosen in *The
  Hostage*. The guides report the later meeting but do not verify the state
  check in game.

The escape routes are represented as source-attributed transitions. Do not
attach an entire route's requirements to every edge in that route: a later
exit or QTE is not a prerequisite for an earlier action. Conditions must name
only the transition they describe, unless a source explicitly states a
condition gates multiple edges. The A New Home window requirement remains a
separate prerequisite edge into the window-exit option.

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
  `u_box_trigger`, `u_key_threshold`, `u_home_first_floor_order`,
  `u_home_second_floor_order`, `u_stormy_internal`, `u_checkpoint_timer_11`,
  `u_gun_state_check`, `u_window_route_outcome`,
  `u_stormy_escape_todd_state` and `u_hostage_chart_uncertain`. The first-floor
  record holds unresolved ordering, requirements, and exclusivity among eleven
  selected events. The second-floor record holds the differing guide orders and
  the guide-specific Talk with Alice comments; it does not encode universal
  room-cleaning prerequisites or an AND gate. The Todd-state record specifically
  holds the missing state after either successful non-gun escape; the dashed
  links to `s_alive` are inferences, not confirmed outcomes. The Hostage record
  covers the five uncertain edge claims after independent review, including both approach origins
  and explicitly does not absorb
  the guide-supported saved-cop prerequisite.
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
- route-specific fences: the two non-gun escape routes stay distinct, neither
  unlocks the other, the window opening is only a prerequisite, and both
  endpoint-to-`s_alive` links stay `hypothesis` edges labelled as unresolved
  inferences with an explicit unknown record;
- entry-slice fences: Todd's order and Alice running upstairs precede the
  response branches; the non-deviant fatal outcome is distinct from `s_dead`
  and never reaches `s_alive` or the later meeting; go-upstairs joins only the existing
  `s_reach_alice` route, and Reason with Todd stops at its reported endpoint;
- first-floor event fences: eleven selected events carry scoped source refs;
  four documented local progressions are drawn (laundry to backyard to washer
  to Red Ice to Todd reaction, and TV stare to blocking Todd’s view);
  unrelated tasks have no invented spokes, the existing `a_clean1 → a_ask`
  sequence remains, and the unknown record covers order and requirements;
- second-floor event fences: twelve selected events carry scoped source refs;
  exactly two reported sequences are drawn (pills to gun sighting, and Todd’s
  bed to Alice going to her room). The pills sequence cites GameFAQs/Mogg only;
  the bed sequence cites both guides. Neither is a prerequisite, and no
  second-floor event becomes a Talk with Alice gate or generic spoke;
- Alice-key fence: the key-to-box relation remains `a_key → a_box`; the key
  condition is `SINGLE` on `e_home_talk_key`, and the named relationship levels
  `Neutral`, `Warm` and `Distant` are rejected because the guides do not state
  an exact level;
- Hostage chart fences: all 33 PoC3 boxes retain their IDs/order and all 40
  visible labels survive. The Steam image still accounts for 36 pictured
  connectors. The atlas stores 37 edge claims after one option-specific split:
  32 are traced and 5 remain uncertain. Both approach origins remain unresolved. The Friendly candidate is not an
  extra confirmed connector. The old `?edge=89` position stays fixed and its
  narrower meaning is documented. One scoped unknown record names the remaining
  uncertainty, and `GET CLOSE ENOUGH` gains no outgoing edge;
- saved-cop fence: `wounded_cop` has one outgoing connector from option index 1
  only, targets `pe_meet_cop`, stays `prerequisite`, cites both PowerPyx pages,
  keeps its guide-reported/not-gameplay-verified note, and has exactly one
  `SINGLE` condition. `LEAVE WOUNDED COP` and later cop outcomes stay
  unconnected; `pe_meet_cop` has no outgoing edge;
- the previous graph invariants, inventory counts, layout and routing checks.

`tests/atlas-data-contract.test.js` accepts the real sample and rejects
deliberate malformed fixtures for every error class above. Structural checks do
not prove that a guide is correct, that a source is independent, or that a
transition occurs in game.

## Limits

- This contract is bounded to the existing PoC4 sample; full-game coverage and
  the full-product data contract remain open.
- No game claim, source, node, edge or topology is added by this contract
  document itself; the corresponding source-backed data changes are recorded in
  the coverage notes.
- The conflict record shape is documented and fixture-tested but has no real
  sample instance.
- Stored evidence status describes source basis, not gameplay verification.
- The Stage 2 [chapter preparation packet](chapter-preparation.md) is a separate
  preparation gate. It does not change this runtime contract or migrate the
  runtime source of truth by itself. [ADR 0002](adr/0002-canonical-atlas-source.md)
  separately moves graph authoring into a versioned JSON bundle.

## Withdrawn claims and source corrections — 2026-10-23

[ADR 0001](adr/0001-withdrawn-edge-permalinks.md) keeps known-wrong claims out
of the active graph while preserving old references. `kind: withdrawn` records
retain their ID, endpoints and array position, require a withdrawal `note`, and
list unique active replacement IDs in `replacedBy`. They have no live condition.
They are absent from drawn paths, neighbour relations, chapter links and ordinary
connection lists. A focused old permalink shows the withdrawal and replacements.

The A New Home source review withdraws index 2 (`e_home_clean1_ask`, which
skipped TAKE OUT TRASH) and index 6 (`e_home_room_talk`, which had the wrong
origin). Appended records 93–95 represent stage→trash→ask and stage→conversation.
The original endpoints are not silently retargeted. Both cleaning nodes are
stages. A stage/chore relation does not establish mandatory task order.

`meta.counts.edges` counts all 96 records. `activeEdges` is 94 and
`withdrawnEdges` is 2. Kind counts sum to records: 72 traced, 8 conditional,
6 prerequisite, 3 hypothesis, 5 uncertain and 2 withdrawn. User-facing
connector totals and stable-world inventories count only active connectors.

An optional `points` array stores authored world-coordinate pairs for a
connector route. Points must be finite, orthogonal and anchored to their
endpoint borders. Existing collision checks apply. These routes avoid other
nodes without moving the existing boxes. Routes carry no gameplay semantics.
The packet excludes the withdrawn traces from `chart` and records their migration
in `legacy.note`. Runtime ownership and the full-product schema remain undecided.
