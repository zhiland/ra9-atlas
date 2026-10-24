# The Painter leisure: inspected public input

Date: 2026-10-24. Parent source inspection, not independent approval or gameplay.
Base: `031309c7363d58bc8c69a2c7c2af18215509781e` (PR #31).

## Sources and access

[Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882),
The Painter section, opened live. It shows a removed-item notice. StongLory credits
throwawaydeviant9 for original paths/screenshots and Krystal109 for higher resolution.
The exact wide chart and alternate opening screenshot were inspected locally:

- https://images.steamusercontent.com/ugc/1469813569888642618/46A96B75406313591FE214D6DBC3CE7E88EC33F0/
  7271×1056, SHA256 `1380647c97e77c8b8e3330afa4b1b1bb73c21e0d44fc5b04969ce43ac9a3b0aa`.
- https://images.steamusercontent.com/ugc/1333579200343348861/1195404B68995CE7A56984FD24294F79A366F6E3/
  1920×1080, SHA256 `b8a5fbeb6f50c2ae84b21749d3193f6f679ea385f8bd308491a757925230afb7`.

The parent inspected a readable leisure crop of the wide chart. The alternate
supports left/middle groups but crops the later studio target. These images
share underlying chart evidence. No independent research, build identity or
reuse permission is established. Raw images remain outside Git, reference-only.

[PowerPyx](https://www.powerpyx.com/detroit-become-human-the-painter-walkthrough-100/)
opened live, section Checkpoint: Find Something To Do. Its activity list supports
the row labels and describes taking Carl to the studio. Its replay/completion
advice is not adopted. A later-scope reader patch disagreement remains outside
this slice. No percentage, replay count or all-rows-complete rule is transcribed.

## Bounded graph representation

Scope starts at the existing FIND SOMETHING TO DO checkpoint and ends at TAKE
CARL TO THE STUDIO. Exclude painting, later studio tasks, the chapter outcome and
all cross-chapter consequences. Use packetVersion 1.1, same chapter the-painter,
packetId the-painter-leisure-packet, and no runtime/legacy reconciliation.

Six nodes and thirteen exact row labels:

| ID | Descriptive label | Kind | Ordered options |
| --- | --- | --- | --- |
| pt_find | FIND SOMETHING TO DO | stage | none |
| pt_activity | Activity row group | choice | PLAY CHESS; READ BOOK; PLAY PIANO |
| pt_chess | Chess result row group | choice | WIN; LOSE; DRAW |
| pt_book | Book row group | choice | THE REPUBLIC BY PLATO; TRAGEDIES OF WILLIAM SHAKESPEARE; ODES BY JOHN KEATS |
| pt_piano | Piano variation row group | choice | MELANCHOLIC; HOPEFUL; INTIMATE; ENIGMATIC |
| pt_studio | TAKE CARL TO THE STUDIO | action | none |

The four group labels are original descriptions, not quoted box captions. The
schema's choice kind represents grouped rows here. It does not claim the player
can directly choose a chess outcome. See [domain terms](../../CONTEXT.md).

Seven traced chart connections, source `steamPainterLeisure`:

1. e_pt_find_activity: pt_find→pt_activity, no fromOption.
2. e_pt_activity_chess: pt_activity→pt_chess, fromOption 0.
3. e_pt_activity_book: pt_activity→pt_book, fromOption 1.
4. e_pt_activity_piano: pt_activity→pt_piano, fromOption 2.
5. e_pt_chess_studio: pt_chess→pt_studio, no fromOption.
6. e_pt_book_studio: pt_book→pt_studio, no fromOption.
7. e_pt_piano_studio: pt_piano→pt_studio, no fromOption.

The last three leave the whole bracket. Do not clone them into per-row claims.
No AND/all-activities requirement, inferred variant unlock, exact play mechanic
or simultaneous completion is represented. No detached segment is introduced.

Use four unknown records with concrete node references: u_ptl_group_semantics
(row groups do not prove player agency or per-row availability), u_ptl_common_exit
(common bracket exits do not establish per-row transitions/completion),
u_ptl_completion (no replay/completion/platform rule adopted), u_ptl_build
(platform/build and game behavior unverified). Cite the chart and guide where
applicable. Supplementary and conditions stay empty. Rights remain reference-only.
Independent review starts pending and publication stays blocked. The worker has
not accessed sources: record its access as not-accessed, separate from the
parent's inspection. This packet includes a shared boundary checkpoint, not six
new runtime nodes. Runtime integration requires a separate package.
