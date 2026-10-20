#!/usr/bin/env node
/* PoC4 data/provenance contract checks.
   Run: node tests/atlas-data-contract.test.js   (npm run test:contract)

   The real sample must pass the validator. Deliberately malformed copies must
   fail for each documented error class. These are structural checks only: they
   do not verify any game claim or source accuracy. */
'use strict';

const path = require('path');
const { readAtlasData, validateAtlas } = require('../prototype/validate-atlas-data.js');

const real = readAtlasData(path.join(__dirname, '..', 'prototype', 'atlas-data.js'));
const clone = () => JSON.parse(JSON.stringify(real));

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

function allErrors(result) {
  return result.checks.reduce((out, item) => out.concat(item.errors), []);
}

function rejects(name, mutate, pattern) {
  check(name, () => {
    const data = clone();
    mutate(data);
    const result = validateAtlas(data);
    assert(result.failed, 'validator accepted the malformed fixture');
    const errors = allErrors(result);
    assert(errors.some(error => pattern.test(error)),
      'no error matched ' + pattern + '\n        ' + errors.join('\n        '));
  });
}

console.log('atlas-data.js — real sample contract');
check('the real PoC4 sample passes all structural checks', () => {
  const result = validateAtlas(clone());
  const errors = allErrors(result);
  assert(!result.failed, errors.join('\n        '));
});

check('the sample declares contract version 1.0 and separate coverage records', () => {
  eq(real.meta.contractVersion, '1.0');
  eq(real.chapters.map(c => c.coverage.status), ['partial', 'partial', 'partial']);
  real.chapters.forEach(c => {
    assert(c.coverage.scope && c.coverage.included && c.coverage.omitted, c.id + ' coverage scope/inclusion/omission missing');
    assert(c.coverage.sources.length > 0, c.id + ' coverage has no sources');
  });
});

check('existing 18 node IDs remain unchanged', () => {
  eq(real.nodes.map(n => n.id), [
    'a_welcome', 'a_todd', 'a_clean1', 'a_ask', 'a_go', 'a_clean2', 'a_room', 'a_talk', 'a_key', 'a_box',
    's_alive', 's_dead',
    'k_terminal', 'k_meet', 'k_dialogue', 'k_away', 'k_check', 'k_goodbye'
  ]);
});

check('16 edge IDs preserve the existing order and topology', () => {
  eq(real.edges.map(e => e.id), [
    'e_home_welcome_todd', 'e_home_todd_clean1', 'e_home_clean1_ask', 'e_home_ask_go',
    'e_home_go_clean2', 'e_home_clean2_room', 'e_home_room_talk', 'e_home_talk_key',
    'e_home_key_box', 'e_home_box_kara_dialogue_hypothesis', 'e_stormy_alive_meet',
    'e_kara_terminal_meet', 'e_kara_meet_dialogue', 'e_kara_dialogue_away',
    'e_kara_dialogue_check', 'e_kara_away_goodbye'
  ]);
  eq(real.edges.map(e => [e.from, e.to, e.kind]), [
    ['a_welcome', 'a_todd', 'traced'], ['a_todd', 'a_clean1', 'traced'],
    ['a_clean1', 'a_ask', 'traced'], ['a_ask', 'a_go', 'traced'],
    ['a_go', 'a_clean2', 'traced'], ['a_clean2', 'a_room', 'traced'],
    ['a_room', 'a_talk', 'traced'], ['a_talk', 'a_key', 'conditional'],
    ['a_key', 'a_box', 'traced'], ['a_box', 'k_dialogue', 'hypothesis'],
    ['s_alive', 'k_meet', 'prerequisite'], ['k_terminal', 'k_meet', 'prerequisite'],
    ['k_meet', 'k_dialogue', 'traced'], ['k_dialogue', 'k_away', 'traced'],
    ['k_dialogue', 'k_check', 'traced'], ['k_away', 'k_goodbye', 'traced']
  ]);
});

check('conditions only group the existing key and Meet Todd requirements', () => {
  eq(real.conditions.map(c => [c.id, c.operator]), [
    ['cond_key_relationship', 'SINGLE'],
    ['cond_meet_todd_access', 'AND']
  ]);
  const meet = real.conditions.find(c => c.id === 'cond_meet_todd_access');
  eq(meet.appliesTo, ['e_stormy_alive_meet', 'e_kara_terminal_meet']);
  eq(meet.requirements, [
    'Todd was not killed in Stormy Night.',
    'Kara and Alice reached the bus terminal.'
  ]);
  const edgeIds = new Set(real.edges.map(e => e.id));
  real.conditions.forEach(c => c.appliesTo.forEach(id => assert(edgeIds.has(id), id + ' is not an existing edge')));
});

check('unknowns stay unknown and no source-vs-source conflict is invented', () => {
  eq(real.uncertainties.map(u => u.status), ['unknown', 'unknown', 'unknown']);
  eq(real.conflicts, []);
  real.uncertainties.forEach(u => {
    assert(u.explanation && u.sources.length, u.id + ' lacks an explanation or source');
  });
});

console.log('atlas-data.js — malformed fixtures');
rejects('rejects duplicate node IDs', d => { d.nodes[1].id = d.nodes[0].id; }, /duplicate node id/);
rejects('rejects duplicate chapter IDs', d => { d.chapters[1].id = d.chapters[0].id; }, /duplicate chapter id/);
rejects('rejects duplicate edge IDs', d => { d.edges[1].id = d.edges[0].id; }, /duplicate edge id/);
rejects('rejects duplicate condition IDs', d => { d.conditions[1].id = d.conditions[0].id; }, /duplicate condition id/);
rejects('rejects an edge with a dangling target endpoint', d => { d.edges[0].to = 'missing_node'; }, /edge to "missing_node" has no node/);
rejects('rejects a node with no source references', d => { d.nodes[0].src = []; }, /node "a_welcome" has no src keys/);
rejects('rejects a node with an unknown source reference', d => { d.nodes[0].src = ['missing_ref']; }, /node "a_welcome" references unknown ref "missing_ref"/);
rejects('rejects an edge with no source references', d => { d.edges[0].src = []; }, /edge a_welcome->a_todd has no src keys/);
rejects('rejects an edge with an unknown source reference', d => { d.edges[0].src = ['missing_ref']; }, /edge a_welcome->a_todd references unknown ref "missing_ref"/);
rejects('rejects missing chapter coverage sources', d => { d.chapters[0].coverage.sources = []; }, /chapter "home" coverage has no source keys/);
rejects('rejects unknown chapter coverage sources', d => { d.chapters[0].coverage.sources = ['missing_ref']; }, /chapter "home" coverage references unknown ref "missing_ref"/);
rejects('rejects an invalid claim/evidence status', d => { d.nodes[0].status = 'verified'; }, /node "a_welcome" has unknown status "verified"/);
rejects('rejects an invalid chapter coverage status', d => { d.chapters[0].coverage.status = 'complete'; }, /chapter "home" has unknown coverage status "complete"/);
rejects('rejects a malformed condition operator', d => { d.conditions[0].operator = 'XOR'; }, /condition "cond_key_relationship" has unknown operator "XOR"/);
rejects('rejects an AND condition with fewer than two requirements', d => { d.conditions[1].requirements = ['only one']; }, /condition "cond_meet_todd_access" needs at least two requirements for AND/);
rejects('rejects a condition that applies to a missing edge ID', d => { d.conditions[0].appliesTo = ['e_missing']; }, /condition "cond_key_relationship" applies to missing edge id "e_missing"/);
rejects('rejects an uncertainty without an explanation', d => { d.uncertainties[0].explanation = ''; }, /uncertainty "u_box_trigger" has no explanation/);
rejects('rejects an uncertainty without source references', d => { d.uncertainties[0].sources = []; }, /uncertainty "u_box_trigger" has no source keys/);
rejects('rejects an uncertainty mislabelled as a conflict', d => { d.uncertainties[0].status = 'conflict'; }, /uncertainty "u_box_trigger" has status "conflict", expected "unknown"/);
rejects('rejects an uncertainty with no node or edge reference', d => { d.uncertainties[0].nodes = []; d.uncertainties[0].edges = []; }, /uncertainty "u_box_trigger" has no node or edge reference/);
rejects('rejects an uncertainty with a missing edge reference', d => { d.uncertainties[0].edges = ['e_missing']; }, /uncertainty "u_box_trigger" references missing edge "e_missing"/);
rejects('rejects a conflict without an explanation', d => {
  d.conflicts.push({ id: 'cf_fixture', status: 'conflict', explanation: '', nodes: ['k_meet'], sources: ['powerpyxKara'] });
}, /conflict "cf_fixture" has no explanation/);
rejects('rejects a conflict without source references', d => {
  d.conflicts.push({ id: 'cf_fixture', status: 'conflict', explanation: 'Fixture disagreement.', nodes: ['k_meet'], sources: [] });
}, /conflict "cf_fixture" has no source keys/);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
