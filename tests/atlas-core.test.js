#!/usr/bin/env node
/* PoC4 — unit checks for the shared behaviour core (prototype/atlas-core.js)
   and the data invariants the details panel promises (prototype/atlas-data.js).
   Run: node tests/atlas-core.test.js   (npm run test:unit)

   The two prototype files are classic scripts, so they are evaluated in a
   function scope here and exported through a trailing return. */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const load = function (file, name) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  return new Function(src + '\nreturn ' + name + ';')();
};

const ATLAS = load('prototype/atlas-data.js', 'ATLAS');
const C = load('prototype/atlas-core.js', 'ATLAS_CORE');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok    ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL  ' + name + '\n        ' + err.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg || 'not equal') + ': ' + a + ' !== ' + b);
}

const nodeIds = ATLAS.nodes.map(function (n) { return n.id; });
const edgesFrom = function (id) { return ATLAS.edges.filter(function (e) { return e.from === id; }); };
const edgesTo = function (id) { return ATLAS.edges.filter(function (e) { return e.to === id; }); };

console.log('atlas-core.js — state transitions');
check('createState starts unconsented on the whole atlas', function () {
  eq(C.createState(), { consented: false, chapter: 'all', selected: null, edge: null, trail: [], query: '' });
});

check('consent sets the flag without mutating the input', function () {
  const s0 = C.createState();
  const s1 = C.consent(s0);
  assert(s1.consented === true, 'consented not set');
  assert(s0.consented === false, 'input state was mutated');
});

check('revokeConsent restores the warning state without mutating the input', function () {
  const s0 = C.consent(C.createState());
  const s1 = C.revokeConsent(s0);
  assert(s1.consented === false, 'consent was not revoked');
  assert(s0.consented === true, 'input state was mutated');
});

check('jumpChapter moves between chapters and accepts "all"', function () {
  const s0 = C.createState();
  const s1 = C.jumpChapter(s0, 'kara', ATLAS);
  const s2 = C.jumpChapter(s1, 'all', ATLAS);
  eq(s1.chapter, 'kara');
  eq(s2.chapter, 'all');
  eq(s0.chapter, 'all', 'input state was mutated');
});

check('jumpChapter clears an edge focus but keeps consent', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  const s0 = C.focusEdge(C.consent(C.createState()), index, ATLAS);
  const s1 = C.jumpChapter(s0, 'home', ATLAS);
  eq(s1.edge, null);
  assert(s1.consented === true, 'consent must survive a chapter jump');
});

check('jumpChapter rejects an unknown chapter and leaves state untouched', function () {
  const s0 = C.consent(C.createState());
  let threw = false;
  try { C.jumpChapter(s0, 'nope', ATLAS); } catch (e) { threw = /unknown chapter/.test(e.message); }
  assert(threw, 'unknown chapter was not rejected');
  eq(s0.chapter, 'all');
});

check('selectNode opens details, follows the node chapter and trails the visit', function () {
  const s0 = C.consent(C.createState());
  const s1 = C.selectNode(s0, 'k_meet', ATLAS);
  eq(s1.selected, 'k_meet');
  eq(s1.chapter, 'kara', 'chapter should follow the selected node');
  eq(s1.trail, ['k_meet']);
  assert(s0.selected === null && s0.trail.length === 0, 'input state was mutated');
});

check('selectNode rejects an unknown node', function () {
  const s0 = C.createState();
  let threw = false;
  try { C.selectNode(s0, 'not_a_node', ATLAS); } catch (e) { threw = /unknown node/.test(e.message); }
  assert(threw, 'unknown node was not rejected');
});

check('focusEdge selects the real later endpoint and records the edge index', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  const s0 = C.consent(C.createState());
  const s1 = C.focusEdge(s0, index, ATLAS);
  eq(s1.selected, 'k_dialogue');
  eq(s1.edge, index);
  eq(s1.chapter, 'kara');
  eq(s1.trail, ['k_dialogue']);
  assert(s0.selected === null && s0.edge === null, 'input state was mutated');
});

check('focusEdge rejects an unknown edge', function () {
  const s0 = C.createState();
  let threw = false;
  try { C.focusEdge(s0, 999, ATLAS); } catch (e) { threw = /unknown edge/.test(e.message); }
  assert(threw, 'unknown edge was not rejected');
  threw = false;
  try { C.focusEdge(s0, 'nope', ATLAS); } catch (e) { threw = /unknown edge/.test(e.message); }
  assert(threw, 'non-numeric edge was not rejected');
  threw = false;
  try { C.focusEdge(s0, 'e_missing', ATLAS); } catch (e) { threw = /unknown edge/.test(e.message); }
  assert(threw, 'unknown stable edge id was not rejected');
});

check('focusEdge accepts a stable edge id as an alias for its index', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  const id = ATLAS.edges[index].id;
  assert(/^e_[a-z0-9_]+$/.test(id), 'stable edge id missing: ' + id);
  const byIndex = C.focusEdge(C.createState(), index, ATLAS);
  const byId = C.focusEdge(C.createState(), id, ATLAS);
  eq(byId.edge, index);
  assert(C.sameTarget(byId, byIndex), 'stable id did not resolve to the same focused edge');
});

check('selectNode clears a previous edge focus', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'prerequisite'; });
  const s = C.selectNode(C.focusEdge(C.createState(), index, ATLAS), 'a_box', ATLAS);
  eq(s.edge, null);
  eq(s.selected, 'a_box');
});

check('trail dedupes and keeps the most recent visit first', function () {
  let s = C.createState();
  s = C.selectNode(s, 'a_box', ATLAS);
  s = C.selectNode(s, 'k_meet', ATLAS);
  s = C.selectNode(s, 'a_box', ATLAS);
  eq(s.trail, ['a_box', 'k_meet'], 're-selecting must move the node to the front without duplication');
});

check('trail caps at ' + C.MAX_TRAIL + ' entries', function () {
  let s = C.createState();
  const visit = nodeIds.slice(0, 10);
  visit.forEach(function (id) { s = C.selectNode(s, id, ATLAS); });
  eq(s.trail.length, C.MAX_TRAIL);
  eq(s.trail, visit.slice(2).reverse(), 'trail must keep the eight most recent visits, newest first');
});

check('closeDetails clears only the selection and both close paths share it', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'prerequisite'; });
  const s1 = C.focusEdge(C.createState(), index, ATLAS);
  const buttonPath = C.closeDetails(s1);
  const escapePath = C.closeDetails(s1);
  eq(buttonPath, escapePath, 'the two close paths must reduce to the same state');
  eq(buttonPath.selected, null);
  eq(buttonPath.edge, null, 'edge focus is cleared with the details');
  eq(buttonPath.trail, ['k_meet'], 'history is kept after closing');
  eq(buttonPath.chapter, 'kara', 'camera preset is kept after closing');
});

check('reset clears selection, edge focus, search and camera but keeps consent and history', function () {
  let s = C.consent(C.createState());
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  s = C.focusEdge(s, index, ATLAS);
  s = C.setQuery(s, 'todd');
  const r = C.reset(s);
  eq(r.chapter, 'all');
  eq(r.selected, null);
  eq(r.edge, null);
  eq(r.query, '');
  assert(r.consented === true, 'consent must survive reset');
  eq(r.trail, ['k_dialogue'], 'history must survive reset');
});

check('setQuery coerces to a string (null means empty)', function () {
  const s = C.setQuery(C.createState(), null);
  eq(s.query, '');
  eq(C.setQuery(s, 42).query, '42');
});

console.log('atlas-core.js — hash round-trip');
check('hashFor reflects chapter and selection', function () {
  eq(C.hashFor(C.createState()), '#all');
  eq(C.hashFor(C.jumpChapter(C.createState(), 'home', ATLAS)), '#home');
  eq(C.hashFor(C.selectNode(C.createState(), 'k_meet', ATLAS)), '#kara/k_meet');
});

check('applyHash restores a selected node and its chapter', function () {
  const s = C.applyHash(C.consent(C.createState()), '#kara/k_meet', ATLAS);
  eq(s.selected, 'k_meet');
  eq(s.chapter, 'kara');
  eq(s.trail, ['k_meet'], 'a hash-restored visit is part of the history');
});

check('applyHash accepts a chapter-only hash', function () {
  const s = C.applyHash(C.createState(), '#home', ATLAS);
  eq(s.chapter, 'home');
  eq(s.selected, null);
});

check('edge focus survives a hash round-trip', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  const direct = C.focusEdge(C.createState(), index, ATLAS);
  const hash = C.hashFor(direct);
  assert(/\?edge=\d+$/.test(hash), 'edge hash suffix missing: ' + hash);
  const round = C.applyHash(C.createState(), hash, ATLAS);
  assert(C.sameTarget(round, direct), 'edge focus did not round-trip (' + hash + ')');
  eq(round.edge, index);
  eq(round.selected, 'k_dialogue');
});

check('applyHash accepts a stable edge id and keeps index hashes canonical', function () {
  const index = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  const id = ATLAS.edges[index].id;
  const byIndex = C.applyHash(C.createState(), '#kara/k_dialogue?edge=' + index, ATLAS);
  const byId = C.applyHash(C.createState(), '#kara/k_dialogue?edge=' + id, ATLAS);
  assert(C.sameTarget(byId, byIndex), 'stable edge id link did not resolve to the index target');
  eq(byId.edge, index, 'stable edge id should resolve to its array index');
  eq(C.hashFor(byId), '#kara/k_dialogue?edge=' + index,
    'wrote hashes should stay ?edge=N so existing links remain canonical');
});

check('applyHash degrades unknown parts to safe defaults', function () {
  eq(C.applyHash(C.createState(), '', ATLAS), C.createState(), 'empty hash is a no-op');
  const unknownNode = C.applyHash(C.createState(), '#kara/not_a_node', ATLAS);
  eq(unknownNode.chapter, 'kara', 'known chapter with unknown node keeps the chapter');
  eq(unknownNode.selected, null);
  const unknownChapter = C.applyHash(C.createState(), '#nope', ATLAS);
  eq(unknownChapter, C.createState(), 'unknown chapter is ignored');
});

check('hash round-trip matches selectNode for every node in the data', function () {
  nodeIds.forEach(function (id) {
    const direct = C.selectNode(C.createState(), id, ATLAS);
    const round = C.applyHash(C.createState(), C.hashFor(direct), ATLAS);
    assert(C.sameTarget(round, direct), id + ' did not round-trip (' + C.hashFor(direct) + ')');
  });
});

check('sameTarget compares visible target only', function () {
  const a = C.selectNode(C.createState(), 'k_meet', ATLAS);
  const b = C.selectNode(C.createState(), 'k_meet', ATLAS);
  const c = C.selectNode(C.createState(), 'k_away', ATLAS);
  assert(C.sameTarget(a, b));
  assert(!C.sameTarget(a, c));
  const edgeIndex = ATLAS.edges.findIndex(function (e) { return e.kind === 'hypothesis'; });
  assert(!C.sameTarget(a, C.focusEdge(C.createState(), edgeIndex, ATLAS)), 'edge focus must be a different target');
});

console.log('atlas-core.js — history rendering');
check('trailFor expands ids to label and chapter name', function () {
  const items = C.trailFor(C.selectNode(C.createState(), 'a_box', ATLAS), ATLAS);
  eq(items.length, 1);
  eq(items[0].id, 'a_box');
  eq(items[0].chapterName, 'A New Home');
  assert(items[0].label.length > 0, 'label missing');
});

console.log('atlas-core.js — fit bounds');
function fitBox(viewport, box, pad, padTop) {
  const fitted = C.fitBounds(viewport, box, pad, padTop);
  return {
    fitted: fitted,
    scale: fitted.scale,
    left: fitted.tx + box.x * fitted.scale,
    right: fitted.tx + (box.x + box.w) * fitted.scale,
    top: fitted.ty + box.y * fitted.scale,
    bottom: fitted.ty + (box.y + box.h) * fitted.scale
  };
}

function inside(rect, viewport, pad, padTop) {
  const tol = 0.01;
  return rect.scale > 0 &&
    rect.left >= pad - tol && rect.right <= viewport.width - pad + tol &&
    rect.top >= padTop - tol && rect.bottom <= viewport.height - pad + tol;
}

check('full-map fit stays inside desktop and 390px mobile viewports', function () {
  const box = { x: 0, y: 0, w: ATLAS.canvas.width, h: ATLAS.canvas.height };
  [{ width: 1440, height: 757 }, { width: 390, height: 617 }].forEach(function (viewport) {
    const fitted = fitBox(viewport, box, 28, 28);
    assert(inside(fitted, viewport, 28, 28),
      'full map clipped at ' + viewport.width + 'x' + viewport.height +
      ': ' + JSON.stringify(fitted));
  });
});

check('every chapter fit stays inside desktop and 390px mobile viewports', function () {
  [{ width: 1440, height: 757 }, { width: 390, height: 617 }].forEach(function (viewport) {
    ATLAS.chapters.forEach(function (chapter) {
      const fitted = fitBox(viewport, chapter.frame, 56, 110);
      assert(inside(fitted, viewport, 56, 110),
        chapter.id + ' clipped at ' + viewport.width + 'x' + viewport.height +
        ': ' + JSON.stringify(fitted));
      assert(fitted.fitted.scale >= C.MIN_SCALE, chapter.id + ' fit fell below the global minimum scale');
    });
  });
});

check('fitBounds centers the box in the usable area', function () {
  const viewport = { width: 1440, height: 757 };
  const box = { x: 100, y: 50, w: 400, h: 200 };
  const fitted = fitBox(viewport, box, 40, 40);
  const leftGap = fitted.left - 40;
  const rightGap = viewport.width - 40 - fitted.right;
  const topGap = fitted.top - 40;
  const bottomGap = viewport.height - 40 - fitted.bottom;
  assert(Math.abs(leftGap - rightGap) < 0.01, 'horizontal gaps differ: ' + leftGap + ' / ' + rightGap);
  assert(Math.abs(topGap - bottomGap) < 0.01, 'vertical gaps differ: ' + topGap + ' / ' + bottomGap);
});

console.log('atlas-core.js — chapter-level crosslinks');
check('crossChapterLinks returns only actual cross-chapter edges', function () {
  const groups = C.crossChapterLinks(ATLAS);
  const flat = groups.reduce(function (out, g) { return out.concat(g.edges); }, []);
  const expected = ATLAS.edges.filter(function (e) {
    const a = ATLAS.nodes.find(function (n) { return n.id === e.from; });
    const b = ATLAS.nodes.find(function (n) { return n.id === e.to; });
    return a.chapter !== b.chapter;
  });
  eq(flat.length, expected.length, 'grouped edge count must match actual cross-chapter edges');
  flat.forEach(function (item) {
    const edge = ATLAS.edges[item.index];
    assert(edge === item.edge, 'group item does not reference its real edge index');
    const a = ATLAS.nodes.find(function (n) { return n.id === edge.from; });
    const b = ATLAS.nodes.find(function (n) { return n.id === edge.to; });
    assert(a.chapter !== b.chapter, 'group must not include an internal edge');
  });
  eq(groups.map(function (g) { return g.key; }), ['home>stormy', 'home>kara', 'stormy>kara', 'hostage>public-enemy']);
});

check('chapter groups preserve kinds and never synthesize edges', function () {
  const groups = C.crossChapterLinks(ATLAS);
  const kinds = groups.map(function (g) { return g.edges.map(function (item) { return item.edge.kind; }); });
  eq(kinds, [['prerequisite', 'prerequisite'], ['hypothesis'], ['prerequisite'], ['prerequisite']]);
  const total = ATLAS.meta.counts.crossChapterEdges;
  eq(groups.reduce(function (n, g) { return n + g.edges.length; }, 0), total);
});

check('multiple edges between one chapter pair group by real index for navigation', function () {
  const data = {
    chapters: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    nodes: [
      { id: 'a1', chapter: 'a' }, { id: 'a2', chapter: 'a' },
      { id: 'b1', chapter: 'b' }, { id: 'c1', chapter: 'c' }
    ],
    edges: [
      { from: 'a1', to: 'b1', kind: 'hypothesis' },
      { from: 'a1', to: 'a2', kind: 'traced' },
      { from: 'a2', to: 'b1', kind: 'prerequisite' },
      { from: 'b1', to: 'c1', kind: 'conditional' }
    ]
  };
  const groups = C.crossChapterLinks(data);
  eq(groups.map(function (g) { return g.key; }), ['a>b', 'b>c']);
  eq(groups[0].edges.map(function (item) { return item.index; }), [0, 2],
    'the group must reference the two actual cross-chapter edges, not the internal edge');
  eq(groups[0].edges.map(function (item) { return item.edge.kind; }), ['hypothesis', 'prerequisite']);
  eq(groups[1].edges.map(function (item) { return item.index; }), [3]);
});

console.log('atlas-data.js — invariants the details panel relies on');
check('Meet Todd has exactly the two reported prerequisite gates', function () {
  const gates = edgesTo('k_meet').filter(function (e) { return e.kind === 'prerequisite'; });
  eq(gates.map(function (e) { return e.from; }).sort(), ['k_terminal', 's_alive']);
  gates.forEach(function (g) { assert(/prerequisite/.test(g.label || ''), 'gate label must say prerequisite'); });
});

check('the Alice box keeps a single unresolved hypothesis edge', function () {
  const out = edgesFrom('a_box');
  eq(out.length, 1);
  eq(out[0].kind, 'hypothesis');
  eq(out[0].to, 'k_dialogue');
  assert(/UNRESOLVED/.test(out[0].label || ''), 'hypothesis label must be explicit');
  assert(!ATLAS.edges.some(function (e) { return e.from === 'a_box' && e.to === 'k_meet'; }),
    'the hypothesis must not be presented as a gate into the meeting');
});

check('Todd killed is a terminal negative state', function () {
  eq(edgesFrom('s_dead'), [], 'no outgoing connector may leave the negative state');
});

check('A New Home first-floor events keep only source-supported progressions', function () {
  const byId = Object.fromEntries(ATLAS.nodes.map(function (n) { return [n.id, n]; }));
  const edges = Object.fromEntries(ATLAS.edges.map(function (e) { return [e.id, e]; }));
  const events = [
    'a_read_android_power', 'a_read_connecting_dots', 'a_wash_dishes', 'a_take_laundry_backyard',
    'a_rewash_clothes', 'a_find_red_ice', 'a_enrage_todd', 'a_watch_todd_tv',
    'a_block_todd_view', 'a_activate_vacuum', 'a_take_out_trash'
  ];
  events.forEach(function (id) {
    assert(byId[id] && byId[id].chapter === 'home', id + ' must be a sourced A New Home event');
    assert(byId[id].src.length > 0, id + ' must name its evidence');
    assert(!/\b(optional (activity|event|action|branch)|is mandatory|must be completed|are exclusive|mutually exclusive)\b/i.test(byId[id].note || ''), id + ' must not claim unsupported optionality or requirements');
  });
  eq([edges.e_home_backyard_rewash_clothes.from, edges.e_home_backyard_rewash_clothes.to], ['a_take_laundry_backyard', 'a_rewash_clothes']);
  eq([edges.e_home_rewash_red_ice.from, edges.e_home_rewash_red_ice.to], ['a_rewash_clothes', 'a_find_red_ice']);
  eq([edges.e_home_red_ice_enrage_todd.from, edges.e_home_red_ice_enrage_todd.to], ['a_find_red_ice', 'a_enrage_todd']);
  eq([edges.e_home_watch_tv_block_view.from, edges.e_home_watch_tv_block_view.to], ['a_watch_todd_tv', 'a_block_todd_view']);
  eq([edges.e_home_backyard_rewash_clothes.from, edges.e_home_backyard_rewash_clothes.to], ['a_take_laundry_backyard', 'a_rewash_clothes']);
  eq(edgesFrom('a_clean1').map(function (e) { return e.to; }), ['a_ask']);
  const unknown = ATLAS.uncertainties.find(function (u) { return u.id === 'u_home_first_floor_order'; });
  assert(unknown && unknown.status === 'unknown', 'unresolved first-floor order and requirements must be recorded');
  events.forEach(function (id) { assert(unknown.nodes.includes(id), id + ' must appear in the uncertainty record'); });
});

check('Todd survival and terminal arrival stay separate prerequisites', function () {
  const froms = edgesTo('k_meet').map(function (e) { return e.from; });
  assert(froms.indexOf('s_alive') !== -1 && froms.indexOf('k_terminal') !== -1,
    'both survival and arrival must gate the meeting');
  assert(froms.indexOf('s_alive') !== froms.indexOf('k_terminal'), 'gates must be two distinct edges');
});

check('the two successful non-gun escape routes stay distinct', function () {
  const corridor = ['s_reach_alice', 's_run_away', 's_hide_corridor', 's_todd_passes', 's_front_backyard_escape'];
  const window = ['s_lock_room', 's_window_go_out', 's_window_qte', 's_window_reach_bus'];
  for (let i = 0; i < corridor.length - 1; i++) {
    const outs = edgesFrom(corridor[i]).map(function (e) { return e.to; });
    assert(outs.indexOf(corridor[i + 1]) !== -1, 'corridor route step missing: ' + corridor[i] + ' -> ' + corridor[i + 1]);
  }
  for (let i = 0; i < window.length - 1; i++) {
    const outs = edgesFrom(window[i]).map(function (e) { return e.to; });
    assert(outs.indexOf(window[i + 1]) !== -1, 'window route step missing: ' + window[i] + ' -> ' + window[i + 1]);
  }
  assert(corridor.slice(0, -1).every(function (id) { return window.indexOf(id) === -1; }),
    'the corridor route must not reuse window-only steps');
  assert(window.every(function (id) { return corridor.indexOf(id) === -1; }),
    'the window route must not reuse corridor-only steps');
  assert(!edgesFrom('s_front_backyard_escape').some(function (e) { return e.to === 's_window_reach_bus'; }) &&
    !edgesFrom('s_window_reach_bus').some(function (e) { return e.to === 's_front_backyard_escape'; }),
    'one escape route must not unlock the other');
  const access = edgesFrom('s_window_open');
  eq(access.map(function (e) { return e.to; }), ['s_window_go_out']);
  eq(access[0].kind, 'prerequisite');
  assert(!edgesFrom('s_window_open').some(function (e) { return e.to === 'k_terminal' || e.to === 'k_meet'; }),
    'the window opening must not claim a direct escape outcome');
});

check('both non-gun escape endpoints link to Todd only through a labelled inference', function () {
  [['s_front_backyard_escape', 'e_stormy_front_backyard_alive'],
    ['s_window_reach_bus', 'e_stormy_window_bus_alive']].forEach(function (pair) {
    const out = edgesFrom(pair[0]);
    eq(out.map(function (e) { return e.id; }), [pair[1]]);
    eq(out[0].kind, 'hypothesis');
    eq(out[0].to, 's_alive');
    assert(/UNRESOLVED inference/i.test(out[0].label || ''), pair[1] + ' must label itself as an inference');
    assert(/not state|does not state|unstated/i.test(out[0].note || ''),
      pair[1] + ' must say the source does not state Todd’s later state');
    assert(!out.some(function (e) { return e.to === 'k_terminal' || e.to === 'k_meet'; }),
      pair[0] + ' must not connect directly to the meeting or terminal');
  });
  const unknown = ATLAS.uncertainties.find(function (u) { return u.id === 'u_stormy_escape_todd_state'; });
  assert(unknown && unknown.status === 'unknown', 'the shared Todd-state inference needs an explicit unknown record');
  assert(unknown.edges.indexOf('e_stormy_front_backyard_alive') !== -1 &&
    unknown.edges.indexOf('e_stormy_window_bus_alive') !== -1,
    'the Todd-state unknown must reference both inference edges');
});

check('Stormy entry follows source order and keeps the fatal branch distinct', function () {
  const order = ATLAS.nodes.find(function (n) { return n.id === 's_todd_orders_stay'; });
  const alice = ATLAS.nodes.find(function (n) { return n.id === 's_alice_runs_upstairs'; });
  const deviant = ATLAS.nodes.find(function (n) { return n.id === 's_deviant'; });
  const fatal = ATLAS.nodes.find(function (n) { return n.id === 's_fatal_todd_kills'; });
  const dead = ATLAS.nodes.find(function (n) { return n.id === 's_dead'; });
  assert(order && alice && deviant && fatal && dead, 'entry and Todd-fate nodes must exist');
  [order, alice, deviant].forEach(function (node) {
    assert(node.kind === 'action', node.id + ' must be a real event, not a supplemental state gate');
    assert(node.src.indexOf('powerpyxStormy') !== -1 && node.src.indexOf('gamerGuidesStormy') !== -1,
      node.id + ' must cite both reviewed Stormy Night sources');
  });
  eq(edgesFrom('s_todd_orders_stay').map(function (e) { return [e.to, e.kind]; }),
    [['s_alice_runs_upstairs', 'traced']]);
  eq(edgesFrom('s_alice_runs_upstairs').map(function (e) { return e.to; }).sort(),
    ['s_deviant', 's_fatal_todd_kills']);
  assert(/deviant/i.test(deviant.label), 'the alternate branch must lead to the deviant event');
  assert(/stay still|obey/i.test(edgesFrom('s_alice_runs_upstairs').find(function (e) { return e.to === 's_fatal_todd_kills'; }).label),
    'fatal route must be the stay-still response');
  assert(edgesFrom('s_alice_runs_upstairs').some(function (e) { return e.to === 's_deviant'; }),
    'the second route must lead to the deviant event');
  assert(fatal.label !== dead.label && /fatal/i.test(fatal.note || ''), 'fatal outcome must remain distinct from Todd killed');
  eq(edgesFrom('s_fatal_todd_kills'), [], 'fatal outcome must remain terminal');
  assert(!ATLAS.edges.some(function (e) { return e.from === 's_fatal_todd_kills' && ['s_alive', 's_dead', 'k_meet', 'k_terminal'].indexOf(e.to) !== -1; }),
    'fatal outcome must not imply a Todd-state or meeting');
  eq(edgesFrom('s_deviant').map(function (e) { return e.to; }).sort(), ['s_go_upstairs', 's_reason_todd']);
  eq(edgesFrom('s_go_upstairs').map(function (e) { return [e.to, e.kind]; }), [['s_reach_alice', 'traced']]);
  eq(edgesFrom('s_reason_todd').map(function (e) { return [e.to, e.kind]; }), [['s_todd_upstairs_first', 'traced']]);
  assert(/knocks Kara down|Kara is knocked down/i.test(ATLAS.nodes.find(function (n) { return n.id === 's_todd_upstairs_first'; }).note),
    'Reason with Todd endpoint must state Kara is knocked down');
  eq(edgesFrom('s_todd_upstairs_first'), [], 'Reason with Todd endpoint must stay scoped');
  eq(edgesTo('s_alive').map(function (e) { return e.from; }).sort(), ['s_front_backyard_escape', 's_window_reach_bus']);
});

check('cross-chapter links connect only the documented chapter pairs', function () {
  const cross = ATLAS.edges.filter(function (e) {
    const a = ATLAS.nodes.find(function (n) { return n.id === e.from; });
    const b = ATLAS.nodes.find(function (n) { return n.id === e.to; });
    return a.chapter !== b.chapter;
  });
  eq(cross.length, 5);
  const pairs = cross.map(function (e) {
    const a = ATLAS.nodes.find(function (n) { return n.id === e.from; });
    const b = ATLAS.nodes.find(function (n) { return n.id === e.to; });
    return a.chapter + '>' + b.chapter;
  });
  eq(pairs.sort(), ['home>kara', 'home>stormy', 'home>stormy', 'hostage>public-enemy', 'stormy>kara']);
});

check('declared counts match the data', function () {
  const c = ATLAS.meta.counts;
  const count = function (kind) { return ATLAS.edges.filter(function (e) { return e.kind === kind; }).length; };
  eq(c.chapters, ATLAS.chapters.length);
  eq(c.nodes, ATLAS.nodes.length);
  eq(c.edges, ATLAS.edges.length);
  eq(c.tracedEdges, count('traced'));
  eq(c.conditionalEdges, count('conditional'));
  eq(c.prerequisiteEdges, count('prerequisite'));
  eq(c.hypothesisEdges, count('hypothesis'));
});

check('reaching the positive outcome never requires the unresolved hypothesis', function () {
  const confirmed = ATLAS.edges.filter(function (e) { return e.kind !== 'hypothesis'; });
  const seen = { k_away: true };
  let grew = true;
  while (grew) {
    grew = false;
    confirmed.forEach(function (e) {
      if (seen[e.to] && !seen[e.from]) { seen[e.from] = true; grew = true; }
    });
  }
  assert(seen.k_meet, 'the confirmed meeting gate path must reach k_meet');
  assert(!seen.a_box, 'a_box must not be a confirmed prerequisite of the positive outcome');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
