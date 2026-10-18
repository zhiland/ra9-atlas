# PoC4 — multi-chapter map plan

Status: planned; implementation is blocked until an authorized free OpenCode model completes a request. PoC3 checkpoint `2ca9e25` is pushed to `origin/main`.

## Goal and boundary

Build a static browser prototype that shows chapter topology and cross-chapter prerequisites together. This is a scoped interaction and data-method demonstration, not full-game coverage, a selected production stack, or gameplay verification. Keep graph data separate from rendering. Do not reuse game art.

## Evidence-bounded slice

Show selected parts of **A New Home**, **Stormy Night**, and **Battle for Detroit — Kara**. The checked guide sources say the later Todd meeting requires Todd to have survived **Stormy Night** and Kara/Alice to have reached the bus terminal. Meeting dialogue then determines whether Todd sends the soldiers away or a security check follows.

Keep the **A New Home** box-to-later-Todd relationship visibly unresolved. Sources are incomplete about whether opening the box, seeing a photo, or another related action sets the relevant state. Do not draw this as a confirmed causal edge or imply it guarantees the meeting or outcome. Present any candidate box state as a dashed, labeled hypothesis with sources and uncertainty. Show Todd survival and reaching the bus terminal as separate prerequisites. Mark game version/platform unknown and claims as guide-supported or unresolved; none are gameplay-verified.

Use the Steam flowchart transcription only for the visible **A New Home** local sequence. For other nodes and links, use claims and cited sources in [verification-d2.md](notes/verification-d2.md), then inspect cited pages if exact wording or another transition is needed. Do not infer unrecorded internal **Stormy Night** topology. Coverage metadata must name included chapters, omitted portions, source type, and unresolved claims.

## Interface and behavior

- Show the whole chapter graph on entry, beneath a clear spoiler-consent overlay. Consent reveals the map; detail navigation and chapter jumps retain a visible map and history/context.
- Provide three chapter maps with persistent, labeled cross-chapter links and prerequisite gates visible before navigation. Show uncertainty through text, line style, and details, not color alone.
- Details have a visible close button and close with Escape. Keep the graph accessible while details are open.
- Supply three separate HTML entry points sharing data and behavior, with distinct accessible palettes: light blue/teal editorial, warm amber neutral, and dark cyan.
- Public interface and documentation remain in English.

## Checks and deliverables

Have OpenCode first save a short execution checklist, then implement in the same session. Include meaningful graph, condition, and history unit checks plus browser functional/feature tests using Playwright if available; otherwise use and document a fit-for-purpose browser test harness. Exercise spoiler consent, chapter jumps, cross-chapter conditions, both detail-close paths, and all three visual variants. Independent review checks attribution, uncertainty, topology, visible-map behavior, and defects. Record passed, failed, and unrun checks without overstating browser or game verification.

Deliver three usable HTML entries, shared data/rendering, tests, a concise coverage/source note, updated README and STATUS, and reviewed commits pushed without force. Stage only intended public docs, prototype, tests, and configuration. Keep raw prompts and logs local and ignored.

## Source limits

The current evidence ledger is [verification-d2.md](notes/verification-d2.md); its limits are binding. PowerPyx and Gamer Guides are secondary guides, some box/state claims come from snippets or incompletely reviewed pages, and no original in-game flowchart or controlled playthrough was checked. The [map-reference-analysis.md](notes/map-reference-analysis.md) transcription supports visible structure only.
