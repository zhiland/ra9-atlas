# Preparation packet 1.1: choices with more than two options

Date: 2026-10-23. Base: `bee077dd2ca086a412ad099b46e00134665ba067` (PR #30).

## Problem and acceptance

The next Painter source slice contains groups with three and four visible rows.
The preparation validator currently requires exactly two options for every choice.
Do not split such a group into fabricated binary choices or silently change 1.0.

Add explicit preparation version 1.1. It permits at least two unique, nonempty
string options. Version 1.0 retains exactly two. Default draft creation and the
exported default version stay 1.0. Apply the version to both chart nodes and
supplementary external nodes. Option indices remain zero-based and bounded by
the declared array. Reject unsupported versions and malformed options/indices.

This changes preparation validation only. Existing packets, atlas data, renderer,
identity ledger, generated artifact, geometry and URLs must stay byte-identical.
Exact optional ATLAS reconciliation still compares the full option arrays. The
current runtime remains binary. A valid 1.1 packet does not make a three/four-row
runtime node supported. Runtime migration requires a separate design and tests.
Source review, publication and gameplay gates remain unchanged. No Painter leisure
packet or source approval is created by this schema prerequisite.

## Implementation and verification

Controlled OpenCode from public `bee077d` changed only the preparation validator.
All 49 boundary checks passed and its private server stopped. Codex inspected
the patch and ran `git apply --check` before applying it. The version is threaded
to chart and supplementary nodes, with no mutable global version state.

Nineteen synthetic regressions cover default/version compatibility, 2/3/4-row
groups, malformed choices, option zero/last index, invalid indices, external
choices, exact runtime reconciliation and the blocked CLI review gate. The new
suite failed before the change on unsupported 1.1, then passed after it. No new
gameplay claim or leisure packet is published.

## Standards

Review at `git diff bee077d...446ff29` found one conflicting guide statement
that still called 1.0 the only version. It now identifies 1.0 as the default and
requires explicit 1.1 selection. No implementation or material smell finding.
A separate follow-up confirmed the wording fix.
Standards: one documentation finding resolved, none open.

## Spec

Review found a missing options comparison for supplementary external nodes
during optional ATLAS reconciliation. A new fixture reproduced the bypass with
changed labels/order in 1.0 and an added third option in 1.1. Codex added the same
full-array comparison used for chart nodes. Matching external choices still pass.
The regression failed before the fix and passed after it.
Spec: one finding corrected, follow-up pending.

## Full verification

Full npm passed: existing 20 build, inventory, 94 contract, 44 unit, 4 map,
11 zoom, 12 layout, 59 packet, 6 Shades packet, 21 Shades runtime, 6 Painter
packet, 21 Painter runtime and 72 browser checks, plus 19 new arity regressions.
Existing packets, data and runtime are byte-identical to base `bee077d`.
Hosted CI is pending.
