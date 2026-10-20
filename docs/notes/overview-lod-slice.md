# Stable zoom map slice

Checked: 2026-10-20. The renderer keeps one spatial graph at every zoom level.
This corrects the earlier overview/LOD experiment, which hid events and swapped
in floating labels and grouped summaries. No nodes, edges, evidence claims, or
causal relations were added in this renderer change.

## Behavior

- Every real event box, its full label, every real connector path, labeled
  connector, and chapter region stays in the same world at all camera scales.
- Zoom and pan change only the world camera transform. Labels stay inside their
  event boxes and scale with them; there are no scale thresholds, representative
  subsets, screen-space text overlays, anonymous event dots, summary groups, or
  pseudo-connectors.
- Whole-map Fit frames all chapter regions. Chapter focus fits its selected
  region while the full graph remains mounted. Pan reveals viewport-clipped
  content; Fit restores the selected bounds.
- The zoom control reports camera percentage only. It does not name a semantic
  zoom level. Far-zoom text is naturally small; the 1,000-node fixture is a
  stress test, not a claim that all labels are readable at once.
- Spoiler consent, evidence/details, search, deep links, chapter navigation,
  X/Escape close behavior, and the gray default theme remain available.

## Static layout follow-up

Checked: 2026-10-20. This is geometry-only spacing, not a cosmetic restyle or a
change to graph content. A New Home keeps its compact two-column flow; the key
and talk boxes move 6px apart in opposite directions to fit their caption
between them. The canvas grows to 3050×1080, Stormy Night uses five horizontal lanes at x = 620,
880, 1140, 1400 and 1660 with 190px boxes and a 260px pitch, and Battle for
Detroit — Kara separates checkpoint and meeting lanes at x = 1980, 2230, 2480
and 2740. Stormy Night is now 1320×860; Kara is 1060×900. The Home/Stormy gap
stays 25px and the Stormy/Kara gap grows to 40px.

Connector captions in Stormy Night and the Kara checkpoint area were moved onto
their real path runs and now clear node boxes and one another. The A New Home
`TALK WITH ALICE → ALICE GIVES KARA A KEY` caption fits in the opened gap and
remains within 80 world pixels of its connector.

## Verification

`npm test` passes the validators, 45 contract checks, 41 unit checks, 4 stable
map checks, 10 stable-zoom checks, 8 static-layout checks, and 52 browser
checks. The stable-zoom suite
compares all 38 sample node IDs, 42 edge paths, original labels, connector
labels, and world-space geometry at fit, far, intermediate, and close scales. It
also verifies the full 1,000-node / 1,650-edge synthetic inventory at several
scales. Browser tests cover desktop, all three palettes, consent, search,
source/evidence inspection, cross-chapter navigation, history, hash links,
X/Escape, and 390×844 Chromium viewport emulation.

The deterministic 1,000-node benchmark passes its performance, inventory,
interaction, stable-world, and node-text containment gates. Desktop fit scale
was 0.1639; camera pan and zoom frame p95 were 16.8 ms. At mobile emulation
(390×844), fit scale was 0.0428 and pan/zoom p95 was 16.7/16.8 ms. All 1,000
nodes, 1,650 paths, and 1,006 label elements remained mounted. The three
synthetic choice boxes have additional world-space height for their title and
two options, and all generated text fits its node. Label readability at either
fit scale is not claimed. Mobile results are emulation, not physical-device
testing.

Fresh localhost Playwright screenshots are in `/private/tmp/` for review:
`ra9-stable-overview-fit.png`, `ra9-stable-overview-far.png`,
`ra9-stable-overview-mid.png`, `ra9-stable-overview-close.png`,
`ra9-stable-mobile-fit.png`, and `ra9-stable-mobile-kara.png`. These images are
local QA evidence and are not committed.

## Limits

The game graph remains a selected, guide-backed sample: 3 chapter regions, 38
events, and 42 connectors. Coverage is partial and no transition is verified
in-game. Synthetic benchmark labels and topology are not game content. The
The A New Home relationship-threshold caption now clears its adjacent boxes.
Physical phones, Safari/iOS, and real touch input were not tested.

The previous LOD screenshots and benchmark discussion are historical. This
stable-map behavior is now the active PoC4 implementation.

See [graph-scale-spike.md](graph-scale-spike.md), [PoC4 coverage](poc4-coverage.md),
and [project status](../STATUS.md).
