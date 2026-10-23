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
The browser-path setting now belongs to job-level `env`, where the runner context
is available. This workflow defect escaped the earlier local code-review pass.
