'use strict';
const assert = require('node:assert/strict');
const { painterRuntimeErrors } = require('../prototype/validate-painter-runtime');
const { validateAtlas } = require('../prototype/validate-atlas-data');
const atlas = require('../data/atlas.source.json').atlas;
const ledger = require('../data/legacy-index.json');
const before = require('./fixtures/pre-painter-identity.json');
const packet = require('../packets/the-painter.packet.json');
const clone = value => structuredClone(value);
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
function rejects(name, mutate) { test(name, () => { const copy = clone(atlas); mutate(copy); assert.ok(painterRuntimeErrors(copy).length, name); }); }
test('real reviewed slice passes bounded and complete atlas validators', () => {
  assert.deepEqual(painterRuntimeErrors(atlas), []);
  const result = validateAtlas(atlas); assert.equal(result.failed, false, result.checks.flatMap(c => c.errors).join('\n'));
});
test('published identity and index prefixes are frozen at PR29 base', () => {
  assert.deepEqual(ledger.nodes.slice(0, 114), before.nodes);
  assert.deepEqual(ledger.edges.slice(0, 101), before.edges);
  assert.deepEqual(atlas.nodes.slice(0, 114).map(n => n.id), before.nodes);
  assert.deepEqual(atlas.edges.slice(0, 101).map(e => ({id:e.id,from:e.from,to:e.to,fromOption:e.fromOption ?? null})), before.edges);
  assert.equal(atlas.edges[2].kind, 'withdrawn'); assert.equal(atlas.edges[6].kind, 'withdrawn');
});
test('new nodes and edges append in reviewed packet order', () => {
  assert.deepEqual(atlas.nodes.slice(114,123).map(n => n.id), packet.chart.nodes.map(n => n.id));
  assert.deepEqual(atlas.edges.slice(101,106).map(e => e.id), packet.chart.edges.map(e => e.id));
  assert.deepEqual(packet.chart.edges.map(e => e.legacyEdgeIndex), [101,102,103,104,105]);
  assert.equal(atlas.meta.counts.activeEdges, 111); assert.equal(atlas.meta.counts.chapters, 7);
});
test('source unknowns and guide citation survive integration without new claims', () => {
  const expected = clone(packet.unknowns);
  for (const record of expected) for (const key of ['nodes','edges']) if (!record[key]?.length) delete record[key];
  assert.deepEqual(atlas.uncertainties.slice(14,18), expected);
  assert.ok(atlas.detail.pt_clothes.src.includes('powerpyxPainter'));
  assert.equal(packet.review.mergeGate.state, 'blocked');
});
for (const [name, mutate] of [
  ['label', n => { n.label = 'Unsupported label'; }],
  ['kind', n => { n.kind = 'choice'; }],
  ['status', n => { n.status = 'guide'; }],
  ['source', n => { n.src = ['powerpyxPainter']; }]
]) rejects(`reject changed node ${name}`, a => mutate(a.nodes.find(n => n.id === 'pt_birds')));
rejects('reject missing node', a => { a.nodes = a.nodes.filter(n => n.id !== 'pt_titan'); });
rejects('reject missing edge', a => { a.edges = a.edges.filter(e => e.id !== 'e_pt_arrive_package'); });
rejects('reject wrong endpoint', a => { a.edges.find(e => e.id === 'e_pt_arrive_package').to = 'pt_find'; });
rejects('reject changed edge source', a => { a.edges.find(e => e.id === 'e_pt_arrive_package').src = ['powerpyxPainter']; });
rejects('reject option zero', a => { a.edges.find(e => e.id === 'e_pt_arrive_package').fromOption = 0; });
for (const [from,to] of [['pt_arrive','pt_birds'],['pt_clothes','pt_find'],['sc_protesters','pt_clothes']]) {
  rejects(`reject invented connector ${from}->${to}`, a => { a.edges.push({id:'invented',from,to,kind:'traced',src:['steamPainter']}); });
}
rejects('reject coverage promotion', a => { a.chapters.find(c => c.id === 'the-painter').coverage.status = 'checked-against-chart'; });
rejects('reject missing unknown', a => { a.uncertainties = a.uncertainties.filter(u => u.id !== 'u_pt_order'); });
rejects('reject lost detached reference', a => { a.uncertainties.find(u => u.id === 'u_pt_detached_origins').nodes.pop(); });
rejects('reject new eligibility gate', a => { a.conditions.push({id:'invented',appliesTo:['e_pt_arrive_package']}); });
test('missing chapter or collections returns errors', () => { assert.ok(painterRuntimeErrors({}).length); assert.ok(painterRuntimeErrors(null).length); });
console.log(`${count} Painter runtime tests passed`);
