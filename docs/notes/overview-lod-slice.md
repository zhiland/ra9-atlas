# Overview / LOD slice — chapter-level story map

Checked: 2026-10-20. Scope: the shared PoC4 renderer in `prototype/atlas-app.js`,
`prototype/atlas-core.js` and `prototype/atlas.css`. This is a UX and rendering
slice, not new game evidence. No fixture label, threshold, or data claim was
changed to make a check pass.

## What changed

- **Whole-story opening.** A whole-atlas fit now opens on screen-space chapter
  cards, one per chapter. The cards are laid out in CSS pixels, so chapter names
  stay 16 px on desktop and 14.5 px at the tested 390 px viewport regardless of
  the world-camera scale.
- **Progressive disclosure.** `ATLAS_CORE.lodFor` returns `overview` only for
  the whole atlas below scale 0.52. From 0.52 to 0.8 the same surface shows
  event boxes without event text (`structure`); at 0.8 and above it shows event
  labels (`detail`). A focused chapter skips the card overview so a narrow
  mobile chapter fit still shows event boxes.
- **Fit bounds.** `ATLAS_CORE.fitBounds` fits the full map or one chapter frame
  without a minimum-scale clamp. The world camera still has a 0.02 pan/zoom
  minimum. Full-map and chapter fits are measured against the actual canvas.
- **Cross-chapter representation.** Every overview row is derived from real
  `data.edges` entries by `crossChapterLinks`. A single connector row exposes
  the actual edge index, label, evidence status, unknown text and sources, and
  opens that edge (`?edge=N`) on its real later endpoint. A multi-edge group is
  navigation-only, says explicitly that it is not an aggregate causal relation,
  and expands to the real edge indices. No synthetic summary edge is created.
- **Spoiler overlay.** The map is rendered beneath the cover; the shell is
  `inert` and `aria-hidden` while locked. Consent is remembered in
  `localStorage` (`ra9-atlas.consent.v1`) and can be cleared with the Spoiler
  tool. Details still close by both the X button and Escape.
- **Mobile overview.** The overview is a scroll container. At overview LOD the
  canvas uses `touch-action: pan-y` and does not capture a camera drag, so
  vertical touch scrolling is not blocked by the old canvas pointer handler.

## Verification

`npm test` passes the three data validators, 38/38 unit checks and 48/48
Chromium checks. The browser suite serves the app from localhost; it does not
open a local file URL:

- 15 checks in each of the three palettes: cover and map beneath it, chapter
  legibility, overview-to-actual-edge evidence, LOD transitions, desktop fit,
  chapter focus, prerequisite gates, hypothesis navigation, edge-focused
  overview links and hashes, close paths, history, keyboard search, contrast,
  remembered consent and deep links.
- 3 scoped checks at 390×844: overview layout, card legibility and scrolling,
  full-map and chapter fit, overview drag suppression, and contained detail
  selection.

`npm run bench:scale` still runs the deterministic synthetic fixture (1,000
nodes / 1,650 edges; seed 20261019) and all seven desktop gates pass. Mobile
emulation also passes its diagnostic thresholds. The LOD follow-up measured:

| Measurement | Desktop 1440×900 | Mobile emulation 390×844 |
|---|---|---|
| Opening LOD / scale | overview / 0.1772 | overview / 0.0428 |
| Chapter cards / font | 5 / 16 px | 5 / 14.5 px |
| Rendered event labels at overview | 0 of 1,003 | 0 of 1,003 |
| Frames fully inside whole-map fit | 5 / 5 | 5 / 5 |
| Focused frame inside chapter fit | true | true |
| Overview scroll area | 736 → 915 px | 618 → 1,381 px |
| Detail LOD / scale after select + `+` | detail / 1.037 | detail / 1.037 |
| Focused label sample unclipped | 20/20 | 18/20 |
| Pan / zoom frame p95 | 16.8 / 16.7 ms | 16.7 / 16.7 ms |
| Runtime errors | 0 | 0 |

The camera-pan timing sample now starts at structure LOD, one zoom step above
the scrollable overview, because the overview is no longer a pan surface. Gate
thresholds are unchanged. The synthetic fixture groups 7 chapter pairs into
aggregate crosslink rows; those rows are structurally navigation-only.

Current benchmark artifacts are in `benchmark/scale/out/`
(`results.json`, `desktop-overview.jpg`, `desktop-detail.jpg`,
`mobile-overview.jpg`, `mobile-detail.jpg`). The opening cards and detail panel
were inspected in those images.

## Limits

- The synthetic benchmark is not game content and does not prove gameplay
  correctness, real-graph capacity, or full-game coverage.
- Mobile results are desktop Chromium viewport emulation at 390×844. They do
  not prove physical-phone, Safari/iOS, GPU, or real touch-gesture behavior; the
  scroll assertion uses emulated layout plus a pointer-drag suppression check.
- The real slice has one actual connector per chapter pair, so aggregate-row
  expansion is exercised by the synthetic fixture, not by a claim in the game
  data.
- Because the map now renders beneath the spoiler cover, the benchmark's
  consent timing measures cover removal, not initial graph construction. It is
  retained only as an interaction diagnostic; the earlier graph-render timing
  is historical.
- At the synthetic density 37/1,000 fixed-size node boxes still overflow
  internally, including long labels and choice options. Event labels are
  intentionally hidden at overview and structure LOD; chapter focus labels are
  not legible until detail zoom.
- The mobile details panel still covers most of the map; the map stays mounted
  but is not simultaneously readable.

See [graph-scale-spike.md](graph-scale-spike.md) for the earlier benchmark and
[STATUS.md](../STATUS.md) for project status.
