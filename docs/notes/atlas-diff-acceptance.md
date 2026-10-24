# Semantic atlas diff acceptance

Verified: 2026-10-24 UTC. Implementation specification:
[atlas-diff-plan.md](atlas-diff-plan.md). Base: main `df6d3fe`.

## Accepted behavior

The dependency-free report compares two source/ledger snapshots after validating
both with `compileSource`. It emits deterministic JSON or escaped Markdown,
covering six keyed collections, refs/detail, meta/canvas and retained legacy
index movements. Relative ordering is separate from additions/removals.
Report v1 rejects unsupported atlas-level fields rather than hiding changes.
It reads inputs only and does not approve source truth, gameplay, compatibility,
completeness, rights or publication. Canonical data and browser runtime are exact.

## Recovery and review

All three long worker attempts ended with client-exit failure; none is described
as a successful worker run. The first exported no changes. The second exported
a reviewed partial module, preserved at52e279f. The third exported the remaining
implementation, tests and documentation in exactly the five permitted files.
Codex reviewed those complete exports before execution and independently
established package completion against the specification. Partial-export status
alone was never acceptance evidence.

Standards review found one P2: compileSource admits unknown atlas fields but the
diff initially ignored them, allowing a false hasChanges:false. A regression
reproduced this; report-v1 validation now fails closed on either side. Direct
and canonical CLI tests cover it. Follow-up review closed the finding.
Spec review found no missing or incorrect requirement. Codex also added the
missing test-file final newline and corrected a spelling error.

## Trusted validation

-57 semantic-diff tests passed, including canonical comparison, ordering,
provenance/withdrawal changes, deep JSON semantics, invalid/sparse/duplicate IDs,
frozen inputs, no shared references, HTML/table escaping, both ledger failures,
unknown-field refusal and read-only behavior.
-Full local npm test passed, including browser suites and all earlier checks.
-git diff --check passed. User-local draft hash remains unchanged.
-Runner/config transport correction separately passed67 Python regressions,
independent review, native delayed-header A/B and53 live provider checks.

The host correction disables native header/overall deadlines only for explicit
MiMo working mode. OS/network rules, host-only credentials,300s upstream
socket-idle and16MiB response bound remain unchanged. The original header race
is reproduced and corrected. Later silent native-client exits remain unresolved;
this report does not claim generally reliable unlimited-duration worker runs.
See [failure and correction evidence](atlas-diff-run-failure.md).

## Reported charges

| Attempt | Cost reports / requests | API-reported USD |
| --- | ---: | ---: |
| Initial implementation, no export |13/15 |0.036165940 |
| Restart, partial module |9/9 |0.017950728 |
| Completion export |28/29 |0.036518088 |
| Corrected-route fixture, literal-JSON output failure |3/3 |0.000332628 |
| Clarified exact-byte fixture,53/53 checks |3/3 |0.000329896 |
| Known subtotal, including fixtures |56/59 |0.091297280 |

The known subtotal is about9.13US cents. Three requests lack cost reports, so it
is not a complete final bill. Reservation estimates are not charges. Reasoning
was enabled. Native synthetic A/B used no external inference. No paid fallback,
top-up or deployment was performed. Hosted CI is recorded on the resulting PR.
