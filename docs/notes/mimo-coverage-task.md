# MiMo structural coverage package

Date: 2026-10-24. Model: `xiaomi/mimo-v2.6-flash`, reasoning enabled.
Public task base: `84a944723467ebb791773ae4092da5329250fb10`.
Host application base: `f15bd02f13cdf11dd08bc871a90730b88662b459`.
Acceptance: [coverage-report-plan.md](coverage-report-plan.md).

## Result

MiMo completed the five authorized files: a pure report builder and JSON/Markdown
CLI, regression tests, npm scripts, authoring instructions and documentation
index. The initial exported patch applied cleanly. One complete MiMo follow-up
resolved the review findings; both exported patches were accepted without
Codex implementation edits.
Canonical source, ledger and browser runtime remain unchanged.

The report observes 7 regions,128 nodes,113 edge records,111 active edges,
2 withdrawn records,106 internal active edges,5 cross-chapter active edges,
6 conditions,22 uncertainties and0 conflicts. These counts do not establish
source approval, gameplay correctness, completeness or publication permission.

## Trusted verification

- Complete export: `partial:false`,51/51 runner checks passed; server stopped.
- Full patch scope reviewed before execution; `git apply --check` passed.
- Initial29 coverage-report tests passed as part of successful `npm test`.
- Final43 coverage-report tests and full structural validation passed after
  the follow-up; browser/runtime files remained unchanged.
- Full browser suite:76 passed,0 failed;6 row-group browser checks also passed.
- JSON and Markdown commands returned the expected canonical totals.
- `git diff --check` passed. User's unrelated local draft was preserved.
- Standards review:0 findings. Spec initially found three P3 cases: sparse-array
  validation, literal HTML in Markdown cells, and a truly empty-region fixture.
  One MiMo follow-up fixed all three; independent Spec review confirmed closure
  with no new findings in the limited diff.

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

## Follow-up and combined cost

The follow-up passed51/51 runner checks with a complete two-file export and
confirmed server shutdown. It used14 completions and cost USD0.012055032.
Combined implementation and review-fix API cost: **USD0.044560196**
(about4.456cents),39 completions. Reasoning was enabled in both runs.

Final hosted CI is associated with the reviewable coverage-report PR; no merge
or deployment is part of acceptance. The source/gameplay/publication limits
above continue to apply.
