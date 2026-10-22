# Sol handoff — ra9-atlas

Prepared: 2026-10-22 from chapter-preparation commit `26c6e19`. Recheck the
branch and PR state at the start of the next work package; this document is a
checkpoint, not a live status feed.

## Current continuation update — 2026-10-22

Read [STATUS](STATUS.md) and the [repository review](notes/repository-review-2026-10-22.md)
first. The earlier source-review-pending statements below are historical.
The Hostage source review approved the corrected packet, with 32 traced and
5 uncertain claims. Both approach origins remain uncertain. FAIL-to-JUMPS is
traced directly in the primary Steam image. Its publication gate remains blocked.
The validator now permits approved source review with a blocked merge gate.

Runner checkpoint `7f89e88` fixes public export against local Git replacement
and attributes, and preserves non-LF text in exported patches. It passed 18
regressions and repeated 51 synthetic end-to-end checks. Use this corrected
runner, not the old b75ea04 archive. Branch/PR states remain dated snapshots.

## Model and transition decision

Use **GPT-6.1 Sol at the client's default reasoning effort** for bounded chapter
packets, validation, implementation, and review follow-ups. Raise effort for a
specific hard task when its result needs deeper analysis. Use **Astra** for a
cross-package decision that requires sustained judgment across conflicting
sources, product constraints, code and rights, or when a Sol attempt cannot
resolve a material ambiguity after a focused review. Model choice never replaces
independent source review, tests, or owner approval for publication. This is a
workflow recommendation, not a promise about account limits, latency, or price.
See [official OpenAI model guidance](https://learn.chatgpt.com/docs/models#choosing-astra-sol-and-luna).

Handoff gate: finish a clean, tested chapter-preparation commit before starting
the next package. Commit `26c6e19` meets the branch checkpoint; its PR
description reports `npm test` passing. Recheck the tests and review state
before relying on it for a new package. PR review, independent source review,
and packet merge approval remain separate gates.

## Product and evidence boundary

The approved goal is a complete, source-audited guide to every identified
chapter and character chart, with cross-chapter consequences. An explicitly
incomplete public preview is allowed when coverage gaps are visible. The
current PoC is a static sample, not the full guide. Keep the map as the main
surface: one stable world, camera-only zoom, authored left-to-right branches,
and compact chart nodes. Use the Hostage chart as the visual template. Do not
replace the map with a card sequence or hide branches at low zoom.

Separate four claims: chart coverage, source support for a relationship,
in-game verification, and interface behavior. A chart connector, a guide
statement, and a gameplay test are different evidence. Keep unknowns and actual
source conflicts explicit. Attach each condition only to the edge it governs.
No whole-game gameplay check or owner-performed all-node review is required.
Structural validation does not approve sources or reuse rights.

Project documents and UI copy are in English. Owner-facing chat is concise
Russian. The MIT license covers original code and documentation only. Do not
copy private vault content, credentials, agent logs, or local research caches
into the public repository. The [controlled OpenCode runner](opencode-runner.md) passed its macOS
boundary, native-policy, synthetic provider and public-commit smoke checks on
2026-10-22. Use that runner with prepared public content for external work.
Keep its host/version limits and per-run gates.

## OpenCode isolation: verified controlled runner

Implementation checkpoint: local commit `77eee10` on
`codex/isolation-preflight`, followed by checkpoint/routing documentation.

The owner authorized completion and testing of OpenCode setup on 2026-10-22.
Use [the runner guide](opencode-runner.md) before an external development task.
The guide replaces the earlier unbuilt launch template. The historical
[isolation study](notes/opencode-macos-isolation.md) and
[offline preflight](notes/isolation-preflight.md) explain earlier checkpoints.

The final runner passed 51 synthetic boundary/native-policy/provider checks,
then a 49-check smoke task on public PR #21 commit `2576a95`. Actual GLM
read/write tools worked through the fixed free-provider relay. Fourteen runner
regression tests, eight original setup tests, and the full project suite passed.
No smoke patch was applied to the product. User files remain preserved.

The wrapper starts an authenticated private `serve --stdio` process inside
Seatbelt on one exact loopback port. It runs the client inside that boundary
with an explicit `--server` URL and verifies the server PID. This fulfills the
private-server objective without admitting arbitrary standalone dynamic ports.
It never attaches to the user's shared OpenCode service. Direct external
networking stays denied. The inference relay accepts only the fixed free model
and upstream route. No user credentials or paid fallback are supplied.

Every invocation repeats final-profile canaries, waits for the native policy
plugin to become active, checks its real permission decisions and effective
config, and rejects unverified public input. Public Git trees are copied from
one anonymously confirmed commit, with no untracked/private files, symlinks,
submodules, hardlinks or caches. Task output becomes a reviewed text patch.
Codex runs tests in the trusted checkout. Shell and external integrations stay
denied in OpenCode. No automatic patch application, push, PR merge or publication
is part of the wrapper.

The tested boundary remains macOS Seatbelt, not a security guarantee or VM.
Revalidate after runtime/profile changes. Keep the pinned binary and runner
checks. A no-home-mount Linux VM remains the preferred durable alternative.

## Verified local checkpoint and next work

- Historical offline checkpoint: local commit `814bd32` on
  `codex/isolation-preflight`, followed by documentation that records that
  checkpoint. The later controlled runner is described above. No branch was
  pushed and no new PR was created during either isolation package.
- Continuation baseline: PRs #19–21 were checked on 2026-10-22 and remain open
  and unmerged. PR #21 head is `2576a95`, based on `26c6e19`; the GitHub API
  returned no submitted reviews or inline review threads for all three PRs.
  Work continues on `codex/isolation-preflight` from that PR #21 head.
  The main checkout's two original untracked documents were preserved: the
  identical isolation study is now tracked from PR #21, and the old Obsidian
  update draft remains untracked and unchanged. The full baseline `npm test`
  passed outside the Codex sandbox. No content packet or runtime data changed
  in that offline prerequisite package. Its pending OpenCode gates were later
  completed by the controlled runner above. Content work retains the separate
  preparation/source-review gates below.

- The public GitHub checkpoint is `0ddb64d` on
  `origin/codex/hostage-pilot`. PR [#19](https://github.com/zhiland/ra9-atlas/pull/19)
  is open and unmerged as of this preparation. It is stacked on
  `codex/roadmap-pilot-stage1`; verify both PR heads before any action. Do not
  merge automatically.
- The active package is branch `codex/chapter-preparation`, based on
  `0ddb64d`. Its commit `26c6e19` is pushed in open, unmerged PR
  [#20](https://github.com/zhiland/ra9-atlas/pull/20), stacked on PR #19. It
  adds a versioned Hostage packet, a draft packet template, a Node validator,
  and the bounded source-chart corrections. The PR description reports
  `npm test` passing: contract 84, unit 43, map 4, stable zoom 10, layout 12,
  packet 55 and browser 58. Read its final diff and check the tests yourself
  before using the result as a new base.
- The current sample has five chapter regions, 102 nodes and 93 modeled edge
  claims. The source Hostage chart shows 33 boxes, 40 labels and 36 connectors.
  The option-specific model represents 37 Hostage claims after one chart
  connector was split into Friendly and Cold candidates. Four claims remain
  uncertain. `?edge=89` remains the uncertain Friendly candidate; index 92 is
  the new Cold candidate. The separate SAVE WOUNDED COP to *Public Enemy*
  prerequisite is guide-reported, not gameplay-verified.
- The packet is a preparation gate. Independent source review is pending and
  its merge gate is blocked. The production schema, runtime data migration,
  durable permalink plan, full chapter inventory reconciliation, and hosting
  choice remain open. Do not call a structurally valid packet source-approved.
- Next: review the Hostage packet against its cited chart and guide locations,
  settle its source and rights notes, then use one representative next-chapter
  packet to test the repeatable extraction, review and diff workflow. Decide
  the production data contract and `?edge=N` compatibility before scaling
  chapter batches. Keep each new chapter's coverage and omissions visible.

## Startup checklist

1. Check `git status --short --branch`, `git log -5 --oneline --decorate`, the
   final chapter-preparation commit, PR #19, and any later PR. Preserve
   unrelated or untracked user files. Do not merge or publish by default.
2. Read [STATUS](STATUS.md), [ROADMAP](ROADMAP.md), [spec](spec.md),
   [data contract](data-contract.md), [chapter preparation](chapter-preparation.md),
   [source register](SOURCES.md), and the relevant coverage ledger before
   changing data. The approved requirements and stage gates outrank this
   snapshot when they differ.
3. Run `npm test` on the final checkpoint. For a packet-only diagnostic, run
   `npm run validate:packet` and `npm run test:packet`. Record any environment
   failure separately from a test assertion failure. Browser checks use a
   localhost harness; Chromium viewport emulation does not certify Safari,
   physical touch, or assistive technology.
4. For each content package, keep extraction, structural validation,
   independent source review, and publication decision as separate gates.
   Ask for focused owner input only when the project evidence cannot settle a
   material product choice. Return source conflicts to research or the spec;
   never weaken a check to get a pass.

The next executor should update [STATUS](STATUS.md) and this handoff with the
actual final commit and PR state after the checkpoint closes.

## Copy-paste prompt for the next chat

Open a new Codex chat in the Detroit project. Select GPT-6.1 Sol at the client
default reasoning effort. Paste this prompt:

```text
Continue the ra9-atlas project. First read docs/handoff-sol.md from the current
checkout, including its verified OpenCode runner update. Read docs/spec.md, docs/STATUS.md, and
docs/ROADMAP.md. Check git status, the actual commits, and the stacked PRs
#19 → #20 → #21. Do not merge or publish automatically. Preserve local and
uncommitted user files.

After checking the baseline, take one small next package: prepare a draft
chapter packet for a representative chapter using available public sources.
Record coverage, omissions, sources, and unknowns explicitly. Do not mark
the packet independently reviewed or move its data into runtime before a
separate review. Use only the tested tools/isolation/opencode_runner.py wrapper for OpenCode.
Read docs/opencode-runner.md and retain its per-run gates and review boundary. Report
the result, checks, and remaining limits concisely in Russian.
```
