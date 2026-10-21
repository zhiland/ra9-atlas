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
- [x] Every previously published node and edge ID and its array order remain;
      each bounded expansion appends only source-attributed content without
      changing the renderer.
- [x] Existing `?edge=N` links keep working; stable edge IDs are accepted as
      aliases.
- [x] The validator rejects deliberate fixtures for duplicate IDs, dangling
      endpoints, missing/unknown sources, invalid claim/coverage statuses,
      malformed conditions, and incomplete uncertainty/conflict records.
- [x] The real sample passes its validator, contract, unit, map, stable-zoom,
      layout and browser checks. The synthetic benchmark implementation is
      unchanged. See [STATUS](STATUS.md) for the current test boundary.

## Scope and record shape

The contract covers the three existing chapter regions, 68 nodes, 55 edges, five
condition groups, nine uncertainty records and no conflict records in
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
sequence plus two guide-reported clue actions, eleven selected first-floor
events and twelve selected second-floor events. Six local progressions are
drawn: four first-floor and two second-floor. The two guides list the
second-floor chores in different orders, so that difference stays an explicit
unknown rather than a universal room-cleaning gate. Stormy Night has a selected ordered entry sequence with response
branches, a non-deviant fatal outcome, a selected gun confrontation, two
successful non-gun escape routes and inferred Todd states. Battle for Detroit —
Kara has selected checkpoint and meeting branches. The omitted parts are
recorded per chapter. Version and platform remain `unknown`; no transition is
gameplay-verified.

Edge `kind` is a relation vocabulary, not a coverage or verification claim:

| Value | Meaning |
|---|---|
| `traced` | Link transcribed or directly guide-stated |
| `conditional` | Guide-stated link with a reported condition; the note explains the source and condition |
| `prerequisite` | Reported access gate into a later node |
| `hypothesis` | Unresolved candidate link; never presented as causal |

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

The current sample has five records:

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
  `u_gun_state_check`, `u_window_route_outcome` and
  `u_stormy_escape_todd_state`. The first-floor record holds unresolved ordering,
  requirements, and exclusivity among eleven selected events. The second-floor
  record holds the differing guide orders and the guide-specific Talk with Alice
  comments; it does not encode universal room-cleaning prerequisites or an AND
  gate. The last record specifically holds the missing Todd state after either
  successful non-gun escape; the dashed links to `s_alive` are inferences, not
  confirmed outcomes.
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
