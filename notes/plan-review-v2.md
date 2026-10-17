# Independent review of plan v2

Date: October 17, 2026. Basis: `PREPARATION-PLAN.md`; external sources were not checked.

- **Conclusion:** the goal is sound. Set research boundaries and test usefulness before filling a complete guide.

## Material changes

- **Separate stages 1 and 2.** In the “Next package,” full source comparison starts before deciding whether a custom product is needed. Compare ready-made solutions first; build a chapter matrix only to the extent needed to check claimed coverage. Conduct a full source audit only after deciding to continue.
- **Replace the preliminary go/no-go with a concrete choice:** use an existing solution; investigate improving one; investigate a custom solution; or stop for one specified check. Record the rationale and next bounded package for each choice.
- **Check causality.** “Action → consequence” must show required earlier conditions, additional later choices, and alternative outcomes. A simple link to a later node is not enough. One of the three scenarios must test a conditional, not guaranteed, consequence.
- **Test usefulness before full data entry.** Between stages 4 and 5, add a short scenario test using a paper mockup or existing demo: the user finds a later consequence and understands its conditions while keeping context. Keep the test after the full guide too, but do not make it the first one.
- **Clarify outputs for other stages.** The table lists decisions but has few criteria. For the data method, three examples must be reproducible from sources and conflicts marked. For the full guide, every chapter must be accounted for, unknown links explicitly marked, and an acceptable gap limit set. Decide that limit during the grill.

## When the next research phase is complete

- Record search areas checked, independent solutions found, and reasons for excluding candidates; group forks. A bounded search is enough; there is no need to prove that no competitors exist anywhere online.
- Check the strongest available candidates against the same three concrete game scenarios. Record a result, exact link, and status for each criterion: checked, claimed by author, or unknown.
- For a candidate to adapt, check source availability and the licenses for code and data separately. Unknown rights do not count as permission.
- Preserve one decision backed by an identified gap if proposing a custom solution. List unresolved questions, how to check them, and the next package.
- Update `STATUS.md` and `AGENT-RUNS.md`; stop searching when more searches cannot change the decision.

## What to shorten

- Move SQLite, servers, models, and limits into working rules. Choose architecture after checking the need.
- Prepare the first grill from comparison results; do not make it a mandatory design stage if an existing solution already fits.

## Clarification after discussion

- **Supported:** HOLD on development, GO on a targeted check of `Baba88611/detroit-ai-player`. README claims are grounds to inspect the corpus, not proof it is suitable. JSON for 32 chapters does not establish complete branches and conditions.
- **1. Bound the package:** inventory 32 chapters and check three agreed scenarios against the data and independent sources; separately check state persistence and a conditional later consequence.
- **2. Check reuse:** match licenses to specific files and data provenance. Do not extend the runner’s MIT license to the corpus; assess CC BY-NC against intended use.
- **3. End with a data decision:** suitable for the next stage / suitable after specific fixes / unsuitable / one additional check needed. Continue a bounded comparison of ready-made guides: a good corpus lowers the cost of a custom UI, but does not by itself prove the UI is needed.
