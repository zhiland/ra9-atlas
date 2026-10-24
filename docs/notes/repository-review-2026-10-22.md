# Repository review and cleanup — 2026-10-22

Scope: the current repository, open PR stack, controlled runner and Hostage
preparation gate. The code-review fixed point was `2576a95`; the initial diff
was `git diff 2576a95...b75ea04`. Separate reviewers checked documented standards,
requirements and source evidence. The executor applied fixes and requested follow-up checks.

## Standards

**One finding, fixed: public input substitution (P1).** Anonymous public SHA
confirmation preceded a local `git archive`. Local replacement refs could
substitute an unpublished commit. Uncommitted export attributes could insert
private tag names. Both were reproduced with fabricated data.

The corrected exporter reads raw objects with fixed `/usr/bin/git`, a clean
environment, replacement refs and lazy fetching disabled, and commit/tree/blob
hash verification. It constructs the archive without local attributes or ref
formatting. Three regressions cover replacements, attributes and Git overrides.
The follow-up found no new blocking issue. Duplicate paths fail before extraction.

## Spec

**Two findings, fixed (P2).**

1. Patch export used `splitlines`, which splits bare CR and Unicode separators.
   Those characters are content in Git hunks. The exporter now splits only LF.
   Round-trip tests cover CR, CRLF, VT, FF, NEL, LS, PS and missing final LF.
2. Packet validation required approved source review to open the merge gate.
   Source review and publication readiness are separate. Approved-but-blocked
   is now valid, with `reviewReady=false` and `--require-review` exit 2.

The follow-up confirmed both fixes. Standards: one finding closed. Spec: two
findings closed. These axes do not replace independent source review.

## Source review

The [Hostage review](hostage-packet-source-review.md) inspected the primary image,
alternate image and live guide passages. Its initial changes request is closed
by a separate follow-up. Cold-to-FAIL is uncertain because selected events and a
shared bus do not establish its direct origin. Shazoo is pre-release/demo-era.
FAIL-to-JUMPS is traced directly in the primary Steam image.

All node/edge IDs, endpoints, options, legacy indices and geometry are preserved.
The atlas remains 102 nodes/93 claims. Hostage has 32 traced/5 uncertain claims.
The packet has approved source review and a blocked publication gate. Rights,
source independence, full-game coverage and gameplay verification remain separate.

## Repository maintenance

Seven areas were checked: code standards, requirement fidelity, evidence,
documentation, tests, dependency setup, and Git/publication state.

- README now gives local startup, commands, evidence limits and project navigation.
- [The docs index](../README.md) identifies current authority and historical records.
- STATUS is a concise continuation checkpoint. The handoff links the current review.
- Historical plans and isolation templates retain their evidence, with explicit
  supersession notices. No research archive or other worktree was deleted.
- The browser-test comment no longer describes retired semantic LOD behavior.
- Node 22.23.1/npm 10.9.8 were used. The lockfile records Playwright 1.64.1,
  requiring Node >=20. No runtime dependency exists. No dependency upgrade or
  vulnerability audit was performed without a demonstrated need.
- PRs #19–21 were checked live and remain open/unmerged. The corrected runner is
  in draft [PR #22](https://github.com/zhiland/ra9-atlas/pull/22), head `7f89e88`,
  based on PR #21. No PR was merged and no site was published.
- The original untracked Obsidian draft is excluded. Its SHA-256 remains
  `f0a9eb2733ba7b3bcd886852dbd30fe093912f50351b1dd16a7eacae37998833`.

## Verification

- Corrected runner regression suite: 18 passed. Preflight suite: 8 passed.
- Corrected synthetic end-to-end runner: 51/51 passed, real search/read/write,
  fixed free relay and native/OS boundary checks. Local report:
  `/private/tmp/ra9-opencode-run-t586f43i/report.json`.
- Full final `npm test`: validators, 84 contract, 43 unit, 4 map, 10 stable zoom,
  12 layout, 56 packet and 58 browser checks passed.
- `git diff --check` passed. Local Markdown link verification excludes external
  reachability, anchors and plain-text research cache paths.

The restricted Codex sandbox denied localhost binding. The affected suites ran
with local execution permission, not weakened assertions. The test harness uses
Chromium and mobile viewport emulation. No physical-device, Safari, assistive
technology, gameplay or general sandbox-escape certification is claimed.

## Next package

Prepare a partial A New Home packet through the corrected runner from existing
public evidence. Keep it a draft with separate source review and a blocked merge
gate. The packet does not migrate runtime ownership. Then decide canonical
versioned data generation and permalink compatibility before larger content batches.
