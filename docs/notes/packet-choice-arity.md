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

Eighteen synthetic regressions cover default/version compatibility, 2/3/4-row
groups, malformed choices, option zero/last index, invalid indices, external
choices, exact runtime reconciliation and the blocked CLI review gate. The new
suite failed before the change on unsupported 1.1, then passed after it. No new
gameplay claim or leisure packet is published.

## Standards

Pending fixed-point review.

## Spec

Pending review against the acceptance above.

## Full verification

Pending full npm and hosted CI.
