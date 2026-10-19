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
  eq(C.createState(), { consented: false, chapter: 'all', selected: null, trail: [], query: '' });
});

check('consent sets the flag without mutating the input', function () {
  const s0 = C.createState();
  const s1 = C.consent(s0);
  assert(s1.consented === true, 'consented not set');
  assert(s0.consented === false, 'input state was mutated');
});

check('jumpChapter moves between chapters and accepts "all"', function () {
  const s0 = C.createState();
  const s1 = C.jumpChapter(s0, 'kara', ATLAS);
  const s2 = C.jumpChapter(s1, 'all', ATLAS);
  eq(s1.chapter, 'kara');
  eq(s2.chapter, 'all');
  eq(s0.chapter, 'all', 'input state was mutated');
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
  const s1 = C.selectNode(C.createState(), 'a_box', ATLAS);
  const buttonPath = C.closeDetails(s1);
  const escapePath = C.closeDetails(s1);
  eq(buttonPath, escapePath, 'the two close paths must reduce to the same state');
  eq(buttonPath.selected, null);
  eq(buttonPath.trail, ['a_box'], 'history is kept after closing');
  eq(buttonPath.chapter, 'home', 'camera preset is kept after closing');
});

check('reset clears selection, search and camera but keeps consent and history', function () {
  let s = C.consent(C.createState());
  s = C.selectNode(s, 'k_check', ATLAS);
  s = C.setQuery(s, 'todd');
  const r = C.reset(s);
  eq(r.chapter, 'all');
  eq(r.selected, null);
  eq(r.query, '');
  assert(r.consented === true, 'consent must survive reset');
  eq(r.trail, ['k_check'], 'history must survive reset');
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
});

console.log('atlas-core.js — history rendering');
check('trailFor expands ids to label and chapter name', function () {
  const items = C.trailFor(C.selectNode(C.createState(), 'a_box', ATLAS), ATLAS);
  eq(items.length, 1);
  eq(items[0].id, 'a_box');
  eq(items[0].chapterName, 'A New Home');
  assert(items[0].label.length > 0, 'label missing');
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

check('Todd survival and terminal arrival stay separate prerequisites', function () {
  const froms = edgesTo('k_meet').map(function (e) { return e.from; });
  assert(froms.indexOf('s_alive') !== -1 && froms.indexOf('k_terminal') !== -1,
    'both survival and arrival must gate the meeting');
  assert(froms.indexOf('s_alive') !== froms.indexOf('k_terminal'), 'gates must be two distinct edges');
});

check('cross-chapter links only enter the Kara region', function () {
  const cross = ATLAS.edges.filter(function (e) {
    const a = ATLAS.nodes.find(function (n) { return n.id === e.from; });
    const b = ATLAS.nodes.find(function (n) { return n.id === e.to; });
    return a.chapter !== b.chapter;
  });
  eq(cross.length, 2);
  cross.forEach(function (e) {
    const b = ATLAS.nodes.find(function (n) { return n.id === e.to; });
    eq(b.chapter, 'kara', 'cross-chapter edges into ' + b.id);
  });
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
