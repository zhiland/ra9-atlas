# ra9-atlas — resume point

Updated: 2026-10-20. Status: the PoC4 map-first overview/LOD slice, bounded data/provenance contract, and selected content expansion are complete. The graph remains partial: 3 chapter regions, 29 events, 31 connectors, with no gameplay verification. Full validation passes: 38 contract checks, 40 unit tests, 13 map regressions, and 48 browser checks.

The owner has now answered the follow-up grill questions in [grill-round-01.md](notes/grill-round-01.md). The decisions are consolidated in [spec.md](spec.md) and the open work in [ROADMAP.md](ROADMAP.md). Direction: static site, free hosting, no server maintenance; custom domain purchase is acceptable. No hosting provider or full-product data contract is selected. The first release may be an explicitly incomplete public preview; full-game coverage remains the end goal. A robust cross-chapter vertical slice is the first implementation milestone. No images, analytics, or advertising trackers in the first release. Q7's selected-chapter cross-link emphasis is provisional, Q17 replay-state help needs fact-checking, and the source-review procedure remains open.

The implementation roadmap is recorded in [ROADMAP.md](ROADMAP.md) and split across 11 open GitHub issues, with separate deferred issues for personal progress, images, and player-choice percentages. The root [MIT license](../LICENSE) applies to original project code and documentation only; [license-boundary.md](license-boundary.md) excludes game content, third-party sources, and source-derived samples. This is a license-scope statement, not clearance of existing source-derived material. Guide-supported claims may be published with source and status; whole-game gameplay verification is not a release gate. The full-product data contract and hosting choice remain open; the bounded [PoC4 contract](data-contract.md) is implemented.

## Decision

The map-first concept is accepted for a small prototype. PoC 2.0 applies the light Steam flowchart grammar. This is a UI concept only; it does not establish gameplay accuracy, full coverage, or release readiness.

## Complete

- PoC3 — The Hostage chapter map — passed its data/layout validator and JavaScript syntax checks. It contains 33 boxes, 40 visible labels, and 36 edges (5 uncertain); its coverage note documents source and browser/game verification limits. Checkpoint commit `2ca9e25` was pushed to `origin/main`.
- PoC4 scope and checklist: [poc4-plan.md](poc4-plan.md). OpenCode v2.0.32 CLI/catalog were inspected; the installed catalog lists `opencode/deepseek-v4.1-flash-free` and `opencode/glm-5.3-flash-free`, and the CLI accepts `provider/model#variant`. Official DeepSeek and OpenCode docs support the `max` effort concept. A minimal `#max` request selected the DeepSeek model, but the free-model service rejected it before returning a model response; backend application of max remains **unverified**. No paid fallback or access workaround was used. The public-only prompt remains in an ignored local log. A later follow-up session on the same free route completed the implementation below.
- PoC4 — multi-chapter atlas is a partial, guide-backed sample. The gray, amber, and dark-cyan entry points share one map renderer. The existing A New Home chart sequence and unresolved Alice-box hypothesis remain. The expanded sample adds a checkpoint detour/late-bus route and selected A New Home gun/window actions with Stormy Night outcomes. Kara and Alice shooting Todd stay distinct; only the guide-stated Kara outcome carries the gun. Meet Todd keeps its two separate prerequisite gates. The exact 11-minute boundary, full Stormy Night topology, window escape result, and exact in-game state checks remain unresolved. All three chapter coverage records remain partial. See [content expansion](notes/content-expansion-slice.md), [coverage](notes/poc4-coverage.md), and [source rights](notes/source-license-audit.md). No game transition is verified.
- PoC4 data/provenance contract — [data-contract.md](data-contract.md) now describes 29 nodes, 31 edges, four plain-English condition groups, six unknown records, and no source-conflict records. The timing alternatives are attached to separate edges. Chapter coverage remains `partial` and separate from claim status. `?edge=N` stays canonical; stable edge IDs remain aliases. No frontend or renderer code changed in this content slice.
- Graph-scale spike — a deterministic synthetic fixture of 1,000 nodes and 1,650 edges, using 40 neutral verbs × 25 neutral objects for 1,000 unique labels, passes all seven pre-registered desktop gates on the current SVG/DOM renderer with the production stylesheet. The later LOD review confirms the desktop performance gates; dense overview is a coarse region/branch summary, not full-game UX certification. At 390×844 the synthetic mobile profile is diagnostic only. Fixed-size dense nodes may overflow internally. No Cytoscape comparison was run; SVG remains provisional for this synthetic density. See [graph-scale-spike.md](notes/graph-scale-spike.md) and [overview-lod-slice.md](notes/overview-lod-slice.md).

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

- Continue source-backed chapter coverage and keep gaps visible. The current map has three selected chapter regions, not full chapter coverage.
- Use the [roadmap](ROADMAP.md) to settle the full-product data contract, evidence-review procedure, and hosting choice before a production build. The [PoC4 contract](data-contract.md) is bounded to the existing sample.
- Keep gameplay checks targeted to material source conflicts or unresolved conditions. This slice does not require full-game verification.

## Budget

Account limits change across all chats. Check them before each work package.
Below 20% remaining, save progress and defer a large package.
The run log records historical measurements, not current capacity.

The map is a static prototype, not a production site. Chromium viewport emulation does not verify a physical device, Safari/iOS, or real touch gestures. The test harness serves pages from localhost; it does not rely on direct file access.

## Limits

The static PoC4 application exists, but the production stack and full-product data contract remain open; only the bounded [PoC4 sample contract](data-contract.md) is implemented. No transition was verified directly in the game.
Mobile-width layout (≤900 px) is fixed and regression-tested at 390×844 in Chromium viewport emulation; no physical-device, Safari, or iOS testing has been done. At the synthetic 1,000-node density, event labels are intentionally hidden at overview and structure LOD; chapter-focus event labels require detail zoom, and 37/1,000 fixed-size node boxes still clip internally.
Game Navigator and the local AI Player viewer were not installed or tested.
Downloaded evidence and raw agent logs remain local and are excluded from Git.
Source licensing does not automatically permit reuse of game data, text, or images.
