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

The acceptable gap limit before release remains open. Record answers here and update the relevant requirements and issues. Add terms to `../CONTEXT.md` only when they are resolved domain concepts.

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

## Follow-up answers

5. Zooming in on a chapter overview reveals its selected chart and links.
6. The eventual guide includes every chart node, including optional actions.
7. The overview keeps chapter-level cross-links. When a chapter is selected, relevant links receive more emphasis. This is provisional until tested on a large map.
8. Search covers chapters, characters, actions, outcomes, and synonyms.
9. A selected outcome can show reverse prerequisites, alternatives, and required conditions.
10. Event and link permalinks are supported. A direct visit still respects spoiler consent.
11. Personal playthrough marking is deferred as a separate feature.
12. Desktop is the primary target; mobile support is required.
13. When sources conflict, show both accounts and their sources; do not select a winner without evidence.
14. Error reports open a prefilled GitHub issue. The project will not create its own account system, comments, or server for reports.
15. A public preview may show incomplete coverage if gaps are visible. Full-game coverage remains the final goal.
16. Hidden conditions stay on links or in details. Do not invent game-chart nodes for them.
17. Help may explain replay-state rules, but only after checking those rules against reliable evidence. This is explanatory guidance, not a replay simulator.
18. Player-choice percentages are deferred; their usefulness remains undecided.
19. The first release has no images. Consider images later only after rights are cleared.
20. Character lanes or filters cover Connor, Kara, and Markus while preserving indications of cross-character connections.
21. A compact inspector shows full citations, source status, and uncertainty.
22. Coverage states are `not added`, `partial`, and `checked against chart`. Coverage is tracked separately from the truth or verification status of each link.
23. Contributors propose changes by pull request. Automated checks and review precede owner approval and publication. Visitors cannot directly edit published data.
24. Use agent-assisted extraction, structural validation, and a separate source review. The owner is not expected to check every node manually. The review method remains to be specified.
25. Write conditions in plain English using AND/OR wording; do not expose internal technical flag names.
26. Zoom levels show stages, branches, and outcomes at overview scale and hide tiny labels. Preserve meaningful cross-chapter links.
27. Dedicated keyboard navigation through the graph is deferred. Keep standard control support, search focus, Escape behavior, visible focus, contrast, and distinctions that do not rely on color.
28. No analytics or advertising trackers in the first release.
29. Required data and unit checks plus desktop and mobile browser checks block publication when they fail.
30. Start implementation with one robust cross-chapter vertical slice, then scale across the chapter collection. The slice is a milestone, not a replacement for full-game scope.

## Technical constraints carried into planning

- Use a static site and free hosting, with no server to maintain. The owner accepts buying a custom domain. Compare hosting options, including GitHub Pages and Sites, under existing issue [#6](https://github.com/zhiland/ra9-atlas/issues/6); no provider is selected yet.
- Keep Q7 provisional until a dense, large-map example is reviewed. Q17 requires fact-checking before explanatory claims are written. Q24's source-review procedure remains open.
- These decisions do not resolve source/content rights. The existing MIT scope and exclusions still apply.
