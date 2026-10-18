# PoC3 design review — The Hostage

Date: 2026-10-18. Scope: design direction and independent review criteria for a complete, Steam-faithful map of one chapter. This note does not claim that implementation or source verification is complete.

## Exact design reference

[Refero: Apple iPhone Duo](https://styles.refero.design/style/a73148b9-449b-42cd-9f38-86ef694f500e), read 2026-10-18. Its useful traits are a quiet gallery canvas, restrained ink/gray/blue palette, compact controls, clear type hierarchy, hairline dividers, flat surfaces, and no unnecessary shadows. Palette roles: white `#fff`, mist `#f5f5f7`, ink `#1d1d1f`, secondary `#707070`, divider `#d6d6d6`, link blue `#0066cc`.

The graph is not a product landing page. Apply the reference's restraint and hierarchy; do not carry over its hero, purchase controls, oversized cards, 28px media frames, or spacious editorial sections. The Steam screenshot is the geometry/completeness reference: broad left-to-right graph, nested stage groups, simultaneous branches and outcomes, thin orthogonal connectors.

## Proposed rules for this map

- Let the chapter graph occupy almost all available space. Keep its left-to-right authored structure, stage groupings, branch splits, joins, and terminals visible together at fit-to-chapter scale.
- Keep a quiet, single-color canvas and flat toolbar. Use the existing map direction's dark palette if retained, or map Apple ink/white/mist roles consistently; do not mix both palettes. Reserve one restrained blue for selection and links.
- Separate stage containers, event/action nodes, choice nodes, and terminal outcomes by hierarchy and shape. Use compact 13–15px labels, 11–12px metadata, moderate 8–12px corners, and subtle stage backdrops. Avoid a card-stack impression.
- Draw thin neutral orthogonal edges. Selected route and immediate neighbors may brighten; preserve all other edges and branches. Use explicit text/shape cues for outcome/status; color alone is insufficient.
- Keep chapter selector, search, fit, zoom, and minimap in quiet utility chrome. A fixed detail panel may show selected-node details and source provenance without covering or replacing the graph.
- Do not add story facts or claim completeness beyond the specific Steam chapter image and checked transcription. Label ambiguous or unsupported edges as unresolved.

## Guidance sources and status

- Applied as design guidance: [Impeccable SKILL.md](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md), [Operate mode](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/operate.md), and [craft floor](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/craft-floor.md), read 2026-10-18. Relevant rules: task-first scanability, restrained product color, familiar controls, consistent interactive states, and checking the rendered result at its intended size. No files or hooks were installed.
- Applied as content/geometry evidence: [map-reference-analysis.md](map-reference-analysis.md), which records a manually checked partial OCR of the Steam *The Hostage* screenshot. It explicitly does not establish all gameplay branches.
- Proposed here for PoC3: the concrete node hierarchy, restrained blue selection, and persistent detail-panel treatment above. These are design recommendations pending rendered review.

## Independent review checklist

Compare every label and visible connector against the full-resolution Steam *The Hostage* screenshot and checked transcription. Count visible node boxes and terminals, check for omitted isolated or edge-less boxes, verify every displayed edge endpoint, and flag uncertain crossings instead of inferring links. Inspect the rendered fit-to-chapter view for cut-off branches, unreadable labels, overlapping edges, or chrome that competes with the graph. Do not claim direct gameplay verification or full-game coverage.
