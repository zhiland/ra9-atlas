# Canonical atlas authoring and deterministic generation

Decision: [ADR 0002](adr/0002-canonical-atlas-source.md).
The authoring bundle now owns graph edits. The browser artifact remains a static
classic script, with the same graph, UI and file-open behavior.

## Files and contract

- `data/atlas.source.json`: `{format: "ra9-atlas.atlas-source", version: 1, atlas: {...}}`.
  The nested atlas preserves the current [sample contract](data-contract.md).
- `data/legacy-index.json`: `{format: "ra9-atlas.legacy-index", version: 1, nodes: [...], edges: [...]}`.
  Nodes list stable IDs in order. Each edge records ID, endpoints and nullable
  `fromOption` in its legacy array position. Withdrawn records keep that position.
- `prototype/atlas-data.js`: generated artifact, not the graph editing surface.
- `tools/data/build-atlas.js`: dependency-free validator and generator.

The generator rejects unknown format/version, malformed ledger entries, identity
or order drift, and any existing atlas validation failure before writing output.
Generation preserves all admitted atlas fields. The reserved JavaScript literal key
`__proto__` is rejected recursively to prevent silent prototype conversion. It adds no evidence or approval.
The compatibility ledger is versioned review material, not an invitation to
rewrite both files to hide a breaking change. Existing regression fixtures pin
published identities and the separate withdrawal policy.

## Commands

```sh
npm run build:data
npm run check:generated
npm run test:build
npm test
```

`build:data` writes the browser artifact after validation. `check:generated`
compares the exact deterministic output and fails on missing or stale files
without writing. It is part of normal validation and CI.

## Structural coverage report

`tools/data/coverage-report.js` is a dependency-free, read-only reporter. It
re-runs the same `compileSource` validation as generation (format, ledger
identity and the full atlas validator) and then counts graph structure. It
never writes anything: no input file, generated artifact or default report
file is created or modified.

```sh
npm run coverage:report     # versioned JSON report on stdout
npm run coverage:report:md  # readable Markdown totals and chapter tables
npm run test:coverage       # reporter regression tests (also part of npm test)
```

Flags: `--markdown` selects the Markdown rendering; `--source PATH` and
`--ledger PATH` choose the input files (defaulting to the committed bundle).
Unknown flags and missing flag values are rejected. Output is deterministic:
no timestamps or absolute paths, and chapter rows follow source chapter order.

The report is a structural inventory only. Its counts are observations of the
committed source structure — never source approval, gameplay verification,
completeness evidence or publication permission. Declared per-chapter coverage
status and scope are copied, not inferred. Conditions and uncertainties appear
as totals only and are never attributed to chapters. Cross-chapter active
edges stay out of internal counts, and withdrawn records preserve history
without counting as active.

## Semantic atlas diff

`tools/data/atlas-diff.js` is a dependency-free, read-only reporter for Stage 2
authoring and review: it compares two independently validated snapshots of the
inner `source.atlas` object and records structural differences without losing
provenance or silently changing identity. The coverage report counts one
snapshot; this diff answers the separate review question of what changed
between a BEFORE bundle and an AFTER bundle. It never decides which snapshot
is true or approved.

```sh
npm run diff:atlas -- --before-source before.json --before-ledger before-ledger.json --after-source after.json --after-ledger after-ledger.json
npm run diff:atlas:md -- --before-source before.json --before-ledger before-ledger.json --after-source after.json --after-ledger after-ledger.json
npm run test:diff       # diff regression tests (also part of npm test)
```

All four input flags are required: `--before-source PATH`,
`--before-ledger PATH`, `--after-source PATH` and `--after-ledger PATH`.
`--markdown` selects the Markdown rendering; default output is JSON on stdout.
Unknown flags, missing flag values and missing required flags are rejected.
Each source/ledger pair passes the same `compileSource` gate as generation —
envelope shape, ledger identity and the full atlas validator — before any
diffing; generated JavaScript is never evaluated. An equal or a changed input
pair both exit 0. Unreadable files, invalid JSON, envelope failures and stale
BEFORE or AFTER ledgers exit nonzero, print the error to stderr and write no
report to stdout. The tool never rewrites an input file, the generated
artifact or any default report file.

### Report schema — format `ra9-atlas.semantic-diff`, version 1

- `hasChanges`: true when any added, removed, changed, reordered or legacy
  index-movement case was observed.
- `collections`: one entry per keyed array (`chapters`, `nodes`, `edges`,
  `conditions`, `uncertainties`, `conflicts`), each with `added` IDs,
  `removed` IDs, `changed` entries `{id, fields}` listing top-level changed
  field names, and a `reordered` boolean.
- `refs` and `detail`: `added`/`removed` keys plus `changed` entries
  `{key, fields}` where both values are records; when a value is a scalar or
  changes type, the explicit marker `(value changed)` replaces field names.
- `meta` and `canvas`: `changed` top-level field names.
- `legacyIndexChanges.nodes` and `legacyIndexChanges.edges`:
  `[{id, before, after}]` for retained IDs whose array indices moved, sorted
  by ID.
- `note`: the structural-only limits statement.

Report version 1 supports exactly the six keyed arrays plus `refs`, `detail`,
`meta` and `canvas`. Unsupported atlas-level fields on either side fail closed,
even if generation accepts them; the diff cannot silently omit future sections.

Both sides are validated before any comparison: dense arrays, nonempty string
IDs, no duplicate ID within an array and the required object shapes, with
errors identifying side, collection and index. Neither input is mutated and
the report shares no object references with either input.

Ordering is deterministic and locale-independent: identifiers, keys and field
lists use stable lexical (UTF-16 code-unit) order, and the report carries no
timestamps or absolute paths. Deep comparison ignores object key insertion
order, respects array element order and treats an absent field as different
from an explicit `null`. `reordered` follows the relative order of IDs common
to both arrays, so additions, removals and appends alone are never reordering.

`legacyIndexChanges` exists because legacy `?edge=N` permalinks address array
indices; a moved index is reported as an observation for review, never as a
judgment of either snapshot. Markdown output escapes `&`, `<`, `>`, table
pipes, backslashes and newlines, emitting only its own `<br>` line breaks.
The report states structural differences only: no approval, no compatibility
or publication permission, no gameplay verification and no release-readiness
claim.

## Change flow

1. Extract or correct a preparation packet and complete separate source review.
2. Make the bounded graph edit in the authoring bundle, preserving source limits.
3. Add reviewed new identities to the ledger. Preserve old records or withdraw
   them explicitly. Never reassign an old array position.
4. Generate, validate and inspect the resulting diff. Run appropriate tests.
5. Keep publication/merge decisions separate from source and structural checks.

The three reviewed packets remain separate preparation documents. They
are not blindly merged into the authoring bundle. Most other chapter regions
remain partial and unreviewed as complete charts. The existing validator has
sample-specific content and layout fences; a new content batch must extend
those fences through review instead of disabling them to obtain a passing build.

A future source-format version must include an explicit migration and preserve
legacy link behavior. Stable edge IDs already work as input aliases. Changing
canonical output from `?edge=N` is a separate decision.


The [Shades integration](notes/shades-runtime-integration.md) exercises the next
step: explicit packet-to-graph integration, appended compatibility records,
generated output, old-layout preservation and dedicated source fences. It adds
no automatic packet merger and retains blocked source-derived publication gates.

The [Painter opening integration](notes/painter-runtime-integration.md) repeats
this workflow for a seventh partial region, retaining every old graph object and
all compatibility records. Packet approval still grants no publication permission.
