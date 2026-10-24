# ra9-atlas — intent

Date: 2026-10-21. Status: record of the project owner's agreed intent; it is not implementation authorization or a production design.

## Problem

Players struggle to understand the later consequences of a current action.
Existing screenshots require repeated switching and zooming.

## Outcome

An interactive guide to all of Detroit: Become Human.
Players select an action, see its prerequisites, and follow its later consequences.
They move from an overview to details without losing context.
The overview is a large connected flowchart. Multiple choices, branches, and outcomes stay visible together. Selecting an event opens details beside the map and preserves its spatial context.

## Agreed scope

- English-only interface.
- Show a spoiler warning before the map. After consent, show the full map.
- Defer fog of war. Its future behavior is not defined.
- Mark disputed links clearly and show their sources.
- Show prerequisites alongside consequences. The map-first presentation is accepted; preserve the map while showing details.
- Cover the full game as the final goal. Small samples test the method, not replace that goal.
- An explicitly incomplete public preview is acceptable when coverage gaps are visible. Guide-supported or disputed claims may be shown with source and status; this does not make them gameplay-verified.
- Desktop is primary and mobile support is required. The first release has no images, analytics, or advertising trackers; image use requires rights clearance.
- Game simulation, save imports, and replay planning are outside the initial scope.

## Constraints

Check existing solutions before building a new one.
Record a go/no-go decision and its evidence after each stage.
Limit model usage. Save partial results.
Do not treat paraphrases or adapted game mechanics as verified game behavior.

## Open questions

- The full-product data contract and production stack, including stable permalink migration.
- The complete reconciled chapter and character-chart inventory, source coverage, and effort to fill documented gaps.
- A free static hosting provider with no server maintenance.
- Rights and permitted use for each source-derived item; MIT applies only to original project code and documentation.

See [spec.md](spec.md) for approved product requirements and [ROADMAP.md](ROADMAP.md) for the staged implementation plan and go/no-go gates.
