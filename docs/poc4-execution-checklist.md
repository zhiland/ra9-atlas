# PoC4 execution checklist

Historical checkpoint. For current requirements and work order, use [the specification](spec.md), [roadmap](ROADMAP.md), and [status](STATUS.md).
The statements below describe the original package, not the current repository state.

Status: PoC4 implementation and bounded content slices complete; focused review and checks recorded in [STATUS.md](STATUS.md) and [PoC4 coverage](notes/poc4-coverage.md). Current checked graph: 45 nodes, 49 edges. This historical checklist records the original implementation boundaries; later notes record the added Stormy Night routes and ordered entry sequence.

## Steps

1. Read the curated scope before this file existed (plan, ledgers, source register, README, STATUS, tracked prototype files).
2. Save this checklist before implementation (this commit).
3. Re-check cited pages where reachable (PowerPyx *Battle for Detroit — Kara*; the user-provided Fandom page) and record inspection limits. Keep the Fandom sequence a user-provided secondary-source claim, separate from the unresolved Alice-box trigger.
4. Shared data — `prototype/atlas-data.js`: A New Home selected sequence (Steam screenshot transcription), Stormy Night selected state only (no inferred internal topology), Battle for Detroit — Kara meeting branch; two labeled prerequisite gates into "Meet Todd"; one dashed unresolved box hypothesis; per-node/edge status and cited sources; counts asserted by the validator.
5. Shared core — `prototype/atlas-core.js`: consent, chapter jump, node selection, trail/history, hash round-trip, and both close-details paths as pure, testable functions.
6. Shared app and stylesheet — `prototype/atlas-app.js`, `prototype/atlas.css`: whole atlas visible after consent; pan/zoom; details that never replace the map; search; trail; orthogonal arrow connectors; uncertainty as dash pattern + text and a question marker on the unresolved hypothesis.
7. Entries — `prototype/poc4-editorial.html` (neutral gray default, following PoC3), `prototype/poc4-amber.html` (warm amber neutral), `prototype/poc4-darkcyan.html` (dark cyan); each loads the same data/core/app and differs by palette attribute.
8. Data checks — `prototype/validate-atlas-data.js`: unique ids, endpoints/kinds, counts, both gate edges into `k-meet` labeled, box→meeting having no confirmed edge, survival state reaching the positive outcome, killed state not reaching Kara outcomes, canvas/overlap/route checks.
9. Unit checks — `tests/atlas-core.test.js`: consent, chapter jump, cross-chapter selection, trail/history cap + dedupe, hash round-trip, close button and Escape reducing to the same state.
10. Browser checks — Playwright headless if installable; otherwise a documented fit-for-purpose harness. Exercise spoiler consent, chapter jumps, cross-chapter conditions, both detail-close paths, all three variants, and text/background contrast.
11. Docs — evidence/coverage note `docs/notes/poc4-coverage.md` (included chapters, omitted parts, source types, unresolved claims), README + STATUS updates.
12. Run every check; stage only intended public files; local commits on `poc4-implementation`; no push.

## Boundaries (binding)

- No gameplay-verification claim anywhere; game version and platform stay `unknown`.
- No inferred Stormy Night internal topology; selected states only, marked partial.
- The box/photo relationship stays dashed + `?` + "UNRESOLVED"; separate from the Todd-survival and bus-terminal prerequisites.
- The Fandom sequence ("Persuade Todd", "Todd sends soldiers away", "Alice says goodbye to Todd") is attributed as a user-provided secondary-source claim.
- The checkpoint-detour timing segment (D3) is outside this slice; named as an omission in the coverage note.
- PoC2/PoC3 prototype files stay untouched; raw prompts and logs stay local and ignored.

## Verification record

Historical record: implementation completed 2026-10-18; updated 2026-10-19 with source-license audit, arrow connectors, neutral-gray default, and the test results at that time. Counts below describe the initial slice; the current 45-node/49-edge inventory and test totals are in [PoC4 coverage](notes/poc4-coverage.md) and [STATUS](STATUS.md).

**Passed**

- `node prototype/validate-atlas-data.js` — all graph/layout/routing/inventory checks. Inventory: 3 chapters, 18 boxes, 16 connectors (12 traced + 1 reported condition + 2 prerequisite gates + 1 unresolved hypothesis; 2 cross-chapter).
- `node --check` on all new scripts and validators — syntax OK.
- `node tests/atlas-core.test.js` — 25/25: consent, chapter jump, selection, trail cap 8 + dedupe, both close paths reducing to one state, reset, hash round-trip for all 18 nodes, and the key data invariants (two separate gates into `Meet Todd`, box hypothesis not a gate, terminal negative state, confirmed reachability of the positive outcome without the hypothesis).
- `npm test` — all project validators, 25/25 unit checks, and 42/42 Playwright checks (14 checks × 3 palettes) pass. Browser checks cover consent, whole surface, cross-chapter labels/gates, chapter jumps, both close paths, focus restore, history, search, deep links, arrowheads, absence of prerequisite diamonds, and sampled text contrast ≥ 4.5:1.

- Earlier browser run was blocked in the sandbox when Chromium launch failed before page load: macOS denied `bootstrap_check_in` (`Permission denied (1100)`). The locked Playwright dependency was installed in the main checkout and the browser suite then passed using normal permission escalation. This is a current-session rerun.
- During browser-test development, initial selector/assumption errors were test defects and were fixed. One visual defect was found in historical screenshot review and fixed in `atlas-app.js`: the legend overlay covered a focused chapter's title; chapter fits now reserve top padding.

**Unrun / not claimed**

- No gameplay verification of any transition; game version and platform stay `unknown`.
- No real pan/zoom/fling gesture or touch testing; no keyboard traversal beyond Escape; no screen-reader or mobile-width testing; no browser other than headless Chromium.
- Targeted independent review of attribution, uncertainty, topology and defects has not yet happened; nothing is pushed.
