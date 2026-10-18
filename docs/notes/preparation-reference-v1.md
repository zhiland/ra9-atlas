# rA9 Atlas — preparation plan

Date: October 17, 2026. The project owner confirmed the name **ra9-atlas** and the phase order. Status: preparation; no GitHub repository or implementation exists, and no technology stack has been selected.

## Outcome and principles

A public interactive guide for Detroit: Become Human fans and players, covering the whole game: game overview → chapter map → choice conditions → consequences in other chapters → evidence. Core use case: select a current action and trace where and under what conditions it affects later events, while keeping context instead of switching between 100% walkthrough screenshots. The whole game remains the goal; a chapter sample tests the method and does not replace the intended result. This is a reference guide, not a separate game. Playthrough simulation, save import, accounts, and replay optimization are outside the initial required scope.

The main asset is an evidence-checkable corpus of connections. The website is a way to explore it. AI may suggest extracted claims; missing information must not be filled in by guessing. A link does not mean a claim has been verified. The absence of a transition in one guide does not prove that it is impossible.

## Work order and phase outcomes

| Phase | Work | Checkable outcome / transition condition |
|---|---|---|
| 1. Short product brief | Priority scenarios: overview, explain cause and effect, find an unavailable branch. Defer replay planner; prioritize viewing connections. Cover spoilers, languages, mobile layout, and keyboard navigation. | Short brief separating required, desirable, and deferred items; 5–8 user questions the map must answer. |
| 2. Source and audience research | In parallel: GitHub/fan projects; game guides/wiki; flowcharts/video; Reddit/Steam and official audience information. Check links from found projects, forks, and related tools. | Source register with coverage, format, date, access, provenance, and reuse terms; map of existing solutions and unmet tasks. |
| 3. Game and gap register | Distinguish chapter, character flowchart, route, and guide page. Compare sources for each chart and separately for cross-chapter consequences. | Coverage matrix: text, chart, conditions, consequences, independent cross-check, gaps. Do not use page count as a completeness measure. |
| 4. Knowledge model and extraction method | Describe events/choices/transitions, AND/OR/NOT conditions, states, and effects. Separate in-game flowcharts from additional mechanic explanations. Manually analyze a simple chapter, a complex chapter, and a cross-chapter chain. | Small evidence corpus, glossary, extraction and conflict-resolution rules, and an estimate of the work needed for the full game. No application implementation. |
| 5. High-level design | Compare storage, publishing, and interface; prepare 2–3 options with maintenance costs. Consider ready-made UI templates separately from the graph engine. | Decision document with recommendation, alternatives, limits, and reasons to revisit. Choose the visualization library later, using real complex data. |
| 6. Public project | Name, description, author identity, language, code/data licenses, community contributions, corrections, and attribution. Then create a GitHub repository and move in the prepared documents. | Clear positioning and participation rules; owner and visibility decided before public creation. |
| 7. Full corpus preparation and development | After deciding to implement, break work down by chapters and dependencies, and plan data versions, checks, and website. | Release roadmap for the whole game with visible gaps and verified coverage. |
| 8. Publication and maintenance | Demonstrate useful scenarios, gather feedback, make corrections, and set contribution and update rules. | First public release and correction process; community messages are prepared separately and sent only on the project owner’s direct instruction. |

Phases 1–2 can partly run in parallel. Phases 3–4 depend on sources; phase 5 depends on the data model and user scenarios. Name and audience research can run in parallel. Do not wait for the full corpus to discuss architecture, but do not choose architecture based on a simple demo chapter.

## How to organize full research

- **GitHub:** original projects, forks, data, generators, working demos, coverage, and licenses. Project age alone is not a reason to reject it.
- **Guides and wikis:** PowerPyx, Fandom, Neoseeker, GameFAQs, Steam Guides, and other game sites. Distinguish accessible text from images, and original information from copies.
- **Fan and visual sources:** text transcripts, independent sites, diagram editors, and videos of complete flowcharts. Use screenshots as evidence of structure, not as a ready-made database.
- **Community:** Reddit and Steam — questions people actually ask, gaps in existing guides, and posting rules. Measure sales, concurrent players, and demand for the atlas separately.
- For each source, record URL, date/revision, author, type, coverage, exact evidence location, access, provenance, terms of use, usefulness, and next check. For blocked pages, clearly mark when only a search snippet was available.
- **Initial search stopping rule:** cover all listed source classes, check links and forks for major candidates, and stop when another pass no longer adds materially new solutions; list remaining gaps. This is a bounded, reproducible audit, not a promise to check the whole internet.

## Preliminary architecture hypothesis

Preparation flow: sources → extracted claims → cross-checks and conflicts → versioned corpus → publication build → browser atlas.

| Option | Benefits | Costs / when needed |
|---|---|---|
| Static website + chapter JSON | Simple publishing; no required accounts or server database; data is easy to discuss on GitHub. Interactivity runs in the browser. | Search, loading large graphs, and updates need design; there is no shared user editing. Preliminary primary candidate. |
| SQLite for preparation → JSON for website | Useful queries, consolidation, and auditing of a large corpus; website remains static. | Extra build step; binary database is hard to review. Choose one authoritative format and prevent two databases from diverging. Add only when usefulness is demonstrated. |
| Backend + database | Shared accounts, progress sync, and on-site editing/moderation. | Hosting, security, migrations, backups, and ongoing maintenance. Consider only when shared editing is a real need, not just because the project has a graph. |

SQLite is a storage format/engine; a backend is a running server. They are different choices. A static website can still have complex filters, search, and local progress. Neither a cloud server nor a graph database is justified by current requirements. JSON and SQLite are options, not a selected implementation.

Interface: overview of all chapters and characters; expand one flowchart; switch between “what led here” and “what this affects”; condition and source card; stable links to nodes; search; clear unknown status. Spoiler mode must also account for search, labels, and link previews. Dense graphs need an accessible text navigation method.

React Flow + ELK and Cytoscape.js remain candidates from the handoff. Their support, licenses, and suitability still need review. Assess UI templates for accessibility, mobile support, license, and map compatibility; visual styling must not determine the data model.

## Accuracy and completeness

Track chapter, node, local-transition, condition, cross-chapter-effect, and evidence coverage separately. Do not combine them into one arbitrary percentage. Claim statuses: extracted, source-supported, independently cross-checked, checked in game, disputed, unknown. Multiple sites may copy one source.

Record the platform/game version before measuring coverage. Distinguish necessary conditions, sufficient conditions, and observed correlations; save the starting state and reproduction method for checks. The pilot should estimate time for extraction, cross-checking, and in-game reproduction, and confirm access to a person/game for verification. For community contributions, use stable claim IDs and require evidence for corrections. These additions followed an independent review by GPT-6 Astra / high.

Replay planning needs separate research into saves, checkpoints, and state carry-over. A path in a graph does not prove it can be reached from a particular save. Do not promise a precise simulator for all hidden variables without data.

Check rights to code, guide text, images, and game materials separately. A short original paraphrase does not automatically remove obligations when using others’ material. Mark unconfirmed reuse permission explicitly; decide licenses after a separate review.

## Agents and quality checks

The orchestrator sets a shared format, scope, and acceptance criteria; combines reports and rechecks key claims. Limit the number of agents by independence of work and budget, not by the number of search queries.

| Work | Proposed model / effort | Reason |
|---|---|---|
| Search and catalog independent source classes | GPT-6 Luna / medium; low for mechanical normalization | Many bounded tasks with checkable links. |
| Extract complex conditions and compare conflicts | GPT-6.1 Sol / high | Requires tracking context across multiple scenes and sources. |
| State model, architecture tradeoffs, plan review | GPT-6 Astra / high; xhigh for a specific difficult conflict | Dedicated deep review of narrow, important decisions. |

This is a working allocation policy, not a guarantee of model accuracy. A researcher must not treat their own conclusion as independent verification. Long research proceeds in waves, reporting new findings and remaining gaps.

## Name and public positioning

The requested context was found in the chat “Explanation of rA9.” The project owner approved **rA9 Atlas** (`ra9-atlas`). Name availability, similar projects, and usage rights have not been checked.

Suggested description: “An unofficial interactive guide to choices and consequences in Detroit: Become Human, with sources and an open database.” Do not claim “first” or market AI as proof of quality. English is the preliminary language for public material, Russian for working discussion; decide website language and translations in the brief.

Author privacy and announcements are separate decisions. If publishing under a pseudonym, decide the profile, commit author email, and metadata before the first public commit. A pseudonym does not guarantee anonymity. Do not change existing global Git settings automatically.

## Work completed and next steps

The handoff and project wiki were read; the earlier rA9 chat and draft files were found. Two limited surveys were completed: [sources](source-survey.md) and [audience](audience-survey.md). Older drafts in another folder were not treated as architecture.

The next work package is a full candidate register, comparison table of existing solutions, chapter/flowchart matrix, and short brief. Then run a trial evidence extraction and make an architecture decision. Preparation is sufficient when sources and gaps are known, the method has been tested on different complexity levels, product boundaries are chosen, and architecture tradeoffs are explained. Checking every game transition belongs to later full-corpus preparation.

## Skills and decision reviews

After the first research wave, collect facts, open decisions, and recommendations. Then hold a **grill with documents** with the project owner using the local `grill-with-docs` skill, which combines `grilling` and `domain-modeling`. Ask questions in dependency order and save decisions and vocabulary. The skill is planned for a future stage; the interview has not started.

First grill: guide purpose, consequence navigation, spoilers, and boundaries. A second grill, only if needed: data model and architecture tradeoffs. Agents research facts; the project owner chooses among prepared options. Do not reopen the already agreed project name, full-game coverage, and interactive-guide format without new evidence.

Apply other skills as needed: `research` for audits, `domain-modeling` for terms and decisions, `codebase-design` for module boundaries; `prototype` later only for a specific disputed interaction; `code-review` and `pr` during development. Do not start every skill in advance.

## Budget and recovery

- Check account limits before and after each research wave. Snapshot on October 17, 2026, while refining the plan: 20% of the 5-hour window and 27% of the week had been used; this covers the whole account, not this project’s usage.
- Suggested start: one Luna / medium for a bounded package; add a second only for independent work where parallelism helps. Use Sol/Astra for specific unresolved questions, not every search. Do not promise fixed usage in advance.
- Suggested reserve: if less than 20% remains in either window, do not start another large wave; save results and a summary. This is a working threshold for approval, not an automatic service limit. If limits are unavailable, do not assume the full allowance remains.
- Each agent gets a separate output file and saves intermediate results during the task. `../STATUS.md` records completed and unfinished work, next steps, and links; `../AGENT-RUNS.md` records name, model/effort, assignment, status, and outcome.
- If work stops, save open questions, unread sources, partial results, and the resume point. A new session reads STATUS and relevant files instead of repeating all searches. Automatic resumption is not configured or promised.
- Do not buy credits or paid APIs, or use available limit resets, without the project owner’s instruction.

## OpenCode fallback

OpenCode is considered an optional executor for bounded tasks using public sources, not a required dependency. It has not been installed or configured. Before connecting it, check that the selected model ID is actually free, review quotas and data-handling terms, and ensure there is no paid fallback or automatic top-up. Provide only a specially prepared public-data package, without a personal vault, chats, secrets, or user profile. Save results locally and apply the same evidence standards.

Check on October 17, 2026: the official [OpenCode Models](https://opencode.ai/v2/docs/console/models/) page lists GLM 5.2 as paid and GLM-5.3-Flash Free as temporarily free, with a claim that the provider does not retain data or use it for training. Do not generalize these terms to all free models. Account access and quotas were not checked. Verify again during setup.

## Agent visibility

Previous executors were named child agents in this chat, not separate user-created chats or persistent roles. All three completed. Official [subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) describes displaying agent streams in the app, but the reason they were not visible to the project owner is unknown. Do not promise an interface fix without diagnosis. Before the next wave, show names and assignments and maintain AGENT-RUNS; create separate user chats only on explicit request.

## Next wave — pending approval

One bounded research package: examine fschutt data, coverage, license, and related forks in depth; compare PowerPyx, Fandom, and the fan transcript text. Produce a source suitability table and begin the chapter/flowchart matrix. Then save a summary, check limits, and prepare the first grill-with-documents round. Do not start implementation, bulk extraction of the whole game, or installation of a fallback tool during this wave.
