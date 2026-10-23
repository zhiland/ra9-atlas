# A New Home packet — independent source review

Reviewed: 2026-10-23 by a separate Codex source-review agent.
Baseline: `2334d583e5c6f7560ab90b6e872e53857104d0db`.
Scope: [the draft packet](../../packets/a-new-home.packet.json), its ten
selected chart nodes, nine claimed local connectors, two supplementary clues,
and key condition. The reviewer did not extract the packet.

**Initial verdict: changes requested.** All ten selected labels are present,
but two direct chart relations are wrong. One skips an intermediate box. The
other assigns the wrong origin to the second-floor conversation. Two node
kinds also turn stage containers into actions. Agreement with the existing
runtime and old project notes did not detect these transcription errors.

## Actual source access

| Source | Access on 2026-10-23 | Locator and limit |
|---|---|---|
| [Steam Community chart guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882), StongLory | Web page accessed. Existing ignored 6743×1300 primary image inspected whole and in two full-resolution crops. | Guide credits name throwawaydeviant9 and Krystal109. The removal notice remains visible. This review does not claim a fresh Steam image download. Image game build and platform are unknown. |
| [PowerPyx A New Home walkthrough](https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/) | Relevant live page text inspected through the web tool. Page dated 2018-05-24. | Under second-floor cleaning: nightstand clue and room ventilation. Under the Alice conversation: favorable choices, key, and box. Access-specific extracted lines 41–55 locate these items. No precise trust threshold is stated. |
| [GameFAQs/Mogg A New Home guide](https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/a-new-home) | Relevant page text accessed through the web tool. Guide version 1.8, updated 2018-10-15. | Under Clean Second Floor: window paragraph, bedside-table paragraph, and final key paragraph. Access-specific extracted lines 194–206. Prior guide order and trust statements remain source reports, not gameplay checks. |

Extracted line numbers are not publisher section numbers. Use the named
headings and paragraph subjects for repeatable textual locators. The PowerPyx
date is the page's stated publication date. Neither guide's exact game build
was established.

Primary image: ignored local
`notes/evidence/evidence/steam-a-new-home-reference.png`, SHA-256
`e559383398c4643e3bdef5c5d2e651484a8eb2a14138574b5ad4b1c2bfcc2e4b`.
All coordinates below refer to that 6743×1300 image, measured from its top-left.
Temporary crops and the source image are not added to the public repository.

## Per-edge chart verdict

| Packet edge / legacy index | Verdict | Visual locator and required interpretation |
|---|---|---|
| `e_home_welcome_todd` / 0 | Supported | x=70–1080, y=700–825. Continuous horizontal connector from arrival checkpoint to Todd action. |
| `e_home_todd_clean1` / 1 | Supported with node-kind correction | x=780–2080, y=700–825. The line enters the first-floor stage. Its large bracketed heading is a container, not an ordinary chore action. |
| `e_home_clean1_ask` / 2 | Unsupported as a direct pictured connector | x=2080–3030, y=700–825. `TAKE OUT TRASH` lies between the stage and asking permission. Separate connectors enter and leave that box. The draft silently compresses two connectors into one. |
| `e_home_ask_go` / 3 | Supported | x=2730–3720, y=700–825. Horizontal line from asking permission into the upstairs checkpoint. |
| `e_home_go_clean2` / 4 | Supported with node-kind correction | x=3180–4920, y=700–825. The checkpoint leads into the second-floor stage, another large bracketed container. |
| `e_home_clean2_room` / 5 | Supported as a stage/chore relation | x=3990–4920, y=700–1050. A branch from the stage reaches the Alice-room chore below. This is not proof of a universal prerequisite, a completed-stage requirement, or mandatory order among chores. |
| `e_home_room_talk` / 6 | Unsupported origin | x=3990–5430, y=700–1160. The main conversation line leaves the right side of the second-floor stage at approximately y=765. The room chore instead branches downward into ventilation and the discovered-route flag. It has no direct connector to the conversation. |
| `e_home_talk_key` / 7 | Supported, condition remains guide-reported | x=5100–5820, y=550–825. A branch from the conversation rises to the key flag. The chart does not encode a numeric relationship threshold. |
| `e_home_key_box` / 8 | Supported | x=5500–6200, y=550–625. Direct horizontal connector from the key flag to opening the box. |

Thus seven represented relations are supported within the stated container
semantics. Two are not valid direct chart traces. A partial packet may omit
branches, but it must not replace omitted intermediate structure with an
apparently exact connector.

The ten selected labels are legible, but the packet does not contain a faithful
ten-node linear path. Change `a_clean1` and `a_clean2` from `action` to `stage`.
Keep `a_room` an action and `a_key` a flag. Distinguish the packet's second-floor
conversation from the separate conversation inside the first-floor container.

## Supplementary clues and key condition

Both guides describe seeing a handgun in Todd's bedside furniture. They do
not describe taking or possessing it in this chapter. The packet's sighting
boundary is correct. Their different presentation of pills and drawer actions
must not become a universal eligibility requirement.

The window-opening event has the stated PowerPyx support. GameFAQs also
reports it, but the packet's narrower PowerPyx-only attribution is valid.
The packet models no later escape success or cross-chapter edge.

The key condition accurately preserves GameFAQs' non-numeric trust framing.
PowerPyx recommends favorable conversation choices. Neither passage supplies
an exact level. Preserve the unknown threshold and keep the condition attached
only to `e_home_talk_key`. These passages do not establish a complete rule table.

The guides give different chore orders and additional conversation advice.
Do not infer that room cleaning alone is sufficient for the conversation.
Those differences remain source-specific reports rather than a verified
contradiction about a game requirement.

## Independence and publication boundary

This is a separate review of the sources, not independent gameplay research.
The two guide publishers do not establish independence of their underlying
research. Steam's credits identify source lineage, not reuse permission.

All sources remain reference-only. Keep attribution and the
[source-derived license boundary](../license-boundary.md). No image, guide
corpus, or game transcript was added. Source approval cannot clear publication
rights, prove whole-chapter coverage, or verify gameplay. The publication
decision remains open under the [rights audit](source-license-audit.md).

## Correction criteria

1. Correct both stage kinds and identify the intermediate trash box explicitly.
2. Correct the two false direct traces. The chart path goes through the trash
   box before asking permission. The conversation originates at the second-floor
   stage, not the room-cleaning action.
3. Preserve existing runtime indices without silently retargeting their IDs.
   If compatibility requires retaining old compressed claims, label them as
   historical claims outside exact chart transcription. Do not merely relabel
   a known wrong connector as an unresolved exact trace.
4. Update the old OCR note and packet draft description so they no longer
   present the ten selected nodes as one faithfully transcribed direct path.
5. Append this review's source access, exact image locators, and support limits.
6. Retain partial coverage, omitted branches, threshold uncertainty, and the
   separate publication decision. Request an independent follow-up on the
   corrected packet and any runtime migration before approval.

The packet remains draft and unapproved at this review checkpoint. No packet,
runtime, tests, IDs, or merge gate were changed by this reviewer.

## Correction follow-up — 2026-10-23

**Final source verdict: approved within the corrected partial scope.**
The reviewer inspected the corrected packet, runtime data and
[withdrawn-claim decision](../adr/0001-withdrawn-edge-permalinks.md), then
reinspected the two primary-image crops against the original coordinates.
The review covers source interpretation and recorded migration data. It does
not certify browser behavior, visual geometry, gameplay, or publication rights.

| Corrected record | Source-data result |
|---|---|
| `a_clean1`, `a_clean2` | Both are now stages, consistent with the bracketed headings. |
| `a_take_out_trash` | Existing runtime node reused. Its title-case label is an explicit normalization of the chart label, not a different event. |
| `e_home_clean1_trash`, index 93 | Supported: the first-floor stage's outgoing connector reaches the trash box in x=2080–2570, y=700–825. |
| `e_home_trash_ask`, index 94 | Supported: a separate connector leaves the trash box for asking permission in x=2280–3030, y=700–825. |
| `e_home_clean2_talk`, index 95 | Supported: the main connector leaves the right side of the second-floor stage and reaches the conversation in x=4890–5430, y=700–825. |
| `e_home_clean1_ask`, index 2 | Withdrawn historical compressed claim. Original ID and endpoints retained, with both replacement IDs recorded. Excluded from the packet's chart relations. |
| `e_home_room_talk`, index 6 | Withdrawn historical wrong-origin claim. Original ID and endpoints retained, with the stage-origin replacement recorded. Excluded from the packet's chart relations. |

The seven supported relations from the initial table remain unchanged. Together
with the three corrected relations they form ten selected chart relations
among eleven selected nodes. This selection does not include the complete
chapter or its final cleaning endpoint. The stage-to-room branch explicitly
does not assert mandatory chore order or sufficient conversation eligibility.

The original 93 runtime edge identities, endpoints, option indices and array
positions were compared with baseline `2334d58` and remain intact. Three new
records append. The two withdrawn claims are historical records rather than
active source-backed connectors. These data checks support migration identity,
not independent validation of the user-interface withdrawal notices.

The key condition, gun-sighting clue, and window-opening clue retain the source
support and boundaries recorded above. The exact trust threshold is unknown.
No source conflict, gun possession, later escape success, or complete chapter
coverage is invented. Source records preserve the worker's historical
`not-accessed` outcomes and append the separate inspection on 2026-10-23.
The old OCR chain is corrected and the original packet draft is labeled as an
extraction checkpoint instead of evidence for the superseded topology.

The packet is now `reviewed` and its independent source review is `approved`.
Its merge gate stays `blocked` because the source-derived publication decision
remains unresolved. The remaining uncertainty and reference-only rights states
are part of this approval's boundary, not claims of legal or gameplay clearance.
