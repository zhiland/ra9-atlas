/* PoC4 — multi-chapter atlas data (Detroit: Become Human).
   Standalone classic script: no modules, no imports, no fetch. Load before
   atlas-core.js / atlas-app.js so prototype/poc4-*.html open directly over file://.
   Validate with:  node prototype/validate-atlas-data.js

   Provenance and evidence limits (see docs/notes/poc4-coverage.md):
   - A New Home structure: selected local sequence transcribed from the Steam
     "100% Chapter Flowcharts" screenshot for A New Home; see
     docs/notes/map-reference-analysis.md. Chore and side labels with unresolved
     arrows are omitted rather than invented.
   - Stormy Night: selected carried state only. Internal chapter topology is NOT
     transcribed; no arrow inside Stormy Night is claimed.
   - Battle for Detroit — Kara: guide-reported Todd meeting branch. PowerPyx,
     Fandom and Neoseeker pages were opened in full text on 2026-10-18; Gamer
     Guides is used at the level recorded in docs/notes/verification-d2.md.
     No transition is verified in game; version and platform are unknown.
   - The box-to-later-dialogue relationship stays a dashed, labeled hypothesis
     (edge kind "hypothesis"): guides are incomplete about whether opening the
     box, seeing a photo, or another related action carries the state.
   - The checkpoint detour timing segment (D3) is deliberately out of this slice.

   Edge model (asserted by the validator):
     traced        solid   — connection transcribed or guide-stated directly.
     conditional   dash-dot— connection is guide stated, but a condition is a
                    single-source claim (no style change without the matching note).
     prerequisite  solid+gate — reported access gate into a later node.
     hypothesis    dashed+? — unresolved candidate link; never presented as causal.
*/

const ATLAS = {
  meta: {
    project: 'ra9-atlas',
    poc: 'PoC4',
    title: 'ra9-atlas',
    subtitle: 'Selected multi-chapter slice · A New Home → Stormy Night → Battle for Detroit (Kara)',
    version: 'unknown',
    platform: 'unknown',
    disclaimer: 'Guide-based and screenshot-transcribed only. No transition is verified in game; game version and platform are unknown.',
    counts: {
      chapters: 3,
      nodes: 18,
      edges: 16,
      tracedEdges: 12,
      conditionalEdges: 1,
      prerequisiteEdges: 2,
      hypothesisEdges: 1,
      crossChapterEdges: 2
    }
  },

  refs: {
    steam: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882',
    powerpyxHome: 'https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/',
    gamefaqs: 'https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/a-new-home',
    transcript: 'https://detroit-become-human.fandom.com/wiki/A_New_Home_%28Transcript%29',
    powerpyxKara: 'https://www.powerpyx.com/detroit-become-human-battle-for-detroit-kara-walkthrough-100/',
    fandomBattle: 'https://detroit-become-human.fandom.com/wiki/Battle_for_Detroit',
    neoseekerKara: 'https://www.neoseeker.com/detroit-become-human/walkthrough/Battle_for_Detroit_Kara',
    gamerGuides: 'https://www.gamerguides.com/detroit-become-human/guide/walkthrough/chapter-1/chapter-31-battle-for-detroit-kara'
  },

  canvas: { width: 2060, height: 850 },

  chapters: [
    {
      id: 'home',
      name: 'A New Home',
      code: 'D2 · selected Alice sequence',
      frame: { x: 30, y: 110, w: 520, h: 650 },
      desc: 'Selected local sequence transcribed from the Steam chapter screenshot (10 boxes, 9 links). Chores and unlinked side labels are omitted; the box-to-Todd relationship stays unresolved.'
    },
    {
      id: 'stormy',
      name: 'Stormy Night',
      code: 'D2 · selected carried state only',
      frame: { x: 580, y: 110, w: 520, h: 300 },
      desc: 'Selected state only. Internal chapter topology is not transcribed and no in-chapter arrow is claimed; guides differ on how Todd can be spared, avoided, or killed.'
    },
    {
      id: 'kara',
      name: 'Battle for Detroit — Kara',
      code: 'D2 · selected Todd meeting branch',
      frame: { x: 1130, y: 110, w: 900, h: 700 },
      desc: 'Guide-reported Todd meeting branch and its reported access gates. Checkpoint, ticket, border and river branches are omitted; see docs/notes/poc4-coverage.md.'
    }
  ],

  /* kind: action | flag | choice | outcome
     status: ocr | guide | user | unresolved | mixed  (details panel expands each)
     short: presentation-only abbreviation of the same claim, used when the map
     is too dense for the full label. It adds no new fact. */
  nodes: [
    /* ---- A New Home: selected Alice sequence (screenshot transcription) ---- */
    { id: 'a_welcome', chapter: 'home', label: 'WELCOME HOME', short: 'Welcome home', kind: 'action', x: 55, y: 200, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_todd', chapter: 'home', label: 'JOIN TODD', short: 'Join Todd', kind: 'action', x: 55, y: 310, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_clean1', chapter: 'home', label: 'CLEAN FIRST FLOOR', short: 'Clean first floor', kind: 'action', x: 55, y: 420, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_ask', chapter: 'home', label: 'ASK TO GO UPSTAIRS', short: 'Ask to go upstairs', kind: 'action', x: 55, y: 530, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_go', chapter: 'home', label: 'GO UPSTAIRS', short: 'Go upstairs', kind: 'action', x: 55, y: 640, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_clean2', chapter: 'home', label: 'CLEAN SECOND FLOOR', short: 'Clean second floor', kind: 'action', x: 320, y: 640, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_room', chapter: 'home', label: "CLEAN ALICE'S ROOM", short: "Clean Alice's room", kind: 'action', x: 320, y: 530, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_talk', chapter: 'home', label: 'TALK WITH ALICE', short: 'Talk with Alice', kind: 'action', x: 320, y: 420, w: 195, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_key', chapter: 'home', label: 'ALICE GIVES KARA A KEY', short: 'Alice gives key', kind: 'flag', x: 320, y: 310, w: 195, h: 84, sub: 'condition single-source', status: 'mixed', src: ['steam', 'gamefaqs', 'powerpyxHome'],
      note: 'The screenshot shows the link; GameFAQs alone reports a Neutral-or-higher relationship threshold.' },
    { id: 'a_box', chapter: 'home', label: "OPEN ALICE'S BOX", short: 'Open box', kind: 'action', x: 320, y: 200, w: 195, h: 84, sub: 'later trigger unresolved', status: 'mixed', src: ['steam', 'transcript', 'neoseekerKara'],
      note: 'Contents are transcript-supported. Whether this box, a photo, or another action carries the later Todd state is unresolved.' },

    /* ---- Stormy Night: selected carried state only ---- */
    { id: 's_alive', chapter: 'stormy', label: 'Todd not killed', short: 'Todd not killed', kind: 'flag', x: 850, y: 230, w: 195, h: 84, sub: 'carried state · guide-reported', status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'Reported access condition for the later Todd meeting. How this state is reached is not covered here.' },
    { id: 's_dead', chapter: 'stormy', label: 'Todd killed', short: 'Todd killed', kind: 'flag', x: 620, y: 230, w: 195, h: 84, sub: 'closes the meeting branch', status: 'guide', src: ['powerpyxKara', 'fandomBattle'],
      note: 'Guides report that killing Todd closes the later meeting branch. No connector is drawn because the reviewed sources do not describe Stormy Night’s internal arrows.' },

    /* ---- Battle for Detroit — Kara: selected Todd meeting branch ---- */
    { id: 'k_terminal', chapter: 'kara', label: 'Kara and Alice reach the bus terminal', short: 'Bus terminal', kind: 'flag', x: 1160, y: 200, w: 210, h: 84, sub: 'reported access gate', status: 'guide', src: ['powerpyxKara', 'fandomBattle'],
      note: 'PowerPyx lists Meet Todd inside the Bus Terminal scene; arrival there is reported as required for the meeting to be available.' },
    { id: 'k_meet', chapter: 'kara', label: 'Meet Todd', short: 'Meet Todd', kind: 'action', x: 1160, y: 340, w: 210, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'PowerPyx: “only possible, if he wasn’t killed in Stormy Night.” The meeting is listed at the Bus Terminal.' },
    { id: 'k_dialogue', chapter: 'kara', label: 'Todd dialogue', short: 'Todd dialogue', kind: 'choice', x: 1420, y: 440, w: 230, h: 110, options: ['Persuade Todd', 'Fail to persuade Todd'], status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara', 'gamerGuides'],
      note: 'Positive options persuade Todd; negative options trigger a security check (guides agree).' },
    { id: 'k_away', chapter: 'kara', label: 'Todd sends soldiers away', short: 'Soldiers away', kind: 'outcome', x: 1740, y: 250, w: 210, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'k_check', chapter: 'kara', label: 'Security check follows', short: 'Security check', kind: 'outcome', x: 1740, y: 590, w: 210, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'] },
    { id: 'k_goodbye', chapter: 'kara', label: 'Alice says goodbye to Todd', short: 'Alice says goodbye', kind: 'outcome', x: 1740, y: 410, w: 210, h: 84, sub: 'reported sequence', status: 'user', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'User-provided sequence; the same wording appears in the inspected PowerPyx, Fandom and Neoseeker pages. No gameplay verification.' }
  ],

  /* from/to reference node ids. fromOption selects a choice row (0 = first).
     via = explicit orthogonal mid-x when the automatic channel would cross nodes.
     labelAt = explicit label position when the path midpoint is a poor spot. */
  edges: [
    /* A New Home local sequence — transcribed from the Steam screenshot */
    { from: 'a_welcome', to: 'a_todd', kind: 'traced' },
    { from: 'a_todd', to: 'a_clean1', kind: 'traced' },
    { from: 'a_clean1', to: 'a_ask', kind: 'traced' },
    { from: 'a_ask', to: 'a_go', kind: 'traced' },
    { from: 'a_go', to: 'a_clean2', kind: 'traced' },
    { from: 'a_clean2', to: 'a_room', kind: 'traced' },
    { from: 'a_room', to: 'a_talk', kind: 'traced' },
    { from: 'a_talk', to: 'a_key', kind: 'conditional', label: 'reported condition: relationship threshold (single source)', labelAt: { x: 455, y: 405 },
      note: 'The screenshot shows the link itself. GameFAQs alone reports the key is given at Neutral or higher; PowerPyx describes the conversation without a threshold.' },
    { from: 'a_key', to: 'a_box', kind: 'traced' },

    /* Cross-chapter candidate hypothesis — stays dashed, never causal */
    { from: 'a_box', to: 'k_dialogue', kind: 'hypothesis', via: 570, label: 'UNRESOLVED hypothesis · reported to affect Todd dialogue', labelAt: { x: 1000, y: 495 },
      src: ['neoseekerKara'],
      note: 'Neoseeker ties the later “[Your Story]” persuasion option to “unlocked Alice’s box during A New Home”. Whether the game checks opening the box, seeing a photo, or another action is unresolved. Drawn as a hypothesis only: it does not guarantee the meeting or its outcome.' },

    /* Cross-chapter prerequisite gate — Todd survival out of Stormy Night */
    { from: 's_alive', to: 'k_meet', kind: 'prerequisite', via: 1110, label: 'prerequisite: Todd not killed in Stormy Night', labelAt: { x: 1110, y: 320 },
      src: ['powerpyxKara'],
      note: 'PowerPyx: Meet Todd is “only possible, if he wasn’t killed in Stormy Night”. The negative state closes the branch; no arrow inside Stormy Night is claimed.' },

    /* Battle for Detroit — Kara meeting branch */
    { from: 'k_terminal', to: 'k_meet', kind: 'prerequisite', label: 'prerequisite: at the bus terminal', labelAt: { x: 1380, y: 312 },
      src: ['powerpyxKara'],
      note: 'PowerPyx lists Meet Todd at the Bus Terminal and says all checkpoint paths lead there; the meeting was not checked in game.' },
    { from: 'k_meet', to: 'k_dialogue', kind: 'traced' },
    { from: 'k_dialogue', fromOption: 0, to: 'k_away', kind: 'traced', label: 'Persuade Todd' },
    { from: 'k_dialogue', fromOption: 1, to: 'k_check', kind: 'traced', label: 'Fail to persuade' },
    { from: 'k_away', to: 'k_goodbye', kind: 'traced' }
  ],

  /* Detail panel entries. src lists ref keys; unknown carries the unresolved text. */
  detail: {
    a_key: {
      status: 'Guide-reported · single source for the threshold',
      summary: 'The Steam screenshot shows TALK WITH ALICE → ALICE GIVES KARA A KEY → OPEN ALICE’S BOX. GameFAQs additionally reports that the key is given at Neutral or higher relationship; PowerPyx describes the conversation without stating a threshold.',
      unknown: 'The exact relationship requirement is a single-source claim and has not been checked in game.',
      src: ['steam', 'gamefaqs', 'powerpyxHome']
    },
    a_box: {
      status: 'Transcript text for contents · later trigger unresolved',
      summary: 'The opened box reveals family drawings and photos, including Todd, his wife and his biological daughter (transcript lines 1947–1964). The Neoseeker page ties the later “[Your Story]” persuasion option to “unlocked Alice’s box during A New Home”.',
      unknown: 'Candidate triggers (open the box / see the photo / another related action) cannot be distinguished from the reviewed sources. The dashed hypothesis edge is a navigation aid only: it is not a confirmed causal link and does not guarantee the meeting or its outcome.',
      cross: { chapter: 'kara', node: 'k_dialogue', label: 'Open the reported later dialogue node' },
      src: ['transcript', 'neoseekerKara', 'powerpyxHome']
    },
    s_alive: {
      status: 'Guide-reported · carried state',
      summary: 'PowerPyx and Fandom both anchor the later Todd meeting on Todd not being killed in Stormy Night (PowerPyx: Todd can be “spared/avoided” in that chapter).',
      unknown: 'The internal Stormy Night branch that produces this state is outside the reviewed evidence and is not drawn.',
      cross: { chapter: 'kara', node: 'k_meet', label: 'Show the gated meeting node' },
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara']
    },
    s_dead: {
      status: 'Guide-reported · branch closure',
      summary: 'Guides report that killing Todd closes the later Todd meeting branch. This node is shown as the negative state; no in-chapter or cross-chapter connector is drawn from it.',
      unknown: 'What the game checks exactly, and which Stormy Night actions produce this state, are not covered by the reviewed evidence.',
      src: ['powerpyxKara', 'fandomBattle']
    },
    k_terminal: {
      status: 'Guide-reported · access gate',
      summary: 'PowerPyx lists Meet Todd inside the Bus Terminal scene, after “Continue to Bus Terminal”, and states that all checkpoint paths lead to “At the Bus Terminal”. Reaching the terminal is shown as a separate gate from Todd’s survival.',
      unknown: 'The reviewed guides describe the scene order, not a numeric or state variable; the gate is not verified in game.',
      cross: { chapter: 'kara', node: 'k_meet', label: 'Show the gated meeting node' },
      src: ['powerpyxKara', 'fandomBattle']
    },
    k_meet: {
      status: 'Guide-reported · matching sources',
      summary: 'PowerPyx: Meet Todd is “only possible, if he wasn’t killed in Stormy Night”. Neoseeker: “If Todd survived Stormy Night … he’ll confront Kara.” The meeting sits at the Bus Terminal scene.',
      unknown: 'Whether the earlier A New Home box/photo state also changes this meeting’s availability is unresolved; the reported effect is on the dialogue options, shown as a dashed hypothesis.',
      cross: { chapter: 'stormy', node: 's_alive', label: 'Show the survival gate' },
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara']
    },
    k_dialogue: {
      status: 'Guide-reported · matching sources',
      summary: 'PowerPyx: positive dialogue options (“Persuade Todd”) lead to Todd sending the soldiers away and Alice saying goodbye; negative options (“Fail to persuade Todd”) make soldiers arrive for a security check. Neoseeker adds that “[Your Story]” is tied to Alice’s box in A New Home.',
      unknown: 'Exact wordings of every positive and negative option, and all downstream responses (for example Luther’s diversion), are outside this slice.',
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara', 'gamerGuides']
    },
    k_away: {
      status: 'Guide-reported · matching sources',
      summary: 'Todd sends the soldiers away when persuaded (PowerPyx, Fandom, Neoseeker all list this node). In the user-provided sequence this is followed by Alice saying goodbye to Todd.',
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara']
    },
    k_check: {
      status: 'Guide-reported · matching sources',
      summary: 'Failing to persuade Todd makes soldiers arrive for a security check (PowerPyx, Fandom); the earlier ledger also records Gamer Guides describing the “Fail to Persuade Todd” outcome.',
      unknown: 'What happens after the check depends on other characters (for example Luther) and is outside this slice.',
      src: ['powerpyxKara', 'fandomBattle', 'gamerGuides']
    },
    k_goodbye: {
      status: 'User-provided claim · page wording matches inspected guides',
      summary: 'The user-provided Fandom sequence reads: Meet Todd (not killed in Stormy Night) → Persuade Todd → Todd sends soldiers away → Alice says goodbye to Todd. The same node names appear in the PowerPyx and Neoseeker pages inspected on 2026-10-18.',
      unknown: 'No gameplay verification; community-edited and guide-level evidence only. Kept separate from the unresolved Alice-box trigger.',
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara']
    }
  }
};
