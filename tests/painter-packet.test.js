'use strict';

// Expectations pin a source-reviewed slice, not gameplay or complete coverage.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { readPacket, validatePacket } = require('../prototype/validate-chapter-packet');
const file = path.resolve(__dirname, '../packets/the-painter.packet.json');
const packet = readPacket(file);
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }

test('bounded packet validates without runtime reconciliation or publication approval', () => {
  const result = validatePacket(packet, { atlas: require('../data/atlas.source.json').atlas });
  assert.equal(result.failed, false, result.errors.join('\n'));
  assert.equal(result.reviewReady, false);
  assert.equal(packet.coverage.status, 'partial');
  assert.equal(packet.atlas, undefined);
  assert.equal(packet.legacy, undefined);
});
test('opening scope preserves nine exact labels and two checkpoint kinds', () => {
  assert.deepEqual(packet.chart.nodes.map(node => [node.id, node.label, node.kind]), [
    ['pt_arrive', 'ARRIVING HOME', 'stage'],
    ['pt_package', 'DROP OFF PACKAGE', 'action'],
    ['pt_wake', 'WAKE CARL', 'action'],
    ['pt_breakfast', 'SERVE BREAKFAST', 'action'],
    ['pt_clothes', "CARL NOTICES MARKUS' CLOTHES", 'action'],
    ['pt_birds', 'ACTIVATE BIRDS', 'action'],
    ['pt_north', 'READ "NORTH POLE RUSSIA"', 'action'],
    ['pt_titan', 'READ "LIFE ON TITAN"', 'action'],
    ['pt_find', 'FIND SOMETHING TO DO', 'stage']
  ]);
});
test('five continuous traces include Wake to clothes without guessed optional or cross-chapter links', () => {
  assert.deepEqual(packet.chart.edges.map(edge => [edge.id, edge.from, edge.to]), [
    ['e_pt_arrive_package', 'pt_arrive', 'pt_package'],
    ['e_pt_package_wake', 'pt_package', 'pt_wake'],
    ['e_pt_wake_breakfast', 'pt_wake', 'pt_breakfast'],
    ['e_pt_wake_clothes', 'pt_wake', 'pt_clothes'],
    ['e_pt_breakfast_find', 'pt_breakfast', 'pt_find']
  ]);
  for (const edge of packet.chart.edges) {
    assert.equal(edge.kind, 'traced');
    assert.deepEqual(edge.sources, ['steamPainter']);
    assert.equal(edge.option, undefined);
    assert.equal(edge.legacyEdgeIndex, undefined);
  }
  assert.deepEqual(packet.conditions, []);
  assert.deepEqual(packet.supplementary, []);
});
test('three detached targets remain sourced unknowns, with build/order/eligibility gaps retained', () => {
  assert.equal(packet.unknowns.length, 4);
  const origin = packet.unknowns.find(item => item.id === 'u_pt_detached_origins');
  assert.ok(origin);
  assert.deepEqual([...origin.nodes].sort(), ['pt_birds', 'pt_north', 'pt_titan']);
  assert.ok(origin.sources.includes('steamPainter'));
  for (const id of ['u_pt_order', 'u_pt_clothes', 'u_pt_build']) {
    const item = packet.unknowns.find(item => item.id === id);
    assert.ok(item, id);
    assert.equal(item.status, 'unknown');
    assert.ok(item.sources.length > 0);
  }
});
test('worker access is distinct from direct parent inspection and reference-only rights', () => {
  for (const source of packet.sources) {
    assert.equal(source.rights.state, 'reference-only');
    assert.ok(source.access.some(item => item.actor === 'extraction worker' && item.outcome === 'not-accessed'));
    assert.ok(source.access.some(item => item.actor === 'Codex extraction parent' && item.outcome === 'inspected'));
  }
});
test('independent source approval does not open the publication gate', () => {
  assert.equal(packet.packetStatus, 'reviewed');
  assert.equal(packet.review.independent.state, 'approved');
  assert.equal(packet.review.mergeGate.state, 'blocked');
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../prototype/validate-chapter-packet.js'), file, '--require-review'], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr + result.stdout);
});
console.log(`${count} Painter packet tests passed`);
