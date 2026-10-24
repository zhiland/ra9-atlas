# A New Home second-floor event slice

Updated: 2026-10-20. This slice adds selected guide-reported second-floor
activities to the partial PoC4 map. It does not claim full chapter coverage,
gameplay verification, or a fixed walkthrough order.

## Added records

The map adds twelve events: cleaning Todd’s room, tidying the pills, making
Todd’s bed, Alice going to her room, cleaning the toilet, arranging the bathroom
bottles, storing the bathroom clothes, mopping the bathroom, reading “Android
QB”, reading “Putting a Price”, reading the book on Alice’s floor, and reading
the books on Alice’s shelf.

The exact Todd-room magazine titles come from PowerPyx only. GameFAQs/Mogg
reports one unnamed magazine in Todd’s room, so the two exact titles are not
attributed to both guides. The Alice-floor book is reported by both guides;
only PowerPyx names it. The shelf books are PowerPyx-only in this section.

Only two local relations are drawn:

- `a_tidy_pills` → `a_gun_seen` (`e_home_pills_gun`). GameFAQs/Mogg reports
  opening the pill bottle and then finding the handgun in the bedside-table
  drawer. PowerPyx reports checking the nightstand directly. This is a reported
  sequence, not an eligibility requirement.
- `a_make_todd_bed` → `a_alice_goes_room` (`e_home_todd_bed_alice_room`). Both
  guides report Alice going to her room after Todd’s bed is made. The move is a
  reported sequence event, not an eligibility gate.

The map does not connect individual chores to `CLEAN SECOND FLOOR`,
`CLEAN ALICE'S ROOM`, or `TALK WITH ALICE`. PowerPyx reports that cleaning
Todd’s room, the bathroom, and Alice’s room, plus reading both sets of books,
are prerequisites for Talk with Alice. GameFAQs/Mogg gives a different room
order and says Alice’s room must be cleaned before Todd’s. The source-specific
reports stay in the inspector and unknown record. The map does not encode them
as one universal gate or claim that unrelated chores are optional, required,
or exclusive.

## Source order difference

PowerPyx and GameFAQs/Mogg list the second-floor chores in different orders.
PowerPyx lists Todd’s room (including pills and magazines), Alice going to her
room, the toilet, the bathroom, Alice’s room and window, then the floor and
shelf books. GameFAQs/Mogg starts with the bathroom, then Alice’s room and
window, then Todd’s room (pills, handgun, bed), then the toilet and floor book.
PowerPyx also says Talk with Alice requires Todd’s room, the bathroom and
Alice’s room plus reading the floor and shelf books; GameFAQs/Mogg only says
Alice’s room must be cleaned before Todd’s.

These are guide-specific walkthrough orders and comments. Bathroom cleaning is
one PowerPyx-reported Talk prerequisite, but the guides do not say whether each
listed bathroom action is a separate gate. These reports are recorded in
`u_home_second_floor_order` and are not turned into mandatory order, universal
prerequisites, or an AND condition on the Talk with Alice edge.

## Key relationship correction

The earlier sample attributed a “Neutral-or-higher” requirement to GameFAQs.
The reviewed GameFAQs/Mogg text says Alice trusts Kara enough to give the key
but does not name Neutral or another level. PowerPyx lists favorable
conversation choices but also gives no threshold. The map keeps the key-to-box
relation `a_key → a_box`, keeps `cond_key_relationship` as a `SINGLE`
condition on `e_home_talk_key`, and records the exact level as unknown in
`u_key_threshold`. The details panel and older navigation data no longer state
a named level.

## Sources and limits

The source entries are [PowerPyx: A New Home](https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/)
and [GameFAQs: A New Home](https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/a-new-home).
Matching guide statements do not establish independent verification. No guide
prose, images, or chart structure is reproduced in this slice.

The graph now has 68 nodes and 55 edges across three partial chapter regions.
A New Home remains incomplete: other chores, unresolved chart side links,
conversation choices, the differing guide order, and in-game verification of the
reported events remain outside this slice.
