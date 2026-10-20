# PoC4 — multi-chapter atlas coverage and source note

Date: 2026-10-19; bounded data/provenance contract, Stormy Night escape routes and the Stormy Night entry slice added 2026-10-20. Scope: the static PoC4 prototype showing selected parts of
**A New Home**, **Stormy Night** and **Battle for Detroit — Kara** on one
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
ordering remain screenshot-derived. No reuse license for the guide image or
transcribed chart structure was identified in the [source-license audit](source-license-audit.md).
That audit records evidence and recommendations, not a legal determination.
The prototype includes no screenshot, game art, or copied guide paragraphs.
The box contents are summarized from cited transcript lines, and the later
Todd outcomes are independently worded guide-based summaries with attribution;
some short choice names are retained to identify the reported options.
PoC3 files were published previously and remain unchanged by this PoC4 work.

## Source types used

| Type | Meaning in the prototype | Where it appears |
|---|---|---|
| Screenshot transcription | Steam "100% Chapter Flowcharts" reference image, read 2026-10-18; structure only | The **A New Home** local sequence (see [map-reference-analysis.md](map-reference-analysis.md)) |
| Guide-reported (secondary) | PowerPyx *A New Home*, *Stormy Night* and *Battle for Detroit — Kara*; Gamer Guides *Stormy Night* and *Battle for Detroit — Kara*; GameFAQs *A New Home* and *Stormy Night* | Kara branch nodes/edges, relationship-threshold condition, ordered Stormy Night entry events and response branches, gun states and two successful non-gun routes |
| User-provided claim | The user-supplied Fandom node sequence; the same wording appears in the inspected PowerPyx, Fandom and Neoseeker pages | `Alice says goodbye to Todd` chip and its details entry |
| Transcript | Fandom *A New Home* transcript lines 1947–1964 | Box-contents summary in the details panel |
| Unresolved | Candidate links that the reviewed sources cannot distinguish | The dashed box → dialogue hypothesis |

Game version and platform: `unknown`. No transition in this prototype is
verified in game.

## Counts (asserted by the validator)

| Measure | Count | Note |
|---|---:|---|
| Chapter regions | **3** | A New Home, Stormy Night, Battle for Detroit — Kara |
| Boxes (nodes) | **45** | 12 A New Home events/clues + 24 Stormy Night events/states + 9 Kara events/outcomes |
| Connectors (edges) | **49** | 33 traced + 8 conditional + 5 prerequisite gates + 3 unresolved hypotheses |
| Cross-chapter connectors | **4** | Two A New Home → Stormy Night prerequisites and two existing Stormy Night/A New Home → Kara links |

## Data/provenance contract

The bounded contract is [data-contract.md](../data-contract.md). It keeps node
claim/evidence status (`ocr`, `guide`, `user`, `unresolved`, `mixed`) separate
from chapter coverage status (`not-added`, `partial`, `checked-against-chart`);
all three chapters are `partial`. Each chapter now carries an explicit
`coverage` record with scope, included sample, omissions and source references.

Every previously published edge keeps its order; new content is appended and
every edge has a stable `e_*` ID. Array-index `?edge=N` links remain canonical;
stable IDs are accepted as input aliases. Five plain-English condition groups
cover the key threshold (`SINGLE`), the two separate Meet Todd gates (`AND`),
the separate below-11 late-bus and above-11 on-time detour outcomes (`AND` per
edge), and the window QTE success step (`SINGLE`). Route transitions do not
inherit requirements from later steps; the window-opening prerequisite remains
a separate edge. The entry slice adds no condition groups: its seven links are
directly guide-stated `traced` transitions. Seven `unknown` records cover the
box trigger, key threshold, Stormy Night internals, exact 11:00 boundary, the
exact gun-state check, window-route outcomes, and the missing Todd state after
either successful non-gun escape. No source-vs-source conflict is recorded or
invented.

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
- **Additional A New Home actions.** Optional nightstand-gun inspection and
  opening Alice's window are guide-reported side actions, not claimed as
  exclusive or required next steps in the screenshot sequence.
- **Checkpoint detour.** The local route choice, reported timing split,
  late-bus outcome, and terminal connection are included. Both timing paths
  reach the terminal; exactly 11:00 remains unknown.
- **Battle for Detroit — Kara — selected Todd meeting branch.**
  `Kara and Alice reach the bus terminal` and `Todd not killed` are drawn as
  **two separate prerequisite gates** into `Meet Todd`. The meeting leads to
  the `Todd dialogue` choice (reported options `Persuade Todd` / `Fail to
  persuade Todd`), then to `Todd sends soldiers away → Alice says goodbye to
  Todd` or `Security check follows`.

## Deliberately omitted

- The rest of **A New Home**: chores and unlinked side labels whose arrows the
  screenshot does not resolve; not invented.
- Other **Stormy Night** internal branches: the too-slow path, hidden timers,
  fatal or survival outcomes beyond the selected non-deviant fatal route,
  Fail to Hide/Defend Alice alternatives, failed window QTEs, miss-bus
  outcomes, difficulty-specific prompts, and other ways Todd can be spared,
  avoided or killed.
- Most of **Battle for Detroit — Kara**: guarded checkpoint interactions,
  ticket, border and river branches, and downstream responses.
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
- **Relationship threshold for Alice's key.** GameFAQs alone reports a
  Neutral-or-higher requirement; the Steam screenshot shows the link and
  PowerPyx describes the conversation without a threshold. Drawn as a
  dash-dot "reported condition" with a single-source label.
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

## Checks run (2026-10-18; contract, Stormy expansion and entry slice re-run 2026-10-20)

- `node prototype/validate-atlas-data.js` — **all checks pass**: unique node,
  chapter, edge, condition, uncertainty and conflict IDs; claim/coverage
  vocabularies; chapter coverage records and source refs; node/edge/detail
  source refs; edge endpoints; no self-loops/duplicates; uncertainty styling
  with notes; plain-English condition groups (`SINGLE`, `AND`) over existing
  edge IDs; complete `unknown` records; exactly four cross-chapter links; `Meet
  Todd` receiving exactly the two reported gates; single
  unresolved hypothesis for the box; terminal negative state; confirmed
  reachability of the positive outcome without the hypothesis; declared
  counts; canvas/frame containment; no node overlaps; orthogonal routes avoid
  unrelated nodes. Route-specific fences also check that the two successful
  non-gun routes stay distinct, neither unlocks the other, the window opening
  remains a prerequisite rather than an outcome, and both endpoint-to-`s_alive`
  links stay `hypothesis` edges with an explicit unknown. The entry fence keeps
  the ordered entry events and response branches, keeps the fatal outcome terminal
  and distinct from `s_dead`, joins go-upstairs only to `s_reach_alice`, and
  stops Reason with Todd at its reported endpoint. Inventory: 3
  chapters, 45 boxes, 49 connectors (33 traced + 8 conditional + 5 prerequisite
  gates + 3 unresolved hypotheses); 5 conditions, 7 uncertainties, 0 conflicts.
- `node --check` on every prototype script and validator — syntax OK.
- `node tests/atlas-data-contract.test.js` — **51/51 pass**: the real sample is
  accepted; deliberate fixtures reject duplicate IDs, dangling endpoints,
  missing/unknown sources, invalid claim/coverage statuses, malformed
  conditions, incomplete uncertainty/conflict records, lost route steps,
  traced-instead-of-inferred Todd links, missing window prerequisites, escape
  endpoints wired straight to the meeting, whole-route conditions attached to
  early route transitions, unsourced entry edges, a fatal outcome merged with
  Todd killed or linked to Todd survives, a deviant shortcut past go-upstairs,
  and an extended Reason with Todd endpoint.
- `node tests/atlas-core.test.js` — **42/42 pass**: consent, chapter jump,
  selection, trail cap 8 + dedupe, both close paths reducing to one state,
  reset, hash round-trip for every node, stable-edge-ID aliases, and the data
  invariants above, including route distinctness, the inferred Todd links, and
  the separate entry/fatal/deviant states.
- `node tests/map-first.test.js` — **4/4 pass**, including desktop/mobile
  whole-map and chapter-focus inventory with 45 nodes/49 connectors.
- `node tests/poc4-browser.test.js` — **55/55 pass** (17 checks × 3 variants + 4 mobile checks)
  in headless Chromium over localhost HTTP: no page errors; consent gate; whole
  surface with 3 frames/45 nodes/49 connectors; cross-chapter gate and
  hypothesis labels visible before any navigation; chapter jumps as camera
  presets that keep every region mounted; both `Meet Todd` gates; the box
  hypothesis dashed, correctly labelled, and not a gate; each non-gun escape
  endpoint showing its unresolved Todd inference and no direct terminal/meeting
  connector; the window opening showing its prerequisite without claiming an
  escape outcome; the non-deviant fatal and deviant branches opening separately
  with no fatal Todd-state/meeting connector; cross-chapter jump; close-button
  and Escape paths equal with focus restored; history trail; search with Escape
  priority; hash deep link; text contrast ≥ 4.5:1 for the sampled text roles
  (minimums: editorial 6.07:1, amber 6.16:1, darkcyan 7.59:1).

- Earlier visual screenshot review covered all three palettes (whole atlas,
  focused chapters, details open, search). One layout defect was found and
  fixed: the legend overlay covered a focused chapter's title; chapter fits
  now reserve top padding. Screenshots are local review artifacts and are not
  committed.

### Current verification

- `node tests/stable-zoom.test.js` — **10/10 pass**. The close-scale sample now
  clicks zoom until the actual camera reaches 100%, independent of the whole-map
  fit scale; it still verifies the same node, edge, label and geometry inventory
  at fit, far, intermediate and close scales.
- `node tests/atlas-layout.test.js` — **9/9 pass** for all 45 node boxes,
  horizontal A New Home main sequence, label containment, caption clearance and
  chapter focus.

On 2026-10-19, the first main-checkout attempt could not load the browser suite
because Playwright was not installed. The locked dependency was installed with
`npm ci`; a sandboxed Chromium launch was then denied by macOS at
`bootstrap_check_in` (`Permission denied (1100)`). The suite passed after a
normal permission-escalated rerun. No workaround was used.

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
