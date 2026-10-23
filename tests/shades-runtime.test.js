'use strict';
const assert = require('node:assert/strict');
const { shadesRuntimeErrors } = require('../prototype/validate-shades-runtime');
const { validateAtlas } = require('../prototype/validate-atlas-data');
const atlas = require('../data/atlas.source.json').atlas;
const ledger = require('../data/legacy-index.json');
const before = require('./fixtures/pre-shades-identity.json');
const packet = require('../packets/shades-of-color.packet.json');
const clone = value => structuredClone(value);
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
function rejects(name, mutate) { test(name, () => { const copy = clone(atlas); mutate(copy); assert.ok(shadesRuntimeErrors(copy).length, name); }); }
test('real reviewed slice passes bounded and complete atlas validators', () => {
  assert.deepEqual(shadesRuntimeErrors(atlas), []);
  const result = validateAtlas(atlas); assert.equal(result.failed, false, result.checks.flatMap(c => c.errors).join('\n'));
});
test('published identity and index prefixes are frozen at PR27 base', () => {
  assert.deepEqual(ledger.nodes.slice(0, 102), before.nodes);
  assert.deepEqual(ledger.edges.slice(0, 96), before.edges);
  assert.deepEqual(atlas.nodes.slice(0, 102).map(n => n.id), before.nodes);
  assert.deepEqual(atlas.edges.slice(0, 96).map(e => ({id:e.id,from:e.from,to:e.to,fromOption:e.fromOption ?? null})), before.edges);
  assert.equal(atlas.edges[2].kind, 'withdrawn'); assert.equal(atlas.edges[6].kind, 'withdrawn');
});
test('new nodes and edges append in reviewed packet order', () => {
  assert.deepEqual(atlas.nodes.slice(102, 114).map(n => n.id), packet.chart.nodes.map(n => n.id));
  assert.deepEqual(atlas.edges.slice(96, 101).map(e => e.id), packet.chart.edges.map(e => e.id));
  assert.deepEqual(packet.chart.edges.map(e => e.legacyEdgeIndex), [96,97,98,99,100]);
  assert.equal(atlas.meta.counts.activeEdges, 104); assert.equal(atlas.meta.counts.chapters, 7);
});
test('source unknowns and guide citation survive integration without new claims', () => {
  const expected = clone(packet.unknowns);
  for (const record of expected) for (const key of ['nodes','edges']) if (!record[key]?.length) delete record[key];
  assert.deepEqual(atlas.uncertainties.slice(10, 14), expected);
  assert.ok(atlas.detail.sc_protesters.src.includes('powerpyxShades'));
  assert.equal(packet.review.mergeGate.state, 'blocked');
});
for (const [name, mutate] of [
  ['label', n => { n.label = 'Unsupported label'; }],
  ['kind', n => { n.kind = 'choice'; }],
  ['status', n => { n.status = 'guide'; }],
  ['source', n => { n.src = ['powerpyxShades']; }]
]) rejects(`reject changed node ${name}`, a => mutate(a.nodes.find(n => n.id === 'sc_preacher')));
rejects('reject missing node', a => { a.nodes = a.nodes.filter(n => n.id !== 'sc_busker'); });
rejects('reject missing edge', a => { a.edges = a.edges.filter(e => e.id !== 'e_sc_park_store'); });
rejects('reject wrong endpoint', a => { a.edges.find(e => e.id === 'e_sc_park_store').to = 'sc_bus'; });
rejects('reject changed edge source', a => { a.edges.find(e => e.id === 'e_sc_park_store').src = ['powerpyxShades']; });
rejects('reject option zero', a => { a.edges.find(e => e.id === 'e_sc_park_store').fromOption = 0; });
for (const [from,to] of [['sc_park','sc_preacher'],['sc_protesters','sc_bus'],['sc_bus','a_welcome']]) {
  rejects(`reject invented connector ${from}->${to}`, a => { a.edges.push({id:'invented',from,to,kind:'traced',src:['steamShades']}); });
}
rejects('reject coverage promotion', a => { a.chapters.find(c => c.id === 'shades-of-color').coverage.status = 'checked-against-chart'; });
rejects('reject missing unknown', a => { a.uncertainties = a.uncertainties.filter(u => u.id !== 'u_sc_order'); });
rejects('reject lost detached reference', a => { a.uncertainties.find(u => u.id === 'u_sc_detached_origins').nodes.pop(); });
rejects('reject new eligibility gate', a => { a.conditions.push({id:'invented',appliesTo:['e_sc_park_store']}); });
test('missing chapter or collections returns errors', () => { assert.ok(shadesRuntimeErrors({}).length); assert.ok(shadesRuntimeErrors(null).length); });
console.log(`${count} Shades runtime tests passed`);
