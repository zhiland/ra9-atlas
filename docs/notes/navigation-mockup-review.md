# Navigation mockup review

Date: 2026-10-18. Scope: static review of `prototype/navigation-mockup.html` against `../spec.md` R1–R2, Gate 02, and the navigation mockup brief. No browser or live interaction was used; no gameplay claims were verified.

## Finding and targeted recheck

- The initial draft could leave the URL fragment stale after Back, weakening R1 context restoration. The builder added browser-history snapshots and `popstate`/`hashchange` restoration. Targeted static inspection confirms both the in-page Back handler and URL restoration now use browser history state. The builder reports a Node harness covering in-page Back, browser Back, D2 navigation, and overview reload targets; I did not run a browser interaction check.

## Checked statically

- The event data keeps the D1 gun-find, keep/drop choice, and use/ending branches separate. D2 labels the box trigger unresolved, shows other prerequisites, and presents Todd outcomes as dialogue-dependent alternatives. D3 separates `<11`, `>11`, and exactly `11:00` as unknown; the conflict is separately labeled.
- Statuses appear on claim cards and navigation rows; the source panel gives named source sections, links, evidence/status wording, conflicts or unknowns where supplied, and unknown version/platform. The page labels its examples and incomplete coverage. No “in-game verified” wording was found.
- The spoiler cover precedes map content on initial load, including a direct event hash; consent is held only in page state. This is consistent with the brief’s exclusion of R4 testing, but persistence across reload is not tested.

## Limits

This is a static code review only. R1–R2 live journeys, keyboard/screen-reader behavior, rendered layout, and link destinations were not exercised. Source attribution and game mechanics were not independently rechecked.
