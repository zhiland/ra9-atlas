# Overview / LOD slice — chapter-level story map

Checked: 2026-10-20. Scope: the shared PoC4 renderer and the existing 18-node
sample. This is a visualization and navigation change, not new game evidence or
full-game coverage.

## Acceptance

- Open on one spatial map containing the available chapter regions, all 18
  sample event boxes with readable in-box labels, and both actual cross-chapter
  links. Do not replace the map with a report or card screen.
- Keep the map continuous while zooming. At chapter fit, show all 10 A New Home
  sample events with readable labels. At close scale, preserve the existing
  detailed event text.
- Group dense synthetic data only when groups are explicitly labeled. Group
  connector paths must join their real chapter frame bounds, and selecting a
  group must expose its actual underlying edges and evidence.
- Keep full-map and chapter fits within their respective visible bounds; preserve
  keyboard search, event selection, X/Escape close behavior, and mobile access.

## Implementation

- The overview now uses the same spatial canvas as chapter and close views.
  Sparse data keeps every event as a labeled box at desktop overview and chapter
  fit. The 390×844 opening view uses named chapter regions and representative
  real event labels; selecting a chapter reveals all its sample events.
- Chapter labels and event labels remain readable at map scale. Labels are
  buttons, so event selection, search, and inspector navigation remain usable.
  Details still open over the map and close with X or Escape; focus returns to
  the selected event after the map redraws.
- Dense synthetic fixtures keep event internals compact at overview. Region and
  branch summaries are derived from their actual nodes and edges. Cross-region
  paths are grouped by directed chapter pair, touch the actual frame boundaries,
  and open an inspector listing every real edge in the selected group. The group
  does not assert a combined causal relation.
- Existing sample geometry was rearranged for legible regions and in-box labels.
  No nodes, edges, evidence claims, or causal relations were added.

## Verification

`npm test` passes the repository validators, 45 contract-fixture checks, 42 unit
checks, 13 map-first checks, and 51 Chromium browser checks. Playwright serves the repository on localhost;
no `file://` route is used. The map-first checks cover desktop opening, chapter
fit, intermediate zoom, cross-link navigation, dense aggregation, and 390×844
viewport emulation. Browser checks retain spoiler, search, deep-link, evidence,
contrast, X/Escape, and three-palette coverage.

`npm run bench:scale` passes all seven desktop gates for its deterministic
synthetic fixture (1,000 generated nodes and 1,650 generated connectors). The
latest measured desktop runs report 34–39 ms consent render, about 45 ms
selection, and 16.7–16.8 ms pan/zoom frame p95. Mobile emulation is diagnostic;
the benchmark's focused-label gate does not pass there. This is not a physical
device test.

Fresh localhost Playwright screenshots are written to ignored files under
`benchmark/scale/out/`: `review-real-desktop-overview.jpg`,
`review-real-desktop-chapter-home.jpg`, `review-real-desktop-intermediate.jpg`,
`review-real-desktop-close.jpg`, `review-real-mobile-overview.jpg`,
`review-real-mobile-chapter-home.jpg`, and `review-dense-desktop-overview.jpg`.
The desktop overview and chapter view were visually inspected after the final
renderer change. Dense screenshots show a coarse grouped map only.

## Limits

- The 18 events are a selected proof-of-concept sample, not the full game. The
  map does not claim full chapter or route coverage, and no transition was
  verified in-game.
- Stormy Night contains carried states only; the sample does not invent its
  internal topology. The Alice-box connection remains an unresolved hypothesis.
- Synthetic benchmark data is not game content and does not prove real-game
  correctness or production capacity. Its mobile profile and the physical
  device, Safari/iOS, GPU, and real touch behavior remain unverified.
- Dense 1,000-node overview is a coarse visualization. It is not accepted as a
  full-game user experience; dense node-label overflow and mobile legibility
  need later work.

See [graph-scale-spike.md](graph-scale-spike.md),
[PoC4 coverage](poc4-coverage.md), and [project status](../STATUS.md).
