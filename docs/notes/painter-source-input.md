# The Painter: inspected public input

Date: 2026-10-23. Prepared by Codex extraction parent. This is bounded evidence
for packet preparation, not independent approval, a complete chapter or gameplay.

## Access and provenance

[Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882),
The Painter section, inspected live. StongLory credits throwawaydeviant9 for
original paths/screenshots and Krystal109 for high-resolution images. The page
shows a removed-item notice although its page and images remain accessible.

- [Wide chart](https://images.steamusercontent.com/ugc/1469813569888642618/46A96B75406313591FE214D6DBC3CE7E88EC33F0/):
  7271×1056, SHA256 `1380647c97e77c8b8e3330afa4b1b1bb73c21e0d44fc5b04969ce43ac9a3b0aa`.
- [Alternate opening screenshot](https://images.steamusercontent.com/ugc/1333579200343348861/1195404B68995CE7A56984FD24294F79A366F6E3/):
  1920×1080, SHA256 `b8a5fbeb6f50c2ae84b21749d3193f6f679ea385f8bd308491a757925230afb7`.

Both images were inspected locally, with a readable crop of the wide opening.
They depict the same chart, not independent research. A third image linked by
Steam was not inspected and is outside this packet. Raw images stay outside Git.
Images and guide text remain reference-only. No reuse permission is established.

## Bounded transcription

Only the opening through the next checkpoint is selected. Leisure categories,
studio, painting choices and the chapter outcome are outside this packet.

| ID | Exact label | Kind |
| --- | --- | --- |
| pt_arrive | ARRIVING HOME | stage |
| pt_package | DROP OFF PACKAGE | action |
| pt_wake | WAKE CARL | action |
| pt_breakfast | SERVE BREAKFAST | action |
| pt_clothes | CARL NOTICES MARKUS' CLOTHES | action |
| pt_birds | ACTIVATE BIRDS | action |
| pt_north | READ "NORTH POLE RUSSIA" | action |
| pt_titan | READ "LIFE ON TITAN" | action |
| pt_find | FIND SOMETHING TO DO | stage |

Five continuous box-to-box traces:
`e_pt_arrive_package`: pt_arrive→pt_package;
`e_pt_package_wake`: pt_package→pt_wake;
`e_pt_wake_breakfast`: pt_wake→pt_breakfast;
`e_pt_wake_clothes`: pt_wake→pt_clothes;
`e_pt_breakfast_find`: pt_breakfast→pt_find.
All have kind `traced`, source `steamPainter`, and no option or legacy index.
The clothes branch visibly leaves the wake box and ends at a triangle beside
the clothes box. Its legend meaning is not interpreted as an eligibility rule.

Three other segments share a detached icon near the package box and point toward
pt_birds, pt_north and pt_titan. They do not begin at a declared box. Record them
as unknown origins, not edges. No side-event ordering is established. Checkpoint
boxes are stages. Percentages and the displayed completion claim are excluded.

## Supplementary guide and omissions

[PowerPyx chapter guide](https://www.powerpyx.com/detroit-become-human-the-painter-walkthrough-100/),
linked from index item 5, inspected live. Its opening checkpoint section identifies
Markus in the clothes discussion. It reports earlier protester harassment as a
prerequisite for Carl's comment. This is guide-reported, not game-verified. Do not
add a Shades edge or an exact trigger. Record the report in an unknown note.
The later painting/replay advice has a dated reader disagreement about patches.
That advice is outside this slice and is not adopted as a gameplay rule.

Use four unknown records: detached origins (three target nodes), optional-event
ordering, clothes eligibility/cross-chapter trigger, and unknown platform/build.
The model has not accessed any page or image. Its input is this prepared note.
Keep its source-access records `not-accessed`, separate from the parent's live
inspection. Conditions and supplementary nodes stay empty. Source review starts
pending. Publication stays blocked. Do not add ATLAS reconciliation, change the
runtime or alter the existing identity ledger.
