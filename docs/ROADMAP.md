# Implementation roadmap

The requested end state is a complete, source-audited, interactive guide to the full game. PoC3 and PoC4 demonstrate map navigation on samples; neither counts as complete chapter coverage or direct gameplay verification. The roadmap is split into outcome-based GitHub issues. The issues describe future work, not decisions that have already been made about stack, graph schema, or release policy.

## Work sequence

1. **Define the data contract and provenance** — [#2](https://github.com/zhiland/ra9-atlas/issues/2). Agree graph granularity, state vocabulary, evidence fields, and migration from PoC data.
2. **Set the evidence and verification method** — [#4](https://github.com/zhiland/ra9-atlas/issues/4). Decide how to extract, cross-check, record conflicts, verify in-game, and label unreconciled claims.
3. **Build full-game chapter and route coverage** — [#1](https://github.com/zhiland/ra9-atlas/issues/1). Reconcile chapter/character-route inventories and account for every branch and gap.
4. **Model persistent state and delayed consequences** — [#3](https://github.com/zhiland/ra9-atlas/issues/3). Connect choices to later prerequisites and outcomes without implying certainty beyond the evidence.
5. **Deliver the graph explorer** — [#11](https://github.com/zhiland/ra9-atlas/issues/11). Extend the map-first concept with story overview, route navigation, search, filters, and readable large graphs.
6. **Complete spoiler, accessibility, and device behavior** — [#5](https://github.com/zhiland/ra9-atlas/issues/5). Keep spoiler consent explicit and verify keyboard, assistive technology, contrast, and small-screen use.
7. **Add quality and contribution workflow** — [#8](https://github.com/zhiland/ra9-atlas/issues/8). Validate data and evidence boundaries and automate appropriate checks.
8. **Select and operate a publishing approach** — [#6](https://github.com/zhiland/ra9-atlas/issues/6). Decide hosting after product, privacy, data, and operations requirements are reviewed; verify the deployed environment.
9. **Maintain licensing and provenance governance** — [#10](https://github.com/zhiland/ra9-atlas/issues/10). Review each contribution and published item against its actual source rights.

These are broad feature issues. Break them into implementation tasks only after the related decisions and acceptance evidence are clear. Keep structural validation separate from gameplay verification and coverage claims.

## Deferred discovery and outreach

These are future research tasks. No keyword, SEO, agent-search, subreddit, Steam-community, or outreach research has been done for this roadmap.

- **Discoverability and agent-readable content** — [#9](https://github.com/zhiland/ra9-atlas/issues/9). Later, research search intent around Detroit: Become Human flowcharts, choices and consequences; consider agent-readable content and provenance limits. Decide whether to proceed before implementing.
- **Player communities and outreach** — [#7](https://github.com/zhiland/ra9-atlas/issues/7). Later, review relevant Reddit, Steam, and other community rules, then prepare community-specific copy for owner review. No community has been contacted.

## Decisions still open

The existing intent and specification remain authoritative. The next review should resolve only open items that affect the first full implementation: what source-derived material may be published; what evidence threshold permits an unverified relationship in a public release; what level of graph/state detail supports the agreed guide; what consent behavior is required; and which stack and hosting approach fit the resulting data and release requirements. English interface, full-game end goal, map-first navigation, and the decision to defer fog of war, accounts, save imports, and simulation are already agreed.
