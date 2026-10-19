# ra9-atlas — resume point

Updated: 2026-10-19. Status: PoC4 implementation and source-rights audit are complete. The main checkout includes a neutral-gray default, orthogonal arrow connectors, and passing validators, unit, and Chromium browser checks; changes are being checkpointed on `main`.

## Decision

The map-first concept is accepted for a small prototype. PoC 2.0 applies the light Steam flowchart grammar. This is a UI concept only; it does not establish gameplay accuracy, full coverage, or release readiness.

## Complete

- PoC3 — The Hostage chapter map — passed its data/layout validator and JavaScript syntax checks. It contains 33 boxes, 40 visible labels, and 36 edges (5 uncertain); its coverage note documents source and browser/game verification limits. Checkpoint commit `2ca9e25` was pushed to `origin/main`.
- PoC4 scope and checklist: [poc4-plan.md](poc4-plan.md). OpenCode v2.0.32 CLI/catalog were inspected; the installed catalog lists `opencode/deepseek-v4.1-flash-free` and `opencode/glm-5.3-flash-free`, and the CLI accepts `provider/model#variant`. Official DeepSeek and OpenCode docs support the `max` effort concept. A minimal `#max` request selected the DeepSeek model, but the free-model service rejected it before returning a model response; backend application of max remains **unverified**. No paid fallback or access workaround was used. The public-only prompt remains in an ignored local log. A later follow-up session on the same free route completed the implementation below.
- PoC4 — multi-chapter atlas implemented on `main`. Three entry points ([default neutral gray](../prototype/poc4-editorial.html), [amber](../prototype/poc4-amber.html), [dark cyan](../prototype/poc4-darkcyan.html)) share one data/core/app/stylesheet. Selected slice: A New Home sequence transcribed from a Steam screenshot, Stormy Night carried states only (no inferred internal topology), Battle for Detroit — Kara meeting branch with separate Todd-survival and bus-terminal prerequisite gates, a single-source relationship condition, and the Alice-box link kept as a dashed UNRESOLVED hypothesis. Orthogonal connectors display arrowheads; prerequisite conditions retain text labels and have no diamond markers. Inventory: 3 chapters, 18 boxes, 16 connectors (12 traced + 1 reported condition + 2 prerequisite gates + 1 unresolved hypothesis; 2 cross-chapter). Current `npm test` passes all validators, 25/25 unit checks, and 42/42 Playwright Chromium checks across three palettes. No gameplay verification; version/platform unknown. See [coverage](notes/poc4-coverage.md) and the [source-license audit](notes/source-license-audit.md), which records evidence and recommendations without making a legal determination.

- The preparation plan received an independent Astra review and discussion.
- Gate 01: fschutt contains one chapter. AI Player contains 32 chapter files but simplifies the game.
- The initial registry lists 32 chapters. Full coverage is unverified.
- OpenCode completed a public-source review. The orchestrator corrected its unsupported conclusions.
- Two GPT-6 Luna agents checked D1–D3 against guides. The orchestrator reviewed attribution and claim strength.
- Gate 02 permits a mockup with evidence labels. It does not establish gameplay verification.
- OpenCode produced `notes/navigation-mockup-brief.md` for R1–R2 using D1–D3. It separates UI checks from guide-reported claims, preserves the unresolved D2 trigger and D3 11:00 boundary, and defines navigation acceptance checks. No claim is marked in-game verified. The saved brief is 1,197 words, longer than the requested concise target; OpenCode revision was interrupted after repeated unsuccessful condensation. Raw session log remains local and ignored by Git.
- The first navigation mockup was rejected as card-based. Its [old check record](notes/navigation-mockup-check.md) is historical.
- The [map-first replacement](../prototype/navigation-mockup.html) shows an overall sample canvas and three detailed chapter maps. Nodes and branches remain visible together. The overall canvas has a dashed, unresolved Alice's box → Todd link; D1 and D3 remain separate. [OCR and structure note](notes/map-reference-analysis.md) records representative Steam image transcription. [Map check record](notes/map-prototype-check.md) records static checks and limits.
- The map data (refs, N/E helpers, maps, detail) moved out of [navigation-mockup.html](../prototype/navigation-mockup.html) into [map-data.js](../prototype/map-data.js), a classic script loaded before the UI script so the file still opens directly over file://. Every node, edge, status, source URL, label, and the unresolved cross-chapter example is unchanged. [validate-map-data.js](../prototype/validate-map-data.js) checks unique map node IDs, edge endpoints, and that the cross-chapter example stays unresolved; run `node prototype/validate-map-data.js`. All checks pass.
- [spec.md](spec.md) remains a draft. [CONTEXT.md](CONTEXT.md) defines the main terms.
- Project documents are in English. The project owner approved the public `zhiland/ra9-atlas` repository. Project documents are organized under [docs/](./).

## Next

PoC4 files are now in the main checkout. Git writes previously failed while creating a worktree index lock (`Operation not permitted`); a normal permission-escalated add/commit/push is being retried now. The focused review checked condition labels and details, separate Todd-survival and terminal prerequisites, the unresolved box hypothesis, and the new connector styling. A successful push will be confirmed by comparing the local commit hash with `origin/main`.

Historical PoC2 next step: review its map visually and click through the D1–D3 samples. The local browser route remains unavailable under the earlier explicit restriction, so visual and interaction behavior have not been checked in a browser. Resolve specification blockers before a production stack decision.

PoC 2.0 uses compact rectangular event nodes, orthogonal connectors, blue milestone nodes, visible branches, and a light neutral canvas. OpenCode was given one bounded visual task but the run was interrupted before a result after about 15 seconds; a hang was not established. The Luna executor completed this small pass. No architecture decision or implementation plan was created.

## Budget

Account limits change across all chats. Check them before each work package.
Below 20% remaining, save progress and defer a large package.
The run log records historical measurements, not current capacity.

Static checks for PoC 2.0: JavaScript syntax passes, all relative Markdown links resolve, and `node prototype/validate-map-data.js` passes. Browser rendering and interaction remain unverified.

## Limits

No application or selected stack exists. No transition was verified directly in the game.
Game Navigator and the local AI Player viewer were not installed or tested.
Downloaded evidence and raw agent logs remain local and are excluded from Git.
Source licensing does not automatically permit reuse of game data, text, or images.
