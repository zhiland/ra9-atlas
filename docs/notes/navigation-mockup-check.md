# Navigation mockup check — R1–R2

Date: 2026-10-18. Artifact: [navigation-mockup.html](../../prototype/navigation-mockup.html). This is a throwaway, three-case example, not the full game guide.

## Use

Open `prototype/navigation-mockup.html` locally. Accept the spoiler warning. Select a chapter and an event. Use **Required earlier**, **Later consequences**, **Previous view**, and **Chapter overview** to test the journey. A direct `#meet-todd` link still shows the spoiler warning before the event.

## Verification record

| Check | Expectation | Observation and evidence | Verdict |
|---|---|---|---|
| R1 navigation | Select chapter, open event, return with chapter selected | Node harness exercised chapter selection, event opening, in-page Back, browser Back, and return to overview. URL fragment and rendered state matched after each transition. | Static pass; browser acceptance pending |
| R2 navigation | Follow D2 in both directions without promoting conditional outcomes to guarantees | Reducer followed `alice-box` → `meet-todd` → back. Each link has an evidence badge; Todd outcomes are separate and depend on later dialogue. | Static pass; browser acceptance pending |
| D1 | Keep finding, lying, and using gun separate | Fixture has distinct `gun-find` → `gun-answer` → `gun-use` events and a truth/drop branch. | Fixture check pass |
| D2 | Preserve uncertain exact trigger | Fixture labels the box/photo/dialogue trigger unresolved. Its former "Neutral or higher" key claim was later removed after full-text review; current data says the exact relationship level is unstated. | Historical fixture check superseded |
| D3 | Preserve both detour branches and unknown equality | Fixture shows `<11`, `>11`, and `=11:00 unknown` as separate claims, plus Supersoluce unclarity. | Fixture check pass |
| Evidence | Every claim and event link has a status; references resolve to URLs | Static script checked all link targets, claim statuses, and referenced URLs. JavaScript syntax check passed. | Static pass |

Browser Use rejected opening the local `file://` URL because it permits only `http:` and `https:`. Its response also forbade workarounds for that blocked action. Therefore visual layout, actual clicking, keyboard use, and responsive behavior were **not checked in a browser**. The mockup awaits owner acceptance of the R1–R2 journey and a permitted browser check. No gameplay transition was verified; platform and game version remain unknown.

Static review found that the first draft could leave the URL fragment stale after Back. The mockup now stores each view in browser history and restores it on `popstate` or `hashchange`. A Node harness checked URL/view agreement after in-page Back, browser Back, and an overview URL used as a reload target. This is a model check, not a browser interaction check.
