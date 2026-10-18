# Map-first prototype check — R1–R2

Date: 2026-10-18. Artifact: [navigation-mockup.html](../../prototype/navigation-mockup.html). The previous [card-based check](navigation-mockup-check.md) is historical and does not validate this replacement.

## Result

- The overall canvas contains 25 nodes and 22 edges. It visibly separates D1, D2, and D3. Its only cross-chapter edge is the dashed **UNRESOLVED** Alice's box → Meet Todd hypothesis. No D1 → D3 or Todd → checkpoint edge exists.
- Three chapter canvases contain 17/18, 12/11, and 15/13 nodes/edges. Each uses the same pan, zoom, fit, search, minimap, selection, and side-panel controls.
- At overview zoom, short labels replace long node titles and metadata disappears. Detailed labels return when zoomed in. Small screens still need zoom and pan to read dense branches.
- The map and inspector state that this is an illustrative, guide-based sample. The D2 exact trigger and D3 exactly 11:00 outcome remain unresolved. Version and platform remain unknown.

## Checks performed

HTML parsed. JavaScript syntax passed `node --check`. A static graph check found no missing edge endpoints or nodes outside each declared canvas. `git diff --check` passed. A separate reviewer found no fabricated D1 → D3 edge and confirmed the unresolved and conditional edge styles are distinct; readability at fit prompted the short-label correction.

## Verification boundary

The local browser check was previously denied for `file://` with an explicit no-workaround instruction. This replacement was therefore **not rendered or clicked in a browser**. Pan/zoom behavior, visual layout, responsive behavior, keyboard access, and owner acceptance remain unverified in the target browser. The Steam reference images were downloaded into ignored `notes/evidence/` for OCR and visual comparison; no third-party image is embedded in the prototype. No gameplay transition was checked in the game.
