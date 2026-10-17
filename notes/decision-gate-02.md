# Gate 02 — scenario checks

Date: October 17, 2026. Check of requirements D1–D3 from `spec.md` 0.1.

**GO: a navigation mockup with explicit evidence statuses.**  
**HOLD: an exact public corpus and website implementation.**

| Example | Established | Open questions |
|---|---|---|
| D1: The Hostage, gun | Guides distinguish finding, keeping, and using the gun. | Completeness of all conditions, distance and dialogue order, and accuracy for the game build. |
| D2: Alice’s box → Todd | Sources describe a link between early knowledge and later dialogue. | Exact trigger: opening the box, viewing an item, or another node. Full set of later conditions. |
| D3: detour → bus | Guides say the outcome depends on time remaining. | Exact 11:00 boundary, independence of matching text, and in-game check of both outcomes. |

## Model decisions

- Actions, conditions, and outcomes are separate entities.
- A condition may depend on several earlier and later actions.
- Do not round or invent an unknown threshold.
- Store evidence type, exact source location, and unresolved questions for every connection.
- Do not count two matching guides as two independent observations.

## Orchestrator review

Both reports were read. The PowerPyx *A New Home* page was spot-checked: it does not state a Neutral threshold. The agent was asked to correct attribution. The D1 Intimidate/Convince sequence was clarified; for D3, the unknown equality case at the threshold was called out.

No example is marked “checked in game.” That is the limit of the current review, not an implicit success.

## Next step

Build an R1–R2 mockup using these three examples. Mark D2 as a guide-reported connection with unresolved conditions. The mockup check evaluates navigation; it does not prove game mechanics.

After the mockup, make a separate decision. The complete corpus still needs primary evidence and a policy for acceptable gaps.

## Reports

- [D1 and D3](verification-d1-d3.md)
- [D2](verification-d2.md)
