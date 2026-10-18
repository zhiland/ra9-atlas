# ra9-atlas — resume point

Updated: 2026-10-18. Status: PoC 2.0 in progress.

## Decision

The map-first concept is accepted for a small prototype. PoC 2.0 applies the light Steam flowchart grammar. This is a UI concept only; it does not establish gameplay accuracy, full coverage, or release readiness.

## Complete

- The preparation plan received an independent Astra review and discussion.
- Gate 01: fschutt contains one chapter. AI Player contains 32 chapter files but simplifies the game.
- The initial registry lists 32 chapters. Full coverage is unverified.
- OpenCode completed a public-source review. The orchestrator corrected its unsupported conclusions.
- Two GPT-6 Luna agents checked D1–D3 against guides. The orchestrator reviewed attribution and claim strength.
- Gate 02 permits a mockup with evidence labels. It does not establish gameplay verification.
- OpenCode produced `notes/navigation-mockup-brief.md` for R1–R2 using D1–D3. It separates UI checks from guide-reported claims, preserves the unresolved D2 trigger and D3 11:00 boundary, and defines navigation acceptance checks. No claim is marked in-game verified. The saved brief is 1,197 words, longer than the requested concise target; OpenCode revision was interrupted after repeated unsuccessful condensation. Raw session log remains local and ignored by Git.
- The first navigation mockup was rejected as card-based. Its [old check record](notes/navigation-mockup-check.md) is historical.
- The [map-first replacement](../prototype/navigation-mockup.html) shows an overall sample canvas and three detailed chapter maps. Nodes and branches remain visible together. The overall canvas has a dashed, unresolved Alice's box → Todd link; D1 and D3 remain separate. [OCR and structure note](notes/map-reference-analysis.md) records representative Steam image transcription. [Map check record](notes/map-prototype-check.md) records static checks and limits.
- [spec.md](spec.md) remains a draft. [CONTEXT.md](CONTEXT.md) defines the main terms.
- Project documents are in English. The project owner approved the public `zhiland/ra9-atlas` repository. Project documents are organized under [docs/](./).

## Next

Review the PoC 2.0 map visually and click through the D1–D3 samples. The local browser route remains unavailable under the earlier explicit restriction, so visual and interaction behavior have not been checked in a browser. Resolve specification blockers before an implementation plan or stack decision.

PoC 2.0 uses compact rectangular event nodes, orthogonal connectors, blue milestone nodes, visible branches, and a light neutral canvas. OpenCode was given one bounded visual task but the run was interrupted before a result after about 15 seconds; a hang was not established. The Luna executor completed this small pass. No architecture decision or implementation plan was created.

## Budget

Account limits change across all chats. Check them before each work package.
Below 20% remaining, save progress and defer a large package.
The run log records historical measurements, not current capacity.

Static checks for PoC 2.0: JavaScript syntax passes, and all relative Markdown links resolve. Browser rendering and interaction remain unverified.

## Limits

No application or selected stack exists. No transition was verified directly in the game.
Game Navigator and the local AI Player viewer were not installed or tested.
Downloaded evidence and raw agent logs remain local and are excluded from Git.
Source licensing does not automatically permit reuse of game data, text, or images.
