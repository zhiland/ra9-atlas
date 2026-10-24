'use strict';

// Regression expectations from the bounded source review, not gameplay proof.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { readPacket, validatePacket } = require('../prototype/validate-chapter-packet');
const file = path.resolve(__dirname, '../packets/shades-of-color.packet.json');
const packet = readPacket(file);
const expectedNodes = {
  sc_park: 'WALKING IN THE PARK',
  sc_secret: 'READ "SECRET OF ANDROIDS"',
  sc_climate: 'READ "CLIMATE CHANGE-UP"',
  sc_vendor: 'STARE AT HOT DOG VENDOR',
  sc_pushed: 'HOT DOG VENDOR PUSHES MARKUS',
  sc_busker: 'LISTEN TO BUSKER',
  sc_preacher: 'WATCH PREACHER',
  sc_yells: 'PREACHER YELLS AT MARKUS',
  sc_store: 'VISIT PAINTS STORE',
  sc_package: 'COLLECT PACKAGE',
  sc_protesters: 'PROTESTERS HARASS MARKUS',
  sc_bus: 'MARKUS TOOK THE BUS'
};
const expectedEdges = [
  ['e_sc_park_store', 'sc_park', 'sc_store'],
  ['e_sc_store_package', 'sc_store', 'sc_package'],
  ['e_sc_package_bus', 'sc_package', 'sc_bus'],
  ['e_sc_vendor_push', 'sc_vendor', 'sc_pushed'],
  ['e_sc_preacher_yells', 'sc_preacher', 'sc_yells']
];
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
test('reviewed source packet passes generic structural validation', () => {
  const result = validatePacket(packet, { atlas: require('../data/atlas.source.json').atlas });
  assert.equal(result.failed, false, result.errors.join('\n'));
  assert.equal(result.reviewReady, false);
});
test('all twelve visible boxes retain exact labels', () => {
  assert.deepEqual(Object.fromEntries(packet.chart.nodes.map(node => [node.id, node.label])), expectedNodes);
  assert.equal(packet.chart.nodes.find(node => node.id === 'sc_park').kind, 'stage');
  assert.equal(packet.chart.nodes.find(node => node.id === 'sc_bus').kind, 'outcome');
});
test('only five continuously pictured box-to-box connectors are graph edges', () => {
  assert.deepEqual(packet.chart.edges.map(edge => [edge.id, edge.from, edge.to]), expectedEdges);
  assert.ok(packet.chart.edges.every(edge => edge.kind === 'traced' && edge.sources.includes('steamShades')));
});
test('detached icon fragments retain unknown origins instead of invented stage edges', () => {
  const unknown = packet.unknowns.find(item => item.id === 'u_sc_detached_origins');
  assert.ok(unknown);
  assert.deepEqual([...unknown.nodes].sort(), ['sc_secret','sc_climate','sc_vendor','sc_busker','sc_preacher','sc_protesters'].sort());
  assert.match(unknown.explanation, /six|6/i);
  assert.match(unknown.explanation, /five|5/i);
});
test('runtime reconciliation appends identities without guide-derived topology', () => {
  assert.equal(packet.atlas.chapterId, 'shades-of-color');
  assert.equal(packet.atlas.exactChapterNodes, true); assert.equal(packet.atlas.exactChapterEdges, true);
  assert.equal(packet.legacy.canonical, '?edge=N');
  assert.deepEqual(packet.conditions, []); assert.deepEqual(packet.supplementary, []);
  assert.equal(packet.coverage.status, 'partial');
  assert.deepEqual(packet.chart.edges.map(edge => edge.legacyEdgeIndex), [96, 97, 98, 99, 100]);
  assert.ok(packet.sources.every(source => source.rights.state === 'reference-only'));
});
test('source approval remains separate from publication and review-required CLI', () => {
  assert.equal(packet.review.independent.state, 'approved');
  assert.equal(packet.review.mergeGate.state, 'blocked');
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../prototype/validate-chapter-packet.js'), file, '--require-review'], { encoding:'utf8' });
  assert.equal(result.status, 2, result.stderr + result.stdout);
});
console.log(`${count} Shades packet tests passed`);
