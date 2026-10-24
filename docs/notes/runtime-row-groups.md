# Explicit source row groups in runtime contract 1.1

Date: 2026-10-24. Base: leisure preparation checkpoint after PR #32.
Decision: [ADR 0003](../adr/0003-explicit-source-row-groups.md).

## Acceptance

Add explicit `meta.contractVersion: '1.1'` support while leaving production data
at 1.0. Only `kind: 'choice', rowGroup: true` opts into two-or-more source rows.
Unflagged choices retain exactly two options and their old DOM/anchor geometry.
Row labels are unique nonempty strings. A row-group flag on another kind, an
unsupported version, malformed rows or insufficient box height must fail.

The new module fixes a 24px heading and divides the remaining inner box equally.
Each row needs at least 32px. One-pixel borders are accounted for. Renderer and
validator share row bounds and anchor calculation. Automatic and authored option
paths must identify the actual row, including aligned-column paths. Common exits
remain whole-node exits without an option index. Legacy anchors stay exact.

Details and accessible names identify source row groups, without asserting player
agency. Preserve escaping, full labels, search, source evidence, numeric links,
spoiler handling, all old graph objects and all compatibility fences. Support all
three standalone entries and the synthetic benchmark entry. No new game nodes,
packet claims, source certainty or publication approval are part of this package.

## Implementation

OpenCode's free route exhausted its quota during the previous package. No new
external run or paid fallback is used. Codex implements the shared geometry,
opt-in validation, DOM row placement, conditional captions and classic-script
loading. Existing map data and packets remain unchanged.

## Standards

Initial review found one P2: an overlapping-column route crossed its source
interior. Shared routing now uses an outside corridor. The follow-up at
`75d729c` closed it. Standards: zero open findings.

## Spec

Initial review independently found the same visible-route defect. The follow-up
at `75d729c` confirmed the fix. Spec: zero open findings.

## Verification

Fourteen unit/contract regressions cover legacy anchors, 3/4-row geometry, versions,
malformed groups, zero/last indices and authored-path row matching. Six browser
fixtures exercise three themes at desktop/mobile widths with long labels and
literal markup. They compare actual row centers to SVG starts, include aligned
columns and common exits, search/deep links/details and escaping. These fixtures
are synthetic and are not adopted game content. Full npm passed, including these 14 unit/contract and six browser fixtures,
all existing packet and source/layout fences, and the unchanged 72 main browser
scenarios. Production data, all packets and generated atlas are byte-identical
to base `dd2f2bb`.

The browser regression first reproduced the endpoint-interior failure. After the
fix, it samples the actual SVG path against both endpoint interiors. Automatic
paths use outside corridors for overlapping columns. Invalid authored routes and
explicit lanes fail validation. Legacy routes remain unchanged.

[Ubuntu CI](https://github.com/zhiland/ra9-atlas/actions/runs/40068397568)
passed at `75d729c`, including full Node/Chromium, 18 runner regressions and
8 mocked preflight checks. This does not certify native macOS isolation, Safari,
physical touch, assistive technology or gameplay. Draft PR #33 remains unmerged.
