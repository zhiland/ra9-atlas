'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildAtlasDiff, renderMarkdown } = require('../tools/data/atlas-diff');
const { compileSource } = require('../tools/data/build-atlas');
const source = require('../data/atlas.source.json');
const ledger = require('../data/legacy-index.json');
const root = path.resolve(__dirname, '..');
const cliPath = path.resolve(root, 'tools/data/atlas-diff.js');
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
const deepFreeze = value => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};
const NOTE = 'Structural differences only: this report compares two independently validated snapshots and records structural differences between them. It never decides which version is true or approved, grants no compatibility or publication permission, performs no gameplay verification, and is not evidence of release readiness.';
const VALUE_CHANGED = '(value changed)';
const ARRAY_KEYS = ['chapters', 'nodes', 'edges', 'conditions', 'uncertainties', 'conflicts'];

const makeBefore = () => ({
  chapters: [
    { id: 'alpha', name: 'Alpha', coverage: { status: 'partial', scope: 'Alpha scope.' } },
    { id: 'beta', name: 'Beta', coverage: { status: 'partial', scope: 'Beta scope.' } }
  ],
  nodes: [
    { id: 'a1', chapter: 'alpha', label: 'A1', src: ['s1'] },
    { id: 'a2', chapter: 'alpha', label: 'A2', src: ['s1'] },
    { id: 'b1', chapter: 'beta', label: 'B1', src: ['s2'] }
  ],
  edges: [
    { id: 'e_a1_a2', from: 'a1', to: 'a2', kind: 'traced', src: ['s1'] },
    { id: 'e_a2_b1', from: 'a2', to: 'b1', kind: 'traced', src: ['s2'] }
  ],
  conditions: [{ id: 'c_gate', appliesTo: ['e_a1_a2', 'e_a2_b1'], operator: 'AND' }],
  uncertainties: [{ id: 'u_open', status: 'unknown', explanation: 'Unsettled.' }],
  conflicts: [],
  refs: { s1: 'https://example.com/one', s2: 'https://example.com/two' },
  detail: {
    a1: { status: 'guide', summary: 'First detail.', src: ['s1'] },
    b1: { status: 'user', summary: 'Old detail.', src: ['s2'] }
  },
  meta: { contractVersion: '1.1', counts: { nodes: 3, edges: 2 } },
  canvas: { width: 100, height: null }
});

// Simultaneous additions and removals, a provenance (src) change, a coverage
// change, a withdrawal (kind/note/replacedBy) change, a nested array reorder,
// an absent-vs-null field and a value-type-neutral ref replacement.
const makeAfter = () => ({
  chapters: [
    { id: 'alpha', name: 'Alpha', coverage: { status: 'checked-against-chart', scope: 'Alpha scope.' } },
    { id: 'gamma', name: 'Gamma', coverage: { status: 'partial', scope: 'Gamma scope.' } }
  ],
  nodes: [
    { id: 'a1', chapter: 'alpha', label: 'A1', src: ['s1', 's3'] },
    { id: 'a2', chapter: 'alpha', label: 'A2', src: ['s1'] },
    { id: 'n_new', chapter: 'gamma', label: 'New', src: ['s3'] }
  ],
  edges: [
    { id: 'e_a1_a2', from: 'a1', to: 'a2', kind: 'traced', src: ['s1'] },
    { id: 'e_a2_b1', from: 'a2', to: 'b1', kind: 'withdrawn', note: 'Withdrawn.', replacedBy: ['e_new'], src: ['s2'] },
    { id: 'e_new', from: 'a1', to: 'n_new', kind: 'traced', src: ['s3'] }
  ],
  conditions: [{ id: 'c_gate', appliesTo: ['e_a2_b1', 'e_a1_a2'], operator: 'AND' }],
  uncertainties: [{ id: 'u_open', status: 'unknown', explanation: 'Settled differently.' }],
  conflicts: [],
  refs: { s2: 'https://example.com/two-v2', s3: 'https://example.com/three' },
  detail: {
    a1: { status: 'guide', summary: 'Expanded detail.', src: ['s1'] },
    n_new: { status: 'ocr', summary: 'New detail.', src: ['s3'] }
  },
  meta: { contractVersion: '1.1', counts: { edges: 2, nodes: 3 } },
  canvas: { width: 100 }
});

test('two-snapshot fixture: additions, removals, provenance, coverage and withdrawal changes', () => {
  const report = buildAtlasDiff(makeBefore(), makeAfter());
  assert.deepEqual(report, {
    format: 'ra9-atlas.semantic-diff',
    version: 1,
    hasChanges: true,
    collections: {
      chapters: { added: ['gamma'], removed: ['beta'], changed: [{ id: 'alpha', fields: ['coverage'] }], reordered: false },
      nodes: { added: ['n_new'], removed: ['b1'], changed: [{ id: 'a1', fields: ['src'] }], reordered: false },
      edges: { added: ['e_new'], removed: [], changed: [{ id: 'e_a2_b1', fields: ['kind', 'note', 'replacedBy'] }], reordered: false },
      conditions: { added: [], removed: [], changed: [{ id: 'c_gate', fields: ['appliesTo'] }], reordered: false },
      uncertainties: { added: [], removed: [], changed: [{ id: 'u_open', fields: ['explanation'] }], reordered: false },
      conflicts: { added: [], removed: [], changed: [], reordered: false }
    },
    refs: { added: ['s3'], removed: ['s1'], changed: [{ key: 's2', fields: [VALUE_CHANGED] }] },
    detail: { added: ['n_new'], removed: ['b1'], changed: [{ key: 'a1', fields: ['summary'] }] },
    meta: { changed: [] },
    canvas: { changed: ['height'] },
    legacyIndexChanges: { nodes: [], edges: [] },
    note: NOTE
  });
  // Top-level field names only: the nested coverage.status edit surfaces as
  // the single top-level field "coverage".
  assert.deepEqual(report.collections.nodes.changed[0].fields, ['src']);
  assert.equal(report.hasChanges, true);
  assert.equal(report.note, NOTE);
  assert.match(report.note, /Structural differences only/);
  assert.match(report.note, /release readiness/);
});

test('never mutates either input, including deeply frozen atlases', () => {
  const before = makeBefore();
  const after = makeAfter();
  const expectedBefore = structuredClone(before);
  const expectedAfter = structuredClone(after);
  buildAtlasDiff(deepFreeze(before), deepFreeze(after));
  assert.deepEqual(before, expectedBefore);
  assert.deepEqual(after, expectedAfter);
  // The canonical sample also survives untouched.
  const canonical = structuredClone(source.atlas);
  buildAtlasDiff(deepFreeze(source.atlas), deepFreeze(structuredClone(source.atlas)));
  assert.deepEqual(source.atlas, canonical);
});

test('report shares no object references with its inputs', () => {
  const before = makeBefore();
  const after = makeAfter();
  const report = buildAtlasDiff(before, after);
  const collect = (value, set = new Set()) => {
    if (value !== null && typeof value === 'object') {
      set.add(value);
      for (const child of Object.values(value)) collect(child, set);
    }
    return set;
  };
  const inputs = collect(before, collect(after));
  for (const value of collect(report)) assert.ok(!inputs.has(value), 'report must contain only fresh objects');
});

const reverseKeys = value => {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).reverse()) out[key] = reverseKeys(value[key]);
    return out;
  }
  return value;
};

test('nested object key insertion order is irrelevant at every level', () => {
  const report = buildAtlasDiff(makeBefore(), reverseKeys(makeBefore()));
  assert.equal(report.hasChanges, false);
  for (const key of ARRAY_KEYS) {
    assert.deepEqual(report.collections[key], { added: [], removed: [], changed: [], reordered: false }, key);
  }
  assert.deepEqual(report.refs, { added: [], removed: [], changed: [] });
  assert.deepEqual(report.detail, { added: [], removed: [], changed: [] });
  assert.deepEqual(report.meta, { changed: [] });
  assert.deepEqual(report.canvas, { changed: [] });
  assert.deepEqual(report.legacyIndexChanges, { nodes: [], edges: [] });
});

test('nested array element order matters in keyed records and map records', () => {
  const before = makeBefore();
  const after = makeBefore();
  after.conditions[0].appliesTo = ['e_a2_b1', 'e_a1_a2'];
  before.detail.a1.src = ['s1', 's2'];
  after.detail.a1.src = ['s2', 's1'];
  const report = buildAtlasDiff(before, after);
  assert.equal(report.hasChanges, true);
  assert.deepEqual(report.collections.conditions.changed, [{ id: 'c_gate', fields: ['appliesTo'] }]);
  assert.deepEqual(report.detail.changed, [{ key: 'a1', fields: ['src'] }]);
});

test('absent fields differ from explicit null in both directions and depths', () => {
  // Top level: canvas.height is null before and absent after (main fixture).
  assert.deepEqual(buildAtlasDiff(makeBefore(), makeAfter()).canvas, { changed: ['height'] });
  const nullBefore = makeBefore();
  const plainAfter = makeBefore();
  nullBefore.nodes[0].note = null;
  assert.deepEqual(buildAtlasDiff(nullBefore, plainAfter).collections.nodes.changed,
    [{ id: 'a1', fields: ['note'] }]);
  const plainBefore = makeBefore();
  const nullAfter = makeBefore();
  nullAfter.nodes[0].note = null;
  assert.deepEqual(buildAtlasDiff(plainBefore, nullAfter).collections.nodes.changed,
    [{ id: 'a1', fields: ['note'] }]);
  const nestedBefore = makeBefore();
  const nestedAfter = makeBefore();
  nestedBefore.nodes[0].extra = { x: null };
  nestedAfter.nodes[0].extra = {};
  assert.deepEqual(buildAtlasDiff(nestedBefore, nestedAfter).collections.nodes.changed,
    [{ id: 'a1', fields: ['extra'] }]);
});

test('explicit value-change marker for scalar and type changes in refs and detail', () => {
  const refBefore = makeBefore();
  const refAfter = makeBefore();
  refAfter.refs.s1 = 'https://example.com/other';
  assert.deepEqual(buildAtlasDiff(refBefore, refAfter).refs.changed,
    [{ key: 's1', fields: [VALUE_CHANGED] }]);

  const typeBefore = makeBefore();
  const typeAfter = makeBefore();
  typeAfter.detail.a1 = 'plain text';
  assert.deepEqual(buildAtlasDiff(typeBefore, typeAfter).detail.changed,
    [{ key: 'a1', fields: [VALUE_CHANGED] }]);

  const recordBefore = makeBefore();
  const recordAfter = makeBefore();
  recordAfter.detail.a1 = { status: 'ocr', summary: 'First detail.', src: ['s1'] };
  assert.deepEqual(buildAtlasDiff(recordBefore, recordAfter).detail.changed,
    [{ key: 'a1', fields: ['status'] }]);
});

test('meta and canvas report changed top-level fields only, lexically sorted', () => {
  const before = makeBefore();
  const after = makeBefore();
  after.meta.counts.nodes = 4;
  after.meta.contractVersion = '1.0';
  after.canvas.width = 50;
  const report = buildAtlasDiff(before, after);
  assert.deepEqual(report.meta.changed, ['contractVersion', 'counts']);
  assert.deepEqual(report.canvas.changed, ['width']);
  assert.equal(report.hasChanges, true);
});

test('identifiers, keys and field lists use stable lexical order', () => {
  const before = makeBefore();
  const after = makeBefore();
  before.nodes = [{ id: 'z1' }, { id: 'a1' }];
  after.nodes = [
    { id: 'z_new' },
    { id: 'z1', extra: 1 },
    { id: 'a1', extra: 1 },
    { id: 'm_new' }
  ];
  before.refs = { keep: 'https://example.com/keep' };
  after.refs = { z_new: 'u', a_new: 'u', keep: 'https://example.com/keep' };
  const report = buildAtlasDiff(before, after);
  // Added IDs and keys are sorted, not left in encounter order.
  assert.deepEqual(report.collections.nodes.added, ['m_new', 'z_new']);
  assert.deepEqual(report.refs.added, ['a_new', 'z_new']);
  // Changed entries are sorted by ID, not by before-array encounter order.
  assert.deepEqual(report.collections.nodes.changed.map(entry => entry.id), ['a1', 'z1']);
  assert.equal(report.collections.nodes.reordered, false);

  const fieldBefore = makeBefore();
  const fieldAfter = makeBefore();
  fieldBefore.nodes = [{ id: 'x', k: 1 }];
  fieldAfter.nodes = [{ id: 'x', k: 2, zeta: 'z', alpha: 'a' }];
  assert.deepEqual(buildAtlasDiff(fieldBefore, fieldAfter).collections.nodes.changed,
    [{ id: 'x', fields: ['alpha', 'k', 'zeta'] }]);
});

test('report is deterministic and free of timestamps and absolute paths', () => {
  const first = buildAtlasDiff(makeBefore(), makeAfter());
  const second = buildAtlasDiff(makeBefore(), makeAfter());
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  const json = JSON.stringify(first);
  assert.ok(!json.includes(root));
  assert.ok(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(json), 'no timestamp-like values');
});

test('append, insertion and removal alone are never reordering', () => {
  const renode = (beforeIds, afterIds) => {
    const before = makeBefore();
    const after = makeBefore();
    before.nodes = beforeIds.map(nodeId => ({ id: nodeId }));
    after.nodes = afterIds.map(nodeId => ({ id: nodeId }));
    return buildAtlasDiff(before, after).collections.nodes;
  };
  const appended = renode(['a1'], ['a1', 'a2']);
  assert.equal(appended.reordered, false);
  assert.deepEqual(appended.added, ['a2']);

  const frontInserted = renode(['a1', 'a2'], ['a3', 'a1', 'a2']);
  assert.equal(frontInserted.reordered, false);
  assert.deepEqual(frontInserted.added, ['a3']);

  const removed = renode(['a1', 'a2', 'a3'], ['a1', 'a3']);
  assert.equal(removed.reordered, false);
  assert.deepEqual(removed.removed, ['a2']);

  const reordered = renode(['a1', 'a2', 'a3'], ['a2', 'a1', 'a3']);
  assert.equal(reordered.reordered, true);
});

test('legacy index movements for retained node and edge IDs, sorted by ID', () => {
  const before = makeBefore();
  const after = makeBefore();
  before.nodes = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }];
  after.nodes = [{ id: 'n3' }, { id: 'n1' }, { id: 'n2' }];
  before.edges = [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }];
  after.edges = [{ id: 'e1' }, { id: 'e3' }, { id: 'e2' }];
  const report = buildAtlasDiff(before, after);
  assert.deepEqual(report.legacyIndexChanges.nodes, [
    { id: 'n1', before: 0, after: 1 },
    { id: 'n2', before: 1, after: 2 },
    { id: 'n3', before: 2, after: 0 }
  ]);
  assert.deepEqual(report.legacyIndexChanges.edges, [
    { id: 'e2', before: 1, after: 2 },
    { id: 'e3', before: 2, after: 1 }
  ]);
  // Only the two ledger-backed collections carry legacy index movements.
  assert.deepEqual(Object.keys(report.legacyIndexChanges), ['nodes', 'edges']);
  assert.equal(report.collections.nodes.reordered, true);
  assert.equal(report.collections.edges.reordered, true);
  assert.equal(report.hasChanges, true);
});

test('front insertion shifts retained indices without relative reordering', () => {
  const before = makeBefore();
  const after = makeBefore();
  before.nodes = [{ id: 'a1' }, { id: 'a2' }];
  after.nodes = [{ id: 'a3' }, { id: 'a1' }, { id: 'a2' }];
  const report = buildAtlasDiff(before, after);
  assert.equal(report.collections.nodes.reordered, false);
  assert.deepEqual(report.legacyIndexChanges.nodes, [
    { id: 'a1', before: 0, after: 1 },
    { id: 'a2', before: 1, after: 2 }
  ]);
  assert.equal(report.hasChanges, true);
});

test('hasChanges covers every added, removed, changed, reordered, index and map case', () => {
  const cases = {
    'added node': after => { after.nodes.push({ id: 'extra' }); },
    'removed node': after => { after.nodes.pop(); },
    'changed node field': after => { after.nodes[0].label = 'Changed'; },
    'reordered chapters only': after => { after.chapters.reverse(); },
    'front insertion with index moves': after => { after.nodes.unshift({ id: 'extra' }); },
    'ref value changed': after => { after.refs.s1 = 'https://example.com/changed'; },
    'ref key added': after => { after.refs.s9 = 'https://example.com/nine'; },
    'ref key removed': after => { delete after.refs.s1; },
    'detail value changed': after => { after.detail.a1.summary = 'Changed'; },
    'detail key added': after => { after.detail.extra = { status: 'x', src: ['s1'] }; },
    'meta field changed': after => { after.meta.contractVersion = '1.0'; },
    'canvas field changed': after => { after.canvas.width = 999; }
  };
  for (const [name, mutate] of Object.entries(cases)) {
    const after = makeBefore();
    mutate(after);
    assert.equal(buildAtlasDiff(makeBefore(), after).hasChanges, true, name);
  }
  assert.equal(buildAtlasDiff(makeBefore(), makeBefore()).hasChanges, false, 'equal inputs');
});

test('reject null or nonobject atlases on both sides', () => {
  assert.throws(() => buildAtlasDiff(null, makeAfter()), /before: expected an object/);
  assert.throws(() => buildAtlasDiff(makeBefore(), null), /after: expected an object/);
  assert.throws(() => buildAtlasDiff('nope', makeAfter()), /before: expected an object/);
  assert.throws(() => buildAtlasDiff(makeBefore(), 42), /after: expected an object/);
});

const expectReject = (side, mutate, expected) => {
  const before = makeBefore();
  const after = makeAfter();
  mutate(side === 'before' ? before : after);
  assert.throws(() => buildAtlasDiff(before, after), expected);
};

for (const [name, side, mutate, expected] of [
  ['missing chapters array', 'before', atlas => { atlas.chapters = null; }, /before\.chapters: expected an array/],
  ['edges not an array', 'after', atlas => { atlas.edges = 'nope'; }, /after\.edges: expected an array/],
  ['conditions not an array', 'before', atlas => { atlas.conditions = 7; }, /before\.conditions: expected an array/],
  ['duplicate chapter id', 'after', atlas => { atlas.chapters[1].id = 'alpha'; }, /after\.chapters\[1\]\.id: duplicate chapter id "alpha"/],
  ['duplicate node id', 'before', atlas => { atlas.nodes[1].id = 'a1'; }, /before\.nodes\[1\]\.id: duplicate node id "a1"/],
  ['duplicate edge id', 'before', atlas => { atlas.edges[1].id = atlas.edges[0].id; }, /before\.edges\[1\]\.id: duplicate edge id "e_a1_a2"/],
  ['duplicate uncertainty id', 'after', atlas => { atlas.uncertainties.push({ id: 'u_open' }); }, /after\.uncertainties\[1\]\.id: duplicate uncertainty id "u_open"/],
  ['duplicate conflict id', 'before', atlas => { atlas.conflicts = [{ id: 'c1' }, { id: 'c1' }]; }, /before\.conflicts\[1\]\.id: duplicate conflict id "c1"/],
  ['empty node id', 'before', atlas => { atlas.nodes[0].id = ''; }, /before\.nodes\[0\]\.id: expected a nonempty string/],
  ['nonstring node id', 'after', atlas => { atlas.nodes[0].id = 7; }, /after\.nodes\[0\]\.id: expected a nonempty string/],
  ['empty condition id', 'before', atlas => { atlas.conditions[0].id = ''; }, /before\.conditions\[0\]\.id: expected a nonempty string/],
  ['nonobject chapter entry', 'after', atlas => { atlas.chapters[1] = 42; }, /after\.chapters\[1\]: expected an object/],
  ['null edge entry', 'before', atlas => { atlas.edges[0] = null; }, /before\.edges\[0\]: expected an object/],
  ['undefined uncertainty entry', 'before', atlas => { atlas.uncertainties[0] = undefined; }, /before\.uncertainties\[0\]: expected an object/],
  ['refs not an object', 'before', atlas => { atlas.refs = ['s1']; }, /before\.refs: expected an object/],
  ['missing refs', 'after', atlas => { delete atlas.refs; }, /after\.refs: expected an object/],
  ['detail not an object', 'after', atlas => { atlas.detail = null; }, /after\.detail: expected an object/],
  ['meta not an object', 'before', atlas => { atlas.meta = []; }, /before\.meta: expected an object/],
  ['canvas not an object', 'after', atlas => { atlas.canvas = 'x'; }, /after\.canvas: expected an object/]
]) test(`reject ${name} on the ${side} side`, () => expectReject(side, mutate, expected));

for (const key of ARRAY_KEYS) {
  test(`reject sparse-array hole in ${key} on the after side`, () => {
    expectReject('after', atlas => { atlas[key] = new Array(1); },
      new RegExp(`after\\.${key}\\[0\\]: expected an object, found a sparse array hole`));
  });
}

test('reject holes sitting between valid entries on the before side', () => {
  expectReject('before', atlas => {
    const nodes = new Array(3);
    nodes[0] = atlas.nodes[0];
    nodes[2] = atlas.nodes[2];
    atlas.nodes = nodes;
  }, /before\.nodes\[1\]: expected an object, found a sparse array hole/);
});

test('reject unsupported atlas sections instead of silently hiding changes', () => {
  for (const side of ['before', 'after']) {
    expectReject(side, atlas => { atlas.reviewNote = 'new provenance'; },
      new RegExp(`${side}\\.reviewNote: unsupported atlas field`));
  }
});

test('identical current canonical source yields hasChanges false', () => {
  compileSource(source, ledger);
  const before = structuredClone(source.atlas);
  const report = buildAtlasDiff(source.atlas, structuredClone(source.atlas));
  assert.deepEqual(source.atlas, before);
  assert.equal(report.format, 'ra9-atlas.semantic-diff');
  assert.equal(report.version, 1);
  assert.equal(report.hasChanges, false);
  assert.equal(report.note, NOTE);
  for (const key of ARRAY_KEYS) {
    assert.deepEqual(report.collections[key], { added: [], removed: [], changed: [], reordered: false }, key);
  }
  assert.deepEqual(report.refs, { added: [], removed: [], changed: [] });
  assert.deepEqual(report.detail, { added: [], removed: [], changed: [] });
  assert.deepEqual(report.meta, { changed: [] });
  assert.deepEqual(report.canvas, { changed: [] });
  assert.deepEqual(report.legacyIndexChanges, { nodes: [], edges: [] });
});

test('markdown renders summary table, every collection section and limits', () => {
  const markdown = renderMarkdown(buildAtlasDiff(makeBefore(), makeAfter()));
  assert.ok(markdown.startsWith('# Atlas semantic diff\n'));
  assert.ok(markdown.endsWith('\n'));
  assert.match(markdown, /- Has changes: yes/);
  assert.match(markdown, /\| chapters \| 1 \| 1 \| 1 \| no \|/);
  assert.match(markdown, /\| nodes \| 1 \| 1 \| 1 \| no \|/);
  assert.match(markdown, /\| edges \| 1 \| 0 \| 1 \| no \|/);
  assert.match(markdown, /\| conditions \| 0 \| 0 \| 1 \| no \|/);
  assert.match(markdown, /\| uncertainties \| 0 \| 0 \| 1 \| no \|/);
  assert.match(markdown, /\| conflicts \| 0 \| 0 \| 0 \| no \|/);
  for (const key of ARRAY_KEYS) assert.ok(markdown.includes(`### ${key}\n`), `section ${key}`);
  assert.ok(markdown.includes('- Added IDs: gamma'));
  assert.ok(markdown.includes('- Removed IDs: beta'));
  assert.ok(markdown.includes('| alpha | coverage |'));
  assert.ok(markdown.includes('| a1 | src |'));
  assert.ok(markdown.includes('| e_a2_b1 | kind, note, replacedBy |'));
  assert.match(markdown, /## Metadata changes/);
  assert.ok(markdown.includes('- meta changed top-level fields: (none)'));
  assert.ok(markdown.includes('- canvas changed top-level fields: height'));
  assert.match(markdown, /## Reference changes \(refs\)/);
  assert.ok(markdown.includes('- Added keys: s3'));
  assert.ok(markdown.includes('- Removed keys: s1'));
  assert.ok(markdown.includes(`| s2 | ${VALUE_CHANGED} |`));
  assert.match(markdown, /## Detail changes \(detail\)/);
  assert.ok(markdown.includes('- Added keys: n_new'));
  assert.ok(markdown.includes('- Removed keys: b1'));
  assert.ok(markdown.includes('| a1 | summary |'));
  assert.match(markdown, /## Legacy index movements/);
  assert.ok(markdown.includes('No retained node or edge ID changed its array index.'));
  assert.match(markdown, /## Limits/);
  assert.ok(markdown.includes(`- ${NOTE}`));
  assert.match(markdown, /reordered.* IDs common to both arrays/);
  assert.match(markdown, /Neither snapshot is preferred/);
});

test('markdown renders legacy index movements and an empty diff reads cleanly', () => {
  const before = makeBefore();
  const after = makeBefore();
  before.nodes = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }];
  after.nodes = [{ id: 'n3' }, { id: 'n1' }, { id: 'n2' }];
  const markdown = renderMarkdown(buildAtlasDiff(before, after));
  assert.ok(markdown.includes('| nodes | n1 | 0 | 1 |'));
  assert.ok(markdown.includes('| nodes | n2 | 1 | 2 |'));
  assert.ok(markdown.includes('| nodes | n3 | 2 | 0 |'));
  assert.ok(markdown.includes('- Reordered: yes'));

  const equal = renderMarkdown(buildAtlasDiff(makeBefore(), makeBefore()));
  assert.match(equal, /- Has changes: no/);
  assert.ok(equal.includes('- Added IDs: (none)'));
  assert.ok(equal.includes('- Removed IDs: (none)'));
  assert.ok(equal.includes('- Changed entries: (none)'));
  assert.ok(equal.includes('- Changed keys: (none)'));
  assert.ok(equal.endsWith('\n'));
});

test('markdown escapes hostile declared values and only emits its own <br>', () => {
  const before = makeBefore();
  const after = makeAfter();
  const hostileId = 'tick|et\\<id>&x\nsecond line';
  before.nodes[0].id = hostileId;
  after.nodes[0].id = hostileId;
  after.nodes[0]['we|ird'] = true;
  after.nodes.push({ id: 'new<br>&<i>', chapter: 'gamma' });
  const markdown = renderMarkdown(buildAtlasDiff(before, after));
  // Hostile ID in a table cell: pipes and backslashes escaped, HTML escaped,
  // CRLF/LF converted only after escaping, to the reporter's own <br>.
  assert.ok(markdown.includes('| tick\\|et\\\\&lt;id&gt;&amp;x<br>second line | src, we\\|ird |'));
  // Hostile added ID in list context: HTML escaped inline.
  assert.ok(markdown.includes('n_new, new&lt;br&gt;&amp;&lt;i&gt;'));
  // Once our own <br> tags are removed, no raw input markup survives.
  const stripped = markdown.replace(/<br>/g, '');
  assert.ok(!stripped.includes('<'));
  assert.ok(!stripped.includes('>'));
  assert.ok(markdown.endsWith('\n'));
});

test('requiring the module has no CLI side effects', () => {
  const run = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(cliPath)})`], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  assert.equal(run.stderr, '');
});

const cli = (...args) => spawnSync(process.execPath, [cliPath, ...args], { cwd: root, encoding: 'utf8' });

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ra9-atlas-diff-test-'));
try {
  const beforeSrc = path.join(temp, 'before-source.json');
  const beforeLedger = path.join(temp, 'before-ledger.json');
  const afterSrc = path.join(temp, 'after-source.json');
  const afterLedger = path.join(temp, 'after-ledger.json');
  fs.writeFileSync(beforeSrc, JSON.stringify(source));
  fs.writeFileSync(beforeLedger, JSON.stringify(ledger));
  const changedSource = structuredClone(source);
  const changedRef = Object.keys(changedSource.atlas.refs)[0];
  changedSource.atlas.refs[changedRef] = `${changedSource.atlas.refs[changedRef]}?atlas-diff=1`;
  fs.writeFileSync(afterSrc, JSON.stringify(changedSource));
  fs.writeFileSync(afterLedger, JSON.stringify(ledger));
  const four = ['--before-source', beforeSrc, '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', afterLedger];
  const equalFour = ['--before-source', beforeSrc, '--before-ledger', beforeLedger, '--after-source', beforeSrc, '--after-ledger', beforeLedger];
  const snapshot = file => ({ text: fs.readFileSync(file, 'utf8'), mtime: fs.statSync(file).mtimeMs });

  test('cli json exits 0 for a changed pair and matches the module', () => {
    const run = cli(...four);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stderr, '');
    const report = JSON.parse(run.stdout);
    assert.equal(report.format, 'ra9-atlas.semantic-diff');
    assert.equal(report.version, 1);
    assert.equal(report.hasChanges, true);
    assert.deepEqual(report.refs.changed, [{ key: changedRef, fields: [VALUE_CHANGED] }]);
    assert.deepEqual(report, buildAtlasDiff(source.atlas, changedSource.atlas));
  });

  test('cli json exits 0 for an identical canonical pair with hasChanges false', () => {
    const run = cli(...equalFour);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stderr, '');
    const report = JSON.parse(run.stdout);
    assert.equal(report.hasChanges, false);
    assert.deepEqual(report, buildAtlasDiff(source.atlas, source.atlas));
  });

  test('cli output is deterministic and free of absolute paths', () => {
    const first = cli(...four);
    const second = cli(...four);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(first.stdout, second.stdout);
    assert.ok(!first.stdout.includes(root));
    assert.ok(!first.stdout.includes(temp));
    const markdown = cli('--markdown', ...four);
    assert.equal(markdown.status, 0, markdown.stderr);
    assert.equal(markdown.stdout, cli('--markdown', ...four).stdout);
    assert.ok(!markdown.stdout.includes(root));
    assert.ok(!markdown.stdout.includes(temp));
  });

  test('cli markdown renders every section, movements and limits', () => {
    const run = cli('--markdown', ...four);
    assert.equal(run.status, 0, run.stderr);
    const markdown = run.stdout;
    assert.ok(markdown.startsWith('# Atlas semantic diff\n'));
    assert.ok(markdown.endsWith('\n'));
    for (const heading of ['# Atlas semantic diff', '## Keyed collections', '### chapters', '### nodes',
      '### edges', '### conditions', '### uncertainties', '### conflicts', '## Metadata changes',
      '## Reference changes (refs)', '## Detail changes (detail)', '## Legacy index movements', '## Limits']) {
      assert.ok(markdown.includes(heading), heading);
    }
    assert.ok(markdown.includes(`- ${NOTE}`));
    assert.match(markdown, /Structural differences only/);
    assert.match(markdown, /release readiness/);
    assert.match(markdown, /- Has changes: yes/);
  });

  test('reject unknown flags, missing values and missing required flags', () => {
    for (const args of [
      [],
      ['--verbose'],
      ['--markdown=true'],
      ['--before-source'],
      ['--before-source', '--before-ledger', 'b.json', '--after-source', 'a.json', '--after-ledger', 'c.json'],
      ['--before-source', 'a.json'],
      ['--before-source', 'a.json', '--before-ledger', 'b.json', '--after-source', 'a.json']
    ]) {
      const run = cli(...args);
      assert.notEqual(run.status, 0, args.join(' '));
      assert.equal(run.stdout, '');
      assert.match(run.stderr, /Unknown flag|Missing value|Missing required flag/);
    }
    assert.match(cli().stderr, /Missing required flag: --before-source/);
    assert.match(cli('--verbose').stderr, /Unknown flag: --verbose/);
    assert.match(cli('--before-source').stderr, /Missing value for --before-source/);
    assert.match(
      cli('--before-source', '--after-source', 'a.json', '--before-ledger', 'b.json', '--after-ledger', 'c.json').stderr,
      /Missing value for --before-source/
    );
    assert.match(
      cli('--before-source', 'a.json', '--before-ledger', 'b.json', '--after-source', 'a.json').stderr,
      /Missing required flag: --after-ledger/
    );
  });

  test('missing and unreadable files fail cleanly with no report stdout', () => {
    const absent = path.join(temp, 'absent.json');
    for (const [args, pattern] of [
      [['--before-source', absent, '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', afterLedger], /Cannot read before source file/],
      [['--before-source', beforeSrc, '--before-ledger', absent, '--after-source', afterSrc, '--after-ledger', afterLedger], /Cannot read before ledger file/],
      [['--before-source', beforeSrc, '--before-ledger', beforeLedger, '--after-source', absent, '--after-ledger', afterLedger], /Cannot read after source file/],
      [['--before-source', beforeSrc, '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', absent], /Cannot read after ledger file/]
    ]) {
      const run = cli(...args);
      assert.notEqual(run.status, 0, args.join(' '));
      assert.match(run.stderr, pattern);
      assert.equal(run.stdout, '');
    }
  });

  test('invalid json and invalid envelopes fail on both sides', () => {
    const broken = path.join(temp, 'broken.json');
    fs.writeFileSync(broken, '{not json');
    const badJson = cli('--before-source', broken, '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', afterLedger);
    assert.notEqual(badJson.status, 0);
    assert.match(badJson.stderr, /before source file is not valid JSON/);
    assert.equal(badJson.stdout, '');
    fs.rmSync(broken);

    const badEnvelope = path.join(temp, 'bad-envelope.json');
    fs.writeFileSync(badEnvelope, '{}');
    const badBefore = cli('--before-source', badEnvelope, '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', afterLedger);
    assert.notEqual(badBefore.status, 0);
    assert.match(badBefore.stderr, /before snapshot failed validation: source: expected fields format, version, atlas/);
    assert.equal(badBefore.stdout, '');
    const badAfter = cli('--before-source', beforeSrc, '--before-ledger', beforeLedger, '--after-source', badEnvelope, '--after-ledger', afterLedger);
    assert.notEqual(badAfter.status, 0);
    assert.match(badAfter.stderr, /after snapshot failed validation: source: expected fields format, version, atlas/);
    assert.equal(badAfter.stdout, '');
    fs.rmSync(badEnvelope);
  });

  test('stale before and after ledgers are rejected before diffing', () => {
    const staleBefore = structuredClone(ledger);
    staleBefore.nodes[0] = 'stale-node';
    const staleBeforePath = path.join(temp, 'stale-before-ledger.json');
    fs.writeFileSync(staleBeforePath, JSON.stringify(staleBefore));
    const beforeRun = cli('--before-source', beforeSrc, '--before-ledger', staleBeforePath, '--after-source', afterSrc, '--after-ledger', afterLedger);
    assert.notEqual(beforeRun.status, 0);
    assert.match(beforeRun.stderr, /before snapshot failed validation: Node ledger mismatch at 0/);
    assert.equal(beforeRun.stdout, '');

    const staleAfter = structuredClone(ledger);
    staleAfter.edges[0].id = 'stale-edge';
    const staleAfterPath = path.join(temp, 'stale-after-ledger.json');
    fs.writeFileSync(staleAfterPath, JSON.stringify(staleAfter));
    const afterRun = cli('--before-source', beforeSrc, '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', staleAfterPath);
    assert.notEqual(afterRun.status, 0);
    assert.match(afterRun.stderr, /after snapshot failed validation: Edge ledger mismatch at 0/);
    assert.equal(afterRun.stdout, '');
    fs.rmSync(staleBeforePath);
    fs.rmSync(staleAfterPath);
  });

  test('cli rejects unknown canonical atlas sections on either side', () => {
    const extra = structuredClone(source);
    extra.atlas.reviewNote = 'new provenance';
    // Prove the existing compiler accepts the extension: the diff must fail
    // closed rather than claim these independently valid snapshots are equal.
    compileSource(extra, ledger);
    const extraPath = path.join(temp, 'extra-source.json');
    fs.writeFileSync(extraPath, JSON.stringify(extra));
    for (const side of ['before', 'after']) {
      const args = [...equalFour];
      args[side === 'before' ? 1 : 5] = extraPath;
      const run = cli(...args);
      assert.notEqual(run.status, 0, side);
      assert.equal(run.stdout, '');
      assert.match(run.stderr, new RegExp(`${side}\\.reviewNote: unsupported atlas field`));
    }
    fs.rmSync(extraPath);
  });

  test('cli never writes inputs, generated artifacts or report files', () => {
    const files = [beforeSrc, beforeLedger, afterSrc, afterLedger,
      path.join(root, 'data/atlas.source.json'),
      path.join(root, 'data/legacy-index.json'),
      path.join(root, 'prototype/atlas-data.js')];
    const before = files.map(snapshot);
    assert.equal(cli(...four).status, 0);
    assert.equal(cli('--markdown', ...four).status, 0);
    assert.equal(cli(...equalFour).status, 0);
    assert.notEqual(cli('--before-source', path.join(temp, 'absent.json'), '--before-ledger', beforeLedger, '--after-source', afterSrc, '--after-ledger', afterLedger).status, 0);
    assert.deepEqual(files.map(snapshot), before);
    assert.deepEqual(fs.readdirSync(temp).sort(), ['after-ledger.json', 'after-source.json', 'before-ledger.json', 'before-source.json']);
  });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log(`${count} atlas-diff tests passed`);
