# Sol handoff — ra9-atlas

Prepared: 2026-10-22 from chapter-preparation commit `26c6e19`. Recheck the
branch and PR state at the start of the next work package; this document is a
checkpoint, not a live status feed.

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
into the public repository. A macOS isolation runner for external OpenCode work
is under investigation. Treat it as unverified until its public-only filesystem
boundary has been enforced and tested. Use only prepared public files for any
external-agent run.

## Verified local checkpoint and next work

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
