# MiMo structural coverage package

Date: 2026-10-24. Model: `xiaomi/mimo-v2.6-flash`, reasoning enabled.
Public task base: `84a944723467ebb791773ae4092da5329250fb10`.
Host application base: `f15bd02f13cdf11dd08bc871a90730b88662b459`.
Acceptance: [coverage-report-plan.md](coverage-report-plan.md).

## Result

MiMo completed the five authorized files: a pure report builder and JSON/Markdown
CLI, regression tests, npm scripts, authoring instructions and documentation
index. The exact exported patch applied cleanly without implementation edits.
Canonical source, ledger and browser runtime remain unchanged.

The report observes 7 regions,128 nodes,113 edge records,111 active edges,
2 withdrawn records,106 internal active edges,5 cross-chapter active edges,
6 conditions,22 uncertainties and0 conflicts. These counts do not establish
source approval, gameplay correctness, completeness or publication permission.

## Trusted verification

- Complete export: `partial:false`,51/51 runner checks passed; server stopped.
- Full patch scope reviewed before execution; `git apply --check` passed.
- All29 new coverage-report tests passed as part of successful `npm test`.
- Full browser suite:76 passed,0 failed;6 row-group browser checks also passed.
- JSON and Markdown commands returned the expected canonical totals.
- `git diff --check` passed. User's unrelated local draft was preserved.
- Standards review:0 findings. Spec review found three P3 cases: sparse-array
  validation, literal HTML in Markdown cells, and a truly empty-region fixture.
  A single MiMo follow-up will resolve them before acceptance.

## API evidence

25 successful completions; API-reported cost **USD0.032505164** (about3.251cents).
Reported tokens:1,865,217 input,58,203 completion,47,330 reasoning.
Reasoning is included in the provider's completion accounting, not an additional
bill to add here. Conservative cumulative reserved capacity was USD3.80762088;
it was neither a bill nor a working-mode spending ceiling.

Working mode used the owner-authorized remaining-account policy without local
request, duration or reservation caps. Transport/isolation/model capacity limits
remained. No paid fallback, top-up, automatic merge or deployment occurred.
Raw diagnostics remain temporary local files and are not published with this note.
