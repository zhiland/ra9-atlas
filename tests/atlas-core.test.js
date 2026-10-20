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

console.log('atlas-core.js — progressive disclosure');
check('lodFor reveals chapter cards, then event boxes, then labels', function () {
  eq(C.lodFor(C.OVERVIEW_MAX_SCALE - 0.01, 'all'), 'overview');
  eq(C.lodFor(C.OVERVIEW_MAX_SCALE, 'all'), 'structure');
  eq(C.lodFor(C.DETAIL_MIN_SCALE - 0.01, 'all'), 'structure');
  eq(C.lodFor(C.DETAIL_MIN_SCALE, 'all'), 'detail');
  eq(C.lodFor(0.1, 'home'), 'structure', 'a focused chapter must not fall back to the story overview');
  eq(C.lodFor(2, 'home'), 'detail');
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
  eq(groups.map(function (g) { return g.key; }), ['home>kara', 'stormy>kara']);
});

check('chapter groups preserve kinds and never synthesize edges', function () {
  const groups = C.crossChapterLinks(ATLAS);
  const kinds = groups.map(function (g) { return g.edges.map(function (item) { return item.edge.kind; }); });
  eq(kinds, [['hypothesis'], ['prerequisite']]);
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
