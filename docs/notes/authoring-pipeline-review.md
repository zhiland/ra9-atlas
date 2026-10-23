# Authoring, CI and inventory package — 2026-10-23

Base: `f260060d455bb0b52976537e118f003e94e04229` (PR #25).
Review command: `git diff f260060...HEAD`, plus uncommitted package files during review.
The authoring decision is [ADR 0002](../adr/0002-canonical-atlas-source.md).

## Scope and evidence

- Canonical versioned JSON and the compatibility ledger preserve the complete
  previous atlas object: 102 nodes and 96 records, including two withdrawals.
  A direct deep-equality check against the base browser data passed before generation.
- The source-index inventory reconciles 32 chapter rows and 39 headings. An
  independent reviewer rechecked both live index texts, Opening, 23 null character
  entries, and the distinct Kara Leaving Detroit / Kara Captured associations.
  No concrete metadata discrepancy was found. This is not a complete game-chart census.
- OpenCode prepared the CI patch through the controlled runner from the public
  base SHA: 49 checks passed and its server stopped. Parent review replaced mutable
  action tags with the verified immutable release SHAs and corrected unsupported
  documentation claims about tokens, logs, network and Linux success.
- The first combined generator task timed out at 240 seconds. The runner failed
  closed, stopped its server and exported no accepted patch. A narrower retry
  requested only the generator; raw task logs stay local.

## Standards

Independent review identified a Linux portability blocker in the newly enabled
mocked preflight test: it used the macOS-only `/private/tmp` path before reaching
its intended mocked failure. The test's scratch root is now controlled by its
fixture; the actual isolation runtime and macOS boundary are unchanged.
Final code-review findings and execution results are recorded below after checks.

## Spec

Independent review checks lossless generation, compatibility identities, nonwriting
check mode, strict format admission and inventory/CI scope separately from source
truth. Source approval, publication rights, hosting and PR merge remain separate gates.

## Verification boundary

Hosted Linux success must come from an actual Actions run. Local browser checks
use Chromium and viewport emulation; Safari, physical touch, assistive technology
and gameplay remain unverified. Both reviewed preparation packets retain blocked
publication gates. No merge or site deployment is part of this package.

## Final review follow-up

Standards axis: two findings resolved. The Linux fixture fix passed 8 preflight
checks. Generator staging now uses a fresh owned adjacent directory, so cleanup
cannot remove a pre-existing PID-named file; an executed regression preserves its bytes.
No other concrete standards finding or material smell was reported.

Spec axis: one additional lossless-export edge case resolved. A JSON `__proto__`
key would become a prototype setter in a JavaScript object literal. The generator
now rejects that reserved key recursively before writing, with an explicit
regression and documented admission boundary. The current graph has no such key.
The duplicate file-preservation finding above was also raised by the spec reviewer.

Both external generator attempts timed out after 240 seconds, stopped their
servers and exported no accepted patch. Codex implemented the generator and its
20 focused tests, then submitted it to both independent code-review axes.
The accepted external implementation contribution in this package is the CI patch.

Source-index review found no metadata discrepancy within its bounded text scope.
Standards: 2 findings resolved. Spec: 2 findings resolved (including the shared
staging finding). No unresolved blocker is known in the reviewed package.

## Hosted workflow admission correction

The first hosted attempt rejected `runner.temp` in workflow-level `env` before
creating a job. GitHub annotation: `Unrecognized named-value: runner` at line19.
A job-level `env` retry was rejected for the same reason. The setting now uses
`$RUNNER_TEMP` in the first shell step, persisted through `GITHUB_ENV`; it does
not evaluate a runner expression before a runner exists. This workflow defect escaped the earlier local code-review pass.

## Executed local checks and preservation

Final full `npm test` passed:20 build, inventory regression,94 contract,44 unit,
4 map,10 stable zoom,12 layout,59 packet and62 browser checks. Mocked Python suites
passed18 runner and8 preflight tests. `git diff --check` passed;270 local Markdown
links resolved before the final status links were added.
The pre-existing untracked `docs/notes/obsidian-update-draft.md` remains unchanged
(SHA256 `f0a9eb2733ba7b3bcd886852dbd30fe093912f50351b1dd16a7eacae37998833`).
Draft [PR #26](https://github.com/zhiland/ra9-atlas/pull/26) targets PR #25's branch.
The graph has no semantic change. No PR was merged and no site was deployed.

## Hosted font regression

The admitted Ubuntu run reached Node tests and exposed a real renderer defect:
`inv_father` wraps to two lines with the Linux fallback font, while a 36px action
button still reserves vertical padding. Stable-zoom bounds checks failed; they
were not relaxed. Short Hostage action buttons now use zero vertical padding and
center the original label with flex layout. Graph coordinates, boxes, labels and
font size are unchanged. A new wide-monospace regression forces the two-line case;
all11 stable-zoom checks pass locally. Hosted execution must confirm the fix.

CSS follow-up review caught the initial flex-row side effect. The final rule
uses a centered column with stretched children; the regression checks horizontal
text containment and sublabel stacking as well as vertical bounds.

## Verified implementation checkpoint

Implementation `593b589c2a2f15004437f9770f8d1502637aa9f2` passed the full local
npm suite and [hosted Ubuntu CI](https://github.com/zhiland/ra9-atlas/actions/runs/39908393426):
Node22, Chromium, runner18 and preflight8, including the fallback-font regression.
The final documentation checkpoint does not change tested implementation files.
The CSS reviewer separately closed the column/wrapping finding at this commit.
Standards axis:3 findings resolved, none open. Spec axis:2 findings resolved,
none open (the staging issue was shared). Hosted workflow-admission corrections
are documented above and all hosted steps now pass.
