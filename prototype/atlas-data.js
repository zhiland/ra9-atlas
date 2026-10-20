/* PoC4 — multi-chapter atlas data (Detroit: Become Human).
   Standalone classic script: no modules, no imports, no fetch. Load before
   atlas-core.js / atlas-app.js so prototype/poc4-*.html open directly over file://.
   Validate with:  node prototype/validate-atlas-data.js
   Contract: docs/data-contract.md (PoC4 sample only; edge order is preserved).

   Provenance and evidence limits (see docs/notes/poc4-coverage.md and
   docs/notes/content-expansion-slice.md):
   - A New Home structure: selected local sequence transcribed from the Steam
     "100% Chapter Flowcharts" screenshot for A New Home; see
     docs/notes/map-reference-analysis.md. Chore and side labels with unresolved
     arrows are omitted rather than invented. The nightstand gun clue and the
     opened Alice's-room window are separate guide-reported events, not claims
     of possession or a successful escape.
   - Stormy Night: selected gun/window events plus two source-supported
     successful non-gun escape routes: the corridor/hiding route to the
     front-door/backyard exit, and the locked-room window route. Internal
     chapter topology is NOT transcribed in full. The guides do not state
     Todd's later state for either non-gun route, so their links into the
     existing Todd-not-killed state are dashed inferences, not traced or
     confirmed links. Fatal routes and other branches remain outside this slice.
   - Battle for Detroit — Kara: guide-reported checkpoint detour/timing branch
     and Todd meeting branch. The exact 11-minute boundary is unresolved; no
     <= or >= rule is modelled. The checkpoint route is a chapter-local route,
     not a carried state.
   - The box-to-later-dialogue relationship stays a dashed, labeled hypothesis
     (edge kind "hypothesis"): guides are incomplete about whether opening the
     box, seeing a photo, or another related action carries the state.
   - No transition is verified in game; version and platform are unknown.

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
    contractVersion: '1.0',
    title: 'ra9-atlas',
    subtitle: 'Selected slices · A New Home → Stormy Night → Battle for Detroit (Kara)',
    version: 'unknown',
    platform: 'unknown',
    disclaimer: 'Guide-based and screenshot-transcribed only. No transition is verified in game; game version and platform are unknown.',
    counts: {
      chapters: 3,
      nodes: 38,
      edges: 42,
      tracedEdges: 26,
      conditionalEdges: 8,
      prerequisiteEdges: 5,
      hypothesisEdges: 3,
      crossChapterEdges: 4
    }
  },

  refs: {
    steam: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882',
    powerpyxHome: 'https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/',
    powerpyxStormy: 'https://www.powerpyx.com/detroit-become-human-stormy-night-walkthrough-100/',
    gamerGuidesStormy: 'https://www.gamerguides.com/detroit-become-human/guide/walkthrough/chapter-1/chapter-6-stormy-night',
    gamefaqsStormy: 'https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/stormy-night',
    gamefaqs: 'https://gamefaqs.gamespot.com/ps4/182637-detroit-become-human/faqs/76123/a-new-home',
    transcript: 'https://detroit-become-human.fandom.com/wiki/A_New_Home_%28Transcript%29',
    powerpyxKara: 'https://www.powerpyx.com/detroit-become-human-battle-for-detroit-kara-walkthrough-100/',
    fandomBattle: 'https://detroit-become-human.fandom.com/wiki/Battle_for_Detroit',
    neoseekerKara: 'https://www.neoseeker.com/detroit-become-human/walkthrough/Battle_for_Detroit_Kara',
    gamerGuides: 'https://www.gamerguides.com/detroit-become-human/guide/walkthrough/chapter-1/chapter-31-battle-for-detroit-kara'
  },

  canvas: { width: 2180, height: 980 },

  chapters: [
    {
      id: 'home',
      name: 'A New Home',
      code: 'D2 · selected Alice sequence + carried clues',
      frame: { x: 30, y: 120, w: 520, h: 860 },
      desc: 'Selected local sequence transcribed from the Steam chapter screenshot (10 boxes, 9 links), plus two guide-reported carried-state clues: the nightstand gun was seen and Alice’s room window was opened. Chores and unlinked side labels are omitted; the box-to-Todd relationship stays unresolved.',
      coverage: {
        status: 'partial',
        scope: 'Selected local Alice sequence plus two separate guide-reported gun/window clue events.',
        included: '12 events: 10 screenshot-transcribed events from WELCOME HOME through OPEN ALICE’S BOX, plus SEE GUN IN TODD’S NIGHTSTAND and OPEN ALICE’S ROOM WINDOW. 11 internal links.',
        omitted: 'Remaining chores, unlinked side labels whose arrows the screenshot does not resolve, how the gun clue is checked by the game, and window-escape outcomes.',
        sources: ['steam', 'gamefaqs', 'powerpyxHome', 'transcript', 'neoseekerKara']
      }
    },
    {
      id: 'stormy',
      name: 'Stormy Night',
      code: 'D2 · selected gun/window + non-gun escape routes',
      frame: { x: 575, y: 120, w: 730, h: 860 },
      desc: 'Selected guide-reported gun and window events, plus two distinct successful non-gun escape routes. The corridor route hides until Todd passes and exits through the front door/backyard; the window route locks the room, goes out, passes the reported QTE and reaches the bus. The guides do not state Todd’s later state for either route, so both links to Todd not killed are explicit inferences. Other internal branches and all fatal escape outcomes are not drawn.',
      coverage: {
        status: 'partial',
        scope: 'Selected gun/window events, the existing Todd fate states, and two successful non-gun escape routes.',
        included: 'Seventeen states/events: Todd not killed, Todd killed, take the nightstand gun, struggle for the gun, Kara shoots Todd, Alice shoots Todd, gun carried forward (Kara only), the window route opened from A New Home, and nine steps/outcomes for the corridor and window escape routes. Seventeen selected internal links.',
        omitted: 'All other Stormy Night branches, non-gun fatal and miss-bus outcomes, exact QTE requirements/difficulty, unseen hidden triggers, and direct evidence of Todd’s later state after either non-gun escape.',
        sources: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy', 'powerpyxKara', 'fandomBattle']
      }
    },
    {
      id: 'kara',
      name: 'Battle for Detroit — Kara',
      code: 'D2 · selected checkpoint + Todd meeting branches',
      frame: { x: 1330, y: 120, w: 820, h: 790 },
      desc: 'Guide-reported security-checkpoint detour timing branch and Todd meeting branch. The checkpoint route is not carried across chapters; the late-bus outcome still reaches the terminal. Ticket, border and river branches remain omitted.',
      coverage: {
        status: 'partial',
        scope: 'Selected checkpoint detour/timing branch and Todd meeting branch in Battle for Detroit — Kara.',
        included: 'Nine events: the checkpoint route choice, detour, delayed/last-bus outcome, bus-terminal arrival, Todd meeting, dialogue result, and two reported access gates.',
        omitted: 'Guarded-checkpoint interactions, ticket, border and river branches, downstream responses, and other checkpoint/timing cases.',
        sources: ['powerpyxKara', 'fandomBattle', 'neoseekerKara', 'gamerGuides']
      }
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

    /* ---- A New Home: guide-reported carried clues (separate from possession) ---- */
    { id: 'a_gun_seen', chapter: 'home', label: 'SEE GUN IN TODD’S NIGHTSTAND', short: 'See nightstand gun', kind: 'flag', x: 320, y: 760, w: 195, h: 84, sub: 'clue seen · not possession', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx reports checking Todd’s nightstand while cleaning his room; this records the clue being seen, not the gun being carried.' },
    { id: 'a_window_open', chapter: 'home', label: 'OPEN ALICE’S ROOM WINDOW', short: 'Open room window', kind: 'action', x: 55, y: 870, w: 195, h: 84, sub: 'opened · future route only', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx says opening the window unlocks a possible future escape way. The opening is represented; escape success is not.' },

    /* ---- Stormy Night: existing carried states + selected gun/window events ---- */
    { id: 's_alive', chapter: 'stormy', label: 'Todd survives', short: 'Todd not killed', kind: 'flag', x: 1135, y: 500, w: 150, h: 84, sub: 'carried state · guide-reported', status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'Reported access condition for the later Todd meeting. Two successful non-gun escape routes now point here only as dashed inferences; the guides do not state Todd’s later state for either route.' },
    { id: 's_dead', chapter: 'stormy', label: 'Todd killed', short: 'Todd killed', kind: 'flag', x: 1135, y: 370, w: 150, h: 84, sub: 'closes the meeting branch', status: 'guide', src: ['powerpyxStormy', 'powerpyxKara', 'fandomBattle'],
      note: 'The selected gun outcomes feed this state. Other ways to reach it and all non-gun Stormy Night branches remain outside this slice.' },
    { id: 's_take_gun', chapter: 'stormy', label: 'Take the gun', short: 'Take nightstand gun', kind: 'action', x: 595, y: 220, w: 150, h: 84, sub: 'requires gun seen in A New Home', status: 'guide', src: ['powerpyxStormy'],
      note: 'PowerPyx reports the gun is available only if it was found in Todd’s nightstand in Chapter 4.' },
    { id: 's_gun_struggle', chapter: 'stormy', label: 'Gun struggle', short: 'Gun struggle', kind: 'action', x: 775, y: 220, w: 150, h: 84, sub: 'reported confrontation', status: 'guide', src: ['powerpyxStormy'],
      note: 'PowerPyx describes threatening Todd and a melee combat; exact QTE timing and difficulty are not modelled.' },
    { id: 's_kara_shoots_todd', chapter: 'stormy', label: 'Kara shoots Todd', short: 'Kara shoots Todd', kind: 'outcome', x: 955, y: 220, w: 150, h: 84, sub: 'selected shooting outcome', status: 'guide', src: ['powerpyxStormy', 'powerpyxKara'],
      note: 'PowerPyx says Kara regains the gun and shoots Todd, and that this gives Kara the gun for future chapters.' },
    { id: 's_alice_shoots_todd', chapter: 'stormy', label: 'Alice shoots Todd', short: 'Alice shoots Todd', kind: 'outcome', x: 955, y: 370, w: 150, h: 84, sub: 'separate shooting outcome', status: 'guide', src: ['powerpyxStormy'],
      note: 'PowerPyx says that if Kara does not pick the gun back up, Alice picks it up and shoots Todd. This does not carry the gun forward.' },
    { id: 's_gun_carried', chapter: 'stormy', label: 'Kara keeps gun', short: 'Gun carried forward', kind: 'flag', x: 1135, y: 220, w: 150, h: 84, sub: 'supplemental carried state · Kara only', status: 'guide', src: ['powerpyxStormy'],
      note: 'Supplemental carried-state node: only the guide-stated Kara-shoots outcome creates it. No later-chapter use of the gun is modelled.' },
    { id: 's_window_open', chapter: 'stormy', label: 'Window route', short: 'Window route', kind: 'action', x: 595, y: 500, w: 150, h: 84, sub: 'route available · success branch drawn', status: 'guide', src: ['powerpyxStormy', 'powerpyxHome', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx, Gamer Guides and GameFAQs say the window option is available only if the window was opened in A New Home. Availability is separate from the successful branch drawn after it.' },

    /* ---- Battle for Detroit — Kara: checkpoint detour + Todd meeting branches ---- */
    { id: 'k_terminal', chapter: 'kara', label: 'Reach bus terminal', short: 'Bus terminal', kind: 'flag', x: 1740, y: 230, w: 170, h: 84, sub: 'reported access gate', status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'],
      note: 'PowerPyx and Gamer Guides state all checkpoint ways reach the Bus Terminal; the late-bus outcome still arrives there.' },
    { id: 'k_meet', chapter: 'kara', label: 'Meet Todd', short: 'Meet Todd', kind: 'action', x: 1730, y: 360, w: 190, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'PowerPyx: “only possible, if he wasn’t killed in Stormy Night.” The meeting is listed at the Bus Terminal.' },
    { id: 'k_dialogue', chapter: 'kara', label: 'Todd dialogue', short: 'Todd dialogue', kind: 'choice', x: 1940, y: 570, w: 210, h: 110, options: ['Persuade Todd', 'Fail to persuade Todd'], status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara', 'gamerGuides'],
      note: 'Positive options persuade Todd; negative options trigger a security check (guides agree).' },
    { id: 'k_away', chapter: 'kara', label: 'Todd sends soldiers away', short: 'Soldiers away', kind: 'outcome', x: 1940, y: 320, w: 190, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'k_check', chapter: 'kara', label: 'Security check follows', short: 'Security check', kind: 'outcome', x: 1940, y: 760, w: 190, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'] },
    { id: 'k_goodbye', chapter: 'kara', label: 'Alice says goodbye to Todd', short: 'Alice says goodbye', kind: 'outcome', x: 1730, y: 650, w: 190, h: 84, sub: 'reported sequence', status: 'user', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'User-provided sequence; the same wording appears in the inspected PowerPyx, Fandom and Neoseeker pages. No gameplay verification.' },
    { id: 'k_checkpoint', chapter: 'kara', label: 'Checkpoint choice', short: 'Checkpoint route', kind: 'choice', x: 1350, y: 230, w: 160, h: 110, options: ['Take Detour', 'Approach Checkpoint'], sub: 'chapter-local route choice', status: 'guide', src: ['powerpyxKara', 'gamerGuides'],
      note: 'The route choice is local to this chapter and is not a carried cross-chapter state.' },
    { id: 'k_detour', chapter: 'kara', label: 'Take detour', short: 'Take detour', kind: 'action', x: 1540, y: 520, w: 150, h: 84, sub: 'reported timing condition', status: 'guide', src: ['powerpyxKara', 'gamerGuides'],
      note: 'PowerPyx and Gamer Guides report a timing-dependent detour outcome; the exact 11-minute boundary is unresolved.' },
    { id: 'k_late_bus', chapter: 'kara', label: 'Bus has left', short: 'Last bus gone', kind: 'outcome', x: 1540, y: 680, w: 150, h: 84, sub: 'still reaches the terminal', status: 'guide', src: ['powerpyxKara', 'gamerGuides'],
      note: 'Reported when the detour is taken after waiting and the timer is below 11 minutes. This is a late-bus outcome at the terminal, not a loss of terminal or Todd-meeting access.' },

    /* ---- Stormy Night: two distinct successful non-gun escape routes ---- */
    { id: 's_reach_alice', chapter: 'stormy', label: 'Reach Alice', short: 'Reach Alice', kind: 'action', x: 775, y: 500, w: 150, h: 84, sub: 'go-upstairs route', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx and Gamer Guides both place the non-gun routes after going upstairs and reaching Alice before Todd.' },
    { id: 's_run_away', chapter: 'stormy', label: 'Run away', short: 'Run away', kind: 'action', x: 595, y: 635, w: 150, h: 84, sub: 'reported route step', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx and Gamer Guides report a Run Away option that takes Alice out of her room.' },
    { id: 's_hide_corridor', chapter: 'stormy', label: 'Hide', short: 'Hide', kind: 'action', x: 775, y: 635, w: 150, h: 84, sub: 'reported route step', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides describe hiding outside Alice’s room rather than standing still; the exact hiding inputs are not modelled.' },
    { id: 's_todd_passes', chapter: 'stormy', label: 'Todd passes', short: 'Todd passes', kind: 'outcome', x: 955, y: 635, w: 150, h: 84, sub: 'reported hiding timing', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx says Todd walks past the hiding place; Gamer Guides says to wait until he walks by. Exact timing is not modelled.' },
    { id: 's_front_backyard_escape', chapter: 'stormy', label: 'Door/yard exit', short: 'Door/yard exit', kind: 'outcome', x: 1135, y: 740, w: 150, h: 84, sub: 'successful non-gun exit · Todd state not stated', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'After Todd passes, PowerPyx and Gamer Guides report the front-door/backyard route. GameFAQs also reports the front-door alternative when the window route was not opened. This records a successful exit, not a later Todd state.' },

    { id: 's_lock_room', chapter: 'stormy', label: 'Lock room', short: 'Lock room', kind: 'action', x: 595, y: 740, w: 150, h: 84, sub: 'window-route branch', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'All three guides report locking Alice’s room before using the window. The precise time limit is not modelled.' },
    { id: 's_window_go_out', chapter: 'stormy', label: 'Window exit', short: 'Window exit', kind: 'action', x: 775, y: 740, w: 150, h: 84, sub: 'choose Go out', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx says to open the window and choose Go out; Gamer Guides and GameFAQs describe placing Alice outside and following her.' },
    { id: 's_window_qte', chapter: 'stormy', label: 'Pass QTE', short: 'Pass QTE', kind: 'action', x: 955, y: 740, w: 150, h: 84, sub: 'reported success condition', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx reports passing the QTE while Todd tries to stop the climb. The exact difficulty, prompts and hidden triggers are not modelled.' },
    { id: 's_window_reach_bus', chapter: 'stormy', label: 'Reach bus', short: 'Reach bus', kind: 'outcome', x: 955, y: 845, w: 150, h: 84, sub: 'successful window escape · Todd state not stated', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx, Gamer Guides and GameFAQs describe passing the climb, taking Alice down and reaching the bus. This records the successful escape, not Todd’s later state.' }
  ],

  /* id is the stable link id; array index and order stay unchanged for ?edge=N.
     Every previously published edge keeps its position; later expansions append
     new edges after them. from/to reference node ids. fromOption selects a
     choice row (0 = first). via = explicit orthogonal mid-x when the automatic
     channel would cross nodes. labelAt = explicit label position when the path
     midpoint is a poor spot. */
  edges: [
    /* A New Home local sequence — transcribed from the Steam screenshot */
    { id: 'e_home_welcome_todd', from: 'a_welcome', to: 'a_todd', kind: 'traced', src: ['steam'] },
    { id: 'e_home_todd_clean1', from: 'a_todd', to: 'a_clean1', kind: 'traced', src: ['steam'] },
    { id: 'e_home_clean1_ask', from: 'a_clean1', to: 'a_ask', kind: 'traced', src: ['steam'] },
    { id: 'e_home_ask_go', from: 'a_ask', to: 'a_go', kind: 'traced', src: ['steam'] },
    { id: 'e_home_go_clean2', from: 'a_go', to: 'a_clean2', kind: 'traced', src: ['steam'] },
    { id: 'e_home_clean2_room', from: 'a_clean2', to: 'a_room', kind: 'traced', src: ['steam'] },
    { id: 'e_home_room_talk', from: 'a_room', to: 'a_talk', kind: 'traced', src: ['steam'] },
    { id: 'e_home_talk_key', from: 'a_talk', to: 'a_key', kind: 'conditional', label: 'reported condition: relationship threshold (single source)', labelAt: { x: 455, y: 405 },
      src: ['steam', 'gamefaqs', 'powerpyxHome'],
      note: 'The screenshot shows the link itself. GameFAQs alone reports the key is given at Neutral or higher; PowerPyx describes the conversation without a threshold.' },
    { id: 'e_home_key_box', from: 'a_key', to: 'a_box', kind: 'traced', src: ['steam'] },

    /* Cross-chapter candidate hypothesis — stays dashed, never causal */
    { id: 'e_home_box_kara_dialogue_hypothesis', from: 'a_box', to: 'k_dialogue', kind: 'hypothesis', via: 560, label: 'UNRESOLVED hypothesis · reported to affect Todd dialogue', labelAt: { x: 1180, y: 650 },
      src: ['neoseekerKara'],
      note: 'Neoseeker ties the later “[Your Story]” persuasion option to “unlocked Alice’s box during A New Home”. Whether the game checks opening the box, seeing a photo, or another action is unresolved. Drawn as a hypothesis only: it does not guarantee the meeting or its outcome.' },

    /* Cross-chapter prerequisite gate — Todd survival out of Stormy Night */
    { id: 'e_stormy_alive_meet', from: 's_alive', to: 'k_meet', kind: 'prerequisite', via: 1315, label: 'prerequisite: Todd not killed in Stormy Night', labelAt: { x: 1315, y: 520 },
      src: ['powerpyxKara'],
      note: 'PowerPyx: Meet Todd is “only possible, if he wasn’t killed in Stormy Night”. The negative state closes the branch; no arrow inside Stormy Night is claimed.' },

    /* Battle for Detroit — Kara meeting branch */
    { id: 'e_kara_terminal_meet', from: 'k_terminal', to: 'k_meet', kind: 'prerequisite', label: 'prerequisite: at the bus terminal', labelAt: { x: 1830, y: 330 },
      src: ['powerpyxKara'],
      note: 'PowerPyx lists Meet Todd at the Bus Terminal and says all checkpoint paths lead there; the meeting was not checked in game.' },
    { id: 'e_kara_meet_dialogue', from: 'k_meet', to: 'k_dialogue', kind: 'traced', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'e_kara_dialogue_away', from: 'k_dialogue', fromOption: 0, to: 'k_away', kind: 'traced', label: 'Persuade Todd', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'e_kara_dialogue_check', from: 'k_dialogue', fromOption: 1, to: 'k_check', kind: 'traced', label: 'Fail to persuade', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'] },
    { id: 'e_kara_away_goodbye', from: 'k_away', to: 'k_goodbye', kind: 'traced', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },

    /* A New Home expansion — separate guide-reported clue/window events */
    { id: 'e_home_go_gun_seen', from: 'a_go', to: 'a_gun_seen', kind: 'conditional', label: 'optional upstairs clue', labelAt: { x: 150, y: 742 },
      src: ['powerpyxHome'],
      note: 'PowerPyx places the nightstand check while cleaning Todd’s room after going upstairs. The screenshot sequence does not show this optional side clue.' },
    { id: 'e_home_room_window', from: 'a_room', to: 'a_window_open', kind: 'conditional', via: 540, label: 'optional room action', labelAt: { x: 530, y: 800 },
      src: ['powerpyxHome'],
      note: 'PowerPyx: while cleaning Alice’s room, opening the window is an optional room action. The node records opening, not merely discovering the window, and the connector does not assert a required next step.' },

    /* Cross-chapter carried-state gates: A New Home → Stormy Night */
    { id: 'e_home_gun_stormy_take', from: 'a_gun_seen', to: 's_take_gun', kind: 'prerequisite', via: 560, label: 'prerequisite: gun was seen in A New Home', labelAt: { x: 560, y: 660 },
      src: ['powerpyxStormy', 'powerpyxHome'],
      note: 'PowerPyx Stormy Night says Kara can take the gun only if it was found in Todd’s nightstand in Chapter 4; the A New Home guide reports that sighting. This gates availability to take it in Stormy Night, not possession in A New Home.' },
    { id: 'e_home_window_stormy_route', from: 'a_window_open', to: 's_window_open', kind: 'prerequisite', via: 560, label: 'prerequisite: window opened in A New Home', labelAt: { x: 560, y: 500 },
      src: ['powerpyxStormy', 'powerpyxHome'],
      note: 'PowerPyx Stormy Night says the window option is available if the route was found in Chapter 4; the A New Home guide reports opening Alice’s room window. This enables the route, not a successful escape.' },

    /* Stormy Night expansion — guide-stated gun confrontation and outcomes */
    { id: 'e_stormy_take_gun_struggle', from: 's_take_gun', to: 's_gun_struggle', kind: 'traced', src: ['powerpyxStormy'],
      note: 'PowerPyx says taking the gun leads to threatening Todd and a melee combat.' },
    { id: 'e_stormy_struggle_kara_shoots', from: 's_gun_struggle', to: 's_kara_shoots_todd', kind: 'conditional', label: 'Kara keeps the gun', labelAt: { x: 960, y: 196 },
      src: ['powerpyxStormy'],
      note: 'PowerPyx reports that picking the gun back up during the prompt makes Kara shoot Todd. Exact QTE timing and difficulty are not modelled.' },
    { id: 'e_stormy_struggle_alice_shoots', from: 's_gun_struggle', to: 's_alice_shoots_todd', kind: 'conditional', label: 'Alice takes the gun', labelAt: { x: 960, y: 328 },
      src: ['powerpyxStormy'],
      note: 'PowerPyx reports that not picking the gun back up makes Alice pick it up and shoot Todd. This is a separate outcome, not a generic gun-outcome choice.' },
    { id: 'e_stormy_kara_gun_carried', from: 's_kara_shoots_todd', to: 's_gun_carried', kind: 'traced', label: 'guide-stated future carry', labelAt: { x: 1135, y: 118 },
      src: ['powerpyxStormy'],
      note: 'PowerPyx’s cross-chapter note says only this Kara-shoots approach gives Kara the gun for future chapters.' },
    { id: 'e_stormy_kara_dead', from: 's_kara_shoots_todd', to: 's_dead', kind: 'traced', src: ['powerpyxStormy', 'powerpyxKara'],
      note: 'Stormy Night reports Kara shoots Todd; the Kara finale guide treats Todd killed in Stormy Night as closing the meeting.' },
    { id: 'e_stormy_alice_dead', from: 's_alice_shoots_todd', to: 's_dead', kind: 'traced', src: ['powerpyxStormy', 'powerpyxKara'],
      note: 'Stormy Night reports Alice shoots Todd; the Kara finale guide treats Todd killed in Stormy Night as closing the meeting.' },

    /* Battle for Detroit — Kara checkpoint detour/timing branch */
    { id: 'e_kara_checkpoint_detour', from: 'k_checkpoint', fromOption: 0, to: 'k_detour', kind: 'traced', label: 'Take Detour', labelAt: { x: 1535, y: 176 },
      src: ['powerpyxKara', 'gamerGuides'] },
    { id: 'e_kara_checkpoint_terminal', from: 'k_checkpoint', fromOption: 1, to: 'k_terminal', kind: 'traced', label: 'Approach Checkpoint', labelAt: { x: 1630, y: 300 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'The guarded-checkpoint interactions are omitted; both reviewed guides state all checkpoint ways lead to the Bus Terminal.' },
    { id: 'e_kara_detour_late', from: 'k_detour', to: 'k_late_bus', kind: 'conditional', label: 'wait, then detour · below 11 min (reported)', labelAt: { x: 1610, y: 290 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'Both reviewed guides describe waiting before taking the detour with the timer reported below 11 minutes and a delayed/last-bus result. Independence is unknown; the exact 11:00 boundary is not stated and is left unresolved.' },
    { id: 'e_kara_detour_terminal', from: 'k_detour', to: 'k_terminal', kind: 'conditional', label: 'detour immediately · above 11 min (reported)', labelAt: { x: 1710, y: 220 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'Both reviewed guides describe taking the detour immediately with the timer reported above 11 minutes and reaching the terminal on time. Independence is unknown; the exact 11:00 boundary is not stated and is left unresolved.' },
    { id: 'e_kara_late_terminal', from: 'k_late_bus', to: 'k_terminal', kind: 'traced', label: 'still reaches the terminal', labelAt: { x: 1725, y: 375 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'The guides state all checkpoint ways, including the late/last-bus outcome, lead to the Bus Terminal. This branch therefore does not block the terminal or Todd-meeting gates.' },

    /* Stormy Night expansion — corridor/hiding successful non-gun route */
    { id: 'e_stormy_reach_run_away', from: 's_reach_alice', to: 's_run_away', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx and Gamer Guides both place Run Away under reaching Alice before Todd on the go-upstairs branch.' },
    { id: 'e_stormy_run_hide', from: 's_run_away', to: 's_hide_corridor', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides report leaving Alice’s room and hiding in the corridor; this is not the separate Fail to Hide outcome.' },
    { id: 'e_stormy_hide_todd_passes', from: 's_hide_corridor', to: 's_todd_passes', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx says to wait until Todd walks past; Gamer Guides says to hide until he walks by. Exact hiding inputs and timing are not modelled.' },
    { id: 'e_stormy_todd_passes_front_backyard', from: 's_todd_passes', to: 's_front_backyard_escape', kind: 'traced', label: 'reported exit route',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx and Gamer Guides connect the hiding route to the front-door/backyard exit. GameFAQs also reports the front-door alternative when the window route is unavailable. Exact door, yard and QTE steps are omitted; only the successful route is represented.' },
    { id: 'e_stormy_front_backyard_alive', from: 's_front_backyard_escape', to: 's_alive', kind: 'hypothesis', label: 'UNRESOLVED inference · Todd state not stated', labelAt: { x: 1205, y: 606 },
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'The reviewed guides describe a successful non-gun escape but do not state Todd’s later state. Linking this route to the existing Todd-not-killed state is an inference, not a traced or confirmed outcome. The meeting still needs the separate terminal gate.' },

    /* Stormy Night expansion — locked-room window successful non-gun route */
    { id: 'e_stormy_reach_lock_room', from: 's_reach_alice', to: 's_lock_room', kind: 'traced', via: 750,
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'All three guides report locking Alice’s room after reaching her on the go-upstairs branch. The reported time window is not modelled.' },
    { id: 'e_stormy_window_go_out_access', from: 's_window_open', to: 's_window_go_out', kind: 'prerequisite', via: 765, label: 'prerequisite: window route opened in A New Home',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy', 'powerpyxHome'],
      note: 'All three Stormy Night guides say the window option is available only if that window route was opened in A New Home. This gates the window exit, not locking the room or a successful escape by itself.' },
    { id: 'e_stormy_lock_go_out', from: 's_lock_room', to: 's_window_go_out', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx reports opening the window and choosing Go out; Gamer Guides and GameFAQs describe placing Alice outside and following.' },
    { id: 'e_stormy_go_out_qte', from: 's_window_go_out', to: 's_window_qte', kind: 'conditional', label: 'pass reported QTE',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx reports a QTE while Todd tries to stop the climb; Gamer Guides and GameFAQs describe the successful climb. Only the success condition is represented. Exact prompts, difficulty and hidden triggers are not modelled.' },
    { id: 'e_stormy_qte_bus', from: 's_window_qte', to: 's_window_reach_bus', kind: 'traced', label: 'take Alice down',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'After the reported QTE, the guides describe taking Alice down and reaching the bus. Exact animations and inputs are omitted.' },
    { id: 'e_stormy_window_bus_alive', from: 's_window_reach_bus', to: 's_alive', kind: 'hypothesis', label: 'UNRESOLVED inference · Todd state not stated', labelAt: { x: 1145, y: 690 },
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'The reviewed guides describe the successful window escape but do not state Todd’s later state. Linking this route to Todd not killed is an inference, not a traced or confirmed outcome. The meeting still needs the separate terminal gate.' }
  ],

  /* Conditions are plain-English groups over existing edges. They add no edge
     or claim. SINGLE means one reported requirement with no AND/OR grouping;
     AND/OR are used only where the reviewed sample supports the grouping. */
  conditions: [
    {
      id: 'cond_key_relationship',
      appliesTo: ['e_home_talk_key'],
      operator: 'SINGLE',
      summary: 'One reported condition on the key step: GameFAQs says Alice gives Kara the key at a Neutral-or-higher relationship. The screenshot and PowerPyx do not state that threshold.',
      requirements: [
        'Reported relationship threshold: Neutral or higher (GameFAQs only).'
      ],
      sources: ['gamefaqs', 'steam', 'powerpyxHome']
    },
    {
      id: 'cond_meet_todd_access',
      appliesTo: ['e_stormy_alive_meet', 'e_kara_terminal_meet'],
      operator: 'AND',
      summary: 'Meet Todd requires both reported requirements: Todd was not killed in Stormy Night AND Kara and Alice reached the bus terminal. They remain two separate prerequisite edges; this record only groups them in plain English.',
      requirements: [
        'Todd was not killed in Stormy Night.',
        'Kara and Alice reached the bus terminal.'
      ],
      sources: ['powerpyxKara', 'fandomBattle', 'neoseekerKara']
    },
    {
      id: 'cond_checkpoint_detour_late',
      appliesTo: ['e_kara_detour_late'],
      operator: 'AND',
      summary: 'The late-bus connector is reported when Kara waits before taking the detour and the timer is below 11 minutes. The exact 11:00 boundary is unresolved.',
      requirements: [
        'Wait before taking the detour.',
        'Timer reported below 11 minutes.'
      ],
      sources: ['powerpyxKara', 'gamerGuides']
    },
    {
      id: 'cond_checkpoint_detour_ontime',
      appliesTo: ['e_kara_detour_terminal'],
      operator: 'AND',
      summary: 'The on-time connector is reported when Kara takes the detour immediately and the timer is above 11 minutes. The exact 11:00 boundary is unresolved.',
      requirements: [
        'Take the detour immediately.',
        'Timer reported above 11 minutes.'
      ],
      sources: ['powerpyxKara', 'gamerGuides']
    },
    {
      id: 'cond_window_qte_success',
      appliesTo: ['e_stormy_go_out_qte'],
      operator: 'SINGLE',
      summary: 'The successful window route requires passing the reported climb QTE; exact prompts and difficulty are not stated.',
      requirements: ['Pass the reported window-climb QTE.'],
      sources: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    }
  ],

  /* Unknowns are incomplete evidence, not source-vs-source conflicts. The
     current sample records no conflict; a conflict would use the same shape
     under conflicts with status "conflict" and at least one source. */
  uncertainties: [
    {
      id: 'u_box_trigger',
      status: 'unknown',
      explanation: 'Whether opening the box, seeing a photo, or another related action carries the later Todd dialogue state cannot be distinguished from the reviewed sources.',
      nodes: ['a_box', 'k_dialogue'],
      edges: ['e_home_box_kara_dialogue_hypothesis'],
      sources: ['neoseekerKara', 'transcript']
    },
    {
      id: 'u_key_threshold',
      status: 'unknown',
      explanation: 'The exact relationship requirement is a single-source claim and has not been checked in game; PowerPyx describes the conversation without a threshold.',
      nodes: ['a_key'],
      edges: ['e_home_talk_key'],
      sources: ['gamefaqs', 'powerpyxHome', 'steam']
    },
    {
      id: 'u_stormy_internal',
      status: 'unknown',
      explanation: 'Only the selected gun outcomes into Todd killed and two selected successful non-gun escape routes are drawn. Other Stormy Night branches, including fatal escape outcomes and other ways Todd is spared or avoided, remain outside this slice. The two non-gun routes are not evidence of Todd’s later state.',
      nodes: ['s_alive', 's_dead', 's_front_backyard_escape', 's_window_reach_bus'],
      edges: ['e_stormy_alive_meet', 'e_stormy_front_backyard_alive', 'e_stormy_window_bus_alive'],
      sources: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy', 'powerpyxKara', 'fandomBattle']
    },
    {
      id: 'u_checkpoint_timer_11',
      status: 'unknown',
      explanation: 'The reviewed checkpoint guides describe a reported below/above-11-minute split for the detour, but the exact treatment of 11:00 is not stated. No inclusive boundary rule is modelled, and the late-bus branch still reaches the terminal.',
      nodes: ['k_checkpoint', 'k_detour', 'k_late_bus'],
      edges: ['e_kara_detour_late', 'e_kara_detour_terminal'],
      sources: ['powerpyxKara', 'gamerGuides']
    },
    {
      id: 'u_gun_state_check',
      status: 'unknown',
      explanation: 'The guides report seeing/finding the gun in A New Home and taking it in Stormy Night, but the exact save/state check the game uses is not verified in game.',
      nodes: ['a_gun_seen', 's_take_gun'],
      edges: ['e_home_gun_stormy_take'],
      sources: ['powerpyxHome', 'powerpyxStormy']
    },
    {
      id: 'u_window_route_outcome',
      status: 'unknown',
      explanation: 'Opening the window in A New Home enables a reported Stormy Night window route. The selected successful window branch is now drawn, but the exact QTE requirements/difficulty and Todd’s later state are not stated by the reviewed guides.',
      nodes: ['a_window_open', 's_window_open', 's_lock_room', 's_window_go_out', 's_window_qte', 's_window_reach_bus'],
      edges: ['e_home_window_stormy_route', 'e_stormy_window_go_out_access', 'e_stormy_go_out_qte', 'e_stormy_window_bus_alive'],
      sources: ['powerpyxHome', 'powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    {
      id: 'u_stormy_escape_todd_state',
      status: 'unknown',
      explanation: 'The corridor and window escape guides describe Kara and Alice escaping successfully, but they do not state Todd’s later state. The dashed links from both escape outcomes to the existing Todd-not-killed state are inferences, not traced or confirmed links; whether either route leaves Todd alive for Battle for Detroit is unresolved.',
      nodes: ['s_alive', 's_front_backyard_escape', 's_window_reach_bus'],
      edges: ['e_stormy_front_backyard_alive', 'e_stormy_window_bus_alive'],
      sources: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy', 'powerpyxKara']
    }
  ],

  conflicts: [],

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
    a_gun_seen: {
      status: 'Guide-reported · clue seen, not possession',
      summary: 'PowerPyx reports that while cleaning Todd’s room upstairs, Kara can check the nightstand and see a gun. The guide marks this as a cross-chapter impact that may matter later.',
      unknown: 'The exact save/state flag the game uses is not verified in game. This node does not claim Kara carries the gun in A New Home.',
      cross: { chapter: 'stormy', node: 's_take_gun', label: 'Show the Stormy Night pickup node' },
      src: ['powerpyxHome', 'powerpyxStormy']
    },
    a_window_open: {
      status: 'Guide-reported · window opened',
      summary: 'PowerPyx’s clean-Alice’s-room step includes “Ventilate Room: Open the window”, marked as a cross-chapter impact that unlocks a possible future escape way.',
      unknown: 'The window is opened here; whether the later route succeeds depends on events and QTEs outside this slice.',
      cross: { chapter: 'stormy', node: 's_window_open', label: 'Show the Stormy Night route node' },
      src: ['powerpyxHome', 'powerpyxStormy']
    },
    s_alive: {
      status: 'Guide-reported · carried state',
      summary: 'PowerPyx and Fandom both anchor the later Todd meeting on Todd not being killed in Stormy Night (PowerPyx: Todd can be “spared/avoided” in that chapter). The corridor and window escape routes now point here only as dashed inferences.',
      unknown: 'The guides do not state Todd’s later state after either successful non-gun escape. Whether either route leaves him alive for the later meeting is unresolved; the two dashed links are not traced or confirmed.',
      cross: { chapter: 'kara', node: 'k_meet', label: 'Show the gated meeting node' },
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara', 'powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    s_dead: {
      status: 'Guide-reported · branch closure',
      summary: 'Guides report that killing Todd closes the later Todd meeting branch. The selected Kara-shoots and Alice-shoots outcomes both feed this state; it has no outgoing connector.',
      unknown: 'What the game checks exactly, and which other Stormy Night actions produce this state, are not covered by the reviewed evidence.',
      src: ['powerpyxStormy', 'powerpyxKara', 'fandomBattle']
    },
    s_take_gun: {
      status: 'Guide-reported · conditional pickup',
      summary: 'PowerPyx Stormy Night says that if the gun was found in Todd’s nightstand in Chapter 4, Kara can pick it up to threaten Todd and defend Alice.',
      unknown: 'The exact underlying state check is not verified in game; finding the gun is distinguished from possessing it in A New Home.',
      cross: { chapter: 'home', node: 'a_gun_seen', label: 'Show the earlier gun clue' },
      src: ['powerpyxStormy', 'powerpyxHome']
    },
    s_gun_struggle: {
      status: 'Guide-reported · confrontation',
      summary: 'PowerPyx describes Kara threatening Todd with the gun and a melee combat starting. The guide reports that a prompt can return the gun to Kara or leave it for Alice.',
      unknown: 'Exact QTE timing, difficulty and moment-to-moment actions are not modelled.',
      src: ['powerpyxStormy']
    },
    s_kara_shoots_todd: {
      status: 'Guide-reported · selected outcome',
      summary: 'PowerPyx says that when prompted to pick up the gun again, doing so makes Kara shoot Todd. Its cross-chapter note says this approach gives Kara the gun for future chapters.',
      unknown: 'No later-chapter gun use is modelled, and the state is not verified in game.',
      cross: { chapter: 'stormy', node: 's_gun_carried', label: 'Show the carried-gun state' },
      src: ['powerpyxStormy', 'powerpyxKara']
    },
    s_alice_shoots_todd: {
      status: 'Guide-reported · selected outcome',
      summary: 'PowerPyx says that when prompted to pick up the gun again, not doing so lets Alice pick it up and shoot Todd. This is reported separately from the Kara-shoots outcome.',
      unknown: 'The guide does not give Alice’s shooting outcome a future gun-carry state; none is modelled.',
      cross: { chapter: 'stormy', node: 's_dead', label: 'Show the resulting Todd state' },
      src: ['powerpyxStormy']
    },
    s_gun_carried: {
      status: 'Supplemental carried-state node · guide-reported',
      summary: 'This node exists only to record the guide-stated future carry: PowerPyx says Kara having shot Todd gives Kara the gun in future chapters.',
      unknown: 'Which later scenes check the gun, and how they use it, are outside this slice.',
      src: ['powerpyxStormy']
    },
    s_window_open: {
      status: 'Guide-reported · route available, successful branch selected',
      summary: 'PowerPyx, Gamer Guides and GameFAQs say the Stormy Night window can be used only if the window route was opened in A New Home. The selected successful branch then locks Alice’s room, goes out, passes the reported QTE and reaches the bus.',
      unknown: 'The exact QTE requirements, difficulty and hidden triggers are not stated. The guides also do not state Todd’s later state after this escape; the link to Todd not killed is a dashed inference.',
      cross: { chapter: 'home', node: 'a_window_open', label: 'Show the earlier window opening' },
      src: ['powerpyxStormy', 'powerpyxHome', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    s_reach_alice: {
      status: 'Guide-reported · non-gun route step',
      summary: 'PowerPyx and Gamer Guides place the two non-gun routes after Kara goes upstairs and reaches Alice before Todd. This event starts both the corridor and locked-room branches.',
      unknown: 'Exact movement timing and the full set of upstairs branch alternatives are outside this slice.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_run_away: {
      status: 'Guide-reported · non-gun route step',
      summary: 'PowerPyx and Gamer Guides report a Run Away option that takes Alice out of her room. This is separate from the Fail to Hide outcome.',
      unknown: 'Exact inputs and the timing window are not modelled.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_hide_corridor: {
      status: 'Guide-reported · non-gun route step',
      summary: 'PowerPyx and Gamer Guides describe hiding in the corridor or a nearby room until Todd passes. This successful hiding branch is separate from Fail to Hide and the Defend Alice branch.',
      unknown: 'The exact hiding spots, button holds and timing checks are not modelled.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_todd_passes: {
      status: 'Guide-reported · non-gun route event',
      summary: 'PowerPyx says Todd walks past the hiding place; Gamer Guides says to wait until he walks by and then head for the stairs.',
      unknown: 'How long Todd searches and whether other hidden checks apply is not stated by the reviewed guides.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_front_backyard_escape: {
      status: 'Guide-reported · successful non-gun exit',
      summary: 'After Todd passes, PowerPyx and Gamer Guides report the front-door/backyard route. GameFAQs also reports the front-door alternative when the window route was not opened. Only this successful exit is drawn; failed QTEs are omitted.',
      unknown: 'The guides do not state Todd’s later state, and the exact front-door/backyard QTE steps are not modelled. The dashed link to Todd not killed is an inference.',
      cross: { chapter: 'stormy', node: 's_alive', label: 'Show the inferred Todd state' },
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    s_lock_room: {
      status: 'Guide-reported · window-route step',
      summary: 'All three guides report locking Alice’s room after reaching her, before using the window route. The lock is part of the window branch and does not gate the corridor route.',
      unknown: 'The exact 10-second window and hidden checks are not modelled.',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    s_window_go_out: {
      status: 'Guide-reported · window-route step',
      summary: 'PowerPyx reports opening the window and choosing Go out. Gamer Guides and GameFAQs describe placing Alice outside and following her. The route requires the window opened in A New Home.',
      unknown: 'The guides do not state every prompt or hidden trigger involved before the climb.',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    s_window_qte: {
      status: 'Guide-reported · reported success condition',
      summary: 'PowerPyx reports a QTE while Todd tries to stop Kara climbing out; passing it leads to the successful window escape. Gamer Guides and GameFAQs describe the same successful climb.',
      unknown: 'Exact prompt sequence, difficulty and hidden triggers are unresolved. The failing branch is deliberately omitted from this batch.',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    s_window_reach_bus: {
      status: 'Guide-reported · successful non-gun escape',
      summary: 'PowerPyx, Gamer Guides and GameFAQs describe taking Alice down after the window QTE and reaching the bus. This ends the selected successful window route.',
      unknown: 'The guides do not state Todd’s later state, and the exact descent animations/inputs are not modelled. The dashed link to Todd not killed is an inference.',
      cross: { chapter: 'stormy', node: 's_alive', label: 'Show the inferred Todd state' },
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy']
    },
    k_terminal: {
      status: 'Guide-reported · access gate',
      summary: 'PowerPyx lists Meet Todd inside the Bus Terminal scene and states that all checkpoint paths lead to “At the Bus Terminal”; Gamer Guides says the terminal is always reached. The late-bus detour outcome still leads here.',
      unknown: 'The reviewed guides describe the scene order, not a numeric or state variable; the gate is not verified in game.',
      cross: { chapter: 'kara', node: 'k_meet', label: 'Show the gated meeting node' },
      src: ['powerpyxKara', 'fandomBattle', 'gamerGuides']
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
    },
    k_checkpoint: {
      status: 'Guide-reported · chapter-local route choice',
      summary: 'PowerPyx and Gamer Guides describe a choice to take a detour around the security checkpoint or approach the guarded checkpoint. The choice is local to Battle for Detroit — Kara.',
      unknown: 'The guarded-checkpoint interactions are omitted, and the route choice is not a carried cross-chapter state.',
      cross: { chapter: 'kara', node: 'k_detour', label: 'Show the detour node' },
      src: ['powerpyxKara', 'gamerGuides']
    },
    k_detour: {
      status: 'Guide-reported · timing-dependent route',
      summary: 'PowerPyx and Gamer Guides describe taking the detour around the checkpoint. Waiting before choosing it is reported to produce a delayed/last-bus result; taking it immediately is reported to reach the terminal on time.',
      unknown: 'The exact treatment of exactly 11 minutes is not stated by the reviewed sources. No inclusive boundary rule is claimed.',
      cross: { chapter: 'kara', node: 'k_late_bus', label: 'Show the late-bus outcome' },
      src: ['powerpyxKara', 'gamerGuides']
    },
    k_late_bus: {
      status: 'Guide-reported · late-bus outcome at the terminal',
      summary: 'The reviewed guides report a delayed/late-for-the-bus/last-bus-departed result after waiting before the detour. PowerPyx and Gamer Guides also state that all checkpoint ways, including this one, lead to the Bus Terminal.',
      unknown: 'Exactly what happens at an 11-minute boundary is unresolved. This node does not block the terminal or Todd meeting; it remains a separate late-bus outcome.',
      cross: { chapter: 'kara', node: 'k_terminal', label: 'Show the terminal node' },
      src: ['powerpyxKara', 'gamerGuides']
    }
  }
};
