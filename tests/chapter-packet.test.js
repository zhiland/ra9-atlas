#!/usr/bin/env node
/* Chapter-preparation packet checks.
   Run: node tests/chapter-packet.test.js   (npm run test:packet)

   The real Hostage packet must pass structural validation and reconcile to the
   current ATLAS chapter. Pilot counts and exact label/edge expectations live in
   tests/fixtures/hostage-pilot-expectations.json, not in the generic validator.
   Malformed copies must fail for each documented structural error class. These
   checks do not verify a game claim, source independence, or rights clearance. */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readAtlasData } = require('../prototype/validate-atlas-data.js');
const { validatePacket, createDraftPacket, readPacket } = require('../prototype/validate-chapter-packet.js');

const root = path.join(__dirname, '..');
const atlasFile = path.join(root, 'prototype', 'atlas-data.js');
const packetFile = path.join(root, 'packets', 'hostage.packet.json');
const templateFile = path.join(root, 'packets', 'chapter-template.json');
const fixtureFile = path.join(root, 'tests', 'fixtures', 'hostage-pilot-expectations.json');

const ATLAS = readAtlasData(atlasFile);
const packet = readPacket(packetFile);
const template = readPacket(templateFile);
const pilot = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));

const load = function (file, name) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  return new Function(source + '\nreturn ' + name + ';')();
};
const CORE = load('prototype/atlas-core.js', 'ATLAS_CORE');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok    ' + name);
  } catch (error) {
    failed++;
    console.log('  FAIL  ' + name + '\n        ' + error.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

function eq(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error((message || 'not equal') + ': ' + a + ' !== ' + b);
}

const chartNodes = packet.chart.nodes;
const chartEdges = packet.chart.edges;
const visibleLabels = chartNodes.flatMap(node => node.kind === 'choice' ? node.options : [node.label]);
const packetEdges = chartEdges.concat(packet.supplementary.flatMap(item => item.edges));
const nodeById = new Map(chartNodes.map(node => [node.id, node]));

function rejects(name, mutate, pattern) {
  check(name, () => {
    const copy = clone(packet);
    mutate(copy);
    const result = validatePacket(copy, { atlas: ATLAS });
    assert(result.failed, 'validator accepted the malformed fixture');
    assert(result.errors.some(error => pattern.test(error)),
      'no error matched ' + pattern + '\n        ' + result.errors.join('\n        '));
  });
}

console.log('chapter packet — real Hostage pilot');
check('the real Hostage packet passes structural and ATLAS reconciliation', () => {
  const result = validatePacket(clone(packet), { atlas: ATLAS });
  assert(!result.failed, result.errors.join('\n        '));
  eq(result.counts.chartNodes, pilot.counts.chartNodes);
  eq(result.counts.chartEdges, pilot.counts.chartEdges);
  eq(result.counts.supplementaryEdges, pilot.counts.supplementaryEdges);
  eq(result.counts.conditions, pilot.counts.conditions);
  eq(result.counts.unknowns, pilot.counts.unknowns);
  eq(result.counts.conflicts, pilot.counts.conflicts);
  assert(result.reviewReady === false, 'the pilot must not be review-ready before independent review');
});

check('packet identity, chapter scope and coverage boundary are versioned', () => {
  eq(packet.kind, 'ra9-atlas.chapter-preparation.packet');
  eq(packet.packetVersion, '1.0');
  eq(packet.packetStatus, 'prepared');
  eq(packet.chapter, { id: pilot.chapterId, title: pilot.atlasChapterTitle });
  eq(packet.coverage.status, 'checked-against-chart');
  assert(packet.coverage.scope && packet.coverage.included.length > 0 && packet.coverage.omitted.length > 0,
    'scope, included and omitted coverage are required');
  assert(packet.coverage.omitted.some(item => /in-game verification/i.test(item)), 'gameplay verification must stay omitted');
  assert(packet.coverage.omitted.some(item => /LEAVE WOUNDED COP/i.test(item)), 'the leave-cop boundary must stay omitted');
  assert(packet.coverage.omitted.some(item => /legal clearance|reuse/i.test(item)), 'rights clearance must stay outside the packet claim');
});

check('pilot counts, node IDs, labels and choice options match the regression fixture', () => {
  eq(chartNodes.length, pilot.counts.chartNodes);
  eq(visibleLabels.length, pilot.counts.visibleLabels);
  eq(new Set(visibleLabels).size, pilot.counts.visibleLabels);
  eq(chartEdges.length, pilot.counts.chartEdges);
  eq(chartEdges.filter(edge => edge.kind === 'traced').length, pilot.counts.tracedEdges);
  eq(chartEdges.filter(edge => edge.kind === 'uncertain').length, pilot.counts.uncertainEdges);
  eq(chartNodes.filter(node => node.kind === 'choice').length, pilot.counts.choiceGroups);
  eq(chartNodes.filter(node => node.kind === 'stage').length, pilot.counts.stageContainers);
  eq(chartNodes.filter(node => node.kind === 'outcome').length, pilot.counts.outcomes);
  eq(chartNodes.map(node => node.id), pilot.nodeIds);
  eq(visibleLabels, pilot.visibleLabels);
  eq(packet.supplementary.length, pilot.counts.supplementaryItems);
  eq(packet.supplementary.reduce((sum, item) => sum + item.edges.length, 0), pilot.counts.supplementaryEdges);
  eq(packet.conditions.length, pilot.counts.conditions);
  eq(packet.unknowns.length, pilot.counts.unknowns);
  eq(packet.conflicts.length, pilot.counts.conflicts);
  for (const [id, options] of Object.entries(pilot.choiceOptions)) {
    eq(nodeById.get(id).options, options, id + ' options');
  }
});

check('chart nodes and edges match the actual Hostage ATLAS slice by label and endpoint', () => {
  const atlasNodes = ATLAS.nodes.filter(node => node.chapter === pilot.chapterId);
  const atlasNodeById = new Map(ATLAS.nodes.map(node => [node.id, node]));
  eq(chartNodes.map(node => node.id), atlasNodes.map(node => node.id));
  for (const node of chartNodes) {
    const actual = atlasNodeById.get(node.id);
    assert(actual, node.id + ' missing from ATLAS');
    eq(actual.label, node.label, node.id + ' label');
    eq(actual.kind, node.kind, node.id + ' kind');
    eq(actual.options || null, node.options || null, node.id + ' options');
  }
  for (const edge of chartEdges) {
    const actual = ATLAS.edges.find(candidate => candidate.id === edge.id);
    assert(actual, edge.id + ' missing from ATLAS');
    eq([edge.from, edge.to, edge.kind, edge.fromOption == null ? null : edge.fromOption],
      [actual.from, actual.to, actual.kind, actual.fromOption == null ? null : actual.fromOption],
      edge.id + ' endpoints/kind/option');
    eq(ATLAS.edges.indexOf(actual), edge.legacyEdgeIndex, edge.id + ' array index');
  }
  eq(chartEdges.map(edge => edge.id), pilot.edgeIds);
});

check('the five uncertain Hostage connectors stay uncertain and GET CLOSE ENOUGH stays open-ended', () => {
  const uncertain = chartEdges.filter(edge => edge.kind === 'uncertain');
  eq(uncertain.map(edge => edge.id), pilot.uncertainEdgeIds);
  assert(uncertain.every(edge => /uncertain|ambiguous|not clear|not separable|not confidently|prevents a confident/i.test(edge.note || '')),
    'each uncertain connector needs its chart-uncertainty note');
  assert(!chartEdges.some(edge => edge.from === 'get_close'), 'GET CLOSE ENOUGH must gain no outgoing edge');
  const unknown = packet.unknowns.find(item => item.id === 'u_hostage_chart_uncertain');
  assert(unknown && unknown.status === 'unknown', 'chart uncertainty must stay explicit');
  eq(unknown.edges, pilot.uncertainEdgeIds);
  assert(/chart-transcription uncertainty/i.test(unknown.explanation), 'the unknown must stay scoped to chart transcription');
  assert(!unknown.edges.includes(pilot.savedCop.edgeId), 'chart uncertainty must not absorb the saved-cop prerequisite');
});

check('the saved-cop prerequisite is separate, guide-reported and edge-local', () => {
  assert(!chartEdges.some(edge => edge.id === pilot.savedCop.edgeId), 'the saved-cop edge must not be a chart connector');
  eq(packet.supplementary.map(item => item.id), [pilot.savedCop.supplementId]);
  const item = packet.supplementary[0];
  eq(item.basis, 'guide-reported');
  eq(item.edges.map(edge => edge.id), [pilot.savedCop.edgeId]);
  eq(item.externalNodes.map(node => node.id), [pilot.savedCop.to]);
  const edge = item.edges[0];
  eq([edge.from, edge.fromOption, edge.to, edge.kind, edge.legacyEdgeIndex],
    [pilot.savedCop.from, pilot.savedCop.fromOption, pilot.savedCop.to, pilot.savedCop.kind, pilot.savedCop.legacyEdgeIndex]);
  assert(/guide-reported, not gameplay-verified/i.test(edge.note || ''), 'the saved-cop edge must keep its evidence limit');
  assert(!chartEdges.some(candidate => candidate.from === 'wounded_cop' && candidate.fromOption === 0),
    'LEAVE WOUNDED COP must have no drawn consequence');
  const condition = packet.conditions.find(itemCondition => itemCondition.id === pilot.savedCop.conditionId);
  assert(condition, 'the saved-cop condition is missing');
  eq(condition.appliesTo, pilot.savedCop.edgeId);
  eq([condition.operator, condition.requirements], ['SINGLE', ['SAVE WOUNDED COP was chosen in The Hostage.']]);
  eq(packet.conditions.filter(itemCondition => itemCondition.appliesTo === pilot.savedCop.edgeId).length, 1);
});

check('source locators, separate access outcomes and rights review states are recorded', () => {
  eq(packet.sources.map(source => source.id), ['steamHostageChart', 'powerpyxHostage', 'powerpyxPublicEnemy', 'gamefaqsPublicEnemy']);
  for (const source of packet.sources) {
    assert(/^https?:\/\//.test(source.url), source.id + ' needs an absolute URL');
    assert(source.locator, source.id + ' needs a locator');
    assert(source.access.length > 0, source.id + ' needs an access record');
    eq(source.rights.state, 'reference-only', source.id + ' rights state');
    assert(!/cleared|approved for reuse/i.test(source.rights.state), source.id + ' must not claim clearance');
  }
  const gamefaqs = packet.sources.find(source => source.id === 'gamefaqsPublicEnemy');
  eq(gamefaqs.access.map(access => [access.outcome, access.httpStatus || null]), [['http-error', 403], ['inspected', null]]);
  assert(gamefaqs.access.some(access => /separate reviewer/i.test(access.actor)),
    'the separate reviewer access must stay attributed separately');
});

check('independent review stays pending and distinct from structural validation', () => {
  const result = validatePacket(clone(packet), { atlas: ATLAS });
  assert(result.ok, result.errors.join('\n        '));
  eq(result.review.state, 'pending');
  eq(result.review.mergeGate, 'blocked');
  eq(result.reviewReady, false);
  assert(packet.review.independent.required === true, 'independent review must be required');
  assert(/structural validation/i.test(packet.review.mergeGate.reason), 'the merge gate must distinguish structural checks');
});

check('all claimed ?edge=N indices round-trip through the current runtime core', () => {
  eq(packet.legacy.canonical, '?edge=N');
  for (const edge of packetEdges) {
    const actual = ATLAS.edges[edge.legacyEdgeIndex];
    assert(actual && actual.id === edge.id, edge.id + ' has a stale legacyEdgeIndex');
    const target = ATLAS.nodes.find(node => node.id === actual.to);
    assert(target, actual.to + ' is missing from ATLAS');
    const state = CORE.createState();
    state.consented = true;
    const hash = '#' + target.chapter + '/' + actual.to + '?edge=' + edge.legacyEdgeIndex;
    const applied = CORE.applyHash(state, hash, ATLAS);
    eq(applied.edge, edge.legacyEdgeIndex, edge.id + ' did not resolve by index');
    eq(CORE.hashFor(applied), hash, edge.id + ' did not write the canonical ?edge=N form');
  }
});

console.log('\nchapter packet — reusable draft template');
check('the checked-in template equals the generated draft and is structurally valid', () => {
  eq(template, createDraftPacket('replace-with-chapter-id', 'Replace with chapter title'));
  const result = validatePacket(clone(template));
  assert(!result.failed, result.errors.join('\n        '));
  eq(template.packetStatus, 'draft');
  eq(template.coverage.status, 'not-added');
  eq(template.sources, []);
  eq(result.reviewReady, false);
  assert(result.warnings.some(warning => /Draft packet/.test(warning)), 'the validator must report draft status');
});

check('a new chapter with no evidence is valid only as a draft and not review-ready', () => {
  const draft = createDraftPacket('next-chapter', 'Next Chapter');
  const result = validatePacket(draft);
  assert(!result.failed, result.errors.join('\n        '));
  eq(result.reviewReady, false);
  eq(result.review.packetStatus, 'draft');
  eq(result.review.mergeGate, 'blocked');
  assert(draft.coverage.omitted.length > 0, 'a draft must still state its omission boundary');
});

check('the generic validator does not assume the Hostage pilot counts or IDs', () => {
  const sample = createDraftPacket('synthetic-chapter', 'Synthetic Chapter');
  sample.packetStatus = 'prepared';
  sample.coverage = {
    status: 'partial',
    scope: 'One synthetic edge used only to prove the validator is not pilot-specific.',
    included: ['One synthetic traced edge.'],
    omitted: ['Everything else, including evidence and review.'],
    sources: ['fixtureSource']
  };
  sample.sources = [{
    id: 'fixtureSource',
    url: 'https://example.com/fixture-source',
    class: 'reference',
    role: 'Synthetic validator fixture only.',
    locator: 'Fixture section 1.',
    access: [{ date: '2026-10-21', actor: 'test fixture', outcome: 'inspected' }],
    attribution: 'Synthetic fixture; not a game source.',
    rights: { state: 'not-reviewed', note: 'No rights review was performed for this fixture.' }
  }];
  sample.chart = {
    basis: 'chart-transcribed',
    sources: ['fixtureSource'],
    nodes: [
      { id: 'node_a', label: 'NODE A', kind: 'action' },
      { id: 'node_b', label: 'NODE B', kind: 'outcome' }
    ],
    edges: [{ id: 'e_node_a_b', from: 'node_a', to: 'node_b', kind: 'traced' }]
  };
  const result = validatePacket(sample);
  assert(!result.failed, result.errors.join('\n        '));
  eq([result.counts.chartNodes, result.counts.chartEdges], [2, 1]);
  eq(result.reviewReady, false);
});

check('an approved partial packet can pass review without claiming complete chapter coverage', () => {
  const candidate = clone(packet);
  candidate.packetStatus = 'reviewed';
  candidate.coverage.status = 'partial';
  candidate.coverage.scope = 'A source-reviewed, explicitly partial chapter sample.';
  candidate.coverage.included = ['One reviewed event and its reported relation.'];
  candidate.coverage.omitted = ['Unreviewed and unrepresented chapter branches.'];
  candidate.review.independent.state = 'approved';
  candidate.review.independent.reviewer = 'Independent reviewer';
  candidate.review.independent.date = '2026-10-21';
  candidate.review.mergeGate.state = 'ready';
  candidate.review.mergeGate.reason = 'The partial scope and its omissions were reviewed.';
  const result = validatePacket(candidate, { atlas: ATLAS });
  assert(!result.failed, result.errors.join('\n        '));
  eq(result.reviewReady, true);
  eq(candidate.coverage.status, 'partial');
  assert(candidate.coverage.omitted.length > 0, 'review readiness must keep omissions explicit');
});

console.log('\nchapter packet — malformed fixtures');
rejects('rejects an unsupported packet version', p => { p.packetVersion = '2.0'; }, /packetVersion must be "1\.0"/);
rejects('rejects a duplicate chart node ID', p => { p.chart.nodes[1].id = p.chart.nodes[0].id; }, /duplicate node id/);
rejects('rejects a duplicate chart edge ID', p => { p.chart.edges[1].id = p.chart.edges[0].id; }, /duplicate edge id/);
rejects('rejects a duplicate source ID', p => { p.sources[1].id = p.sources[0].id; }, /duplicate source id/);
rejects('rejects a duplicate condition ID', p => { p.conditions.push(clone(p.conditions[0])); }, /duplicate condition id/);
rejects('rejects a duplicate unknown ID', p => { p.unknowns.push(clone(p.unknowns[0])); }, /duplicate unknown id/);
rejects('rejects a non-http source URL', p => { p.sources[0].url = 'steam.example'; }, /absolute http\(s\) URL/);
rejects('rejects an unknown source class', p => { p.sources[0].class = 'official'; }, /class must be one of/);
rejects('rejects a missing source locator', p => { p.sources[0].locator = ''; }, /has no locator/);
rejects('rejects an invalid access date', p => { p.sources[0].access[0].date = '2026-02-31'; }, /real YYYY-MM-DD date/);
rejects('rejects an unknown access outcome', p => { p.sources[0].access[0].outcome = 'assumed'; }, /outcome must be one of/);
rejects('rejects an HTTP error outcome without a status', p => { delete p.sources[3].access[0].httpStatus; }, /needs an HTTP status number/);
rejects('rejects an invalid rights review state', p => { p.sources[0].rights.state = 'cleared'; }, /rights\.state must be one of/);
rejects('rejects a rights record with no note', p => { p.sources[0].rights.note = ''; }, /rights\.note is required/);
rejects('rejects a chart source reference that does not exist', p => { p.chart.sources = ['missing']; }, /references unknown source "missing"/);
rejects('rejects a coverage source reference that does not exist', p => { p.coverage.sources.push('missing'); }, /references unknown source "missing"/);
rejects('rejects a chart edge with a dangling endpoint', p => { p.chart.edges[0].to = 'missing_node'; }, /to endpoint "missing_node" is not a chart node/);
rejects('rejects a supplementary edge with an undeclared endpoint', p => { p.supplementary[0].edges[0].to = 'missing_node'; }, /to endpoint "missing_node" is not declared/);
rejects('rejects an out-of-range choice option', p => { p.chart.edges.find(edge => edge.id === 'e_hostage_trust_fail_jumps').fromOption = 9; }, /does not name an option/);
rejects('rejects a condition with an unknown source', p => { p.conditions[0].sources = ['missing']; }, /references unknown source "missing"/);
rejects('rejects a condition that applies to more than one edge', p => {
  p.conditions[0].appliesTo = ['e_hostage_save_cop_public_enemy', 'e_hostage_start_allen'];
}, /appliesTo must name exactly one edge id/);
rejects('rejects a condition that applies to a missing edge', p => { p.conditions[0].appliesTo = 'e_missing'; }, /applies to missing edge "e_missing"/);
rejects('rejects an AND condition with one requirement', p => { p.conditions[0].operator = 'AND'; }, /needs at least two requirements for AND/);
rejects('rejects an empty coverage scope', p => { p.coverage.scope = ''; }, /coverage\.scope is required/);
rejects('rejects a checked coverage record with no omitted boundary', p => { p.coverage.omitted = []; }, /needs at least one omitted item/);
rejects('rejects a draft packet that claims checked-against-chart coverage', p => { p.packetStatus = 'draft'; }, /draft packet must not claim checked-against-chart/);
rejects('rejects an uncertainty mislabelled as a conflict', p => { p.unknowns[0].status = 'conflict'; }, /expected "unknown"/);
rejects('rejects an unknown record with no node or edge reference', p => { p.unknowns[0].nodes = []; p.unknowns[0].edges = []; }, /has no node or edge reference/);
rejects('rejects an unknown record with an unknown edge reference', p => { p.unknowns[0].edges = ['e_missing']; }, /references missing edge "e_missing"/);
rejects('rejects an unknown record with no source references', p => { p.unknowns[0].sources = []; }, /has no source references/);
rejects('rejects a conflict record with no explanation', p => {
  p.conflicts.push({ id: 'cf_fixture', status: 'conflict', explanation: '', edges: ['e_hostage_start_allen'], sources: ['steamHostageChart'] });
}, /conflict "cf_fixture" has no explanation/);
rejects('rejects a conflict record marked as unknown', p => {
  p.conflicts.push({ id: 'cf_fixture', status: 'unknown', explanation: 'Fixture.', edges: ['e_hostage_start_allen'], sources: ['steamHostageChart'] });
}, /expected "conflict"/);
rejects('rejects a stale legacy edge index', p => { p.chart.edges[0].legacyEdgeIndex = 0; }, /legacyEdgeIndex 0 points to ATLAS edge/);
rejects('rejects a duplicate legacy edge index', p => { p.chart.edges[1].legacyEdgeIndex = p.chart.edges[0].legacyEdgeIndex; }, /reuses legacyEdgeIndex/);
rejects('rejects a label that no longer reconciles with ATLAS', p => { p.chart.nodes[0].label = 'MISSION BEGIN'; }, /label differs from ATLAS/);
rejects('rejects an endpoint that no longer reconciles with ATLAS', p => {
  p.chart.edges[0].to = 'fish';
  p.chart.edges[0].kind = 'traced';
}, /endpoints differ from ATLAS|duplicate directed edge/);
rejects('rejects an exact chapter reconciliation with a missing ATLAS node', p => {
  p.chart.nodes = p.chart.nodes.filter(node => node.id !== 'get_close');
  p.chart.edges = p.chart.edges.filter(edge => edge.from !== 'get_close' && edge.to !== 'get_close');
}, /chart node ID set is missing: get_close/);
rejects('rejects readiness before independent approval', p => { p.review.mergeGate.state = 'ready'; p.review.mergeGate.reason = 'Ready.'; }, /mergeGate cannot be ready before/);
rejects('rejects packetStatus reviewed without an approved review', p => { p.packetStatus = 'reviewed'; }, /requires an approved independent review/);
rejects('rejects an approved review without a reviewer or date', p => {
  p.packetStatus = 'reviewed';
  p.review.independent.state = 'approved';
  p.review.mergeGate.state = 'ready';
  p.review.mergeGate.reason = 'Ready.';
}, /needs a named reviewer|needs a real YYYY-MM-DD date/);

console.log('\nchapter packet — CLI');
check('the CLI exits 0 for structural success and 2 when review is required', () => {
  const structural = spawnSync(process.execPath, ['prototype/validate-chapter-packet.js', 'packets/hostage.packet.json'], {
    cwd: root,
    encoding: 'utf8'
  });
  eq(structural.status, 0, structural.stderr || structural.stdout);
  assert(/Structural validation passed/.test(structural.stdout), 'structural success message missing');
  assert(/review-ready: no/.test(structural.stdout), 'review status missing');
  const gated = spawnSync(process.execPath, ['prototype/validate-chapter-packet.js', 'packets/hostage.packet.json', '--require-review'], {
    cwd: root,
    encoding: 'utf8'
  });
  eq(gated.status, 2, 'the merge gate must block before independent review');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
