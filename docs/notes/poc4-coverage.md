# PoC4 — multi-chapter atlas coverage and source note

Date: 2026-10-19. Scope: the static PoC4 prototype showing selected parts of
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
| Guide-reported (secondary) | PowerPyx *A New Home* and *Battle for Detroit — Kara*, GameFAQs *A New Home*, Gamer Guides *Battle for Detroit — Kara* | Kara branch nodes/edges, relationship-threshold condition, Stormy Night carried states |
| User-provided claim | The user-supplied Fandom node sequence; the same wording appears in the inspected PowerPyx, Fandom and Neoseeker pages | `Alice says goodbye to Todd` chip and its details entry |
| Transcript | Fandom *A New Home* transcript lines 1947–1964 | Box-contents summary in the details panel |
| Unresolved | Candidate links that the reviewed sources cannot distinguish | The dashed box → dialogue hypothesis |

Game version and platform: `unknown`. No transition in this prototype is
verified in game.

## Counts (asserted by the validator)

| Measure | Count | Note |
|---|---:|---|
| Chapter regions | **3** | A New Home, Stormy Night, Battle for Detroit — Kara |
| Boxes (nodes) | **18** | 10 home + 2 stormy states + 6 Kara |
| Connectors (edges) | **16** | 12 traced + 1 reported condition + 2 prerequisite gates + 1 unresolved hypothesis |
| Cross-chapter connectors | **2** | Both enter the Kara region: the survival gate and the box hypothesis |

## Included per chapter

- **A New Home — selected local sequence (screenshot transcription).**
  `WELCOME HOME → JOIN TODD → CLEAN FIRST FLOOR → ASK TO GO UPSTAIRS →
  GO UPSTAIRS → CLEAN SECOND FLOOR → CLEAN ALICE'S ROOM → TALK WITH ALICE →
  ALICE GIVES KARA A KEY → OPEN ALICE'S BOX`.
- **Stormy Night — selected carried state only.** Two states: *Todd not
  killed* (reported prerequisite for the later meeting) and *Todd killed*
  (closes the meeting branch, drawn with no outgoing connector). No internal
  chapter topology is transcribed and no in-chapter arrow is claimed.
- **Battle for Detroit — Kara — selected Todd meeting branch.**
  `Kara and Alice reach the bus terminal` and `Todd not killed` are drawn as
  **two separate prerequisite gates** into `Meet Todd`. The meeting leads to
  the `Todd dialogue` choice (reported options `Persuade Todd` / `Fail to
  persuade Todd`), then to `Todd sends soldiers away → Alice says goodbye to
  Todd` or `Security check follows`.

## Deliberately omitted

- The rest of **A New Home**: chores and unlinked side labels whose arrows the
  screenshot does not resolve; not invented.
- All **Stormy Night** internal branches: guides differ on how Todd can be
  spared, avoided or killed; nothing is inferred.
- Most of **Battle for Detroit — Kara**: checkpoint, ticket, border and river
  branches, and downstream responses such as Luther's diversion.
- The **checkpoint-detour timing segment (D3)**: outside this slice. The
  reviewed pages also disagree at the boundary — Fandom states "11 minutes or
  more" while PowerPyx states "above 11 minutes" — so an exactly-11:00 claim
  stays unresolved and is not shown anywhere in the prototype.
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

## Checks run (2026-10-18)

- `node prototype/validate-atlas-data.js` — **all checks pass**: unique ids;
  kinds/statuses/labels/sources; detail refs; edge endpoints; no self-loops/
  duplicates; uncertainty styling with notes; exactly two cross-chapter links,
  both into Kara; `Meet Todd` receiving exactly the two reported gates;
  single unresolved hypothesis for the box; terminal negative state; confirmed
  reachability of the positive outcome without the hypothesis; declared
  counts; canvas/frame containment; no node overlaps; orthogonal routes avoid
  unrelated nodes. Inventory: 3 chapters, 18 boxes, 16 connectors (12 traced +
  1 reported condition + 2 prerequisite gates + 1 unresolved hypothesis).
- `node --check` on every prototype script and validator — syntax OK.
- `node tests/atlas-core.test.js` — **25/25 pass**: consent, chapter jump,
  selection, trail cap 8 + dedupe, both close paths reducing to one state,
  reset, hash round-trip for every node, and the data invariants above.
- `node tests/poc4-browser.test.js` — current run **42/42 pass** (14 checks × 3 variants)
  in headless Chromium over `file://`: no page errors; consent gate; whole
  surface with 3 frames/18 nodes/16 connectors; cross-chapter gate and
  hypothesis labels visible before any navigation; chapter jumps as camera
  presets that keep every region mounted; both `Meet Todd` gates; the box
  hypothesis dashed, correctly labelled, and not a gate; cross-chapter jump;
  close-button and Escape paths equal with focus restored; history trail;
  search with Escape priority; hash deep link; text contrast ≥ 4.5:1 for the
  sampled text roles (minimums: editorial 6.07:1, amber 6.16:1, darkcyan
  7.59:1).
- Earlier visual screenshot review covered all three palettes (whole atlas,
  focused chapters, details open, search). One layout defect was found and
  fixed: the legend overlay covered a focused chapter's title; chapter fits
  now reserve top padding. Screenshots are local review artifacts and are not
  committed.

On 2026-10-19, the first main-checkout attempt could not load the browser suite
because Playwright was not installed. The locked dependency was installed with
`npm ci`; a sandboxed Chromium launch was then denied by macOS at
`bootstrap_check_in` (`Permission denied (1100)`). The suite passed after a
normal permission-escalated rerun. No workaround was used.

### Not run

- Gameplay: no transition was checked in game (out of scope by design).
- Real pointer/touch gesture pan/zoom/fling, keyboard-only traversal beyond
  Escape, screen-reader testing, and responsive/mobile widths.
- Any browser other than headless Chromium (the suite launches only that).
- Independent review of the topology and attribution (next process step;
  nothing is pushed before it).

## Limits

Every connector is a reading of guide text or a single screenshot; none is
in-game verified. `verification-d2.md` remains the binding evidence ledger,
and the map-reference transcription supports visible structure only. The
browser suite proves the static pages work as intended in headless Chromium;
it does not prove completeness, gameplay accuracy, or accessibility beyond the
sampled checks.
