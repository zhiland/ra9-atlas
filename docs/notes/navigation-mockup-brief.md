# Navigation mockup brief — R1–R2 (fixtures D1–D3)

Date: 2026-10-18. Basis: [STATUS.md](../STATUS.md), [spec.md](../spec.md) 0.2, [Gate 02](decision-gate-02.md), [D1/D3](verification-d1-d3.md), [D2](verification-d2.md). Scope: a clickable, design-level mockup only — no implementation, stack choice, new research, or project-doc edits.

## 1. Purpose

Test the R1–R2 journey before any implementation decision:

- **R1** — chapter overview; select a chapter, open an event, return without losing the selected context.
- **R2** — a selected action shows prerequisites and later consequences; a cross-chapter example is followed both ways; required future choices are visible; conditional outcomes are never presented as guaranteed.

Fixtures D1–D3 were cleared by Gate 02 for mockup use **with explicit evidence statuses**. Gate 02 permits the mockup only; it does not establish gameplay verification. The check evaluates navigation, not game mechanics. No element may carry "checked in game" wording.

## 2. Presentation rules (evidence honesty)

- Every claim/link carries a status badge; the detail view shows exact source section/URL, evidence type, verification status, conflicts, and version/platform as `unknown`.
- Matching guides are "matching sources — independence unproven", never two independent observations. Single-source claims stay "single source"; presentation never upgrades them.
- Unknowns stay unknown: no rounding, invented thresholds, resolved equality cases, or fabricated completeness.
- Conditional outcomes appear as **alternatives gated by a condition** ("depends on later dialogue") — never assured, no "always" or default-looking success paths on condition edges.
- Simplified structured data is a comparison example only, not proof.

## 3. Status vocabulary

| Badge | Meaning | Covers |
|---|---|---|
| Guide-reported — matching sources | ≥2 guides agree; independence unproven | D1 lie-to-keep-gun (PowerPyx; Game of Guides cross-check); D2.4/D2.5; D3 threshold and branches (PowerPyx; Gamer Guides, texts closely match) |
| Guide-reported — single source | one secondary source; unconfirmed | D2.1 key after Alice trusts Kara enough (GameFAQs; exact level unstated); Neoseeker's late-only D3 branch |
| Transcript text | secondary transcript, not gameplay capture | D2.2 box contents (Fandom, lines 1947–1964) |
| Snippet-only | full page not reviewed | D2.3; Neoseeker parts of D2.4/D3 |
| Conflict / unclarity | sources disagree; may be omission | D3 Supersoluce discrepancy (step 6) |
| Unresolved | kept open in the UI | D2 exact trigger; D3 equality at 11:00 |
| In-game verified | **never used in this mockup** | — |

Guide-section titles used as event names ("Search for Clues", "Security Checkpoint", "Meet Todd", etc.) are labeled as source-section names, not confirmed in-game node names.

## 4. Journey to prototype

Each step separates **U** (UI behavior to prototype) from **G** (gameplay facts still unknown — displayed as unknown, never resolved here).

### Step 1 — Chapter overview (R1, entry)

- **U:** compact overview; selection (highlight + breadcrumb) persists while browsing. Fixture chapters only: *The Hostage*, *A New Home*, *Battle for Detroit (Kara)*; *Stormy Night* enters only as a D2 prerequisite node.
- **U:** from the overview, open one chapter's event list.
- **G (unknown):** registry/coverage (R7 out of scope); the 32-chapter registry stays "full coverage unverified" and is excluded.

### Step 2 — Event detail: D1, The Hostage gun chain (R1)

- **U:** chain as **separate** action/condition/outcome entities (Gate 02): (1) when Daniel asks, "lie to keep the gun" — distinct node, matching sources; (2) "tell the truth" → gun dropped, `Use Gun` unavailable; `Leave Cop's Gun` = find-but-leave branch.
- **U:** no direct "picked up" → "shot" edge; prerequisites listed above consequences.
- **U:** guide-reported endings stay distinct: `Shoot` → Connor shoots Daniel; `Intimidate > Convince` → Daniel shoots Connor (PowerPyx).
- **G (unknown):** completeness of all conditions; distance/dialogue order; accuracy to a specific build.

### Step 3 — Return with selected context (R1)

- **U:** returning keeps prior selection highlighted, breadcrumb intact, no reset — including after link panels and cross-chapter jumps.

### Step 4 — Forward consequence: D2 (R2, forward)

- **U:** from *A New Home* ("Talk to Alice" / "Open Alice's Box"), a "later consequences" panel links to *Battle for Detroit (Kara)* "Meet Todd" (PowerPyx lines 224–228), with direct navigation.
- **U:** compound conditions, each a separate entry: Alice trusts Kara enough to give the key (**GameFAQs; exact relationship level unknown**); the box needs the key (**single source**); "the box opened" (**unresolved trigger** — guides disagree: "see/inspect the photo or box" vs. "open the box"; `ch04_opened_box` is only a reported hypothesis); Todd survived *Stormy Night* (**matching sources**); Kara and Alice reach the terminal (**matching sources**).
- **U:** outcomes as an explicit alternative set (D2.5): positive dialogue → Todd sends the soldiers away; negative → persuasion fails, security check triggered. Label: depends on later dialogue — not guaranteed by opening the box.
- **U:** overall D2 badge: guide-reported chain with unresolved conditions, labeled hypothetical (Gate 02: HOLD as verified example; GO as labeled scenario).

### Step 5 — Backward prerequisites: same chain in reverse (R2, backward)

- **U:** from "Meet Todd", a "required earlier" panel lists prerequisites (key, opened box, Todd alive, reach terminal). Clicking one navigates back and highlights it; the journey returns forward — bidirectional. Badges identical both ways; no confidence upgrade.

### Step 6 — Discrepancy case: D3, detour → late bus (R2 + simplification detector)

- **U:** the detour carries the **time-remaining condition on the choice**: less than 11 minutes → `Delayed / Late for the Bus / Last Bus departed` (matching sources; Neoseeker snippet-only, late branch only); immediately above 11 minutes → `At the Bus Terminal` (same badge). Both outcomes shown side by side under one action — the positive case refutes "detour → always late".
- **U:** a third row, **unknown** badge: what happens at **exactly 11:00** — no rounding, no invented threshold; neither outcome attached to equality.
- **U:** conflict panel (Supersoluce): lists late branches, then says both paths do not change the rest of the chapter and names no timing condition — conflict/unclarity, possibly a description omission, not a refutation. Citations viewable side by side.
- **G (unknown):** the exact 11:00 boundary; independence of the matching texts; both outcomes in one known build.

## 5. Acceptance checks

1. **R1:** select chapter → open event → return → context intact (pass/fail with observation).
2. **R2:** follow D2 forward and backward; required future choices visible; nothing anywhere presented as guaranteed.
3. **Honesty:** every link shows a status; details show source location + verification status; no "in-game/checked" wording; no invented numbers — 11:00 appears only as unknown.
4. **Discrepancy:** D3 shows both branches under distinct conditions; the conflict panel is openable; no collapsed "detour → late" model survives review.

## 6. Gameplay facts still unknown — display as unknown

- No D1–D3 claim is verified in game; the "in-game verified" badge never appears; version/platform `unknown`.
- **D1:** complete condition set, order, build accuracy. **D2:** exact trigger (open box vs. see photo vs. dialogue node); full later condition set; exact Alice-key relationship level; safe branch-isolation replays unchecked. **D3:** equality at 11:00; text independence; both outcomes in one build.
- A verification record from the mockup states expectation, observation, evidence, verdict — scope is navigation only (spec change rule applies to conflicts found).

## 7. Out of scope

Implementation and stack; new research; project-doc edits; corpus, licensing, release-policy decisions; coverage (R7); spoiler consent (R4); full R3–R7 acceptance. Post-mockup, a **separate** decision follows (Gate 02); specification blockers stay as in spec 0.2.
