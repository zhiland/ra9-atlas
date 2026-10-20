# Stormy Night — successful non-gun escape slice

Updated: 2026-10-20. This note records a bounded addition to the existing PoC4
sample: two distinct, source-supported successful non-gun escapes from
**Stormy Night**. It is not full chapter coverage, a difficulty guide, or
gameplay verification.

## Routes added

| Route | Added node IDs | Added edge IDs | Reported steps |
|---|---|---|---|
| Corridor / front-door / backyard | `s_reach_alice`, `s_run_away`, `s_hide_corridor`, `s_todd_passes`, `s_front_backyard_escape` | `e_stormy_reach_run_away`, `e_stormy_run_hide`, `e_stormy_hide_todd_passes`, `e_stormy_todd_passes_front_backyard`, `e_stormy_front_backyard_alive` | Reach Alice before Todd → Run Away → hide in the corridor → wait until Todd walks past → take the reported front-door/backyard exit. |
| Locked-room window | `s_lock_room`, `s_window_go_out`, `s_window_qte`, `s_window_reach_bus` (plus the existing `s_window_open`) | `e_stormy_reach_lock_room`, `e_stormy_window_go_out_access`, `e_stormy_lock_go_out`, `e_stormy_go_out_qte`, `e_stormy_qte_bus`, `e_stormy_window_bus_alive` | Reach Alice → lock her room → use the window opened in A New Home → choose **Go out** → pass the reported QTE → take Alice down to the bus. |

The routes share only the `s_reach_alice` entry point. They do not share
intermediate nodes, and no edge lets either route unlock the other. The window
route requires `s_window_open`, which in turn records the window opened in
*A New Home*; route availability is separate from the successful branch. The
corridor route has no window requirement.

## Evidence

Sources inspected for this slice:

- [PowerPyx — Stormy Night](https://www.powerpyx.com/detroit-become-human-stormy-night-walkthrough-100/)
- [Gamer Guides — Stormy Night](https://www.gamerguides.com/detroit-become-human/guide/walkthrough/chapter-1/chapter-6-stormy-night)
- [GameFAQs — Stormy Night](https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/stormy-night)

PowerPyx and Gamer Guides support the corridor route: Run Away, hide until Todd
passes, then exit through the front door/backyard. GameFAQs also reports the
front-door alternative when the window route was not opened. All three guides
support locking Alice’s room, going out through the previously opened window,
passing the reported climb/QTE, and taking Alice down to the bus.

These are secondary guides and may share wording or sources; independence is
unknown. Exact movement timing, hiding inputs, prompt sequences, difficulty,
and hidden triggers are not modelled. Other fatal or survival branches,
including the too-slow path, Fail to Hide, Defend Alice, failed window QTEs,
miss-bus outcomes, and other difficulty-specific failures, are deliberately
omitted. The separately added [entry slice](stormy-entry-slice.md) represents
only the non-deviant fatal outcome and the deviant go-upstairs/Reason with Todd
alternatives.

## Todd state remains unresolved

None of the three guides states Todd’s later state after either successful
non-gun escape. The exits therefore connect to the existing `s_alive` state
only through two `hypothesis` edges:

- `e_stormy_front_backyard_alive`
- `e_stormy_window_bus_alive`

Both are labelled `UNRESOLVED inference · Todd state not stated`, and their
notes say the link is an inference rather than a traced or confirmed outcome.
`u_stormy_escape_todd_state` records the same gap explicitly. `s_alive` still
feeds the separate `k_terminal → k_meet` meeting path; neither escape endpoint
connects directly to `k_terminal` or `k_meet`, and neither bypasses the two
reported meeting gates.

## Counts and validation

After the later [entry slice](stormy-entry-slice.md), the atlas contains
**45 nodes and 49 edges**: 33 traced + 8 conditional + 5 prerequisite +
3 unresolved hypotheses, with 4 cross-chapter connectors, 5 conditions,
7 uncertainty records and 0 conflicts. All previously published node/edge IDs
and array order remain; this escape slice's nine nodes and eleven internal
edges stay ahead of the seven entry nodes and seven entry edges appended later.

Conditions remain transition-local: the QTE success condition applies only to the QTE edge; later route steps do not become prerequisites for earlier actions. The A New Home window availability stays a separate prerequisite edge.

Full validation was re-run on 2026-10-20:

- `node prototype/validate-atlas-data.js` — all checks pass, including route
  distinctness, the window prerequisite, the endpoint-to-`s_alive` inference
  fence, and the separate terminal/meeting gates.
- `node tests/atlas-data-contract.test.js` — 51/51 pass after the later entry
  slice.
- `node tests/atlas-core.test.js` — 42/42 pass after the later entry slice.
- `node tests/map-first.test.js` — 4/4 pass.
- `node tests/poc4-browser.test.js` — 55/55 pass in headless Chromium over
  localhost HTTP, including the route/inference details check.
- `node tests/stable-zoom.test.js` — 10/10 pass; close-scale sampling now zooms
  until the actual camera reaches 100%, independent of the fitted map width.
- `node tests/atlas-layout.test.js` — 9/9 pass with the 45-node inventory.

Browser screenshots used for visual review were served over localhost, not
`file://`. No game transition was checked in game.
