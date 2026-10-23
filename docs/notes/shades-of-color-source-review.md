# Shades of Color preparation and independent source review

Date: 2026-10-23. Base: `8fb831301b78f5f54bf32d7a23a87f6d4a457b04` (PR #26).
Scope: the third preparation packet, not runtime integration or publication.

## Acceptance and result

- Inventory all twelve labeled boxes visible in the inspected chart images.
- Record only five continuous box-to-box connectors as chart edges.
- Preserve six detached icon-origin segments as unknowns, without inventing source boxes.
- Keep guide ordering, optionality and later consequences separate from chart topology.
- Require independent source approval, structural checks and a blocked publication gate.
- Preserve the complete runtime graph, existing identities and the user draft.

The separate source reviewer approved this bounded interpretation. The packet is
`reviewed`, coverage remains `partial`, and its merge gate remains `blocked`.
No runtime chart, geometry, permalink or published page changes in this package.

## Sources and access

[Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882)
by StongLory credits throwawaydeviant9 for original paths/screenshots and
Krystal109 for high-resolution images. The live page displays a removed-item
notice even though the page and images were accessible.

The [wide chart image](https://images.steamusercontent.com/ugc/1469813569888632243/9D4431A670A8AA5A0B5784ECE24FF763747247FD/)
is 3785×1148, SHA256 `60480bc17fe3b22cab0249359652593b52952020e7e163767374eb11badb18ca`.
The [alternate screenshot](https://images.steamusercontent.com/ugc/1333579200343343688/01531BEF397AD0B834B608DD4C18B903469084F5/)
is 1920×1080, SHA256 `16a265c79afc110db4bf6cbee37dbf8c278450738a0bbaa6ea3ebe32bd3fa266`.
Both were inspected locally by the extraction parent and separate source reviewer.
They show the same underlying chart and are not independent corroboration.
Raw images remain outside the repository.

[PowerPyx](https://www.powerpyx.com/detroit-become-human-shades-of-color-walkthrough-100/)
was inspected live by both reviewers. Its checkpoint bullets identify Markus and
report potentially avoidable harassment plus a later Carl comment. Exact trigger,
platform/build and gameplay behavior were not verified. Comment-level speculation
about busker/preacher prerequisites is not adopted. Guide research independence
from the chart is unknown. All sources remain reference-only.

## Visible inventory and topology

Twelve boxes: one checkpoint represented as `stage`, ten action/event boxes and
one chapter outcome. The chart says `READ "SECRET OF ANDROIDS"` in the singular;
the guide's plural magazine wording does not replace the chart label.

| Edge | Continuous source trace |
| --- | --- |
| `e_sc_park_store` | Walking in the Park → Visit Paints Store |
| `e_sc_store_package` | Visit Paints Store → Collect Package |
| `e_sc_package_bus` | Collect Package → Markus Took the Bus |
| `e_sc_vendor_push` | Stare at Hot Dog Vendor → Hot Dog Vendor Pushes Markus |
| `e_sc_preacher_yells` | Watch Preacher → Preacher Yells at Markus |

Five separate icons originate six other segments: vendor, busker, preacher,
protesters and the shared magazine icon's two branches. They do not visibly
originate at a declared box. No checkpoint-to-side-event, package-to-protesters,
protesters-to-bus or cross-chapter edge is invented. Unknown records preserve
fragment origins, global ordering, harassment eligibility/consequence and build.
The screenshot's 100% badge does not establish complete gameplay coverage.

## Independent review and implementation

The `shades_source_review` agent derived the visible inventory before reading the
packet, then compared all labels, node kinds, five connectors, six omissions and
four unknown records. It approved the partial source interpretation with no
substantive source defect. Source approval does not establish rights clearance.

OpenCode assembled the JSON from parent-inspected public facts through the
controlled runner from the public base SHA. All 49 runner checks passed and the
private server stopped. The model did not access sources itself. Parent patch
review corrected its draft/pending metadata and added a node/source reference
for the build unknown before validation. No isolation boundary changed.

The inventory now attributes Shades of Color to Markus using the directly
reviewed chapter source. Null-character entries fall from 23 to 22; runtime coverage
still says `not-added`. Preparation coverage and runtime coverage are separate.
See the [authoring workflow](../authoring-data.md) before any later graph edit.

## Standards

Separate review found no concrete implementation violation or material baseline
smell. Packet/source/publication boundaries, runtime `not-added` coverage and
existing identities are preserved. Its optional provenance clarification was
applied: the inventory now distinguishes the original index-only pass from this
bounded chapter-source exception.

## Spec

Separate review found the acceptance requirements implemented: twelve boxes,
five continuous connectors, unknown fragment origins, independent approval with
blocked publication, registered checks and no runtime change. Its one scope-wording
clarification matched the Standards note and is fixed. No functional finding remains.

Standards: zero implementation findings. Spec: zero functional findings and one
resolved provenance clarification. Both reviewers ran focused checks; source truth
was checked separately by the image/page reviewer above.

## Executed checks

Full `npm test` passed: 20 build tests, inventory regression, 94 contract, 44 unit,
4 map, 11 stable zoom, 12 layout, 59 packet, 6 Shades packet and 62 browser checks.
All three real packets pass structural validation. The reviewed Shades packet
still returns exit 2 with `--require-review` because publication remains blocked.
The last provenance/test-output edits passed the focused inventory and Shades
checks. No changed browser file justified another identical browser run.

`git diff --check` passed; 283 local Markdown links resolve. Canonical atlas,
compatibility ledger, generated graph and UI have no diff against the base.
The user's untracked draft retains SHA256
`f0a9eb2733ba7b3bcd886852dbd30fe093912f50351b1dd16a7eacae37998833`.
Hosted CI results belong to the draft PR checkpoint, not source approval.

## Hosted checkpoint

Draft [PR #27](https://github.com/zhiland/ra9-atlas/pull/27) targets PR #26.
[Ubuntu run 39952003660](https://github.com/zhiland/ra9-atlas/actions/runs/39952003660)
passed every step at implementation `380c09b2be24532641d1ee4ef15d4d220b75cd21`:
full npm/Chromium, runner 18 and preflight 8. The job took 11m56s, with most time in
browser dependency installation. It did not fail or require a retry.
The final report/journal checkpoint changes documentation only.
No merge or deployment occurred. Physical touch, Safari, assistive technology,
platform/build and gameplay verification remain outside this check.
