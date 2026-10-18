/* PoC3 — The Hostage (Detroit: Become Human, chapter 1) graph data.
   Standalone classic script: no modules, no imports, no fetch. Load before the
   UI script in prototype/hostage-poc3.html so the page opens directly over file://.
   Validate with:  node prototype/validate-hostage-data.js

   Provenance: every label below was transcribed from the single Steam
   "100% Chapter Flowcharts" screenshot for The Hostage
   (notes/evidence/evidence/steam-the-hostage-reference.png, 7288x2648), read
   2026-10-18. The screenshot itself is NOT embedded or redistributed here.
   Structure is also cross-checked against notes/evidence/evidence/fschutt-hostage.txt
   and docs/notes/map-reference-analysis.md. This is a UI/structure prototype:
   no transition is verified in game, and the game version/platform is unknown.

   Certainty model:
     edge.certainty === 'certain'   — the connector was traced by eye from the full
                                      screenshot with no crossing ambiguity.
     edge.certainty === 'uncertain' — the connector route, source, or branch row
                                      could not be resolved confidently. Drawn dashed
                                      and badged in the UI, with a reason in `note`.
   Nodes with no outgoing connector are flagged in `note` and in the coverage note
   instead of inventing a link. */

const HOSTAGE = {
  meta: {
    chapter: 'The Hostage',
    chapterNumber: 1,
    protagonist: 'Connor',
    subtitle: 'Chapter 1 · Connor · full-chapter transcription',
    reference: 'Steam "100% Chapter Flowcharts" — The Hostage (7288×2648)',
    version: 'unknown',
    platform: 'unknown',
    disclaimer: 'Transcribed from one chapter-flowchart screenshot. Not in-game verified. Dashed connectors are uncertain.',
    /* Counts are asserted by prototype/validate-hostage-data.js. */
    counts: {
      labels: 40,        // unique visible text labels, including 6 terminal outcomes
      nodes: 33,         // 30 action/choice/start/ending boxes + 3 stage containers
      actionNodes: 16,   // 13 action boxes + 3 flag boxes (2 warnings and DEVIANT JUMPS)
      choiceGroups: 7,   // two-option choice boxes
      choiceOptions: 14, // option rows across the 7 choice groups
      stageLabels: 3,    // SEARCH FOR CLUES, CONFRONT DEVIANT OUTSIDE, NEGOTIATE WITH DEVIANT
      startNodes: 1,     // MISSION START
      endings: 6,        // terminal outcome labels
      edges: 36,
      certainEdges: 31,
      uncertainEdges: 5
    }
  },

  palette: {
    canvas: '#ffffff',
    light: '#f5f5f7',
    ink: '#1d1d1f',
    gray: '#707070',
    border: '#d6d6d6',
    blue: '#0066cc'
  },

  canvas: { width: 4440, height: 1300 },

  /* kind: start | action | choice | flag | stage | ending */
  nodes: [
    /* ---- Arrival ---- */
    { id: 'mission_start', label: 'MISSION START', kind: 'start', x: 60, y: 720, w: 200, h: 44,
      note: 'Chapter start checkpoint. Blue milestone box in the screenshot.' },
    { id: 'fish', label: 'SAVE FISH / LEAVE FISH', kind: 'choice', x: 60, y: 520, w: 220, h: 64,
      options: ['SAVE FISH', 'LEAVE FISH'],
      note: 'Two-row choice box. It hangs off the MISSION START → TALK TO CAPT. ALLEN segment; the exact tap point is ambiguous.' },

    /* ---- Search for clues ---- */
    { id: 'talk_allen', label: 'TALK TO CAPT. ALLEN', kind: 'action', x: 360, y: 726, w: 220, h: 36 },
    { id: 'stage-search', label: 'SEARCH FOR CLUES', kind: 'stage', x: 680, y: 700, w: 180, h: 70,
      frame: { x: 650, y: 400, w: 830, h: 700 }, children: ['inv_father', 'learn_cause', 'learn_name', 'inv_gun_case', 'inv_cop_body', 'cops_gun'] },
    { id: 'inv_father', label: "INVESTIGATE FATHER'S BODY", kind: 'action', x: 920, y: 440, w: 210, h: 36 },
    { id: 'learn_cause', label: 'LEARN CAUSE OF INCIDENT', kind: 'action', x: 1240, y: 440, w: 210, h: 36 },
    { id: 'learn_name', label: "LEARN DEVIANT'S NAME", kind: 'action', x: 1240, y: 600, w: 210, h: 36 },
    { id: 'inv_gun_case', label: 'INVESTIGATE GUN CASE', kind: 'action', x: 1240, y: 880, w: 210, h: 36 },
    { id: 'inv_cop_body', label: "INVESTIGATE COP'S BODY", kind: 'action', x: 920, y: 1020, w: 210, h: 36 },
    { id: 'cops_gun', label: "TAKE COP'S GUN / LEAVE COP'S GUN", kind: 'choice', x: 1240, y: 1000, w: 220, h: 64,
      options: ["TAKE COP'S GUN", "LEAVE COP'S GUN"] },
    { id: 'wasted_time', label: 'WASTED TOO MUCH TIME', kind: 'flag', x: 1700, y: 420, w: 230, h: 44,
      note: 'Warning-flag box (triangle icon in the screenshot). Reached from SEARCH FOR CLUES.' },
    { id: 'go_outside', label: 'GO OUTSIDE', kind: 'action', x: 1700, y: 640, w: 230, h: 36 },
    { id: 'swat_injured', label: 'SWAT INJURED', kind: 'flag', x: 1700, y: 1020, w: 230, h: 44,
      note: 'Warning-flag box. Its incoming connector rises into the search area but the tap point is not clear.' },

    /* ---- Confront + negotiate ---- */
    { id: 'stage-confront', label: 'CONFRONT DEVIANT OUTSIDE', kind: 'stage', x: 2020, y: 700, w: 230, h: 60,
      frame: { x: 1980, y: 660, w: 310, h: 140 }, children: [] },
    { id: 'stage-negotiate', label: 'NEGOTIATE WITH DEVIANT', kind: 'stage', x: 2400, y: 700, w: 230, h: 60,
      frame: { x: 2360, y: 300, w: 1020, h: 900 }, children: ['approach', 'helicopter', 'gun_talk', 'wounded_cop', 'fail_negotiate'] },
    { id: 'approach', label: 'FRIENDLY APPROACH / COLD APPROACH', kind: 'choice', x: 2680, y: 360, w: 230, h: 64,
      options: ['FRIENDLY APPROACH', 'COLD APPROACH'] },
    { id: 'helicopter', label: 'REFUSE TO DISMISS HELICOPTER / DISMISS HELICOPTER', kind: 'choice', x: 2680, y: 540, w: 240, h: 64,
      options: ['REFUSE TO DISMISS HELICOPTER', 'DISMISS HELICOPTER'] },
    { id: 'gun_talk', label: 'BE HONEST ABOUT GUN / LIE ABOUT GUN', kind: 'choice', x: 2680, y: 960, w: 230, h: 64,
      options: ['BE HONEST ABOUT GUN', 'LIE ABOUT GUN'] },
    { id: 'wounded_cop', label: 'LEAVE WOUNDED COP / SAVE WOUNDED COP', kind: 'choice', x: 2680, y: 1120, w: 230, h: 64,
      options: ['LEAVE WOUNDED COP', 'SAVE WOUNDED COP'],
      note: 'Two-row choice box; the screenshot marks SAVE WOUNDED COP with a yellow highlight icon.' },
    { id: 'fail_negotiate', label: 'FAIL TO NEGOTIATE', kind: 'action', x: 3060, y: 340, w: 230, h: 36,
      note: 'Sits on the negotiation output bus. Its true source (the approach choice, or the negotiation stage) is ambiguous.' },

    /* ---- Final actions + trust ---- */
    { id: 'honest_deviant', label: 'BE HONEST WITH DEVIANT', kind: 'action', x: 3440, y: 360, w: 230, h: 36 },
    { id: 'lie_deviant', label: 'LIE TO DEVIANT', kind: 'action', x: 3440, y: 540, w: 210, h: 36 },
    { id: 'trust', label: 'FAIL TO BUILD TRUST / BUILD TRUST', kind: 'choice', x: 3720, y: 520, w: 210, h: 64,
      options: ['FAIL TO BUILD TRUST', 'BUILD TRUST'],
      note: 'The screenshot marks FAIL TO BUILD TRUST with an ✕ and BUILD TRUST with a ✓.' },
    { id: 'sacrifice_self', label: 'SACRIFICE SELF', kind: 'action', x: 3440, y: 740, w: 210, h: 36 },
    { id: 'use_gun', label: 'USE GUN', kind: 'action', x: 3440, y: 920, w: 210, h: 36 },
    { id: 'get_close', label: 'GET CLOSE ENOUGH', kind: 'action', x: 3440, y: 1100, w: 230, h: 36,
      note: 'No outgoing connector is visible in the screenshot; its follow-up outcome is unresolved.' },
    { id: 'deviant_jumps', label: 'DEVIANT JUMPS WITH EMMA', kind: 'flag', x: 3440, y: 180, w: 230, h: 44,
      note: 'Flag box (triangle icon) that funnels into the two rooftop-fall endings.' },

    /* ---- Terminal outcomes ---- */
    { id: 'end_failed', label: 'CONNOR FAILED TO REACH DEVIANT IN TIME', kind: 'ending', x: 4040, y: 120, w: 320, h: 56 },
    { id: 'end_leapt', label: 'CONNOR LEAPT FOR EMMA AND FELL', kind: 'ending', x: 4040, y: 300, w: 320, h: 56 },
    { id: 'end_snipers', label: 'SNIPERS SHOT DEVIANT', kind: 'ending', x: 4040, y: 560, w: 320, h: 56 },
    { id: 'end_died', label: 'CONNOR DIED PROTECTING EMMA', kind: 'ending', x: 4040, y: 740, w: 320, h: 56 },
    { id: 'end_deviant_shot', label: 'DEVIANT SHOT CONNOR', kind: 'ending', x: 4040, y: 940, w: 320, h: 56 },
    { id: 'end_connor_shot', label: 'CONNOR SHOT DEVIANT', kind: 'ending', x: 4040, y: 1140, w: 320, h: 56 }
  ],

  /* from/to reference node ids (stage ids are valid endpoints).
     via = explicit orthogonal mid-x when the automatic channel would cross nodes. */
  edges: [
    { from: 'mission_start', to: 'talk_allen', certainty: 'certain' },
    { from: 'talk_allen', to: 'stage-search', certainty: 'certain' },

    { from: 'stage-search', to: 'inv_father', certainty: 'certain' },
    { from: 'inv_father', to: 'learn_cause', certainty: 'certain' },
    { from: 'stage-search', to: 'learn_name', certainty: 'certain' },
    { from: 'stage-search', to: 'inv_gun_case', certainty: 'certain' },
    { from: 'stage-search', to: 'inv_cop_body', certainty: 'certain' },
    { from: 'inv_cop_body', to: 'cops_gun', certainty: 'certain' },

    { from: 'stage-search', to: 'wasted_time', certainty: 'certain', via: 1650 },
    { from: 'stage-search', to: 'go_outside', certainty: 'certain', via: 1668 },
    { from: 'wasted_time', to: 'stage-confront', certainty: 'certain' },
    { from: 'go_outside', to: 'stage-confront', certainty: 'certain' },
    { from: 'stage-confront', to: 'stage-negotiate', certainty: 'certain' },

    { from: 'stage-negotiate', to: 'approach', certainty: 'certain', via: 2640 },
    { from: 'stage-negotiate', to: 'helicopter', certainty: 'certain', via: 2648 },
    { from: 'stage-negotiate', to: 'gun_talk', certainty: 'certain', via: 2656 },
    { from: 'stage-negotiate', to: 'wounded_cop', certainty: 'certain', via: 2664 },

    { from: 'stage-negotiate', to: 'honest_deviant', certainty: 'certain' },
    { from: 'stage-negotiate', to: 'lie_deviant', certainty: 'certain' },
    { from: 'stage-negotiate', to: 'sacrifice_self', certainty: 'certain' },
    { from: 'stage-negotiate', to: 'use_gun', certainty: 'certain' },
    { from: 'stage-negotiate', to: 'get_close', certainty: 'certain' },

    { from: 'lie_deviant', to: 'trust', certainty: 'certain' },
    { from: 'honest_deviant', to: 'deviant_jumps', certainty: 'certain' },
    { from: 'trust', fromOption: 0, to: 'deviant_jumps', certainty: 'certain',
      note: 'Upper FAIL TO BUILD TRUST row routes upward to DEVIANT JUMPS WITH EMMA.' },
    { from: 'trust', fromOption: 1, to: 'end_snipers', certainty: 'certain',
      note: 'Lower BUILD TRUST row routes to SNIPERS SHOT DEVIANT.' },
    { from: 'deviant_jumps', to: 'end_failed', certainty: 'certain' },
    { from: 'deviant_jumps', to: 'end_leapt', certainty: 'certain' },
    { from: 'sacrifice_self', to: 'end_died', certainty: 'certain' },
    { from: 'use_gun', to: 'end_deviant_shot', certainty: 'certain' },
    { from: 'use_gun', to: 'end_connor_shot', certainty: 'certain' },

    /* ---- Uncertain connectors: route/source/branch-row not confidently traced ---- */
    { from: 'mission_start', to: 'fish', certainty: 'uncertain',
      note: 'The fish choice hangs off the MISSION START → TALK TO CAPT. ALLEN segment; the exact tap junction is ambiguous.' },
    { from: 'stage-search', to: 'swat_injured', certainty: 'uncertain', via: 1634,
      note: 'SWAT INJURED is fed from the search area but the tap point of its rising connector is not clear.' },
    { from: 'stage-negotiate', to: 'fail_negotiate', certainty: 'uncertain',
      note: 'FAIL TO NEGOTIATE sits on a shared negotiation bus; the source line is not separable by eye.' },
    { from: 'approach', to: 'fail_negotiate', certainty: 'uncertain',
      note: 'A connector from the approach choice reaches FAIL TO NEGOTIATE, but the crossing bus prevents a confident trace.' },
    { from: 'fail_negotiate', to: 'deviant_jumps', certainty: 'uncertain',
      note: 'A long connector links FAIL TO NEGOTIATE to DEVIANT JUMPS WITH EMMA across the outcome crossings; the route is not confidently traced.' }
  ],

  sources: {
    steam: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882',
    steamImage: 'notes/evidence/evidence/steam-the-hostage-reference.png',
    ocr: 'notes/evidence/evidence/steam-the-hostage-ocr.txt',
    analysis: 'docs/notes/map-reference-analysis.md',
    fschutt: 'notes/evidence/evidence/fschutt-hostage.txt',
    design: 'docs/notes/poc3-design-review.md'
  }
};
