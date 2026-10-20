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
   - Stormy Night: selected gun/window carried-state events only. Internal
     chapter topology is NOT transcribed in full; only the guide-stated gun
     confrontation and its two shooting outcomes are drawn. Other ways to reach
     a surviving or killed Todd remain outside this slice.
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
      nodes: 29,
      edges: 31,
      tracedEdges: 19,
      conditionalEdges: 7,
      prerequisiteEdges: 4,
      hypothesisEdges: 1,
      crossChapterEdges: 4
    }
  },

  refs: {
    steam: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882',
    powerpyxHome: 'https://www.powerpyx.com/detroit-become-human-a-new-home-walkthrough-100/',
    powerpyxStormy: 'https://www.powerpyx.com/detroit-become-human-stormy-night-walkthrough-100/',
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
      code: 'D2 · selected gun/window carried states',
      frame: { x: 575, y: 120, w: 730, h: 790 },
      desc: 'Selected guide-reported gun and window states only. The gun confrontation and its two shooting outcomes are drawn; other internal branches, how Todd survives, and escape outcomes are not. No full chapter topology is claimed.',
      coverage: {
        status: 'partial',
        scope: 'Selected gun/window carried-state events and the existing Todd fate states.',
        included: 'Eight states/events: Todd not killed, Todd killed, take the nightstand gun, struggle for the gun, Kara shoots Todd, Alice shoots Todd, gun carried forward (Kara only), and the window route opened from A New Home. Six selected internal links.',
        omitted: 'All other Stormy Night branches, QTEs/escape outcomes, how Todd is spared or avoided, and how the window route resolves.',
        sources: ['powerpyxStormy', 'powerpyxKara', 'fandomBattle', 'neoseekerKara']
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
      note: 'Reported access condition for the later Todd meeting. How this state is reached is not covered here.' },
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
    { id: 's_window_open', chapter: 'stormy', label: 'Window route', short: 'Window route', kind: 'action', x: 595, y: 500, w: 150, h: 84, sub: 'route enabled · escape not modelled', status: 'guide', src: ['powerpyxStormy', 'powerpyxHome'],
      note: 'PowerPyx says the window can be opened if the route was found in Chapter 4. Availability is not a successful escape.' },

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
      note: 'Reported when the detour is taken after waiting and the timer is below 11 minutes. This is a late-bus outcome at the terminal, not a loss of terminal or Todd-meeting access.' }
  ],

  /* id is the stable link id; array index and order stay unchanged for ?edge=N.
     The first 16 edges keep their legacy order; the expansion appends new
     edges after them. from/to reference node ids. fromOption selects a choice
     row (0 = first). via = explicit orthogonal mid-x when the automatic channel
     would cross nodes. labelAt = explicit label position when the path midpoint
     is a poor spot. */
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
      note: 'The guides state all checkpoint ways, including the late/last-bus outcome, lead to the Bus Terminal. This branch therefore does not block the terminal or Todd-meeting gates.' }
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
      explanation: 'Only the selected gun outcomes into Todd killed are drawn. Other Stormy Night branches that produce survival or death, the escape routes, and the exact way Todd is spared remain outside this slice.',
      nodes: ['s_alive', 's_dead'],
      edges: ['e_stormy_alive_meet'],
      sources: ['powerpyxStormy', 'powerpyxKara', 'fandomBattle']
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
      explanation: 'Opening the window in A New Home enables a reported window route in Stormy Night, but the route’s QTEs and escape outcomes are outside this slice. Route availability is not a successful escape.',
      nodes: ['a_window_open', 's_window_open'],
      edges: ['e_home_window_stormy_route'],
      sources: ['powerpyxHome', 'powerpyxStormy']
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
      summary: 'PowerPyx and Fandom both anchor the later Todd meeting on Todd not being killed in Stormy Night (PowerPyx: Todd can be “spared/avoided” in that chapter).',
      unknown: 'The internal Stormy Night branch that produces this state is outside the reviewed evidence and is not drawn.',
      cross: { chapter: 'kara', node: 'k_meet', label: 'Show the gated meeting node' },
      src: ['powerpyxKara', 'fandomBattle', 'neoseekerKara']
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
      status: 'Guide-reported · route enabled only',
      summary: 'PowerPyx says the Stormy Night window can be opened if the route was found in Chapter 4, and that opening it can lead to escape choices.',
      unknown: 'This slice stops at route availability. It does not claim that the escape succeeds or model the later QTEs.',
      cross: { chapter: 'home', node: 'a_window_open', label: 'Show the earlier window opening' },
      src: ['powerpyxStormy', 'powerpyxHome']
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
