# Author the atlas in versioned JSON and generate the browser script

Accepted 2026-10-23. `data/atlas.source.json` is the canonical graph-authoring
bundle. Its `format` and numeric `version` identify the source contract. It
preserves the complete current atlas, including evidence, layout, conditions,
unknowns and withdrawn history. Generate the classic `const ATLAS` browser
script deterministically so direct file opening needs no fetch or runtime dependency.

The reviewed packets remain preparation/evidence gates. They do not automatically
replace runtime ownership or approve all graph claims. A reviewed packet leads
to an explicit source edit, structural validation, generation and reviewed diff.
The canonical JSON owns that source edit; `prototype/atlas-data.js` is generated.
Existing source uncertainty and publication gates do not change during migration.

`data/legacy-index.json` records the existing node order and edge identities,
endpoints, option indices and positions. Build validation requires exact agreement.
Append new records deliberately to both files; never silently reorder, retarget or
reuse an old identity. Use withdrawn records for rejected claims. Keep current
`?edge=N` output and stable-ID input aliases while a later permalink migration is
specified. This preserves existing browser behavior instead of coupling a data
ownership change to a URL change.

The existing validator still carries bounded sample and source-regression fences.
New chapter batches must extend those reviewed fences. This decision establishes
an authoring/build contract, not a universal gameplay rules engine or automatic
packet merger. No backend, database or new runtime framework is introduced.
