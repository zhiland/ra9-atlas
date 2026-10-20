# Stormy Night — entry sequence slice

Updated: 2026-10-20. This bounded addition expands the existing PoC4 sample. It
is not full chapter coverage or gameplay verification.

## Map content

The selected sequence starts with Todd ordering Kara to stay still, then Alice
runs upstairs. Kara can obey and stay still, which leads to the fatal outcome
where Todd kills Alice and Kara, or become deviant. From the deviant event, the
guides report two alternatives: go upstairs, joining the existing `s_reach_alice`
route, or reason with Todd. The latter ends at the reported point where Todd
knocks Kara down and reaches Alice before Kara.

| Node ID | Meaning |
|---|---|
| `s_todd_orders_stay` | Todd orders Kara to stay still. |
| `s_alice_runs_upstairs` | Alice runs upstairs; response branches follow. |
| `s_fatal_todd_kills` | Todd kills Alice and Kara. This is separate from `s_dead` (Todd killed) and has no outgoing edge. |
| `s_deviant` | Kara becomes deviant. |
| `s_go_upstairs` | Go upstairs; joins existing `s_reach_alice`. |
| `s_reason_todd` | Reason with Todd. |
| `s_todd_upstairs_first` | Todd knocks Kara down and reaches Alice before Kara; no later result is claimed. |

Seven traced edges use edge-specific references to both reviewed guides. The
first edge preserves Todd order → Alice runs upstairs. The two outgoing edges
from Alice’s upstairs event distinguish stay still from becoming deviant. The
fatal outcome does not connect to `s_dead`, `s_alive`, the terminal or the later
Todd meeting. The deviant alternatives do not claim a Todd fate.

## Evidence limits

Sources: [PowerPyx — Stormy Night](https://www.powerpyx.com/detroit-become-human-stormy-night-walkthrough-100/), “Todd Gets Mad / Becoming Deviant or not”; [Gamer Guides — Stormy Night](https://www.gamerguides.com/detroit-become-human/guide/walkthrough/chapter-1/chapter-6-stormy-night), Branches 1–3. Both are secondary guides; source independence is unknown. The too-slow path, hidden timers, exact QTE and difficulty, and later outcomes after Reason with Todd remain omitted. No claim is verified in game.

## Current PoC boundary

The atlas contains 45 nodes and 49 edges across three partially covered chapter
regions. The data contract, full game coverage, source review procedure and
production stack remain open. The A New Home main sequence is arranged left to
right; other chapters still have mixed directions and remain a later static
layout task.

Checks for this update: `node prototype/validate-atlas-data.js` passes; contract
51/51, core 42/42, map-first 4/4, stable-zoom 10/10, layout 9/9, browser 55/55.
Browser tests use localhost Chromium and mobile viewport emulation, not a
physical device.

## PoC closeout and next backlog

This is a usable partial prototype, not a full-game flowchart. All three chapter
coverage records remain partial; the exact 11-minute boundary, full Stormy Night
branch graph, source independence, and game-state behavior remain unresolved.
The next product work is to expand source-backed chapter content and branch
relationships, define a repeatable source review process, and later align the
remaining chapter layouts with the left-to-right main-flow rule. None of those
items is included in this slice. The whole-map screenshot at fit scale is local
QA evidence only; the 390×844 check is Chromium emulation, not device testing.
