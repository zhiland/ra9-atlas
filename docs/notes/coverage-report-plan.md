# Structural coverage report implementation

Date: 2026-10-24. Public implementation base: `84a9447`.
Assigned to MiMo through the canonical isolated working mode.

## Acceptance

Add dependency-free `tools/data/coverage-report.js` with a pure
`buildCoverageReport(atlas)` export and a CLI that has no import-time side effects.
Keep canonical data, generated browser data, identities and source claims exact.

The versioned report contains totals and chapter rows in source order. Count
regions, nodes, edge records, active/withdrawn edges, internal/cross-chapter active
edges, conditions, uncertainties and conflicts. Chapter rows include identity,
name, declared coverage status/scope, node count, internal active edges, incoming
and outgoing cross-chapter active edges, and withdrawn records assigned once by
their source chapter. Active means `kind !== 'withdrawn'`, not confirmed gameplay.
Do not infer per-chapter uncertainty attribution or chart completeness.

Validate arrays/IDs, duplicate chapter/node IDs, unknown node chapters and dangling
edge endpoints. Do not mutate inputs. The CLI validates the source/ledger through
the existing `compileSource` before counting. Default output is deterministic JSON;
`--markdown` produces an escaped table with totals and verification limits.
Support `--source PATH` and `--ledger PATH`; reject unknown flags, missing values,
missing files and stale ledgers. No timestamps, absolute paths or file writes in
normal output. Structural inventory does not approve sources, gameplay or release.

Add meaningful small-fixture, empty-region, internal/cross/withdrawn classification,
no-mutation, malformed-input, canonical-count and CLI/no-rewrite regressions in
`tests/coverage-report.test.js`. Add `coverage:report`, `coverage:report:md` and
`test:coverage` npm scripts; include the new tests in `npm test`. Document commands
and limits in `docs/authoring-data.md` and `docs/README.md`.

Those five files are the only model-authorized edits. Raw logs remain local.
Codex reviews the exported patch and executes trusted tests before acceptance.
Current canonical observations are 128 nodes,113 records,111 active,2 withdrawn,
106 internal active,5 cross-chapter active,7 regions,6 conditions,22 uncertainties
and0 conflicts. They are not a full-game completeness claim.
