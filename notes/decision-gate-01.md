# Gate 01 — ready-made solutions

Date: October 17, 2026.

**Decision: continue preparing a custom guide. Do not start development yet.**

No ready solution for the core use case was confirmed in the checked sample. This does not prove that no such solution exists anywhere online.

## What was checked

| Candidate | Check | Finding |
|---|---|---|
| [fschutt](https://github.com/fschutt/detroit-become-human-flowchart) | GitHub API, file tree, YAML, its only fork, and published browser demo | `chapters/` contains one file, The_Hostage.yml. The fork points to the same commit. The demo displays the README. It does not replace a guide for the whole game. No license was found. |
| [Detroit AI Player](https://github.com/Baba88611/detroit-ai-player) | File tree, three JSON files, state registry, license-boundary file | Contains 32 English chapter files. It adapts the game for AI experiments; it is not an exact game-flowchart database. |
| [PowerPyx](https://www.powerpyx.com/detroit-become-human-full-walkthrough-all-chapters/) | Index and selected text | Useful text source. The pages read include conditions, but do not provide one interactive traversal through a chain of consequences. |
| [Steam flowcharts](https://steamcommunity.com/sharedfiles/filedetails?id=2162781882) | Page, contents, attribution | Collection of images. It repeats the user’s original problem. Some materials come from Reddit and Neoseeker, so they are not independent confirmation. |
| [Agoxen](https://www.agoxen.com/detroit-become-human-walkthrough-flowchart-guide/) | Direct URL opened | The address redirects to a domain sale. The historical guide is not currently verified. |
| [Game Navigator](https://gamenavigator.raycraftlab.com/?lang=en) | Public product page | Assistant with installation and trial access. Detroit support is claimed. A complete graph is not confirmed in the public section. The product was not installed or checked. |
| Fandom / Detroit Become Text | Index and reading attempts | Potential text sources. Access is partial; completeness is unconfirmed. |

Search covered GitHub, fan guides, game sites, Steam, and Reddit links. The older project has one identical fork. Detroit AI Player has six forks; each fork’s content was not checked separately. A full fork audit and closed products are outside the scope of this limited decision.

## Three control scenarios

| Scenario | Observation | Status |
|---|---|---|
| The Hostage: find the gun and choose an action | fschutt has explicit clue nodes. AI Player reduces investigation to a general strategy, after which items become available. | Difference in level of detail confirmed. Full accuracy against the game was not checked. |
| A New Home → Battle for Detroit: Alice’s box and Todd | AI Player exports `ch04_opened_box` and uses it in `n013_bus_terminal`. But obtaining the key and opening the box are combined in one choice effect. | The data contains a link. The exact set of game conditions is not established. |
| Battle for Detroit: detour and bus | AI Player sets `detour → late`. PowerPyx allows on-time arrival when enough time remains. | Source conflict found. JSON is unsuitable for an exact guide without correction and independent checking. |

Link to [PowerPyx’s final chapter](https://www.powerpyx.com/detroit-become-human-battle-for-detroit-kara-walkthrough-100/), “Take Detour” section. The game itself was not checked.

## Decision on Detroit AI Player

**Do not use it as an authoritative corpus. Use it as a structural reference.**

- Metadata explicitly says it compresses location exploration and replaces QTEs with probabilities.
- In the checked files there are 12 The Hostage nodes, 4 A New Home nodes, and 19 Battle for Detroit nodes. These are model elements, not counts of game nodes.
- State labels and the export schema are useful for comparing approaches.
- [License boundaries](https://github.com/Baba88611/detroit-ai-player/blob/main/docs/legal/README.md): runner — MIT; JSON and registry — CC BY-NC 4.0. The MIT badge does not describe the whole corpus license.
- The game rights holders are explicitly excluded from the permissions granted. The corpus will not be included in a future product.

Saved public files are in `notes/evidence/`. These are research copies, not approved materials for a public repository. Review each file and its terms before publication.

## What remains unknown

- Whether a suitable guide exists among inaccessible or unindexed projects.
- The full set of game flowcharts, including separate later routes and post-credit scenes.
- The cost of preparing and checking an exact complete corpus.
- Whether conditional consequences can be presented clearly in one interface.

## Next bounded step

Run a grill with documents. Then test the method for preparing three examples and the user scenario with a paper mockup.

Proceed at the next gate only if conditions can be evidenced and the user understands the chain without switching screenshots. If this fails, change the method or stop custom development.
