# Map design direction

## Direction

Build a large, spatial chapter flowchart: the map is the product and should occupy nearly the entire viewport. Users should be able to read a chapter's branching structure at a glance, then zoom into individual decisions. Keep chapter/character lanes visible, give the graph room to spread, and avoid a sequence of small cards that must be opened one by one.

Use a restrained dark product interface in the spirit of Refero's Linear reference. Preserve the game's authored flowchart logic and visual hierarchy as data; do not imitate Steam's exact screenshot artwork.

## Visual system

- Canvas `#08090a`; toolbar and quiet surfaces `#0f1011`; selected node/detail panel `#161718`.
- Hairline structure `#23252a`, stronger separators `#383b3f`; primary text `#ffffff`, secondary `#d0d6e0`, metadata `#8a8f98`.
- Use Linear's acid lime `#e4f222` sparingly for the current/selected focus and primary map action. Keep distinct outcome/status states semantically labeled and distinguishable without color alone; use muted status accents, not a rainbow of node fills.
- UI type: Inter or system sans, normal weights, clear levels: chapter title 20–24px, node title 13–15px, metadata 11–12px. Use 4px spacing increments, 8px common gaps, 8–12px node padding, 6px controls, 8–12px node corners. Graph edges are thin and neutral; emphasize only the selected route and its immediate branches.
- Node hierarchy: chapter/scene headings > decision/event title > compact outcome labels > optional metadata. Keep labels visible at useful zoom levels; simplify or hide secondary detail only when zoomed far out. Selected node gets a clear outline/fill and connected edges brighten. Distinguish locked/unseen, discovered, current, and completed with both a small icon/shape and text or accessible tooltip.

## Interaction layout

- Persistent top strip: chapter selector, search, filters, zoom percentage, fit-to-map, reset, and concise keyboard hints.
- Full-bleed pannable/zoomable canvas: drag background to pan; wheel/pinch to zoom around pointer; click a node to select it. Provide fit chapter and fit selection controls.
- Small minimap in a corner shows viewport bounds and supports navigation. Keep it quiet and collapsible.
- Persistent right detail panel for selected event: title, description, choice/outcome text, prerequisites/consequences, source/provenance, and links to connected events. Selecting a node should not navigate away from the map.
- Search result centers and selects the matching node; filters dim unrelated nodes/edges rather than destroying spatial context. Include an obvious clear-filter action.
- Make graph keyboard-operable: searchable node list, arrow/Tab navigation, Enter to select, Escape to clear selection; keep focus visible and provide non-color status cues.

## References and boundaries

- [Steam 100% Chapter Flowcharts guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882): reference for the scale and branching completeness users expect. Steam currently displays a removed-item notice while retaining guide metadata. It credits Reddit user `throwawaydeviant9` for path research/screenshots and Neoseeker for high-resolution images; do not copy screenshots, game assets, or guide content into this project. Treat it only as an interaction/structure reference. Confirm rights and source provenance independently before reusing any game-derived content.
- [Refero Linear style](https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1) and [Refero dashboard examples](https://styles.refero.design/examples/dashboard-ui-design): selected because the Linear example documents compact dark surfaces, hairline borders, restrained accent usage, and scannable dense product UI. Borrow token roles and hierarchy, not Linear's logo, proprietary fonts, source assets, or exact components. Refero labels normalized measurements and interpretations; its screenshot is a source-site reference, not a flowchart UI.
- [Impeccable downloads and setup](https://impeccable.style/#downloads): applied as public design guidance only—design for the product task, respect hierarchy, reduce generic/decorative defaults, and use legible controls. The Impeccable skill was not installed globally or in this project. No Impeccable source code or assets are included.

## Applied vs. referenced

Applied in this direction: graph-first layout, restrained Linear-inspired tokens, explicit node/edge/status hierarchy, and concrete pan/zoom/search/selection behavior. Referenced only: Steam's authored flowchart content and Linear/Impeccable brand implementations. This note is a design brief, not a claim that those sources grant licenses to reuse content or assets.

## Impeccable skill provenance and applied rules

Read the official [Impeccable `SKILL.md`](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md), its [Operate mode reference](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/operate.md), and [craft floor](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/craft-floor.md) from the linked public repository on 2026-10-18. No skill files or hooks were installed.

Rules carried into implementation:

- Treat this as **Operate**: the interface serves the task. Favor scanability, consistent familiar controls, useful density, restrained color, and structural responsive behavior over brand expression.
- The user rejected the previous visual design, so treat it as an anti-reference. Preserve product facts, flowchart content, required functionality, and constraints; replace the composition around those truths.
- Use semantic state colors only for actions and real states; standardize hover, focus, active, disabled, loading, error, warning, success, info, and selected treatments. Keep controls keyboard accessible.
- Avoid generic card-grid scaffolds, nested cards, decorative gradients/glows, gratuitous motion, accent rails, and modal-first interaction. Let the graph geometry carry the visual texture.
- Before editing, inspect existing design truth and the relevant implementation. Before finishing, check the rendered result in a single batched review for readable contrast, spacing, text scale and overflow, complete states, responsive layout, working controls, and brief requirements easy to find.

These are implementation rules from the skill, not a claim that its installer or automatic detector ran. The chosen Linear surface values remain the user's visual reference; any values that conflict with the skill's anti-pattern checks should be adjusted while preserving that direction.
