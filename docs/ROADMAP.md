# Implementation roadmap

The requested end state is a complete, source-audited, interactive guide to the full game. PoC3 and PoC4 demonstrate map navigation on samples; neither counts as complete chapter coverage or direct gameplay verification. The roadmap is split into outcome-based GitHub issues. The issues describe future work, not decisions that have already been made about stack, graph schema, or release policy.

## Work sequence

1. **Define the data contract and provenance** — [#2](https://github.com/zhiland/ra9-atlas/issues/2). Agree graph granularity, state vocabulary, evidence fields, and migration from PoC data. The bounded [PoC4 sample contract](data-contract.md) covers the current 45-node/49-edge sample; the full-product contract remains open.
2. **Set the evidence and verification method** — [#4](https://github.com/zhiland/ra9-atlas/issues/4). Define source extraction and cross-checks as the default evidence method, record conflicts and claim status, and use targeted in-game checks when they can resolve specific uncertainties. Keep automated structural validation separate from evidence checks.
3. **Build full-game chapter and route coverage** — [#1](https://github.com/zhiland/ra9-atlas/issues/1). Reconcile chapter/character-route inventories and account for every branch and gap. The [content expansion](notes/content-expansion-slice.md), [Stormy Night escape slice](notes/stormy-escape-slice.md) and [Stormy Night entry slice](notes/stormy-entry-slice.md) add only selected source-backed routes; all three represented chapters remain partial.
4. **Model persistent state and delayed consequences** — [#3](https://github.com/zhiland/ra9-atlas/issues/3). Connect choices to later prerequisites and outcomes without implying certainty beyond the evidence. The sample now distinguishes seeing the gun from taking it, route availability from successful escape, the two non-gun escape routes from each other, the non-deviant fatal outcome from Todd killed, and source-stated route steps from inferred later Todd state.
5. **Deliver the graph explorer** — [#11](https://github.com/zhiland/ra9-atlas/issues/11). First build a robust cross-chapter vertical slice, then scale to the complete chapter collection. Keep story overview and chapter charts connected; search chapters, characters, actions, outcomes, and synonyms. Selected outcomes expose reverse prerequisites and alternatives. Chapter-level cross-link emphasis remains provisional pending a dense-map review.
6. **Complete spoiler, accessibility, and device behavior** — [#5](https://github.com/zhiland/ra9-atlas/issues/5). Keep spoiler consent explicit and verify contrast, assistive technology, and mobile use. Dedicated graph keyboard navigation is deferred; preserve standard controls, visible focus, search focus, and Escape behavior.
7. **Add quality and contribution workflow** — [#8](https://github.com/zhiland/ra9-atlas/issues/8). Validate data and evidence boundaries and automate appropriate checks.
8. **Select and operate a publishing approach** — [#6](https://github.com/zhiland/ra9-atlas/issues/6). The agreed direction is a static site, free hosting, and no server maintenance; buying a custom domain is acceptable. Compare providers, including GitHub Pages and Sites. No provider has been selected. Required data/unit checks and desktop/mobile browser checks block publication when they fail.
9. **Maintain licensing and provenance governance** — [#10](https://github.com/zhiland/ra9-atlas/issues/10). Review each contribution and published item against its actual source rights.

These are broad feature issues. Break them into implementation tasks only after the related decisions and acceptance evidence are clear. Keep structural validation separate from gameplay verification and coverage claims.

## Deferred product features

- **Personal playthrough marking** — [#14](https://github.com/zhiland/ra9-atlas/issues/14). Keep distinct from the reference guide; no release commitment.
- **Game images** — [#13](https://github.com/zhiland/ra9-atlas/issues/13). No images in the first release; assess later only after rights clearance.
- **Player-choice percentages** — [#12](https://github.com/zhiland/ra9-atlas/issues/12). Deferred; usefulness and evidence sources are undecided.

The first release has no analytics or advertising trackers. Public preview may expose incomplete coverage if gaps are visible; full-game coverage remains the end goal. Proposed edits go through pull requests, automated checks, review, and owner approval before publication. Visitors do not edit published data directly. Error reports can open a prefilled GitHub issue; the product will not add its own accounts, comments, or reporting server.

## Deferred discovery and outreach

These are future research tasks. No keyword, SEO, agent-search, subreddit, Steam-community, or outreach research has been done for this roadmap.

- **Discoverability and agent-readable content** — [#9](https://github.com/zhiland/ra9-atlas/issues/9). Later, research search intent around Detroit: Become Human flowcharts, choices and consequences; consider agent-readable content and provenance limits. Decide whether to proceed before implementing.
- **Player communities and outreach** — [#7](https://github.com/zhiland/ra9-atlas/issues/7). Later, review relevant Reddit, Steam, and other community rules, then prepare community-specific copy for owner review. No community has been contacted.

## Decisions still open

The existing intent and specification remain authoritative. Guide-supported relationships may be published with source and status; gameplay checks are targeted follow-up for conflicts or specific uncertainties, not a whole-game release gate. Remaining decisions include what source-derived material may be published, what graph/state detail supports the guide, the full-product data contract and stack, and the hosting approach. Map-first navigation, prerequisites on connections/details, browser-persisted spoiler consent with reset, English interface, full-game end goal, and deferral of fog of war, accounts, save imports, and simulation are agreed.
