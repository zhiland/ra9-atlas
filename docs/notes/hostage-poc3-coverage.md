# The Hostage — PoC3 coverage and inventory

Date: 2026-10-18. Scope: the standalone PoC3 prototype for one full chapter,
*The Hostage*. Files: [hostage-poc3.html](../../prototype/hostage-poc3.html),
[hostage-data.js](../../prototype/hostage-data.js),
[validate-hostage-data.js](../../prototype/validate-hostage-data.js).

This note reconciles the graph against the source screenshot and states what is
certain versus uncertain. It is a structure/UI record, **not** in-game verification.
No game art or screenshot is embedded or redistributed in the prototype.

## Source and method

- Geometry and labels: the single Steam "100% Chapter Flowcharts" screenshot for
  *The Hostage* (`notes/evidence/evidence/steam-the-hostage-reference.png`,
  7288×2648), read 2026-10-18 and transcribed region by region.
- Cross-checks: `notes/evidence/evidence/steam-the-hostage-ocr.txt`,
  `notes/evidence/evidence/fschutt-hostage.txt`,
  [map-reference-analysis.md](map-reference-analysis.md),
  [poc3-design-review.md](poc3-design-review.md).
- Game version and platform: `unknown`.

## Counts (reconciled with the 40-label reference)

The source screenshot shows **40 unique visible graph labels, including 6 terminal
outcomes**. The data file reproduces exactly 40 and the validator asserts it.

| Measure | Count | Note |
|---|---:|---|
| Unique visible labels | **40** | 16 single action/flag + 14 choice options + 1 start + 3 stage + 6 endings |
| Graph boxes (nodes) | **33** | 7 two-row choice boxes account for 14 labels; no labels are missing |
| Action / flag boxes | 16 | 13 actions + 3 flags: two warnings (`WASTED TOO MUCH TIME`, `SWAT INJURED`) and `DEVIANT JUMPS WITH EMMA` |
| Choice groups (2 rows each) | 7 | 14 option labels |
| Stage containers | 3 | `SEARCH FOR CLUES`, `CONFRONT DEVIANT OUTSIDE`, `NEGOTIATE WITH DEVIANT` |
| Start nodes | 1 | `MISSION START` |
| Terminal endings | **6** | listed below |
| Connectors (edges) | 36 | 31 traced + 5 uncertain (drawn dashed) |

Guides or the game may hold more branches than this one screenshot shows; the
inventory claims only what is visible in the image.

## Label inventory (left → right, preserving the screenshot's stage grouping)

**Arrival**

- `MISSION START` — start
- `SAVE FISH` / `LEAVE FISH` — choice (option rows 2 & 3)
- `TALK TO CAPT. ALLEN` — action

**SEARCH FOR CLUES** (stage container)

- `SEARCH FOR CLUES` — stage
- `INVESTIGATE FATHER'S BODY` — action
- `LEARN CAUSE OF INCIDENT` — action
- `LEARN DEVIANT'S NAME` — action
- `INVESTIGATE GUN CASE` — action
- `INVESTIGATE COP'S BODY` — action
- `TAKE COP'S GUN` / `LEAVE COP'S GUN` — choice
- `WASTED TOO MUCH TIME` — warning flag
- `GO OUTSIDE` — action
- `SWAT INJURED` — warning flag

**CONFRONT DEVIANT OUTSIDE** (stage)

- `CONFRONT DEVIANT OUTSIDE` — stage

**NEGOTIATE WITH DEVIANT** (stage container)

- `NEGOTIATE WITH DEVIANT` — stage
- `FRIENDLY APPROACH` / `COLD APPROACH` — choice
- `REFUSE TO DISMISS HELICOPTER` / `DISMISS HELICOPTER` — choice
- `BE HONEST ABOUT GUN` / `LIE ABOUT GUN` — choice
- `LEAVE WOUNDED COP` / `SAVE WOUNDED COP` — choice (screenshot highlights `SAVE WOUNDED COP`)
- `FAIL TO NEGOTIATE` — action
- `BE HONEST WITH DEVIANT` — action
- `LIE TO DEVIANT` — action
- `FAIL TO BUILD TRUST` / `BUILD TRUST` — choice (✕ / ✓ marks)
- `SACRIFICE SELF` — action
- `USE GUN` — action
- `GET CLOSE ENOUGH` — action
- `DEVIANT JUMPS WITH EMMA` — event flag

**Terminal outcomes (6)**

- `CONNOR FAILED TO REACH DEVIANT IN TIME` — ending
- `CONNOR LEAPT FOR EMMA AND FELL` — ending
- `SNIPERS SHOT DEVIANT` — ending
- `CONNOR DIED PROTECTING EMMA` — ending
- `DEVIANT SHOT CONNOR` — ending
- `CONNOR SHOT DEVIANT` — ending

Excluded as non-labels: `100% COMPLETED` (guide metadata), `THE HOSTAGE` (chapter
title), and the `ANDROID` text printed on the in-game thumbnail (game art).

## Connectors

**Traced (31).** Arrival → search → clue branch → gun branch → confront →
negotiate branches → final actions → endings:

```text
MISSION START → TALK TO CAPT. ALLEN → SEARCH FOR CLUES
SEARCH FOR CLUES → INVESTIGATE FATHER'S BODY → LEARN CAUSE OF INCIDENT
SEARCH FOR CLUES → LEARN DEVIANT'S NAME
SEARCH FOR CLUES → INVESTIGATE GUN CASE
SEARCH FOR CLUES → INVESTIGATE COP'S BODY → {TAKE COP'S GUN | LEAVE COP'S GUN}
SEARCH FOR CLUES → WASTED TOO MUCH TIME
SEARCH FOR CLUES → GO OUTSIDE
{WASTED TOO MUCH TIME | GO OUTSIDE} → CONFRONT DEVIANT OUTSIDE → NEGOTIATE WITH DEVIANT
NEGOTIATE WITH DEVIANT → {FRIENDLY APPROACH | COLD APPROACH}
NEGOTIATE WITH DEVIANT → {REFUSE TO DISMISS HELICOPTER | DISMISS HELICOPTER}
NEGOTIATE WITH DEVIANT → {BE HONEST ABOUT GUN | LIE ABOUT GUN}
NEGOTIATE WITH DEVIANT → {LEAVE WOUNDED COP | SAVE WOUNDED COP}
NEGOTIATE WITH DEVIANT → BE HONEST WITH DEVIANT → DEVIANT JUMPS WITH EMMA
DEVIANT JUMPS WITH EMMA → {CONNOR FAILED TO REACH DEVIANT IN TIME | CONNOR LEAPT FOR EMMA AND FELL}
NEGOTIATE WITH DEVIANT → LIE TO DEVIANT → {FAIL TO BUILD TRUST | BUILD TRUST}
FAIL TO BUILD TRUST → DEVIANT JUMPS WITH EMMA
BUILD TRUST → SNIPERS SHOT DEVIANT
NEGOTIATE WITH DEVIANT → SACRIFICE SELF → CONNOR DIED PROTECTING EMMA
NEGOTIATE WITH DEVIANT → USE GUN → {DEVIANT SHOT CONNOR | CONNOR SHOT DEVIANT}
NEGOTIATE WITH DEVIANT → GET CLOSE ENOUGH   (dead end — see below)
```

**Uncertain (5) — drawn dashed with a `?` badge, flagged in data.**

| # | Edge | Why uncertain |
|---:|---|---|
| 1 | `MISSION START → SAVE FISH/LEAVE FISH` | The fish choice hangs off the start→Allen segment; the exact tap junction is ambiguous. |
| 2 | `SEARCH FOR CLUES → SWAT INJURED` | Its connector rises into the search area, but the tap point is not clear. |
| 3 | `NEGOTIATE WITH DEVIANT → FAIL TO NEGOTIATE` | `FAIL TO NEGOTIATE` sits on a shared negotiation bus; the source line is not separable by eye. |
| 4 | `FRIENDLY/COLD APPROACH → FAIL TO NEGOTIATE` | A connector from the approach choice reaches it, but the crossing bus prevents a confident trace. |
| 5 | `FAIL TO NEGOTIATE → DEVIANT JUMPS WITH EMMA` | Long connector across the outcome crossings; route not confidently traced. |

**Unresolved non-edge.** `GET CLOSE ENOUGH` has **no visible outgoing connector**
in the screenshot. No link was invented; the node carries a note and the validator
fails if an outgoing edge is later added without evidence.

## What is deliberately not claimed

- No label or connector is marked "in-game verified"; version/platform stay `unknown`.
- The 3 stage containers and the 36 connectors are a reading of one image,
  not proof of the complete game branch set.
- Choice groups are drawn as one box with two option rows, matching the screenshot's
  bracketed two-row boxes; counts are reported both as boxes (33) and labels (40).
- Uncertain edges are visually distinct (dashed + `?`) and repeat their reason in the
  details panel; color is never the only cue.

## Checks run

- `node prototype/validate-hostage-data.js` — node/edge/layout validator: unique ids,
  known kinds, edge endpoints, no self-loops/duplicates, certainty + reasons, documented
  dead end, counts (incl. 40 labels / 6 endings), canvas bounds, **no node overlaps**,
  stage-frame containment, and **orthogonal routes that avoid passing through unrelated
  nodes**. All checks pass.
- `node --check prototype/hostage-data.js` — syntax OK.
- `node --check prototype/validate-hostage-data.js` — syntax OK.
- Inline renderer script extracted from `hostage-poc3.html` and passed `node --check`.

## Limitations

- Browser rendering and interaction (pan/zoom/fit/search, details panel) are **not**
  exercised here; only static checks were run. No browser route was used.
- Transcribed from a single guide screenshot; independent guide/transcript review of the
  full branch set, and any in-game verification, remain outstanding.
- Label wording is verbatim from the screenshot, including `CAPT.` and the possessive
  forms, so it can differ from in-game or guide phrasing.
