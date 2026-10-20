# PoC4 content expansion slice

Updated: 2026-10-20. This note records a bounded addition to the existing
three-region sample. It is not full chapter coverage or gameplay verification.
The subsequent [Stormy Night escape slice](stormy-escape-slice.md) adds two
successful non-gun routes; this note remains the record of the earlier
checkpoint/gun/window-availability expansion.

## Added graph claims

| Claim IDs | Meaning represented | Evidence and boundary |
|---|---|---|
| `k_checkpoint`, `k_detour`, `k_late_bus`; `e_kara_checkpoint_detour`, `e_kara_checkpoint_terminal`, `e_kara_detour_late`, `e_kara_detour_terminal`, `e_kara_late_terminal` | A local checkpoint route choice, a detour and its reported late/on-time outcomes. Both late-bus and other checkpoint routes reach `k_terminal`. | [PowerPyx Kara finale](https://www.powerpyx.com/detroit-become-human-battle-for-detroit-kara-walkthrough-100/) and [Gamer Guides Kara finale](https://www.gamerguides.com/detroit-become-human/guide/walkthrough/chapter-1/chapter-31-battle-for-detroit-kara). Their independence is unknown. Exactly 11:00 remains unresolved; no inclusive boundary is claimed. The route choice is not a cross-chapter state. |
| `a_gun_seen`, `s_take_gun`, `s_gun_struggle`, `s_kara_shoots_todd`, `s_alice_shoots_todd`, `s_gun_carried`; associated `e_home_*` and `e_stormy_*` edges | Seeing the nightstand gun in A New Home is separate from taking it in Stormy Night. The two shooting outcomes remain distinct; only Kara shooting carries the gun forward. | [PowerPyx A New Home](https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/) and [PowerPyx Stormy Night](https://www.powerpyx.com/detroit-become-human-stormy-night-walkthrough-100/). `s_gun_carried` is an explicitly supplemental carried-state node. Exact save-state checks and QTE timing are not verified. |
| `a_window_open`, `s_window_open`; `e_home_room_window`, `e_home_window_stormy_route` | Opening Alice's room window enables a later Stormy Night window route. This slice records availability, not a successful escape. | The two PowerPyx chapter guides above. The open-window action is optional. The successful branch is added by the later [Stormy Night escape slice](stormy-escape-slice.md), not by this earlier expansion. |

The two A New Home clue/action links are labeled as optional, guide-reported
actions. They do not claim exclusive or required next steps in the screenshot's
local sequence. The existing `s_alive` and `k_terminal` requirements remain
separate edges into `k_meet`; neither the late-bus branch nor the unresolved
box hypothesis blocks terminal or meeting access.

## Coverage and validation boundary

The atlas now contains **38 nodes and 42 edges** across three chapter regions
after the later Stormy Night escape slice. All three chapter coverage records
remain `partial`. The sample does not transcribe all checkpoint interactions,
all Stormy Night branches, or fatal/non-gun failure outcomes. No source
independence or gameplay verification is claimed. The structural validator
checks IDs, source references, branch separation, cross-chapter prerequisites
and layout; it cannot prove a guide claim or the game's behavior.
