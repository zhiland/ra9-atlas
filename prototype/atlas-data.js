/* PoC4 — multi-chapter atlas data (Detroit: Become Human).
   Standalone classic script: no modules, no imports, no fetch. Load before
   atlas-core.js / atlas-app.js so prototype/poc4-*.html open directly over file://.
   Validate with:  node prototype/validate-atlas-data.js
   Contract: docs/data-contract.md (PoC4 sample only; edge order is preserved).

   Provenance and evidence limits (see docs/notes/poc4-coverage.md and
   docs/notes/content-expansion-slice.md):
   - A New Home structure: selected local sequence transcribed from the Steam
     "100% Chapter Flowcharts" screenshot for A New Home; see
     docs/notes/map-reference-analysis.md. Screenshot-side chore labels with
     unresolved arrows are omitted rather than inferred. Selected guide-reported
     first-floor events are included without asserting a general order,
     exclusivity, or mandatory status. The nightstand gun clue and the opened Alice's-room
     window are separate guide-reported events, not claims of possession or a
     successful escape.
   - Stormy Night: selected entry events, gun/window events plus two
     source-supported successful non-gun escape routes: the corridor/hiding
     route to the front-door/backyard exit, and the locked-room window route.
     The entry slice keeps the non-deviant fatal outcome ("Todd kills Alice and
     Kara") separate from "Todd killed" (s_dead), and joins the deviant
     go-upstairs alternative to the existing Reach Alice route. The reason-with-
     Todd alternative stops at the source-supported "Todd reaches Alice before
     Kara"
     endpoint. Internal chapter topology is NOT transcribed in full. The guides
     do not state Todd's later state for either non-gun route, so their links
     into the existing Todd-not-killed state are dashed inferences, not traced
     or confirmed links. The too-slow path, hidden timers, exact QTE/difficulty,
     and other fatal or survival routes remain outside this slice.
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
      nodes: 68,
      edges: 55,
      tracedEdges: 39,
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

  canvas: { width: 4450, height: 1080 },

  chapters: [
    {
      id: 'home',
      name: 'A New Home',
      code: 'D2 · selected Alice sequence + carried clues + second-floor events',
      frame: { x: 30, y: 120, w: 1930, h: 530 },
      desc: 'Selected local sequence transcribed from the Steam chapter screenshot, two guide-reported carried-state clues, and selected first- and second-floor events. Other chores and unresolved side links remain omitted.',
      coverage: {
        status: 'partial',
        scope: 'Selected local Alice sequence, two separate guide-reported gun/window clues, and selected guide-reported first- and second-floor events.',
        included: '35 events: 10 screenshot-transcribed events from WELCOME HOME through OPEN ALICE’S BOX; two gun/window clues; 11 first-floor events; and 12 second-floor events. The selected progressions are laundry to backyard to washer to Red Ice to Todd’s reported reaction, watch TV to blocking Todd’s view, Todd pills to the gun sighting, and Todd’s bed to Alice going to her room.',
        omitted: 'Other chores, unresolved screenshot side links, the differing guide order and unstated requirements among separate first- and second-floor tasks, Alice’s conversation choices, the exact relationship level for the key, how the gun clue is checked by the game, and window-escape outcomes.',
        sources: ['steam', 'gamefaqs', 'powerpyxHome', 'transcript', 'neoseekerKara']
      }
    },
    {
      id: 'stormy',
      name: 'Stormy Night',
      code: 'D2 · selected gun/window + non-gun escape routes',
      frame: { x: 2000, y: 120, w: 1320, h: 860 },
      desc: 'Selected guide-reported entry sequence, gun/window events, and two distinct successful non-gun escape routes. Todd orders Kara to stay still, Alice runs upstairs, then Kara can obey and reach the fatal outcome (Todd kills Alice and Kara), or become deviant. The deviant alternatives go upstairs into the existing Reach Alice route or reason with Todd and stop at the reported point where Todd knocks Kara down and reaches Alice first. The corridor route hides until Todd passes and exits through the front door/backyard; the window route locks the room, goes out, passes the reported QTE and reaches the bus. The guides do not state Todd’s later state for either successful escape route, so both links to Todd not killed are explicit inferences. Other internal branches, the too-slow path, and other fatal or survival routes are not drawn.',
      coverage: {
        status: 'partial',
        scope: 'Selected entry gates, gun/window events, the existing Todd fate states, and two successful non-gun escape routes.',
        included: 'Twenty-four states/events: Todd not killed, Todd killed, take the nightstand gun, struggle for the gun, Kara shoots Todd, Alice shoots Todd, gun carried forward (Kara only), the window route opened from A New Home, nine steps/outcomes for the corridor and window escape routes, and seven entry-slice events/outcomes (Todd orders Kara to stay still, Alice runs upstairs, Kara becomes deviant, the fatal outcome, go upstairs, Reason with Todd, and Todd reaches Alice first). Twenty-four selected internal links.',
        omitted: 'The shared Todd-gets-mad scene as a separate box, the too-slow path, hidden timers, exact QTE requirements/difficulty, other fatal or survival routes, the later gun/fight/escape consequences of the Reason with Todd endpoint, miss-bus outcomes, and direct evidence of Todd’s later state after either successful non-gun escape.',
        sources: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy', 'powerpyxKara', 'fandomBattle']
      }
    },
    {
      id: 'kara',
      name: 'Battle for Detroit — Kara',
      code: 'D2 · selected checkpoint + Todd meeting branches',
      frame: { x: 3360, y: 120, w: 1060, h: 900 },
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
    { id: 'a_welcome', chapter: 'home', label: 'WELCOME HOME', short: 'Welcome home', kind: 'action', x: 50, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_todd', chapter: 'home', label: 'JOIN TODD', short: 'Join Todd', kind: 'action', x: 240, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_clean1', chapter: 'home', label: 'CLEAN FIRST FLOOR', short: 'Clean first floor', kind: 'action', x: 430, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_ask', chapter: 'home', label: 'ASK TO GO UPSTAIRS', short: 'Ask to go upstairs', kind: 'action', x: 620, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_go', chapter: 'home', label: 'GO UPSTAIRS', short: 'Go upstairs', kind: 'action', x: 810, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_clean2', chapter: 'home', label: 'CLEAN SECOND FLOOR', short: 'Clean second floor', kind: 'action', x: 1000, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_room', chapter: 'home', label: "CLEAN ALICE'S ROOM", short: "Clean Alice's room", kind: 'action', x: 1190, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_talk', chapter: 'home', label: 'TALK WITH ALICE', short: 'Talk with Alice', kind: 'action', x: 1380, y: 250, w: 170, h: 84, status: 'ocr', src: ['steam'] },
    { id: 'a_key', chapter: 'home', label: 'ALICE GIVES KARA A KEY', short: 'Alice gives key', kind: 'flag', x: 1570, y: 250, w: 170, h: 84, sub: 'condition level unstated', status: 'mixed', src: ['steam', 'gamefaqs', 'powerpyxHome'],
      note: 'The screenshot shows the link; GameFAQs reports Alice trusts Kara enough to give the key but does not name a relationship level. PowerPyx lists favorable conversation choices without a threshold.' },
    { id: 'a_box', chapter: 'home', label: "OPEN ALICE'S BOX", short: 'Open box', kind: 'action', x: 1760, y: 250, w: 170, h: 84, sub: 'later trigger unresolved', status: 'mixed', src: ['steam', 'transcript', 'neoseekerKara'],
      note: 'Contents are transcript-supported. Whether this box, a photo, or another action carries the later Todd state is unresolved.' },

    /* ---- A New Home: guide-reported carried clues (separate from possession) ---- */
    { id: 'a_gun_seen', chapter: 'home', label: 'SEE GUN IN TODD’S NIGHTSTAND', short: 'See nightstand gun', kind: 'flag', x: 1000, y: 400, w: 170, h: 84, sub: 'clue seen · not possession', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'PowerPyx reports checking Todd’s nightstand while cleaning his room. GameFAQs instead reports opening the pill bottle and then finding the handgun in the bedside-table drawer. This records the clue being seen, not the gun being carried.' },
    { id: 'a_window_open', chapter: 'home', label: 'OPEN ALICE’S ROOM WINDOW', short: 'Open room window', kind: 'action', x: 1190, y: 500, w: 170, h: 84, sub: 'opened · future route only', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx says opening the window unlocks a possible future escape way. The opening is represented; escape success is not.' },

    /* ---- Stormy Night: existing carried states + selected gun/window events ---- */
    { id: 's_alive', chapter: 'stormy', label: 'Todd survives', short: 'Todd not killed', kind: 'flag', x: 3085, y: 500, w: 190, h: 84, sub: 'carried state · guide-reported', status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'Reported access condition for the later Todd meeting. Two successful non-gun escape routes now point here only as dashed inferences; the guides do not state Todd’s later state for either route.' },
    { id: 's_dead', chapter: 'stormy', label: 'Todd killed', short: 'Todd killed', kind: 'flag', x: 2825, y: 360, w: 190, h: 84, sub: 'closes the meeting branch', status: 'guide', src: ['powerpyxStormy', 'powerpyxKara', 'fandomBattle'],
      note: 'The selected gun outcomes feed this state. Other ways to reach it and all non-gun Stormy Night branches remain outside this slice.' },
    { id: 's_take_gun', chapter: 'stormy', label: 'Take the gun', short: 'Take nightstand gun', kind: 'action', x: 2045, y: 210, w: 190, h: 84, sub: 'requires gun seen in A New Home', status: 'guide', src: ['powerpyxStormy'],
      note: 'PowerPyx reports the gun is available only if it was found in Todd’s nightstand in Chapter 4.' },
    { id: 's_gun_struggle', chapter: 'stormy', label: 'Gun struggle', short: 'Gun struggle', kind: 'action', x: 2305, y: 210, w: 190, h: 84, sub: 'reported confrontation', status: 'guide', src: ['powerpyxStormy'],
      note: 'PowerPyx describes threatening Todd and a melee combat; exact QTE timing and difficulty are not modelled.' },
    { id: 's_kara_shoots_todd', chapter: 'stormy', label: 'Kara shoots Todd', short: 'Kara shoots Todd', kind: 'outcome', x: 2565, y: 210, w: 190, h: 84, sub: 'selected shooting outcome', status: 'guide', src: ['powerpyxStormy', 'powerpyxKara'],
      note: 'PowerPyx says Kara regains the gun and shoots Todd, and that this gives Kara the gun for future chapters.' },
    { id: 's_alice_shoots_todd', chapter: 'stormy', label: 'Alice shoots Todd', short: 'Alice shoots Todd', kind: 'outcome', x: 2565, y: 360, w: 190, h: 84, sub: 'separate shooting outcome', status: 'guide', src: ['powerpyxStormy'],
      note: 'PowerPyx says that if Kara does not pick the gun back up, Alice picks it up and shoots Todd. This does not carry the gun forward.' },
    { id: 's_gun_carried', chapter: 'stormy', label: 'Kara keeps gun', short: 'Gun carried forward', kind: 'flag', x: 2825, y: 210, w: 190, h: 84, sub: 'supplemental carried state · Kara only', status: 'guide', src: ['powerpyxStormy'],
      note: 'Supplemental carried-state node: only the guide-stated Kara-shoots outcome creates it. No later-chapter use of the gun is modelled.' },
    { id: 's_window_open', chapter: 'stormy', label: 'Window route', short: 'Window route', kind: 'action', x: 2045, y: 500, w: 190, h: 84, sub: 'route available · success branch drawn', status: 'guide', src: ['powerpyxStormy', 'powerpyxHome', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx, Gamer Guides and GameFAQs say the window option is available only if the window was opened in A New Home. Availability is separate from the successful branch drawn after it.' },

    /* ---- Battle for Detroit — Kara: checkpoint detour + Todd meeting branches ---- */
    { id: 'k_terminal', chapter: 'kara', label: 'Reach bus terminal', short: 'Bus terminal', kind: 'flag', x: 3905, y: 200, w: 190, h: 84, sub: 'reported access gate', status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'],
      note: 'PowerPyx and Gamer Guides state all checkpoint ways reach the Bus Terminal; the late-bus outcome still arrives there.' },
    { id: 'k_meet', chapter: 'kara', label: 'Meet Todd', short: 'Meet Todd', kind: 'action', x: 3905, y: 370, w: 190, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'PowerPyx: “only possible, if he wasn’t killed in Stormy Night.” The meeting is listed at the Bus Terminal.' },
    { id: 'k_dialogue', chapter: 'kara', label: 'Todd dialogue', short: 'Todd dialogue', kind: 'choice', x: 4165, y: 410, w: 210, h: 110, options: ['Persuade Todd', 'Fail to persuade Todd'], status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara', 'gamerGuides'],
      note: 'Positive options persuade Todd; negative options trigger a security check (guides agree).' },
    { id: 'k_away', chapter: 'kara', label: 'Todd sends soldiers away', short: 'Soldiers away', kind: 'outcome', x: 4165, y: 250, w: 210, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'k_check', chapter: 'kara', label: 'Security check follows', short: 'Security check', kind: 'outcome', x: 4165, y: 650, w: 210, h: 84, status: 'guide', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'] },
    { id: 'k_goodbye', chapter: 'kara', label: 'Alice says goodbye to Todd', short: 'Alice says goodbye', kind: 'outcome', x: 3905, y: 540, w: 190, h: 84, sub: 'reported sequence', status: 'user', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'],
      note: 'User-provided sequence; the same wording appears in the inspected PowerPyx, Fandom and Neoseeker pages. No gameplay verification.' },
    { id: 'k_checkpoint', chapter: 'kara', label: 'Checkpoint choice', short: 'Checkpoint route', kind: 'choice', x: 3405, y: 220, w: 190, h: 110, options: ['Take Detour', 'Approach Checkpoint'], sub: 'chapter-local route choice', status: 'guide', src: ['powerpyxKara', 'gamerGuides'],
      note: 'The route choice is local to this chapter and is not a carried cross-chapter state.' },
    { id: 'k_detour', chapter: 'kara', label: 'Take detour', short: 'Take detour', kind: 'action', x: 3655, y: 480, w: 190, h: 84, sub: 'reported timing condition', status: 'guide', src: ['powerpyxKara', 'gamerGuides'],
      note: 'PowerPyx and Gamer Guides report a timing-dependent detour outcome; the exact 11-minute boundary is unresolved.' },
    { id: 'k_late_bus', chapter: 'kara', label: 'Bus has left', short: 'Last bus gone', kind: 'outcome', x: 3655, y: 780, w: 190, h: 84, sub: 'still reaches the terminal', status: 'guide', src: ['powerpyxKara', 'gamerGuides'],
      note: 'Reported when the detour is taken after waiting and the timer is below 11 minutes. This is a late-bus outcome at the terminal, not a loss of terminal or Todd-meeting access.' },

    /* ---- Stormy Night: two distinct successful non-gun escape routes ---- */
    { id: 's_reach_alice', chapter: 'stormy', label: 'Reach Alice', short: 'Reach Alice', kind: 'action', x: 2305, y: 500, w: 190, h: 84, sub: 'go-upstairs route', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx and Gamer Guides both place the non-gun routes after going upstairs and reaching Alice before Todd.' },
    { id: 's_run_away', chapter: 'stormy', label: 'Run away', short: 'Run away', kind: 'action', x: 2045, y: 640, w: 190, h: 84, sub: 'reported route step', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx and Gamer Guides report a Run Away option that takes Alice out of her room.' },
    { id: 's_hide_corridor', chapter: 'stormy', label: 'Hide', short: 'Hide', kind: 'action', x: 2305, y: 640, w: 190, h: 84, sub: 'reported route step', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides describe hiding outside Alice’s room rather than standing still; the exact hiding inputs are not modelled.' },
    { id: 's_todd_passes', chapter: 'stormy', label: 'Todd passes', short: 'Todd passes', kind: 'outcome', x: 2565, y: 640, w: 190, h: 84, sub: 'reported hiding timing', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx says Todd walks past the hiding place; Gamer Guides says to wait until he walks by. Exact timing is not modelled.' },
    { id: 's_front_backyard_escape', chapter: 'stormy', label: 'Door/yard exit', short: 'Door/yard exit', kind: 'outcome', x: 2825, y: 640, w: 190, h: 84, sub: 'successful non-gun exit · Todd state not stated', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'After Todd passes, PowerPyx and Gamer Guides report the front-door/backyard route. GameFAQs also reports the front-door alternative when the window route was not opened. This records a successful exit, not a later Todd state.' },

    { id: 's_lock_room', chapter: 'stormy', label: 'Lock room', short: 'Lock room', kind: 'action', x: 2045, y: 790, w: 190, h: 84, sub: 'window-route branch', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'All three guides report locking Alice’s room before using the window. The precise time limit is not modelled.' },
    { id: 's_window_go_out', chapter: 'stormy', label: 'Window exit', short: 'Window exit', kind: 'action', x: 2305, y: 790, w: 190, h: 84, sub: 'choose Go out', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx says to open the window and choose Go out; Gamer Guides and GameFAQs describe placing Alice outside and following her.' },
    { id: 's_window_qte', chapter: 'stormy', label: 'Pass QTE', short: 'Pass QTE', kind: 'action', x: 2565, y: 790, w: 190, h: 84, sub: 'reported success condition', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx reports passing the QTE while Todd tries to stop the climb. The exact difficulty, prompts and hidden triggers are not modelled.' },
    { id: 's_window_reach_bus', chapter: 'stormy', label: 'Reach bus', short: 'Reach bus', kind: 'outcome', x: 2825, y: 790, w: 190, h: 84, sub: 'successful window escape · Todd state not stated', status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx, Gamer Guides and GameFAQs describe passing the climb, taking Alice down and reaching the bus. This records the successful escape, not Todd’s later state.' },

    /* ---- Stormy Night: source-backed entry gates before the selected routes ---- */
    { id: 's_todd_orders_stay', chapter: 'stormy', label: 'Todd orders Kara to stay still', short: 'Todd: stay still', kind: 'action', x: 2240, y: 120, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Entry event reported in PowerPyx (Todd Gets Mad / Becoming Deviant or not, reviewed lines 27–37) and Gamer Guides (Branch 1, reviewed lines 182–212). Alice then runs upstairs before Kara’s response branch.' },
    { id: 's_alice_runs_upstairs', chapter: 'stormy', label: 'Alice runs upstairs', short: 'Alice runs upstairs', kind: 'action', x: 2500, y: 120, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both reviewed guides place Alice running upstairs after Todd orders Kara to stay still and before Kara’s stay-still or deviant response.' },
    { id: 's_deviant', chapter: 'stormy', label: 'Kara becomes deviant', short: 'Become deviant', kind: 'action', x: 2760, y: 120, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'The deviant response follows Alice running upstairs. The guides then report two alternatives: go upstairs immediately or reason with Todd. The too-slow path is deliberately omitted.' },
    { id: 's_fatal_todd_kills', chapter: 'stormy', label: 'Todd kills Alice and Kara', short: 'Todd kills Alice and Kara', kind: 'outcome', x: 2240, y: 300, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Fatal non-deviant outcome. Both guides say Todd kills Alice and Kara after Kara stays still. This is not “Todd killed” (s_dead); it has no connector to “Todd survives” (s_alive) or the later meeting.' },
    { id: 's_go_upstairs', chapter: 'stormy', label: 'Go upstairs', short: 'Go upstairs', kind: 'action', x: 3085, y: 120, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides report going upstairs straight away to protect Alice instead of talking to Todd. This is one alternative under the deviant entry, not the non-deviant path.' },
    { id: 's_reason_todd', chapter: 'stormy', label: 'Reason with Todd', short: 'Reason with Todd', kind: 'action', x: 3085, y: 690, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides report talking to Todd instead of going upstairs; Todd knocks Kara down. Only the reported endpoint is drawn from here.' },
    { id: 's_todd_upstairs_first', chapter: 'stormy', label: 'Todd reaches Alice before Kara', short: 'Todd reaches Alice first', kind: 'outcome', x: 3085, y: 864, w: 190, h: 84, status: 'guide', src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Source-supported endpoint for the Reason with Todd alternative: Todd knocks Kara down and reaches Alice before Kara. No later gun, fight, survival or fatal outcome is claimed from this endpoint.' },

    /* ---- A New Home: selected first-floor activity records ---- */
    { id: 'a_read_android_power', chapter: 'home', label: 'Read “Android Power!”', short: 'Read Android Power!', kind: 'action', x: 620, y: 132, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx names this magazine on the kitchen table. GameFAQs reports a magazine on the dining table but does not name it. The title is supported by PowerPyx only.' },
    { id: 'a_read_connecting_dots', chapter: 'home', label: 'Read “Connecting the Dots”', short: 'Read Connecting the Dots', kind: 'action', x: 810, y: 192, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx names this second magazine on the kitchen table. GameFAQs reports a magazine on the dining table but does not name it. The title is supported by PowerPyx only.' },
    { id: 'a_wash_dishes', chapter: 'home', label: 'Wash dishes', short: 'Wash dishes', kind: 'action', x: 620, y: 338, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report washing dishes during first-floor cleaning and describe the dishwasher as broken.' },
    { id: 'a_take_laundry_backyard', chapter: 'home', label: 'Take laundry to backyard', short: 'Laundry to backyard', kind: 'action', x: 620, y: 416, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report taking the laundry to the backyard and meeting Alice there. It is a specific laundry step, not a general backyard inspection. The Alice conversation choices are outside this slice.' },
    { id: 'a_rewash_clothes', chapter: 'home', label: 'Rewash clothes', short: 'Rewash clothes', kind: 'action', x: 620, y: 490, w: 170, h: 54, sub: 'laundry sequence', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'PowerPyx calls this step Rewash Clothes; GameFAQs says to take the laundry back inside to the washing machine.' },
    { id: 'a_find_red_ice', chapter: 'home', label: 'Find Red Ice', short: 'Find Red Ice', kind: 'action', x: 810, y: 384, w: 170, h: 54, sub: 'during laundry', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report finding Red Ice while handling laundry supplies: near the washing powder in PowerPyx and on the detergent shelf in GameFAQs.' },
    { id: 'a_enrage_todd', chapter: 'home', label: 'Todd reacts to Red Ice', short: 'Todd reacts to Red Ice', kind: 'outcome', x: 1000, y: 500, w: 170, h: 54, sub: 'reported reaction', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report Todd reacting angrily after Kara finds the Red Ice. No later Stormy Night state is inferred.' },
    { id: 'a_watch_todd_tv', chapter: 'home', label: 'Watch Todd’s TV', short: 'Watch TV', kind: 'action', x: 810, y: 448, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['gamefaqs'],
      note: 'GameFAQs reports that Kara stares at the TV before she blocks Todd’s view. It reports an entry for each event.' },
    { id: 'a_block_todd_view', chapter: 'home', label: 'Block Todd’s view', short: 'Block TV view', kind: 'action', x: 1000, y: 580, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'PowerPyx reports standing in front of the TV to annoy Todd. GameFAQs reports blocking Todd’s view after staring at the TV.' },
    { id: 'a_activate_vacuum', chapter: 'home', label: 'Activate vacuum', short: 'Activate vacuum', kind: 'action', x: 810, y: 523, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report activating the vacuum robot during first-floor cleaning.' },
    { id: 'a_take_out_trash', chapter: 'home', label: 'Take out trash', short: 'Take out trash', kind: 'action', x: 620, y: 562, w: 170, h: 54, sub: 'first-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report collecting first-floor trash and taking it out. PowerPyx lists this after other first-floor steps; GameFAQs describes it first.' },

    /* ---- A New Home: selected second-floor activity records ---- */
    { id: 'a_clean_todd_room', chapter: 'home', label: 'Clean Todd’s room', short: 'Clean Todd’s room', kind: 'action', x: 1490, y: 346, w: 170, h: 54, sub: 'second-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report cleaning Todd’s room, including making the bed and tidying the room. The underlying interaction order differs by guide and is not inferred here.' },
    { id: 'a_tidy_pills', chapter: 'home', label: 'Tidy pills', short: 'Tidy pills', kind: 'action', x: 1300, y: 346, w: 170, h: 54, sub: 'second-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report the pill bottle at Todd’s bedside. PowerPyx calls the step Tidy Pills and has Kara check the bottle; GameFAQs says to grab the bottle before opening the bedside-table drawer.' },
    { id: 'a_make_todd_bed', chapter: 'home', label: 'Make Todd’s bed', short: 'Make Todd’s bed', kind: 'action', x: 1680, y: 346, w: 170, h: 54, sub: 'second-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report making Todd’s bed. PowerPyx places the automatic Alice move after this action; GameFAQs makes the bed last in Todd’s room.' },
    { id: 'a_alice_goes_room', chapter: 'home', label: 'Alice goes to her room', short: 'Alice goes to room', kind: 'action', x: 1680, y: 444, w: 170, h: 54, sub: 'second-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report Alice going to her room after Todd’s bed is made. This is a reported automatic move, not a player task or an eligibility gate.' },
    { id: 'a_clean_toilet', chapter: 'home', label: 'Clean toilet', short: 'Clean toilet', kind: 'action', x: 1300, y: 444, w: 170, h: 54, sub: 'second-floor event', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report cleaning the toilet on the second floor. PowerPyx places it before the bathroom; GameFAQs places it after Todd’s room.' },
    { id: 'a_arrange_bathroom_bottles', chapter: 'home', label: 'Arrange bathroom bottles', short: 'Arrange bottles', kind: 'action', x: 1490, y: 444, w: 170, h: 54, sub: 'second-floor · guide-listed bathroom action', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report arranging or rearranging the bathroom bottles; PowerPyx specifies the bathtub.' },
    { id: 'a_store_bathroom_clothes', chapter: 'home', label: 'Store bathroom clothes', short: 'Store clothes', kind: 'action', x: 1380, y: 543, w: 170, h: 50, sub: 'second-floor · guide-listed bathroom action', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'PowerPyx reports storing the dirty clothes; GameFAQs says to pick up the towels. Both place the action in the bathroom cleaning.' },
    { id: 'a_mop_bathroom', chapter: 'home', label: 'Mop bathroom', short: 'Mop bathroom', kind: 'action', x: 1570, y: 543, w: 170, h: 50, sub: 'second-floor · guide-listed bathroom action', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report mopping the bathroom floor.' },
    { id: 'a_read_android_qb', chapter: 'home', label: 'Read “Android QB”', short: 'Read Android QB', kind: 'action', x: 1760, y: 543, w: 170, h: 50, sub: 'second-floor reading', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx names “Android QB” on the cupboard by Todd’s door and says to read both pages. GameFAQs reports a magazine on the shelf with the speakers but does not name it. The exact title is PowerPyx-only.' },
    { id: 'a_read_putting_price', chapter: 'home', label: 'Read “Putting a Price”', short: 'Read Putting a Price', kind: 'action', x: 1380, y: 596, w: 170, h: 54, sub: 'second-floor reading', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx names “Putting a Price” on the cupboard by Todd’s door and says to read both pages. GameFAQs reports one unnamed magazine in Todd’s room. The exact title is PowerPyx-only.' },
    { id: 'a_read_alice_floor_book', chapter: 'home', label: 'Read Alice’s floor book', short: 'Read floor book', kind: 'action', x: 1570, y: 596, w: 170, h: 54, sub: 'second-floor reading', status: 'guide', src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report the book on Alice’s floor. PowerPyx names it “Alice in Wonderland”; GameFAQs only says Kara comments on the book Alice has been reading.' },
    { id: 'a_read_alice_shelf_books', chapter: 'home', label: 'Read Alice’s shelf books', short: 'Read shelf books', kind: 'action', x: 1760, y: 596, w: 170, h: 54, sub: 'second-floor reading', status: 'guide', src: ['powerpyxHome'],
      note: 'PowerPyx reports reading the books on Alice’s shelf between the bed and the door. GameFAQs does not describe shelf books in this section.' }
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
    { id: 'e_home_talk_key', from: 'a_talk', to: 'a_key', kind: 'conditional', label: 'reported condition: Alice trusts Kara (level unstated)', labelAt: { x: 1650, y: 230 },
      src: ['steam', 'gamefaqs', 'powerpyxHome'],
      note: 'The screenshot shows the link itself. GameFAQs says Alice trusts Kara enough to give the key but does not name a relationship level; PowerPyx lists favorable conversation choices without a threshold.' },
    { id: 'e_home_key_box', from: 'a_key', to: 'a_box', kind: 'traced', src: ['steam'] },

    /* Cross-chapter candidate hypothesis — stays dashed, never causal */
    { id: 'e_home_box_kara_dialogue_hypothesis', from: 'a_box', to: 'k_dialogue', kind: 'hypothesis', via: 1985, label: 'UNRESOLVED hypothesis · reported to affect Todd dialogue', labelAt: { x: 1985, y: 465 },
      src: ['neoseekerKara'],
      note: 'Neoseeker ties the later “[Your Story]” persuasion option to “unlocked Alice’s box during A New Home”. Whether the game checks opening the box, seeing a photo, or another action is unresolved. Drawn as a hypothesis only: it does not guarantee the meeting or its outcome.' },

    /* Cross-chapter prerequisite gate — Todd survival out of Stormy Night */
    { id: 'e_stormy_alive_meet', from: 's_alive', to: 'k_meet', kind: 'prerequisite', via: 3340, label: 'prerequisite: Todd not killed in Stormy Night', labelAt: { x: 3525, y: 412 },
      src: ['powerpyxKara'],
      note: 'PowerPyx: Meet Todd is “only possible, if he wasn’t killed in Stormy Night”. The negative state closes the branch; no arrow inside Stormy Night is claimed.' },

    /* Battle for Detroit — Kara meeting branch */
    { id: 'e_kara_terminal_meet', from: 'k_terminal', to: 'k_meet', kind: 'prerequisite', label: 'prerequisite: at the bus terminal', labelAt: { x: 4070, y: 327 },
      src: ['powerpyxKara'],
      note: 'PowerPyx lists Meet Todd at the Bus Terminal and says all checkpoint paths lead there; the meeting was not checked in game.' },
    { id: 'e_kara_meet_dialogue', from: 'k_meet', to: 'k_dialogue', kind: 'traced', via: 4140, src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'e_kara_dialogue_away', from: 'k_dialogue', fromOption: 0, to: 'k_away', kind: 'traced', labelAt: { x: 4270, y: 372 }, label: 'Persuade Todd', src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },
    { id: 'e_kara_dialogue_check', from: 'k_dialogue', fromOption: 1, to: 'k_check', kind: 'traced', labelAt: { x: 4270, y: 585 }, label: 'Fail to persuade', src: ['powerpyxKara', 'fandomBattle', 'gamerGuides'] },
    { id: 'e_kara_away_goodbye', from: 'k_away', to: 'k_goodbye', kind: 'traced', via: 4125, src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara'] },

    /* A New Home expansion — separate guide-reported clue/window events */
    { id: 'e_home_go_gun_seen', from: 'a_go', to: 'a_gun_seen', kind: 'conditional', label: 'optional upstairs clue', labelAt: { x: 895, y: 370 },
      src: ['powerpyxHome'],
      note: 'PowerPyx places the nightstand check while cleaning Todd’s room after going upstairs. The screenshot sequence does not show this optional side clue.' },
    { id: 'e_home_room_window', from: 'a_room', to: 'a_window_open', kind: 'conditional', via: 1180, label: 'optional room action', labelAt: { x: 1280, y: 425 },
      src: ['powerpyxHome'],
      note: 'PowerPyx: while cleaning Alice’s room, opening the window is an optional room action. The node records opening, not merely discovering the window, and the connector does not assert a required next step.' },

    /* Cross-chapter carried-state gates: A New Home → Stormy Night */
    { id: 'e_home_gun_stormy_take', from: 'a_gun_seen', to: 's_take_gun', kind: 'prerequisite', via: 1985, label: 'prerequisite: gun was seen in A New Home', labelAt: { x: 1985, y: 370 },
      src: ['powerpyxStormy', 'powerpyxHome'],
      note: 'PowerPyx Stormy Night says Kara can take the gun only if it was found in Todd’s nightstand in Chapter 4; the A New Home guide reports that sighting. This gates availability to take it in Stormy Night, not possession in A New Home.' },
    { id: 'e_home_window_stormy_route', from: 'a_window_open', to: 's_window_open', kind: 'prerequisite', via: 1985, label: 'prerequisite: window opened in A New Home', labelAt: { x: 1915, y: 530 },
      src: ['powerpyxStormy', 'powerpyxHome'],
      note: 'PowerPyx Stormy Night says the window option is available if the route was found in Chapter 4; the A New Home guide reports opening Alice’s room window. This enables the route, not a successful escape.' },

    /* Stormy Night expansion — guide-stated gun confrontation and outcomes */
    { id: 'e_stormy_take_gun_struggle', from: 's_take_gun', to: 's_gun_struggle', kind: 'traced', src: ['powerpyxStormy'],
      note: 'PowerPyx says taking the gun leads to threatening Todd and a melee combat.' },
    { id: 'e_stormy_struggle_kara_shoots', from: 's_gun_struggle', to: 's_kara_shoots_todd', kind: 'conditional', label: 'Kara keeps the gun', labelAt: { x: 2600, y: 305 },
      src: ['powerpyxStormy'],
      note: 'PowerPyx reports that picking the gun back up during the prompt makes Kara shoot Todd. Exact QTE timing and difficulty are not modelled.' },
    { id: 'e_stormy_struggle_alice_shoots', from: 's_gun_struggle', to: 's_alice_shoots_todd', kind: 'conditional', label: 'Alice takes the gun', labelAt: { x: 2530, y: 330 },
      src: ['powerpyxStormy'],
      note: 'PowerPyx reports that not picking the gun back up makes Alice pick it up and shoot Todd. This is a separate outcome, not a generic gun-outcome choice.' },
    { id: 'e_stormy_kara_gun_carried', from: 's_kara_shoots_todd', to: 's_gun_carried', kind: 'traced', label: 'guide-stated future carry', labelAt: { x: 2830, y: 320 },
      src: ['powerpyxStormy'],
      note: 'PowerPyx’s cross-chapter note says only this Kara-shoots approach gives Kara the gun for future chapters.' },
    { id: 'e_stormy_kara_dead', from: 's_kara_shoots_todd', to: 's_dead', kind: 'traced', src: ['powerpyxStormy', 'powerpyxKara'],
      note: 'Stormy Night reports Kara shoots Todd; the Kara finale guide treats Todd killed in Stormy Night as closing the meeting.' },
    { id: 'e_stormy_alice_dead', from: 's_alice_shoots_todd', to: 's_dead', kind: 'traced', src: ['powerpyxStormy', 'powerpyxKara'],
      note: 'Stormy Night reports Alice shoots Todd; the Kara finale guide treats Todd killed in Stormy Night as closing the meeting.' },

    /* Battle for Detroit — Kara checkpoint detour/timing branch */
    { id: 'e_kara_checkpoint_detour', from: 'k_checkpoint', fromOption: 0, to: 'k_detour', kind: 'traced', label: 'Take Detour', labelAt: { x: 3615, y: 390 },
      src: ['powerpyxKara', 'gamerGuides'] },
    { id: 'e_kara_checkpoint_terminal', from: 'k_checkpoint', fromOption: 1, to: 'k_terminal', kind: 'traced', label: 'Approach Checkpoint', labelAt: { x: 3775, y: 242 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'The guarded-checkpoint interactions are omitted; both reviewed guides state all checkpoint ways lead to the Bus Terminal.' },
    { id: 'e_kara_detour_late', from: 'k_detour', to: 'k_late_bus', kind: 'conditional', label: 'wait, then detour · below 11 min (reported)', labelAt: { x: 3750, y: 650 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'Both reviewed guides describe waiting before taking the detour with the timer reported below 11 minutes and a delayed/last-bus result. Independence is unknown; the exact 11:00 boundary is not stated and is left unresolved.' },
    { id: 'e_kara_detour_terminal', from: 'k_detour', to: 'k_terminal', kind: 'conditional', via: 3860, label: 'detour immediately · above 11 min (reported)', labelAt: { x: 3775, y: 350 },
      src: ['powerpyxKara', 'gamerGuides'],
      note: 'Both reviewed guides describe taking the detour immediately with the timer reported above 11 minutes and reaching the terminal on time. Independence is unknown; the exact 11:00 boundary is not stated and is left unresolved.' },
    { id: 'e_kara_late_terminal', from: 'k_late_bus', to: 'k_terminal', kind: 'traced', via: 3890, label: 'still reaches the terminal', labelAt: { x: 3890, y: 315 },
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
    { id: 'e_stormy_todd_passes_front_backyard', from: 's_todd_passes', to: 's_front_backyard_escape', kind: 'traced', labelAt: { x: 2790, y: 755 }, label: 'reported exit route',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx and Gamer Guides connect the hiding route to the front-door/backyard exit. GameFAQs also reports the front-door alternative when the window route is unavailable. Exact door, yard and QTE steps are omitted; only the successful route is represented.' },
    { id: 'e_stormy_front_backyard_alive', from: 's_front_backyard_escape', to: 's_alive', kind: 'hypothesis', via: 3040, label: 'UNRESOLVED inference · Todd state unstated', labelAt: { x: 3040, y: 610 },
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'The reviewed guides describe a successful non-gun escape but do not state Todd’s later state. Linking this route to the existing Todd-not-killed state is an inference, not a traced or confirmed outcome. The meeting still needs the separate terminal gate.' },

    /* Stormy Night expansion — locked-room window successful non-gun route */
    { id: 'e_stormy_reach_lock_room', from: 's_reach_alice', to: 's_lock_room', kind: 'traced', via: 2245,
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'All three guides report locking Alice’s room after reaching her on the go-upstairs branch. The reported time window is not modelled.' },
    { id: 'e_stormy_window_go_out_access', from: 's_window_open', to: 's_window_go_out', kind: 'prerequisite', via: 2295, labelAt: { x: 2270, y: 610 }, label: 'prerequisite: window route opened in A New Home',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy', 'powerpyxHome'],
      note: 'All three Stormy Night guides say the window option is available only if that window route was opened in A New Home. This gates the window exit, not locking the room or a successful escape by itself.' },
    { id: 'e_stormy_lock_go_out', from: 's_lock_room', to: 's_window_go_out', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx reports opening the window and choosing Go out; Gamer Guides and GameFAQs describe placing Alice outside and following.' },
    { id: 'e_stormy_go_out_qte', from: 's_window_go_out', to: 's_window_qte', kind: 'conditional', labelAt: { x: 2530, y: 755 }, label: 'pass reported QTE',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'PowerPyx reports a QTE while Todd tries to stop the climb; Gamer Guides and GameFAQs describe the successful climb. Only the success condition is represented. Exact prompts, difficulty and hidden triggers are not modelled.' },
    { id: 'e_stormy_qte_bus', from: 's_window_qte', to: 's_window_reach_bus', kind: 'traced', labelAt: { x: 2790, y: 905 }, label: 'take Alice down',
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'After the reported QTE, the guides describe taking Alice down and reaching the bus. Exact animations and inputs are omitted.' },
    { id: 'e_stormy_window_bus_alive', from: 's_window_reach_bus', to: 's_alive', kind: 'hypothesis', via: 3060, label: 'UNRESOLVED inference · Todd state unstated', labelAt: { x: 3150, y: 650 },
      src: ['powerpyxStormy', 'gamerGuidesStormy', 'gamefaqsStormy'],
      note: 'The reviewed guides describe the successful window escape but do not state Todd’s later state. Linking this route to Todd not killed is an inference, not a traced or confirmed outcome. The meeting still needs the separate terminal gate.' },

    /* Stormy Night entry slice — non-deviant fatal and deviant alternatives */
    { id: 'e_stormy_todd_orders_alice_upstairs', from: 's_todd_orders_stay', to: 's_alice_runs_upstairs', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both reviewed guides report the shared entry sequence: Todd orders Kara to stay still, then Alice runs upstairs.' },
    { id: 'e_stormy_alice_upstairs_stay_still', from: 's_alice_runs_upstairs', to: 's_fatal_todd_kills', kind: 'traced', via: 2500,
      label: 'obey · stay still', labelAt: { x: 2500, y: 360 },
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'The non-deviant response is to obey Todd and stay still. PowerPyx says Todd goes upstairs and kills Alice and Kara; Gamer Guides states he kills Alice, then Kara. This is separate from s_dead (Todd killed) and has no outgoing connector.' },
    { id: 'e_stormy_alice_upstairs_deviant', from: 's_alice_runs_upstairs', to: 's_deviant', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides report breaking programming after Alice runs upstairs as the deviant response, which opens the go-upstairs and Reason with Todd alternatives.' },
    { id: 'e_stormy_deviant_go_upstairs', from: 's_deviant', to: 's_go_upstairs', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides place the go-upstairs alternative under the deviant entry: head upstairs straight away to protect Alice instead of talking to Todd.' },
    { id: 'e_stormy_go_upstairs_reach_alice', from: 's_go_upstairs', to: 's_reach_alice', kind: 'traced', via: 3020,
      label: 'join selected Reach Alice route', labelAt: { x: 2800, y: 525 },
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides connect going upstairs immediately with reaching Alice before Todd. This joins the existing selected non-gun route at s_reach_alice; it does not add a direct Todd-state or meeting outcome.' },
    { id: 'e_stormy_deviant_reason', from: 's_deviant', to: 's_reason_todd', kind: 'traced', via: 3020,
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'Both guides place Reason with Todd under the deviant entry as the alternative to going upstairs. The edge carries no later gun, fight, escape or Todd-state claim.' },
    { id: 'e_stormy_reason_knocked', from: 's_reason_todd', to: 's_todd_upstairs_first', kind: 'traced',
      src: ['powerpyxStormy', 'gamerGuidesStormy'],
      note: 'PowerPyx says Todd smacks Kara to the ground and is upstairs before she can get there. Gamer Guides says Todd always pushes Kara down and marches upstairs himself. The endpoint claims only this reported point; no s_dead or s_alive consequence is added.' },

    /* A New Home first-floor relationships stated by the guides */
    { id: 'e_home_rewash_red_ice', from: 'a_rewash_clothes', to: 'a_find_red_ice', kind: 'traced',
      src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides place finding Red Ice within the laundry task after Kara takes the clothes to the washing machine and handles detergent.' },
    { id: 'e_home_red_ice_enrage_todd', from: 'a_find_red_ice', to: 'a_enrage_todd', kind: 'traced',
      src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report Todd reacting angrily after Kara finds the Red Ice.' },
    { id: 'e_home_watch_tv_block_view', from: 'a_watch_todd_tv', to: 'a_block_todd_view', kind: 'traced',
      src: ['gamefaqs'],
      note: 'GameFAQs reports the TV stare before Kara blocks Todd’s view and says that both actions add flowchart entries.' },
    { id: 'e_home_backyard_rewash_clothes', from: 'a_take_laundry_backyard', to: 'a_rewash_clothes', kind: 'traced',
      src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report taking the laundry to the backyard, meeting Alice there, then bringing the laundry back to the washing machine.' },

    /* A New Home second-floor relationships stated by the guides */
    { id: 'e_home_pills_gun', from: 'a_tidy_pills', to: 'a_gun_seen', kind: 'traced',
      src: ['gamefaqs'],
      note: 'GameFAQs/Mogg reports opening the pill bottle and then finding the handgun in the bedside-table drawer. This is a reported sequence, not an eligibility requirement. PowerPyx reports checking the nightstand without stating the pill-bottle order.' },
    { id: 'e_home_todd_bed_alice_room', from: 'a_make_todd_bed', to: 'a_alice_goes_room', kind: 'traced',
      src: ['powerpyxHome', 'gamefaqs'],
      note: 'Both guides report Alice going to her room after Todd’s bed is made. This is a reported sequence, not an eligibility requirement or a general room-cleaning prerequisite.' }
  ],

  /* Conditions are plain-English groups over existing edges. They add no edge
     or claim. SINGLE means one reported requirement with no AND/OR grouping;
     AND/OR are used only where the reviewed sample supports the grouping. */
  conditions: [
    {
      id: 'cond_key_relationship',
      appliesTo: ['e_home_talk_key'],
      operator: 'SINGLE',
      summary: 'One reported condition on the key step: GameFAQs says Alice trusts Kara enough to give the key but does not name a relationship level. PowerPyx lists favorable conversation choices without a threshold.',
      requirements: [
        'Alice trusts Kara enough to give the key (exact relationship level not stated).'
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
      explanation: 'The exact relationship requirement is not stated by either reviewed guide and has not been checked in game. GameFAQs reports trust sufficient for the key without naming a level; PowerPyx lists conversation choices without a threshold.',
      nodes: ['a_key'],
      edges: ['e_home_talk_key'],
      sources: ['gamefaqs', 'powerpyxHome', 'steam']
    },
    {
      id: 'u_home_first_floor_order',
      status: 'unknown',
      explanation: 'PowerPyx and GameFAQs list the unrelated first-floor chores in different orders. The map records only the source-stated laundry and TV progressions; it does not claim an order, exclusivity, or mandatory status among the other chores.',
      nodes: ['a_clean1', 'a_read_android_power', 'a_read_connecting_dots', 'a_wash_dishes', 'a_take_laundry_backyard', 'a_rewash_clothes', 'a_find_red_ice', 'a_enrage_todd', 'a_watch_todd_tv', 'a_block_todd_view', 'a_activate_vacuum', 'a_take_out_trash'],
      edges: ['e_home_backyard_rewash_clothes', 'e_home_rewash_red_ice', 'e_home_red_ice_enrage_todd', 'e_home_watch_tv_block_view'],
      sources: ['powerpyxHome', 'gamefaqs']
    },
    {
      id: 'u_home_second_floor_order',
      status: 'unknown',
      explanation: 'PowerPyx and GameFAQs list the second-floor chores in different orders. PowerPyx lists Todd’s room (pills and magazines), Alice going to her room, toilet, bathroom, Alice’s room/window, then the floor and shelf books. GameFAQs starts with the bathroom, then Alice’s room/window, then Todd’s room (pills, handgun, bed), then the toilet and floor book. PowerPyx also says Talk with Alice requires Todd’s room, the bathroom and Alice’s room plus reading the floor and shelf books; GameFAQs only says Alice’s room must be cleaned before Todd’s. These guide-specific orders and conditions are recorded as differing reports, not universal prerequisites or an AND gate.',
      nodes: ['a_clean_todd_room', 'a_tidy_pills', 'a_make_todd_bed', 'a_alice_goes_room', 'a_clean_toilet', 'a_arrange_bathroom_bottles', 'a_store_bathroom_clothes', 'a_mop_bathroom', 'a_read_android_qb', 'a_read_putting_price', 'a_read_alice_floor_book', 'a_read_alice_shelf_books', 'a_talk'],
      edges: ['e_home_pills_gun', 'e_home_todd_bed_alice_room'],
      sources: ['powerpyxHome', 'gamefaqs']
    },
    {
      id: 'u_stormy_internal',
      status: 'unknown',
      explanation: 'The selected entry slice draws Todd ordering Kara to stay still, Alice running upstairs, then the obey/stay-still fatal route or deviant alternatives. The shared scene details beyond these selected events, the too-slow path, hidden timers, exact QTE/difficulty, other fatal or survival routes, and any later consequence of the Reason with Todd endpoint remain outside this slice. The fatal entry outcome does not connect to Todd survives or the later meeting. The two successful non-gun routes are still not evidence of Todd’s later state.',
      nodes: ['s_alive', 's_dead', 's_front_backyard_escape', 's_window_reach_bus', 's_todd_orders_stay', 's_alice_runs_upstairs', 's_deviant', 's_fatal_todd_kills', 's_go_upstairs', 's_reason_todd', 's_todd_upstairs_first'],
      edges: ['e_stormy_alive_meet', 'e_stormy_front_backyard_alive', 'e_stormy_window_bus_alive', 'e_stormy_todd_orders_alice_upstairs', 'e_stormy_alice_upstairs_stay_still', 'e_stormy_alice_upstairs_deviant', 'e_stormy_deviant_go_upstairs', 'e_stormy_go_upstairs_reach_alice', 'e_stormy_deviant_reason', 'e_stormy_reason_knocked'],
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
      status: 'Guide-reported · relationship level unstated',
      summary: 'The Steam screenshot shows TALK WITH ALICE → ALICE GIVES KARA A KEY → OPEN ALICE’S BOX. GameFAQs says Alice trusts Kara enough to give the key but does not name a relationship level; PowerPyx lists favorable conversation choices without stating a threshold.',
      unknown: 'The exact relationship level is not stated by either guide and has not been checked in game.',
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
      summary: 'PowerPyx reports that while cleaning Todd’s room upstairs, Kara can check the nightstand and see a gun. GameFAQs describes opening the pill bottle and then finding the handgun in the bedside-table drawer. Both mark the clue as a cross-chapter impact that may matter later.',
      unknown: 'The exact save/state flag the game uses is not verified in game. This node does not claim Kara carries the gun in A New Home, and the two guides describe the discovery in a different order.',
      cross: { chapter: 'stormy', node: 's_take_gun', label: 'Show the Stormy Night pickup node' },
      src: ['powerpyxHome', 'gamefaqs', 'powerpyxStormy']
    },
    a_window_open: {
      status: 'Guide-reported · window opened',
      summary: 'PowerPyx’s clean-Alice’s-room step includes “Ventilate Room: Open the window”, marked as a cross-chapter impact that unlocks a possible future escape way.',
      unknown: 'The window is opened here; whether the later route succeeds depends on events and QTEs outside this slice.',
      cross: { chapter: 'stormy', node: 's_window_open', label: 'Show the Stormy Night route node' },
      src: ['powerpyxHome', 'powerpyxStormy']
    },
    a_read_android_power: {
      status: 'Guide-reported · single-source title',
      summary: 'PowerPyx names “Android Power!” on the kitchen table. GameFAQs reports a magazine on the dining table but does not name it.',
      unknown: 'The title is a single-source label. The guides do not establish this event’s order, requirements, or consequences.',
      src: ['powerpyxHome']
    },
    a_read_connecting_dots: {
      status: 'Guide-reported · single-source title',
      summary: 'PowerPyx names “Connecting the Dots” on the kitchen table. GameFAQs reports a magazine but does not name it.',
      unknown: 'The title is a single-source label. The guides do not establish this event’s order, requirements, or consequences.',
      src: ['powerpyxHome']
    },
    a_wash_dishes: {
      status: 'Guide-reported · first-floor event',
      summary: 'PowerPyx and GameFAQs both report washing dishes during the first floor; both describe the dishwasher as broken.',
      unknown: 'The reviewed guides do not establish this event’s order, requirements, or exclusivity.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_take_laundry_backyard: {
      status: 'Guide-reported · first-floor event',
      summary: 'PowerPyx and GameFAQs both report taking laundry to the backyard during the first floor and meeting Alice there. The conversation choices are outside this slice.',
      unknown: 'The reviewed guides do not establish this event’s order, requirements, or exclusivity.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_rewash_clothes: {
      status: 'Guide-reported · first-floor event',
      summary: 'PowerPyx calls this step Rewash Clothes; GameFAQs says to take the laundry back inside to the washing machine.',
      unknown: 'The reviewed guides do not establish this event’s order, requirements, or exclusivity.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_find_red_ice: {
      status: 'Guide-reported · first-floor event',
      summary: 'PowerPyx and GameFAQs both report finding Red Ice while handling laundry supplies. PowerPyx places it near the washing powder; GameFAQs places it on the detergent shelf. PowerPyx separately reports Todd becoming angry after the discovery.',
      unknown: 'The guides do not establish the order or requirements for other first-floor events. The reported reaction is not verified in game.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_watch_todd_tv: {
      status: 'Guide-reported · single-source event',
      summary: 'GameFAQs reports that Kara stares at Todd’s TV before she blocks his view, and that the two actions add separate flowchart entries.',
      unknown: 'PowerPyx reports standing in front of the TV to annoy Todd but does not describe the separate TV-staring event. This event is not linked to any other first-floor task.',
      src: ['gamefaqs']
    },
    a_block_todd_view: {
      status: 'Guide-reported · reported local progression',
      summary: 'PowerPyx reports standing in front of the TV to annoy Todd. GameFAQs reports blocking Todd’s view after staring at the TV.',
      unknown: 'The guides report this event in different wording. No order relative to other first-floor tasks is claimed.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_enrage_todd: {
      status: 'Guide-reported · reported local progression',
      summary: 'Both guides report Todd reacting angrily after Kara finds the Red Ice during the laundry sequence.',
      unknown: 'The guide-reported reaction is not verified in game and is not linked to later chapter states.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_activate_vacuum: {
      status: 'Guide-reported · first-floor event',
      summary: 'PowerPyx and GameFAQs both report activating the vacuum robot during the first floor.',
      unknown: 'The reviewed guides do not establish this event’s order, requirements, or exclusivity.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_take_out_trash: {
      status: 'Guide-reported · first-floor event',
      summary: 'PowerPyx and GameFAQs both report collecting first-floor trash and taking it out. PowerPyx lists it late; GameFAQs starts with it.',
      unknown: 'The different guide order does not establish a fixed sequence. Exclusivity and mandatory completion are also unstated.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_clean_todd_room: {
      status: 'Guide-reported · second-floor event',
      summary: 'Both reviewed guides report cleaning Todd’s room, including making the bed and tidying the room. PowerPyx also lists the guitar, shelves and papers; GameFAQs summarizes the mess.',
      unknown: 'PowerPyx says Talk with Alice is available only after Todd’s room, the bathroom and Alice’s room are cleaned and the floor/shelf books are read. GameFAQs instead says Alice’s room must be cleaned before Todd’s. These are source-specific reports; the map does not assert one universal gate.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_tidy_pills: {
      status: 'Guide-reported · second-floor event',
      summary: 'Both guides report the pill bottle at Todd’s bedside. PowerPyx calls the step Tidy Pills and has Kara check the bottle; GameFAQs says to grab the bottle and then open the bedside-table drawer.',
      unknown: 'The guides describe the handgun discovery differently: GameFAQs places it after the pill bottle, while PowerPyx has Kara check the nightstand directly. The reported sequence is not an eligibility requirement.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_make_todd_bed: {
      status: 'Guide-reported · second-floor event',
      summary: 'Both guides report making Todd’s bed. PowerPyx places the automatic Alice move after this action; GameFAQs makes the bed last in Todd’s room.',
      unknown: 'The guides place the bed-making step differently within the room-cleaning walkthrough. No fixed order or requirement is inferred.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_alice_goes_room: {
      status: 'Guide-reported · second-floor sequence',
      summary: 'Both guides report that Alice goes to her room after Todd’s bed is made.',
      unknown: 'The move is an automatic scene event, not a player task or a condition for later chapter access. The guides do not state what else may trigger it.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_clean_toilet: {
      status: 'Guide-reported · second-floor event',
      summary: 'Both guides report cleaning the toilet on the second floor. PowerPyx places it before the bathroom; GameFAQs places it after Todd’s room.',
      unknown: 'The different walkthrough positions do not establish a fixed order or a requirement for Talk with Alice.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_arrange_bathroom_bottles: {
      status: 'Guide-reported · second-floor event',
      summary: 'Both guides report arranging or rearranging the bathroom bottles; PowerPyx specifies the bathtub.',
      unknown: 'PowerPyx lists cleaning the bathroom as one Talk with Alice prerequisite, but neither guide states that arranging bottles is a separate gate. This is a guide-listed action, not a verified chart box.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_store_bathroom_clothes: {
      status: 'Guide-reported · second-floor event',
      summary: 'PowerPyx reports storing the dirty clothes; GameFAQs says to pick up the towels. Both place the action in the bathroom cleaning.',
      unknown: 'PowerPyx lists cleaning the bathroom as one Talk with Alice prerequisite, but neither guide states that this individual action is a separate gate. This is a guide-listed action, not a verified chart box.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_mop_bathroom: {
      status: 'Guide-reported · second-floor event',
      summary: 'Both guides report mopping the bathroom floor.',
      unknown: 'PowerPyx lists cleaning the bathroom as one Talk with Alice prerequisite, but neither guide states that mopping is a separate gate. This is a guide-listed action, not a verified chart box.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_read_android_qb: {
      status: 'Guide-reported · single-source title',
      summary: 'PowerPyx names “Android QB” on the cupboard by Todd’s door and says to read both pages. GameFAQs reports a magazine on the shelf with the speakers but does not name it.',
      unknown: 'The exact title is PowerPyx-only. The guides do not establish the order, requirements, or consequences of reading it.',
      src: ['powerpyxHome']
    },
    a_read_putting_price: {
      status: 'Guide-reported · single-source title',
      summary: 'PowerPyx names “Putting a Price” on the cupboard by Todd’s door and says to read both pages. GameFAQs reports one unnamed magazine in Todd’s room.',
      unknown: 'The exact title is PowerPyx-only. GameFAQs does not establish a second magazine or a fixed reading order.',
      src: ['powerpyxHome']
    },
    a_read_alice_floor_book: {
      status: 'Guide-reported · second-floor reading',
      summary: 'Both guides report the book on Alice’s floor. PowerPyx names it “Alice in Wonderland”; GameFAQs only says Kara comments on the book Alice has been reading.',
      unknown: 'PowerPyx lists this floor book among the Talk with Alice requirements. GameFAQs reports Kara reading the book and commenting on it before the conversation but does not explicitly call it a gate. The exact title is PowerPyx-only.',
      src: ['powerpyxHome', 'gamefaqs']
    },
    a_read_alice_shelf_books: {
      status: 'Guide-reported · single-source event',
      summary: 'PowerPyx reports reading the books on Alice’s shelf between the bed and the door as part of the Talk with Alice requirement.',
      unknown: 'GameFAQs does not describe shelf books in this section. Whether reading them is universally required is not established.',
      src: ['powerpyxHome']
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
    s_todd_orders_stay: {
      status: 'Guide-reported · selected event',
      summary: 'PowerPyx (Todd Gets Mad / Becoming Deviant or not, reviewed lines 27–37) and Gamer Guides (Branch 1, reviewed lines 182–212) report that Todd orders Kara to stay still before Alice runs upstairs.',
      unknown: 'The too-slow path is deliberately omitted. This is a guide-backed Stormy Night event, not a transcribed chart box.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_alice_runs_upstairs: {
      status: 'Guide-reported · selected event',
      summary: 'Both reviewed guides place Alice running upstairs after Todd orders Kara to stay still. Kara’s stay-still or deviant response branches from this point.',
      unknown: 'The too-slow path and other intervening timed actions are not represented.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_deviant: {
      status: 'Guide-reported · selected event',
      summary: 'After Alice runs upstairs, Kara can break programming and become deviant. The guides report two alternatives: go upstairs to protect Alice, or reason with Todd.',
      unknown: 'The too-slow path, hidden timers, exact QTE/difficulty and other branches remain outside this slice.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_fatal_todd_kills: {
      status: 'Guide-reported · fatal non-deviant outcome',
      summary: 'PowerPyx says that if Kara fails to become deviant and simply stands still, Todd goes upstairs and kills Alice and Kara. Gamer Guides says Todd kills Alice, returns to Kara and kills her too. The node records that fatal outcome only.',
      unknown: 'This is a different state from “Todd killed” (s_dead). It has no connector to “Todd survives” (s_alive), the bus terminal or the later Todd meeting.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_go_upstairs: {
      status: 'Guide-reported · deviant alternative',
      summary: 'Both guides report going upstairs straight away to protect Alice instead of choosing to talk to Todd. This action joins the existing selected Reach Alice route.',
      unknown: 'Exact movement timing and hidden checks before reaching Alice are not modelled.',
      cross: { chapter: 'stormy', node: 's_reach_alice', label: 'Show the existing Reach Alice route' },
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_reason_todd: {
      status: 'Guide-reported · deviant alternative',
      summary: 'Both guides report talking to Todd instead of going upstairs. Todd knocks Kara down and reaches the stairs/upstairs before she can.',
      unknown: 'The later gun pickup, fight, escape and Todd-state consequences are not connected from this endpoint in this slice.',
      cross: { chapter: 'stormy', node: 's_todd_upstairs_first', label: 'Show the supported endpoint' },
      src: ['powerpyxStormy', 'gamerGuidesStormy']
    },
    s_todd_upstairs_first: {
      status: 'Guide-reported · supported branch endpoint',
      summary: 'PowerPyx says Todd smacks Kara to the ground and is upstairs before she can get there. Gamer Guides says Todd always pushes Kara down and marches upstairs himself. The node records that Todd reaches Alice before Kara.',
      unknown: 'No later gun, fight, survival or fatal outcome is claimed from this endpoint, and it is not wired to s_dead, s_alive, the terminal or the meeting.',
      src: ['powerpyxStormy', 'gamerGuidesStormy']
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
