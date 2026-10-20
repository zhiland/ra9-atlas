# Graph-scale spike — 1,000-node synthetic atlas

Checked: 2026-10-20. Scope: measure the current custom SVG/DOM renderer in
`prototype/atlas-app.js` and `prototype/atlas-core.js` against a deterministic,
synthetic fixture. This is a renderer stress test, not game content, not
evidence, and not a claim about final graph size.

> **Current stable-zoom rerun (2026-10-20):** semantic LOD, label overlays,
> node dots, and grouped pseudo-connectors are removed. The same synthetic
> nodes, labels, and actual paths stay in one world while only the camera
> transform changes. Latest results and limits are below. The original
> measurements later in this file are historical results from the superseded
> LOD renderer; they do not describe the current interface.

## Original acceptance gates (historical LOD run)

These gates were written before the earlier LOD experiment. They remain here to
document that run. Its label-legibility gate is not a current acceptance gate;
the stable-zoom benchmark below checks mounted graph inventory and performance
without claiming readable 1,000-node text at whole-map fit.

| # | Gate | Desktop Chromium | Mobile viewport emulation |
|---|---|---|---|
| 1 | Consent click to second rAF after rendered map | Each of 5 measured runs ≤ 3000 ms | Same threshold, **diagnostic only** |
| 2 | Pan frame durations (rAF) | p95 ≤ 50 ms and max ≤ 200 ms | Same threshold, **diagnostic only** |
| 3 | Zoom frame durations (rAF) | p95 ≤ 50 ms and max ≤ 200 ms | Same threshold, **diagnostic only** |
| 4 | Runtime errors | No uncaught page errors, console errors, or failed local asset requests | Same, diagnostic only |
| 5 | Render inventory | Exactly 1,000 node buttons and 1,650 SVG edge paths | Same, diagnostic only |
| 6 | Details after selection | Selecting a node makes details visible and reachable | Same, diagnostic only |
| 7 | Focused/zoomed label legibility | Select a node, then one `+` step; camera scale ≥ 1.0. For 20 sampled visible nodes in that chapter: computed label font-size ≥ 11 px, effective size (computed font × camera scale) ≥ 11 px, and ≥ 18/20 (90%) labels not intrinsically clipped. | Same threshold, **diagnostic only** |

Interpretation rules fixed with the gates:

- **Mobile is not a phone result.** It is desktop Chromium at a 390×844 CSS
  viewport, `deviceScaleFactor: 1`, touch enabled. No physical-device or
  Safari/iOS claim is made.
- **Overview labels are not gated.** At whole-atlas fit, 1,000 labels cannot be
  legible at once. The benchmark reports overview camera scale, rendered label
  count, effective font size, and clipped-label counts, and interprets them
  explicitly.
- **Consent timing is not page-load timing.** The measurement starts at the
  consent button click and ends at the second `requestAnimationFrame` after the
  synchronous map render. It does not include navigation, network load,
  browser start-up, or a cold cache. It is not a cold-start metric.
- **Frame durations** are `requestAnimationFrame` inter-frame deltas sampled
  while panning and zooming. The first callback seeds the clock; no negative
  interval is recorded. Reported min/median/p95/max come from all five measured
  repetitions after warmup.
- **Computed font-size** is the CSS value from `getComputedStyle`; **effective
  size** multiplies it by the current world transform scale. A pass requires
  both.
- **Intrinsic clipping** means a node button's content overflows its own
  120×52 box (`scrollWidth`/`scrollHeight` greater than its client box,
  consistent with the renderer's `overflow: hidden`) or its label box sits
  outside its own node box. **Boundary clipping** means a label rect crosses the
  visible canvas boundary because of camera position; it is reported separately
  and is not counted as intrinsic label clipping.
- No new runtime dependency was permitted; Playwright is already a
  devDependency.
- The fixture must prominently identify itself as synthetic and must not import
  into any production entry point.

## Fixture and topology

- Exactly 1,000 generated nodes and 1,650 generated edges in five neutral
  regions. Seed `20261019`; PRNG `mulberry32`.
- Node labels use the original formulation: 40 neutral verbs × 25 neutral
  objects, one unique pair per node. All 1,000 labels are unique. Label lengths
  range from 15 to 40 characters (median 23); 80 labels are longer than 30
  characters. Labels were not filtered or shortened for readability.
- Three representative choice nodes carry two options each; they add six
  option labels to the label-element count (1,003 total label elements).
- Each region is a 16-column layered left-to-right DAG. Forward links, explicit
  branches, two/three/four-column joins, adjacent-region links, and a few
  longer region jumps produce the edge set. The graph stays acyclic.
- Edge kinds after topology assignment: 1,535 traced, 70 conditional,
  27 prerequisite, 18 hypothesis; 150 edges cross regions. 363 edges carry
  descriptive labels; 250 of those carry explicit label positions and the rest
  exercise the renderer's automatic `getTotalLength`/`getPointAtLength` path.
- Benchmark source is `benchmark/scale/run-benchmark.js` (runner),
  `benchmark/scale/generate-fixture.js` (seed and topology),
  `benchmark/scale/atlas-1000.html` (isolated entry),
  `benchmark/scale/benchmark.css` and `benchmark/scale/benchmark-chrome.js`
  (benchmark-only banner and synthetic copy).
- The isolated entry point loads the generated fixture plus the real
  `prototype/atlas-core.js`, `prototype/atlas-app.js`, and `prototype/atlas.css`.
  Benchmark-only code replaces the production page's hard-coded spoiler-cover
  copy, adds a synthetic banner, and relabels the "whole atlas" subcount; it
  does not touch graph rendering, interaction, data schema, or production
  files. There is no layout-probe flag or responsive override in the benchmark
  CSS. Both profiles load the same production stylesheet.

## Production mobile layout defect and fix

The previous run measured the unmodified production page at 390×844: the
`.workspace` was 653.7 px wide and `#canvas` was **0 px high**. The `<900px`
rule made `.workspace` a block with no height while the world was absolutely
positioned, so the canvas had no intrinsic or allocated height.

The final run uses the production CSS directly. The narrow fix:

- `.app` now declares `grid-template-columns: minmax(0, 1fr)` and `.top`
  receives `min-width: 0`, so header content cannot force a grid track wider
  than the viewport at either profile. This also removed the desktop
  min-content width mismatch exposed by the synthetic header (the first
  benchmark pass measured a 1692.94 px canvas at a 1440 px viewport).
- `.workspace` has `min-width: 0` and the mobile rule gives it
  `display: block; position: relative; width: 100%; height: 100%`.
- `.canvas-wrap` is explicitly `width: 100%; height: 100%; min-width: 0;
  min-height: 0` at `max-width: 900px`.

Final measured layout at 390×844: viewport 390×844, document scroll width 390
(no horizontal overflow), `.workspace` 390×617.66, `#canvas` 390×617.66. The
synthetic banner is 53.25 px high and remains inside the measured mobile
layout. At 1440×900: viewport 1440×900, document scroll width 1440, banner
38 px, `.workspace` and `#canvas` 1440×757.38.

A scoped regression was added to `tests/poc4-browser.test.js`: at 390×844 with
mobile emulation it checks canvas width vs viewport within 1 px, canvas height
> 0, no document horizontal overflow, chapter focus remains active and visible,
and detail selection/close remains reachable without horizontal overflow.

## Measured environment

| Item | Value |
|---|---|
| OS / runtime | macOS (Darwin 27.0.0), arm64, Node v22.23.1 |
| Playwright | 1.64.1 |
| Browser | Headless Chromium 156.0.8078.4 (`HeadlessChrome/156.0.8078.4`) |
| Desktop | 1440×900, `deviceScaleFactor: 1`, no touch |
| Mobile emulation | 390×844, `deviceScaleFactor: 1`, `isMobile: true`, `hasTouch: true` — diagnostic only |
| Hardware exposed to the page | 8 logical CPUs, 8 GB device memory |
| Repetitions | 1 unmeasured warmup + 5 measured per profile |

## Commands

```text
npm run bench:scale                 # generate fixture, serve the repo locally, run both profiles
node benchmark/scale/generate-fixture.js   # regenerate only the fixture
npm test                            # existing validators, unit checks, and PoC4 browser checks
```

`npm run bench:scale` starts an ordinary localhost static server on an ephemeral
port and launches Chromium. It does not access external services. Generated
fixture and run artifacts are ignored by Git:

- `benchmark/scale/generated/atlas-1000-data.js` (regenerated from seed)
- `benchmark/scale/out/results.json` (full per-repetition data and raw frames)
- `benchmark/scale/out/*.jpg` (overview and zoomed-detail screenshots)

The results below replace the earlier provisional probe numbers. The
`?layoutProbe=1` mechanism and the separate "unmodified mobile" run were
removed.

## Current stable-zoom rerun

`npm run bench:scale` regenerates the deterministic fixture and measures one
warmup plus five repetitions per profile. All current desktop gates pass; the
mobile profile is diagnostic only. The benchmark does not require readable
labels at fit. It reports the complete graph inventory, viewport intersections,
intrinsic overflow, and frame timings. A text-fit gate checks every generated
node box, including the three choice titles and all six choice options.

| Profile | Fit scale | Nodes / paths / labels mounted | Internal node overflow | Pan p95 | Zoom p95 | Consent→render median | Gates |
|---|---:|---:|---:|---:|---:|---:|---|
| Desktop 1440×900 | 0.1639 | 1,000 / 1,650 / 1,006 | 0 / 1,000 | 16.8 ms | 16.7 ms | 36.3 ms | All pass |
| Mobile emulation 390×844 | 0.0428 | 1,000 / 1,650 / 1,006 | 0 / 1,000 | 16.7 ms | 16.8 ms | 29.5 ms | Diagnostic; all measured gates pass |

Both profiles report 1,000 node buttons, 1,650 actual edge paths, 363
data-labeled edge buttons, five chapter regions, no overview cards, no grouped
connectors, and no browser/network errors. The benchmark report is generated at
`benchmark/scale/out/results.json` and ignored by Git. The synthetic text is
small at whole-map fit; full-map label readability is not claimed. The three
choice nodes have taller boxes and later nodes in their columns shift down so
that all choice text fits without clipping. Mobile is Chromium emulation, not
device testing.

## Historical measured result: pre-stable-map LOD renderer

### Desktop Chromium, 1440×900 (production stylesheet)

| Measurement | Result | Gate |
|---|---|---|
| Consent click → second rAF after render | 49.6, 50.8, 48.8, 50.6, 50.1 ms; min 48.8; median 50.1; p95 50.8; max 50.8 | Pass (≤ 3000 ms each) |
| Pan frames, whole atlas | n = 424; min 16.5; median 16.7; p95 16.7; max 33.4 ms | Pass (p95 ≤ 50, max ≤ 200) |
| Pan frames, zoomed detail | n = 254; min 16.5; median 16.7; p95 16.8; max 16.8 ms | Pass |
| Zoom frames, whole atlas | n = 270; min 16.5; median 16.7; p95 16.8; max 33.4 ms | Pass |
| Selection to details visible | 35.6, 37.6, 35.2, 37.2, 35.6 ms; median 35.6; p95 37.6; max 37.6 | Informational |
| Chapter focus | median 34.1 ms; p95 36.1; max 36.1 | Informational |
| Search on representative label | median 8.5 ms; p95 15.6; max 15.6; 1 hit | Informational |
| DOM / SVG inventory | 5,165 elements; 1,000 node buttons; 1,650 `path.edge`; 1,651 total SVG paths; 363 edge labels; 5 frames; 1,003 label elements (997 node labels + 6 choice options) | Pass |
| Canvas / layout | canvas 1440×757.38; workspace 1440×757.38; document scroll width 1440; banner 38 | Informational |
| Runtime errors | 0 page errors, 0 console errors, 0 request failures, 0 HTTP ≥ 400 | Pass |

### Mobile viewport emulation, 390×844 (production stylesheet, diagnostic only)

| Measurement | Result | Gate |
|---|---|---|
| Consent click → second rAF after render | 46.4, 47.2, 46.0, 46.7, 47.3 ms; min 46.0; median 46.7; p95 47.3; max 47.3 | Pass, diagnostic |
| Pan frames, whole atlas | n = 364; min 16.5; median 16.7; p95 16.8; max 16.8 ms | Pass, diagnostic |
| Pan frames, zoomed detail | n = 303; min 16.5; median 16.7; p95 16.7; max 16.8 ms | Pass, diagnostic |
| Zoom frames, whole atlas | n = 270; min 16.5; median 16.7; p95 16.7; max 33.3 ms | Pass, diagnostic |
| Selection to details visible | 35.7, 40.7, 37.3, 36.3, 37.3 ms; median 37.3; p95 40.7; max 40.7 | Diagnostic |
| Chapter focus | median 37.0 ms; p95 38.0; max 38.0 | Diagnostic |
| Search | median 30.7 ms; p95 32.5; max 32.5 | Diagnostic |
| Focused/zoomed labels | 20 sampled; 18/20 intrinsically unclipped (0.90); 11.5 px computed, 11.93 px effective; 3 long samples, 2 intrinsically clipped (36 and 38 characters); 8 boundary-clipped, not counted as intrinsic | Pass at the 18/20 threshold, diagnostic |
| Canvas / layout | canvas 390×617.66; workspace 390×617.66; document scroll width 390; banner 53.25 | Informational |
| Runtime errors | 0 page errors, 0 console errors, 0 request failures, 0 HTTP ≥ 400 | Pass, diagnostic |

The final screenshots were inspected: `desktop-overview.jpg` and
`desktop-detail.jpg` show the full 1,440 px canvas and the details panel;
`mobile-overview.jpg` and `mobile-detail.jpg` show the 390 px production
layout with the banner, the 617.66 px canvas, and the details overlay.

## Historical label legibility and interpretation

- **Whole-atlas overview (desktop, scale 0.1741):** all 1,000 node boxes render
  and all 1,003 label elements are visible; 37 node boxes report internal
  layout overflow at the fixed node size. Median effective text height is
  2.0 px, and node boxes render at roughly 21×9 px. Labels are not legible at
  whole-atlas fit.
- **Chapter focus (desktop, scale 0.4887):** the focused region shows 218
  visible nodes and 218 labels, with 205 fully inside the canvas. Effective
  label text is 5.62 px. Chapter navigation works, but chapter-focus labels are
  not reliably legible.
- **Zoomed detail (desktop, scale 1.037 after select + one `+`):** 56 visible
  nodes and 56 labels with details open; 30 nodes are fully inside the canvas.
  The 20-label sample is 11.5 px computed and 11.93 px effective with 0/20
  intrinsic clipping; min/median/max effective sizes are all 11.93 px. Ten of
  those labels cross the canvas boundary at this camera position; that is
  boundary clipping, not intrinsic label clipping. Details are visible,
  contain connector rows, and are reachable after selection.
- **Long-label clipping is real but limited in this sample.** Across the whole
  fixed 120×52 layout, 37/1,000 node boxes (3.7%) report internal overflow,
  including long labels and the three choice nodes. On desktop the 20-label
  detail sample happened to contain two long labels (35 and 36 characters), and
  both fit. On mobile the sample contained three long labels and two clipped:
  "Trace cross-region dispatch schedule" (36 characters) and "Confirm
  cross-region dispatch schedule" (38 characters). No node geometry or label
  text was changed to manufacture a pass.
- **Mobile is constrained by the camera clamp and viewport.** At the minimum
  camera scale of 0.12, only 448/1,000 nodes (449 label elements, 408 fully
  visible) intersect the whole-atlas canvas; chapter focus also sits at 0.12
  because the focused region cannot fit in 390 px. At detail scale 1.037, 18
  nodes and 18 labels are visible. The layout is now usable, but the overview is
  not a mobile-readable overview of the whole graph.
- The mobile detail panel overlays 90% of the viewport width. Detail selection
  and closing remain operable, but simultaneous map context is limited.

**Conclusion:** targeted navigation (search, chapter buttons, node selection,
details, then one zoom step) makes content usable at both profiles. At-a-glance
reading of all labels at overview or chapter focus is not supported by the
current design. Any label-density or level-of-detail work is a UX follow-up, not
evidence that the SVG renderer failed the performance gates.

## Asset sizes

| File | Raw | gzip |
|---|---:|---:|
| `generated/atlas-1000-data.js` (fixture) | 856,945 B | 31,740 B |
| `prototype/atlas-app.js` | 23,143 B | 6,848 B |
| `prototype/atlas-core.js` | 4,358 B | 1,525 B |
| `prototype/atlas.css` | 12,043 B | 3,122 B |
| `benchmark/scale/atlas-1000.html` | 1,014 B | 528 B |
| Total app path (fixture, app, core, CSS, entry HTML) | 897,503 B | 43,763 B |

`benchmark.css` (1,063 B) and `benchmark-chrome.js` (1,795 B) are benchmark
harness files, not part of a production load. No runtime dependency was added;
the benchmark uses the already-installed Playwright devDependency and Node's
built-in `http`/`zlib`.

## Historical gate evaluation

- Desktop (production stylesheet): **all seven gates pass.**
- Mobile viewport emulation (production stylesheet, 390×844): **all seven
  thresholds pass, diagnostic only.** The label gate passes exactly at 18/20
  because two representative long labels clip intrinsically.
- The previous production mobile layout defect is fixed and covered by the new
  scoped browser regression. The mobile profile is no longer a probe and is not
  counted as a separate unmodified page.

## Historical recommendation

Provisionally **retain the current custom SVG/DOM renderer for this synthetic
density**. At 1,000 nodes and 1,650 edges the desktop gates pass with wide
margins (consent-to-rendered ~50 ms against 3,000 ms; pan/zoom p95 ~17 ms
against 50 ms; no errors), and selection-to-details stays under 40 ms. Because
the measured SVG path meets the desktop gates, no Cytoscape.js or other
renderer comparison was performed. This is a provisional choice for this
synthetic fixture, not a capacity guarantee or an architecture commitment for a
larger real graph.

The historical follow-ups below were superseded by the stable-zoom slice. The
current product limitation is that a dense real graph needs spatial room and
cannot be read all at once at fit; it may be panned and zoomed without hiding
parts of the graph.

1. The old chapter-card and label-visibility behavior is retired. Do not treat
   the historical grouped overview as the current map or restore it as a zoom
   level.
2. The synthetic fixture remains a stress test. It does not prove real-game
   content correctness, usability for a complete-game graph, or legibility at
   mobile fit.

## Caveats

- The topology, labels, statuses, and detail text are synthetic and generated
  for this benchmark. They are not game content, not evidence, and not a claim
  about the real game graph or any real workflow.
- 1,000 nodes / 1,650 edges is a stress fixture, not a measured final graph
  size. The result should not be read as a capacity guarantee for a larger
  whole-game graph.
- Measurements come from one macOS arm64 machine and headless Chromium. Font
  rendering, CPU, and headless scheduling differ on other systems and on
  physical devices.
- Mobile numbers are viewport emulation. Pan and zoom input in both profiles
  used Playwright mouse drag and wheel events against the same pointer handlers;
  the mobile context enables touch metadata, but this is not a real touch,
  gesture, iOS Safari, latency, or GPU measurement on a phone.
- The historical test counts above describe an older renderer. Current test
  counts are recorded in [project status](../STATUS.md) and the [stable zoom
  map slice](overview-lod-slice.md).
