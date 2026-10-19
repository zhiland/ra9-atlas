# Grill with documents — round one

Facts: no ready replacement has been confirmed; the JSON corpus found simplifies the game. Decision: continue preparation and do not start development.

1. What should appear after a choice: only later consequences, or earlier conditions too?
   Recommendation: show consequences by default and reveal earlier conditions nearby.
2. Is spoiler protection needed?
   Recommendation: show a clear warning on entry and the full map after consent. Defer progressive hiding.
3. How should a disputed connection appear?
   Recommendation: give it a clear separate label and source. Do not present it as a confirmed transition.
4. What language should the first public interface use?
   Recommendation: English for the community; add Russian separately.

The next round depends on the answers. The acceptable gap limit before release remains open. Record answers in the plan and new terms in `../CONTEXT.md`.

## Answers

1. The map is the main surface. Keep the game-chart-like nodes and branches visible; show hidden prerequisites on connections and/or in event details, alongside later consequences.
2. Show a warning on entry, then the full map. Persist spoiler consent in the browser and provide a reset. Do not invent a fixed expiration.
3. Guide-supported and disputed connections may be published with source and evidence status. This status does not claim gameplay verification. Source cross-checking is the default; targeted gameplay checks can resolve specific conflicts, but checking the whole game is neither a release gate nor an owner obligation. Automated graph-structure checks remain separate from evidence review.
4. English only. No Russian interface.

## Next questions

5. For the first version: full map after a warning, with fog of war later; or is fog of war required from the start?
6. If fog is required: hide everything after the selected chapter, or reveal each branch manually?

Recommendations: defer fog of war; if added, use a chapter boundary and a Reveal All control. Do not promise spoiler protection without rules for search, conditions, labels, and links.

## Answer to Q5

The project owner deferred fog of war. Version one will show a warning and then the full map. Questions about revealing fog are deferred.

## Follow-up decisions

The initial map-first proposal is confirmed: the chart remains visible as the main surface, and hidden prerequisites appear on connections and/or in event details. Spoiler consent is remembered in the browser, with a reset and no specified fixed expiry.

Guide-supported links can appear in a public guide when their sources and status are shown. This is not a claim that guides establish ground truth. Automated structural checks validate graph consistency only; source cross-checks support evidence labels. In-game checks may target disputed or unclear claims, but comprehensive gameplay verification is not required for release and is not an owner obligation.
