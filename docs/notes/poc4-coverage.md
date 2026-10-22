# PoC4 — multi-chapter atlas coverage and source note

Date: 2026-10-19; bounded data/provenance contract, Stormy Night escape routes, the Stormy Night entry slice, eleven selected A New Home first-floor events and twelve second-floor events added 2026-10-20; the Stage 1 Hostage pilot and one bounded Public Enemy node added 2026-10-21. Scope: the static PoC4 prototype showing selected parts of
**A New Home**, **Stormy Night**, **Battle for Detroit — Kara**, the complete
visible **The Hostage** chart, and one **Public Enemy** meeting node on one
surface. The default [poc4-editorial.html](../../prototype/poc4-editorial.html)
entry now uses the neutral gray PoC3 palette, with orthogonal connectors ending
in arrowheads. Condition and prerequisite labels remain attached to their
connectors; prerequisite diamonds were removed. Files also include
[poc4-amber.html](../../prototype/poc4-amber.html)
(warm amber), [poc4-darkcyan.html](../../prototype/poc4-darkcyan.html)
(dark cyan); shared data/behaviour in
[atlas-data.js](../../prototype/atlas-data.js),
[atlas-core.js](../../prototype/atlas-core.js),
[atlas-app.js](../../prototype/atlas-app.js),
[atlas.css](../../prototype/atlas.css);
[validate-atlas-data.js](../../prototype/validate-atlas-data.js).

This note states what the prototype shows, what it deliberately omits, and
which claims remain unresolved. It is a structure/UI record, **not** in-game
verification. No game art or screenshot is embedded or redistributed.

## Provenance and reuse boundary

The ten-node **A New Home** sequence and its nine links are transcribed from
the visible Steam Community guide screenshot. The labels are event names from
that chart; this is not a copied guide-text corpus, but the selection and
ordering remain screenshot-derived. Eleven additional first-floor events and
twelve second-floor events are independently worded guide summaries, not
screenshot transcription. Six source-stated local progressions are connected:
four first-floor and two second-floor. Other order and requirements remain
unknown, including the differing second-floor guide orders. See [the A New Home
first-floor slice](anewhome-firstfloor-slice.md) and [the second-floor
slice](anewhome-secondfloor-slice.md).
The Stage 1 pilot appends the 33-box *The Hostage* chart already transcribed for
PoC3, preserving its 40 visible labels and 36 pictured connectors. A selected-
path image is pre-release/demo-era. Independent review traces FAIL TO NEGOTIATE →
DEVIANT JUMPS directly in the full Steam image. Both approach origins remain
uncertain; selected blue events do not resolve the shared negotiation bus. The map therefore stores 37 Hostage edge
claims: 32 traced and 5 uncertain. The Friendly candidate is not counted as an
additional confirmed screenshot connector.
One separate, guide-supported prerequisite links `SAVE WOUNDED COP` to the
bounded *Public Enemy* “Meet Cop From Hostage Situation” node. That carry is
guide-reported, not gameplay-verified; `LEAVE WOUNDED COP` has no drawn
consequence and later cop outcomes are omitted. See [the Hostage ledger](hostage-poc3-coverage.md).

No reuse license for the guide image or transcribed chart structure was
identified in the [source-license audit](source-license-audit.md).
That audit records evidence and recommendations, not a legal determination.
The prototype includes no screenshot, game art, or copied guide paragraphs.
The box contents are summarized from cited transcript lines, and the later
Todd outcomes are independently worded guide-based summaries with attribution;
some short choice names are retained to identify the reported options.
PoC3 files were published previously and remain unchanged by this PoC4 work.

## Source types used

| Type | Meaning in the prototype | Where it appears |
|---|---|---|
| Screenshot transcription | Steam "100% Chapter Flowcharts" reference image, read 2026-10-18; structure only | The **A New Home** local sequence and the complete visible **The Hostage** chart (see [map-reference-analysis.md](map-reference-analysis.md) and [the Hostage ledger](hostage-poc3-coverage.md)) |
| Guide-reported (secondary) | PowerPyx *A New Home*, *Stormy Night*, *The Hostage*, *Public Enemy* and *Battle for Detroit — Kara*; Gamer Guides *Stormy Night* and *Battle for Detroit — Kara*; GameFAQs *A New Home*, *Stormy Night* and *Public Enemy* (section reference only) | selected A New Home first- and second-floor events, Kara branch nodes/edges, the unnamed Alice-key relationship condition, ordered Stormy Night entry events and response branches, gun states, two successful non-gun routes, and the saved-cop meeting carry |
| User-provided claim | The user-supplied Fandom node sequence; the same wording appears in the inspected PowerPyx, Fandom and Neoseeker pages | `Alice says goodbye to Todd` chip and its details entry |
| Transcript | Fandom *A New Home* transcript lines 1947–1964 | Box-contents summary in the details panel |
| Unresolved | Candidate links that the reviewed sources cannot distinguish | The dashed box → dialogue hypothesis |

Game version and platform: `unknown`. No transition in this prototype is
verified in game.

## Counts (asserted by the validator)

| Measure | Count | Note |
|---|---:|---|
| Chapter regions | **5** | A New Home, Stormy Night, Battle for Detroit — Kara, The Hostage, Public Enemy (one node) |
| Boxes (nodes) | **102** | 35 A New Home + 24 Stormy Night + 9 Kara + 33 Hostage + 1 Public Enemy |
| Connectors (edges) | **93** | 71 traced + 8 conditional + 6 prerequisite gates + 3 unresolved hypotheses + 5 uncertain chart claims |
| Cross-chapter connectors | **5** | Two A New Home → Stormy Night prerequisites, two Stormy Night/A New Home → Kara links, one saved-cop Hostage → Public Enemy prerequisite |

## Data/provenance contract

The bounded contract is [data-contract.md](../data-contract.md). It keeps node
claim/evidence status (`ocr`, `guide`, `user`, `unresolved`, `mixed`) separate
from chapter coverage status (`not-added`, `partial`, `checked-against-chart`).
*The Hostage* is `checked-against-chart`; the other four regions are `partial`.
Each chapter carries an explicit `coverage` record with scope, included sample,
omissions and source references.

Every previously published node and edge keeps its array order; new content is
appended and every edge has a stable `e_*` ID. Array-index `?edge=N` links
remain canonical; stable IDs are accepted as input aliases. Five plain-English
condition groups cover the unnamed Alice-key trust condition (`SINGLE`), the two
separate Meet Todd gates (`AND`), the separate below-11 late-bus and above-11
on-time detour outcomes (`AND` per edge), the window QTE success step
(`SINGLE`), and the saved-cop prerequisite into the Public Enemy meeting
(`SINGLE`). Route transitions do not inherit requirements from later steps; the
window-opening prerequisite remains a separate edge. Six local progressions are
directly guide-reported: four first-floor and two second-floor. Other selected
events have no inferred spokes, fixed order, or universal room-cleaning
predicate. The entry slice adds no condition groups: its seven links are
directly guide-stated `traced` transitions. Ten `unknown` records cover the box
trigger, the unnamed key relationship level, first-floor event
order/requirements/exclusivity, the differing second-floor order and
guide-specific Talk comments, Stormy Night internals, the exact 11:00 boundary,
the exact gun-state check, window-route outcomes, the missing Todd state after
either successful non-gun escape, and five uncertain Hostage chart edge claims.
The Hostage record explicitly excludes the saved-cop prerequisite,
which rests on guide statements rather than a confident chart trace. No
source-vs-source conflict is recorded or invented.

## Included per chapter

- **A New Home — selected local sequence (screenshot transcription).**
  `WELCOME HOME → JOIN TODD → CLEAN FIRST FLOOR → ASK TO GO UPSTAIRS →
  GO UPSTAIRS → CLEAN SECOND FLOOR → CLEAN ALICE'S ROOM → TALK WITH ALICE →
  ALICE GIVES KARA A KEY → OPEN ALICE'S BOX`.
- **Stormy Night — [entry slice](stormy-entry-slice.md), selected events and
  two successful non-gun routes.** Todd orders Kara to stay still, then Alice
  runs upstairs. Obey/stay still leads only to the fatal *Todd kills Alice and
  Kara* outcome; becoming deviant branches to *Go upstairs*, which joins the
  existing *Reach Alice* route, or *Reason with Todd*, which stops at Todd
  knocking Kara down and reaching Alice before Kara. The fatal outcome is not
  *Todd killed*, is terminal, and
  never connects to *Todd not killed* or the later meeting. Two states remain:
  *Todd not killed* (reported prerequisite for the later meeting) and *Todd
  killed* (closes the meeting branch). A bounded gun confrontation adds
  distinct Kara-shoots and Alice-shoots outcomes; only Kara's outcome carries
  the gun. Two distinct successful non-gun routes are included:
  `Reach Alice → Run away → Hide in corridor → Todd walks past →
  Escape via door/yard`, and `Reach Alice → Lock room → Open window, go out →
  Pass window QTE → Take Alice down to bus`. The window route requires the
  window opened in A New Home; the corridor route does not. Neither route
  unlocks the other. Both exit endpoints link to *Todd not killed* only by
  dashed inference edges because the guides do not state Todd’s later state.
  No other internal chapter topology is transcribed.
- **Additional A New Home actions.** The map includes two guide-reported
  upstairs clues, eleven selected first-floor events and twelve selected
  second-floor events. The magazine titles come from PowerPyx only. Four
  first-floor progressions connect the laundry trip to the backyard, washer,
  Red Ice and Todd’s reported reaction, plus watching TV to blocking Todd’s
  view. Two second-floor progressions connect the pill bottle to the gun
  sighting (GameFAQs/Mogg only) and Todd’s bed to Alice going to her room (both
  guides). The remaining events have no inferred spokes. The map does not claim
  a fixed order, universal room-cleaning prerequisites, an AND gate for Talk
  with Alice, exclusivity, or an exact Alice-key relationship level. See [the
  first-floor slice](anewhome-firstfloor-slice.md) and [the second-floor
  slice](anewhome-secondfloor-slice.md).
- **Checkpoint detour.** The local route choice, reported timing split,
  late-bus outcome, and terminal connection are included. Both timing paths
  reach the terminal; exactly 11:00 remains unknown.
- **Battle for Detroit — Kara — selected Todd meeting branch.**
  `Kara and Alice reach the bus terminal` and `Todd not killed` are drawn as
  **two separate prerequisite gates** into `Meet Todd`. The meeting leads to
  the `Todd dialogue` choice (reported options `Persuade Todd` / `Fail to
  persuade Todd`), then to `Todd sends soldiers away → Alice says goodbye to
  Todd` or `Security check follows`.
- **The Hostage — visible chart transcription.** All 33 boxes and 40 visible labels
  are represented, including three stage containers, seven two-row choice
  groups, the `GET CLOSE ENOUGH` dead end, and six outcomes. The chart shows 36
  connectors. The atlas has 37 claims: 32 traced and five uncertain, including
  a narrowed Friendly candidate at retained index 89. The extra candidate is
  not counted as a confirmed pictured connector. Chart uncertainty is kept
  separate from guide-supported cross-chapter evidence. See [the Hostage
  ledger](hostage-poc3-coverage.md).
- **Public Enemy — one bounded meeting node.** `Meet Cop From Hostage
  Situation` records the guide-reported meeting and its incoming `SAVE WOUNDED
  COP` prerequisite. No consequence for `LEAVE WOUNDED COP` is modelled in this
  slice. Later cop rescue, death, and post-meeting content are omitted. The
  node and prerequisite state that matching guides are not independent
  verification.

## Deliberately omitted

- The rest of **A New Home**: chores other than the eleven first-floor and
  twelve second-floor selected events, unlinked screenshot side labels whose
  arrows are unresolved, and any claimed activity order, exclusivity or
  mandatory completion. The differing second-floor guide order and the
  guide-specific Talk with Alice comments are recorded as unknown, not encoded
  as universal prerequisites. The exact Alice-key relationship level is also
  not claimed.
- Other **Stormy Night** internal branches: the too-slow path, hidden timers,
  fatal or survival outcomes beyond the selected non-deviant fatal route,
  Fail to Hide/Defend Alice alternatives, failed window QTEs, miss-bus
  outcomes, difficulty-specific prompts, and other ways Todd can be spared,
  avoided or killed.
- Most of **Battle for Detroit — Kara**: guarded checkpoint interactions,
  ticket, border and river branches, and downstream responses.
- Most of **Public Enemy**: every other event, and all cop rescue/death or
  post-meeting outcomes. The saved-cop carry stops at one reported meeting.
- Exact non-gun route inputs, QTE requirements/difficulty, hidden triggers, and
  the later Todd state after either successful non-gun escape.
- Other chapters and any full-game coverage.

## Unresolved claims kept visibly unresolved

- **Alice's box → later Todd dialogue.** Neoseeker ties the later "[Your
  Story]" persuasion option to "unlocked Alice's box during A New Home",
  but the reviewed sources cannot distinguish opening the box, seeing a
  photo, or another related action. It is drawn as a **dashed, `?`-badged
  hypothesis** that never claims causality, and it is not a gate into the
  meeting: the prototype cannot be made to route *through* it as a
  prerequisite, and the validator fails if such an edge is ever added.
- **Relationship condition for Alice's key.** GameFAQs says Alice trusts Kara
  enough to give the key but does not name a relationship level; PowerPyx lists
  favorable conversation choices without a threshold. The Steam screenshot
  shows the link. Drawn as a dash-dot "reported condition" whose exact level
  remains unknown. `u_key_threshold` records the gap.
- **First-floor event order and requirements.** PowerPyx and GameFAQs list
  several events in different orders. The map draws only four reported local
  progressions. It does not infer that unrelated events are optional, required,
  or exclusive. `u_home_first_floor_order` records the unresolved details. The
  magazine titles are named by PowerPyx only.
- **Second-floor event order and Talk requirements.** PowerPyx and GameFAQs
  list the second-floor chores in different orders and describe different
  Talk with Alice conditions. The map draws only the pills→gun and
  bed→Alice-room reported sequences. `u_home_second_floor_order` records the
  difference; it is not a universal room-cleaning prerequisite or an AND gate.
- **Whether the box state affects meeting availability or only dialogue
  options** is unknown; the details panel says so on both related nodes.
- **How the Stormy Night survival state is reached** is outside the reviewed
  evidence; the state node says so.
- **Todd’s later state after either non-gun escape** is not stated by the
  reviewed guides. Both endpoint-to-`s_alive` edges are dashed `hypothesis`
  links labelled “UNRESOLVED inference”, and
  `u_stormy_escape_todd_state` records that the question remains open. The
  corridor and window routes do not merge, and neither bypasses the separate
  terminal and meeting gates.
- **What follows Reason with Todd** is outside the selected evidence. The
  prototype stops at the reported point where Todd knocks Kara down and goes
  upstairs first; it adds no later gun, fight, survival or fatal consequence.
- **The non-deviant fatal outcome is not Todd killed.** “Todd kills Alice and
  Kara” is a terminal outcome for Kara and Alice and has no connector to
  `s_dead`, `s_alive` or the later meeting.
- **Five Hostage chart connectors are not confidently traceable.** The fish,
  SWAT, negotiation-bus and FAIL TO NEGOTIATE routes are visible in the chart
  but their exact junctions or crossings are ambiguous. They stay dashed and
  `?`-badged under `u_hostage_chart_uncertain`; they are not merged with the
  saved-cop guide evidence. `GET CLOSE ENOUGH` remains a visible dead end.
- **The saved-cop meeting is guide-reported, not a verified transition.** The
  exact state check, the meeting scene, and every later cop outcome are outside
  the evidence. Only the SAVE option carries a prerequisite; LEAVE has no drawn
  consequence, and no rescue or death outcome is claimed.

## Checks run (2026-10-21)

- `npm test` passes. The data validators report 5 chapters, 102 nodes, 93 edges,
  six condition groups, ten unknowns, and no conflicts.
- Contract tests: **84/84**. They reject unsupported generic first-floor and
  second-floor spokes, unsupported optionality claims, removal of any of the six
  local progressions, a universal Talk with Alice AND gate, restoration of a
  named key relationship level, a Hostage outgoing edge from `GET CLOSE ENOUGH`,
  removal or weakening of the saved-cop prerequisite, a consequence for
  `LEAVE WOUNDED COP`, and relabelling an uncertain Hostage edge claim.
- Core unit tests: **43/43**. Map inventory tests: **4/4**. Stable-zoom tests:
  **10/10**. Layout tests: **12/12**. Chromium browser checks: **58/58** across
  three palette variants and mobile viewport emulation.
- The layout checks include all 102 real node boxes, five chapter frames, label
  containment, the horizontal A New Home main sequence, first- and second-floor
  event spacing, and the Hostage frame fit. Browser tests ran over localhost
  HTTP and check four dashed `uncertain` paths, four `?` badges, the `GET CLOSE
  ENOUGH` dead end, and saved-cop navigation/evidence.
- Fresh whole-atlas and Hostage-fit screenshots were inspected. They are
  temporary review artifacts in `/private/tmp/` and are not committed.

### Not run

- Gameplay: no transition was checked in game (out of scope by design).
- Real pointer/touch gesture pan/zoom/fling, keyboard-only traversal beyond
  Escape, screen-reader testing, and physical-device behavior. The 390×844
  result is Chromium viewport emulation only.
- Any browser other than headless Chromium (the suite launches only that).
- A complete independent source audit of every topology and attribution claim.
  The contract validator checks structure and source references, not source
  accuracy or gameplay truth.

## Limits

Every connector is a reading of guide text or a single screenshot; none is
in-game verified. `verification-d2.md` remains the binding evidence ledger,
and the map-reference transcription supports visible structure only. The
browser suite proves the static pages work as intended in headless Chromium;
it does not prove completeness, gameplay accuracy, or accessibility beyond the
sampled checks.
