# Chapter and character-chart inventory reconciliation

Date: 2026-10-23. State: **partial**.

The two source indices reconcile at the heading level. They do not establish a complete in-game character-chart inventory. The machine-readable result is [chapter-inventory.json](../../data/chapter-inventory.json).

## Sources and access

| Source | Access result | Scope inspected |
|---|---|---|
| [Steam guide 2162781882](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882) | Page text accessible. Steam displays a removed-item notice. | Guide Index, matching body headings and credits. No images retrieved. |
| [PowerPyx chapter index](https://www.powerpyx.com/detroit-become-human-full-walkthrough-all-chapters/) | Index text accessible. | Chapters list and the author's 2018-06-03 reply about Opening. Linked chapter corpora were not retrieved. |
| Local runtime and preparation records | Files accessible. | `prototype/atlas-data.js` chapter metadata, Hostage and A New Home packet coverage, and `docs/SOURCES.md`. |

A separate Python request for PowerPyx link metadata failed at host DNS resolution inside the restricted shell. The successful web-tool index access supports the recorded headings and shared targets. The shell failure does not establish a website outage.

PowerPyx is the primary record of its own index, and Steam is the primary record of its own headings. Both remain secondary sources about the game. Steam credits StongLory as guide author, throwawaydeviant9 for paths/screenshots, and Neoseeker's Krystal109 for high-resolution images. Independence between these publishers and PowerPyx is unknown.

## Counts and reconciliation

| Unit | Count | Interpretation |
|---|---:|---|
| PowerPyx numbered chapter rows | 32 | Chronological ordering convention used by this inventory. |
| PowerPyx chapter/character link occurrences | 36 | Crossroads and the finale each add two links within one numbered row. |
| Unique PowerPyx chapter-guide targets | 35 | Opening and Hostage share one target. The separate Jericho graffiti link is excluded. |
| Steam early chapter headings | 28 | All earlier named chapters except Opening. |
| Steam Crossroads headings | 3 | Separate character headings. |
| Steam Night of the Soul headings | 2 | Two character headings under one shared PowerPyx chapter link. |
| Steam finale headings | 6 | Two route headings for each of three characters. |
| Total Steam chart/route headings | 39 | Source entries, not a certified in-game chart count. |
| Runtime regions associated | 5 | One checked-against-chart region and four partial regions. |
| Early entries without character attribution | 23 | `character: null`, pending targeted source evidence. |

Opening explains the difference between 32 numbered chapters and 31 chapters with Steam chart headings. PowerPyx's author describes Opening as a cutscene without tasks. The inventory keeps its chapter row and an empty `charts` array. This records the two indices, not direct game observation.

Crossroads has three character headings. Their Steam display order differs from PowerPyx's link order. Neither order creates extra chronological chapters.

Night of the Soul has two character headings in Steam and one chapter link in PowerPyx. The finale has three PowerPyx character links and six Steam character/route headings. The JSON retains each route heading within chapter 32. It does not count those alternatives as additional chapters.

## Schema interpretation

IDs use stable lowercase hyphen strings. Chapter `order` follows PowerPyx's 32-row convention, including Opening. Source capitalization and punctuation remain in per-source locators. Canonical chapter titles follow PowerPyx. Locators are source-specific objects with a heading and location, so capitalization differences remain traceable.

A `charts` entry represents a source-index heading at this stage. Its `kind` distinguishes an unsplit source entry, an explicit character heading, and a character/route heading. It does not assert that one heading always equals one in-game chart.

A non-null character needs evidence from an explicit index title or the existing scoped runtime record. Twenty-three early headings name no character. The inventory leaves them unresolved. Last Chance, Connor names its character in its heading. Existing runtime evidence identifies the four early represented regions.

The finale `route` field preserves the route distinction. It does not encode route eligibility. Opening has no fabricated chart. No chart images or story knowledge were used to fill missing characters or subdivisions.

## Existing runtime coverage

| Inventory entry | Runtime ID | Coverage boundary |
|---|---|---|
| The Hostage | `hostage` | `checked-against-chart` only for the documented visible screenshot. The existing packet records 33 boxes, 40 labels, 36 pictured connectors and 37 model claims. It retains uncertain connector readings. |
| A New Home | `home` | `partial`. Selected chart and guide events. |
| Stormy Night | `stormy` | `partial`. Selected guide routes and states. |
| Public Enemy | `public-enemy` | `partial`. One saved-cop meeting node. |
| Finale Kara Leaving Detroit route heading | `kara` | `partial`. Existing checkpoint and bus-terminal slice only. |

The Kara Captured heading has no runtime association. Every other heading remains `not-added`. Hostage's source review does not extend to other charts, gameplay verification, or publication permission.

## Exact open gaps

1. Confirm character attribution for the 23 entries whose `character` is null.
2. Check whether unsplit early headings hide separate character charts. On the Run is an explicit unresolved subdivision case.
3. Check actual chart identifiers and boundaries for the six finale route headings and the two Night of the Soul headings.
4. Confirm Opening's chart status against direct game evidence if an in-game census is required.
5. Resolve source-rights and publication decisions separately. This inventory provides no new permission.

These gaps prevent `reconciled-source-indices` from implying a complete character-chart inventory. A future revision can close them with targeted evidence. It must preserve the difference between source headings and game charts.

## Rights and validation

Only index metadata, short titles, source URLs, attributions and original reconciliation notes were added. No screenshots, transcript, walkthrough prose, node topology or raw guide corpus was saved. The [license boundary](../license-boundary.md) and [source audit](source-license-audit.md) still apply. The repository MIT license does not grant rights in third-party metadata selection, expression or underlying game material.

A local structural check parsed the JSON and confirmed 32 contiguous chapter orders, 39 heading entries, unique stable IDs, resolvable source references and exactly five runtime associations. It also confirmed one checked-against-chart entry, four partial entries and 34 not-added entries. This check proves internal consistency only. It does not verify game inventory or source truth.
