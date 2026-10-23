# rA9 Atlas — current checkpoint

Updated: 2026-10-23. Stage 1 source review is complete for the bounded Hostage
pilot. Stage 2 preparation is implemented. Production schema, runtime ownership,
permalink migration, full chart inventory and hosting remain open.

## Product state

The static PoC4 map contains **102 nodes and 93 edge claims in five regions**.
The Hostage inventory accounts for **33 boxes, 40 labels and 36 pictured connectors**.
Its option-specific model contains **37 claims: 32 traced and 5 uncertain**.
Both approach-to-FAIL origins remain uncertain. The other four regions are partial.
No gameplay transition is verified. Coverage does not imply full-game completeness.

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
No automatic merge or site publication is authorized.
The untracked user file `docs/notes/obsidian-update-draft.md` remains unchanged
with SHA-256 `f0a9eb2733ba7b3bcd886852dbd30fe093912f50351b1dd16a7eacae37998833`.

Full baseline `npm test` passed. Final verification results and new draft PR
checkpoints are recorded in the [repository review](notes/repository-review-2026-10-22.md).
The restricted sandbox cannot bind localhost sockets; those checks run with
appropriate local execution permission. Mobile tests use Chromium viewport
emulation. Safari, physical touch, assistive technology and gameplay are unverified.

## Next bounded work

1. Review sources for the [partial A New Home draft](notes/anewhome-packet-draft.md).
   Its 10 chart nodes, 9 local edges and 2 supplementary clues reconcile with the
   current ATLAS. Extraction uses inherited public evidence, not fresh source access.
   Independent review is pending and the merge gate remains blocked.
2. Use that second packet to decide canonical data ownership and reproducible
   generation. Preserve `?edge=N` compatibility before migrating permalinks.
3. Reconcile the chapter/character-chart inventory before larger content batches.
4. Resolve source-derived publication boundaries before opening the merge/release gate.

Check shared account capacity before each package. Below 20% remaining, preserve
progress and defer a large package. Raw logs and downloaded evidence stay local.
