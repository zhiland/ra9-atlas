# rA9 Atlas — current checkpoint

Updated: 2026-10-23. Stage 1 source review is complete for the bounded Hostage
pilot. Stage 2 preparation is implemented. Canonical JSON authoring and deterministic generation now preserve the existing sample.
Full-product schema expansion, permalink output migration, actual game-chart census and hosting remain open.

## Authoring package checkpoint

Draft [PR #26](https://github.com/zhiland/ra9-atlas/pull/26) adds canonical JSON,
lossless browser generation, compatibility checks, the partial source-index
inventory and hosted CI. All local checks pass: 20 build tests, inventory regression,
94 contract, 44 unit, 4 map, 10 stable zoom, 12 layout, 59 packet, 62 browser;
Python runner18 and preflight8. Independent source-index review found no discrepancy.
Both code-review axes resolved their findings. The first hosted attempt exposed a
workflow-context error, corrected in `5efdc27`; hosted test execution is pending.
See [package review](notes/authoring-pipeline-review.md). No PR was merged or site deployed.

## Product state

The static PoC4 map contains **102 nodes and 94 active connectors in five regions**.
It retains 96 edge records, including two withdrawn claims for old references.
The Hostage inventory accounts for **33 boxes, 40 labels and 36 pictured connectors**.
Its option-specific model contains **37 claims: 32 traced and 5 uncertain**.
Both approach-to-FAIL origins remain uncertain. The other four regions are partial.
No gameplay transition is verified. Coverage does not imply full-game completeness.

The corrected [A New Home selection](notes/anewhome-packet-source-review.md) has
11 chart nodes and 10 relations, two separate guide clues and one key condition.
The source reviewer approved the corrections after reinspection. The publication
gate remains blocked. The old compressed trash link and wrong room-to-talk link
are withdrawn records at indices 2 and 6; replacements append at 93–95.
Old URLs open explicit notices and replacement links. No old endpoint or index
was retargeted. See [implementation review](notes/anewhome-correction-implementation.md).

The approved direction remains a complete source-audited map, with an explicitly
incomplete preview allowed. Use one stable map world and camera-only zoom.
Desktop is primary, mobile support is required. The first release uses static
hosting without a backend, images, analytics or advertising. The provider remains
undecided. See [specification](spec.md) and [roadmap](ROADMAP.md).

## Review and corrections

The [independent Hostage review](notes/hostage-packet-source-review.md) identified
pre-release provenance and an unsupported option-origin reading. The corrected
Cold candidate is uncertain at the same index 92. The Friendly candidate stays
uncertain at index 89. FAIL-to-JUMPS stays traced at index 90, now supported by a
continuous connector in the primary Steam image. All IDs, endpoints, options,
legacy indices and geometry remain unchanged.

The packet source review is **approved** after a separate correction check.
Its merge gate remains **blocked** for the unresolved source-derived publication
decision. The saved-cop meeting prerequisite is guide-reported, not gameplay-verified.
Source agreement is not proof of independent research. No later cop outcomes were added.

The [repository review](notes/repository-review-2026-10-22.md) fixed three defects:
public Git input substitution, patch export splitting non-LF text, and source
approval forcing the merge gate open. README and the documentation index now
show current usage. Superseded plans retain explicit historical labels.

## OpenCode

Use only the [controlled runner](opencode-runner.md). Independent review found
local Git replace/attribute substitution could affect the old archive exporter.
The corrected exporter checks raw Git object hashes in a clean environment.
Older source backups retain that defect and must not be used for new tasks.

The corrected runner passed 51 synthetic end-to-end checks and 18 regression
tests. Eight preflight tests pass. The earlier public-commit smoke passed 49
checks; its patch was not applied. Seatbelt remains deprecated and host/version
specific. OpenCode sees prepared public commits only and exports reviewed patches.

## Git and verification

PRs #19–21 were rechecked and remain open/unmerged at `0ddb64d`, `26c6e19`,
and `2576a95`. The corrected runner is in draft [PR #22](https://github.com/zhiland/ra9-atlas/pull/22)
at `7f89e88`, based on PR #21. Runner changes are isolated from this
source-review/cleanup package. Draft [PR #23](https://github.com/zhiland/ra9-atlas/pull/23)
saves that package at `78d94ea`, based on #22.
The A New Home draft is saved in [PR #24](https://github.com/zhiland/ra9-atlas/pull/24),
implementation checkpoint `3287787`, based on #23. Its original extraction was a draft. The later source-correction package is
described above.
The source correction is in draft [PR #25](https://github.com/zhiland/ra9-atlas/pull/25),
implementation checkpoint `d649e88`, based on #24. Both bounded source reviews
are approved; both publication gates remain blocked.
No automatic merge or site publication is authorized.
The untracked user file `docs/notes/obsidian-update-draft.md` remains unchanged
with SHA-256 `f0a9eb2733ba7b3bcd886852dbd30fe093912f50351b1dd16a7eacae37998833`.

Final correction `npm test` passed: 94 contract, 44 unit, 4 map, 10 stable zoom,
12 layout, 59 packet and 62 browser checks. Both packet validators passed.
Old-link notices and replacement navigation were visually inspected in desktop
Chromium; mobile-width interaction is regression-tested. Final verification results and new draft PR
checkpoints are recorded in the [repository review](notes/repository-review-2026-10-22.md).
The restricted sandbox cannot bind localhost sockets; those checks run with
appropriate local execution permission. Mobile tests use Chromium viewport
emulation. Safari, physical touch, assistive technology and gameplay are unverified.

## Next bounded work

1. Use the canonical authoring bundle and compatibility ledger for future graph edits.
   Both reviewed packets retain blocked publication gates; generation adds no approval.
2. Start the next bounded source packet from the [partial inventory](notes/chapter-inventory-reconciliation.md).
   It reconciles 32 chapter rows and 39 source headings, not actual complete game-chart boundaries.
   Resolve character and subdivision gaps before claiming those charts complete.
3. Preserve withdrawal history and `?edge=N` behavior when extending the sample-specific validator.
4. Resolve source-derived publication boundaries and select hosting before release.

Check shared account capacity before each package. Below 20% remaining, preserve
progress and defer a large package. Raw logs and downloaded evidence stay local.
