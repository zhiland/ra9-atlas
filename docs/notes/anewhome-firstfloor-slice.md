# A New Home first-floor event slice

Updated: 2026-10-20. This slice adds selected guide-reported first-floor
activities to the partial PoC4 map. It does not claim full chapter coverage or
gameplay verification.

## Added records

The map adds eleven events: two magazine readings, washing dishes, taking the
laundry to the backyard, rewashing clothes, finding Red Ice, Todd’s reported
reaction, watching Todd’s TV, blocking his view, activating the vacuum, and
taking out the trash. Event labels are original short descriptions. The two
magazine titles come from PowerPyx only. GameFAQs reports magazine reading but
does not name the titles.

Four guide-reported local progressions are drawn:

- `a_take_laundry_backyard` → `a_rewash_clothes`
- `a_rewash_clothes` → `a_find_red_ice`
- `a_find_red_ice` → `a_enrage_todd`
- `a_watch_todd_tv` → `a_block_todd_view`

Their edge IDs are `e_home_backyard_rewash_clothes`,
`e_home_rewash_red_ice`, `e_home_red_ice_enrage_todd`, and
`e_home_watch_tv_block_view`. Each edge cites the guide that states the
relationship. The TV-stare event cites GameFAQs only. PowerPyx reports
standing in front of the TV to annoy Todd, but does not separately describe
watching the TV first.

The map does not connect unrelated chores to `CLEAN FIRST FLOOR`. It does not
claim that an event is optional, required, exclusive, or part of one fixed
walkthrough order. PowerPyx and GameFAQs list events in different orders. The
unknown record `u_home_first_floor_order` keeps this gap explicit.

## Sources and limits

The source entries are [PowerPyx: A New Home](https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/)
and [GameFAQs: A New Home](https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/a-new-home).
The source register records the reviewed scope. Matching guide statements do
not establish independent verification. No guide prose, images, or chart
structure is reproduced in this slice.

The graph now has 56 nodes and 53 edges across three partial chapter regions.
The 11 added events do not make A New Home complete. The map still omits other
first- and second-floor activities, conversation choices, unresolved chart
side links, and in-game verification of the reported events.
