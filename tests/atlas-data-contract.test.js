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

check('published node IDs keep their order and later slices are appended', () => {
  eq(real.nodes.map(n => n.id), [
    'a_welcome', 'a_todd', 'a_clean1', 'a_ask', 'a_go', 'a_clean2', 'a_room', 'a_talk', 'a_key', 'a_box',
    'a_gun_seen', 'a_window_open',
    's_alive', 's_dead', 's_take_gun', 's_gun_struggle', 's_kara_shoots_todd',
    's_alice_shoots_todd', 's_gun_carried', 's_window_open',
    'k_terminal', 'k_meet', 'k_dialogue', 'k_away', 'k_check', 'k_goodbye',
    'k_checkpoint', 'k_detour', 'k_late_bus',
    's_reach_alice', 's_run_away', 's_hide_corridor', 's_todd_passes', 's_front_backyard_escape',
    's_lock_room', 's_window_go_out', 's_window_qte', 's_window_reach_bus',
    's_todd_orders_stay', 's_alice_runs_upstairs', 's_deviant', 's_fatal_todd_kills', 's_go_upstairs', 's_reason_todd', 's_todd_upstairs_first',
    'a_read_android_power', 'a_read_connecting_dots', 'a_wash_dishes', 'a_take_laundry_backyard',
    'a_rewash_clothes', 'a_find_red_ice', 'a_enrage_todd', 'a_watch_todd_tv', 'a_block_todd_view', 'a_activate_vacuum', 'a_take_out_trash'
  ]);
  eq(real.nodes.length, 56);
});

check('published edge IDs keep their order and later slices are appended', () => {
  eq(real.edges.map(e => e.id), [
    'e_home_welcome_todd', 'e_home_todd_clean1', 'e_home_clean1_ask', 'e_home_ask_go',
    'e_home_go_clean2', 'e_home_clean2_room', 'e_home_room_talk', 'e_home_talk_key',
    'e_home_key_box', 'e_home_box_kara_dialogue_hypothesis', 'e_stormy_alive_meet',
    'e_kara_terminal_meet', 'e_kara_meet_dialogue', 'e_kara_dialogue_away',
    'e_kara_dialogue_check', 'e_kara_away_goodbye',
    'e_home_go_gun_seen', 'e_home_room_window',
    'e_home_gun_stormy_take', 'e_home_window_stormy_route',
    'e_stormy_take_gun_struggle', 'e_stormy_struggle_kara_shoots', 'e_stormy_struggle_alice_shoots',
    'e_stormy_kara_gun_carried', 'e_stormy_kara_dead', 'e_stormy_alice_dead',
    'e_kara_checkpoint_detour', 'e_kara_checkpoint_terminal',
    'e_kara_detour_late', 'e_kara_detour_terminal', 'e_kara_late_terminal',
    'e_stormy_reach_run_away', 'e_stormy_run_hide', 'e_stormy_hide_todd_passes',
    'e_stormy_todd_passes_front_backyard', 'e_stormy_front_backyard_alive',
    'e_stormy_reach_lock_room', 'e_stormy_window_go_out_access', 'e_stormy_lock_go_out',
    'e_stormy_go_out_qte', 'e_stormy_qte_bus', 'e_stormy_window_bus_alive',
    'e_stormy_todd_orders_alice_upstairs', 'e_stormy_alice_upstairs_stay_still',
    'e_stormy_alice_upstairs_deviant', 'e_stormy_deviant_go_upstairs',
    'e_stormy_go_upstairs_reach_alice', 'e_stormy_deviant_reason', 'e_stormy_reason_knocked',
    'e_home_rewash_red_ice', 'e_home_red_ice_enrage_todd', 'e_home_watch_tv_block_view', 'e_home_backyard_rewash_clothes'
  ]);
  eq(real.edges.length, 53);
  eq(real.edges.map(e => [e.from, e.to, e.kind]), [
    ['a_welcome', 'a_todd', 'traced'], ['a_todd', 'a_clean1', 'traced'],
    ['a_clean1', 'a_ask', 'traced'], ['a_ask', 'a_go', 'traced'],
    ['a_go', 'a_clean2', 'traced'], ['a_clean2', 'a_room', 'traced'],
    ['a_room', 'a_talk', 'traced'], ['a_talk', 'a_key', 'conditional'],
    ['a_key', 'a_box', 'traced'], ['a_box', 'k_dialogue', 'hypothesis'],
    ['s_alive', 'k_meet', 'prerequisite'], ['k_terminal', 'k_meet', 'prerequisite'],
    ['k_meet', 'k_dialogue', 'traced'], ['k_dialogue', 'k_away', 'traced'],
    ['k_dialogue', 'k_check', 'traced'], ['k_away', 'k_goodbye', 'traced'],
    ['a_go', 'a_gun_seen', 'conditional'], ['a_room', 'a_window_open', 'conditional'],
    ['a_gun_seen', 's_take_gun', 'prerequisite'], ['a_window_open', 's_window_open', 'prerequisite'],
    ['s_take_gun', 's_gun_struggle', 'traced'], ['s_gun_struggle', 's_kara_shoots_todd', 'conditional'],
    ['s_gun_struggle', 's_alice_shoots_todd', 'conditional'], ['s_kara_shoots_todd', 's_gun_carried', 'traced'],
    ['s_kara_shoots_todd', 's_dead', 'traced'], ['s_alice_shoots_todd', 's_dead', 'traced'],
    ['k_checkpoint', 'k_detour', 'traced'], ['k_checkpoint', 'k_terminal', 'traced'],
    ['k_detour', 'k_late_bus', 'conditional'], ['k_detour', 'k_terminal', 'conditional'],
    ['k_late_bus', 'k_terminal', 'traced'],
    ['s_reach_alice', 's_run_away', 'traced'], ['s_run_away', 's_hide_corridor', 'traced'],
    ['s_hide_corridor', 's_todd_passes', 'traced'], ['s_todd_passes', 's_front_backyard_escape', 'traced'],
    ['s_front_backyard_escape', 's_alive', 'hypothesis'],
    ['s_reach_alice', 's_lock_room', 'traced'], ['s_window_open', 's_window_go_out', 'prerequisite'],
    ['s_lock_room', 's_window_go_out', 'traced'], ['s_window_go_out', 's_window_qte', 'conditional'],
    ['s_window_qte', 's_window_reach_bus', 'traced'], ['s_window_reach_bus', 's_alive', 'hypothesis'],
    ['s_todd_orders_stay', 's_alice_runs_upstairs', 'traced'],
    ['s_alice_runs_upstairs', 's_fatal_todd_kills', 'traced'], ['s_alice_runs_upstairs', 's_deviant', 'traced'],
    ['s_deviant', 's_go_upstairs', 'traced'],
    ['s_go_upstairs', 's_reach_alice', 'traced'], ['s_deviant', 's_reason_todd', 'traced'],
    ['s_reason_todd', 's_todd_upstairs_first', 'traced'],
    ['a_rewash_clothes', 'a_find_red_ice', 'traced'],
    ['a_find_red_ice', 'a_enrage_todd', 'traced'],
    ['a_watch_todd_tv', 'a_block_todd_view', 'traced'],
    ['a_take_laundry_backyard', 'a_rewash_clothes', 'traced']
  ]);
});

check('the Stormy Night entry follows source order and keeps fatal and deviant branches distinct', () => {
  const byId = new Map(real.nodes.map(n => [n.id, n]));
  const from = id => real.edges.filter(e => e.from === id);
  const to = id => real.edges.filter(e => e.to === id);
  const required = ['s_todd_orders_stay', 's_alice_runs_upstairs', 's_deviant', 's_fatal_todd_kills',
    's_go_upstairs', 's_reason_todd', 's_todd_upstairs_first'];
  required.forEach(id => {
    const node = byId.get(id);
    assert(node && node.src.includes('powerpyxStormy') && node.src.includes('gamerGuidesStormy'),
      id + ' must exist and cite both reviewed Stormy Night sources');
  });
  eq(from('s_todd_orders_stay').map(e => [e.to, e.kind]), [['s_alice_runs_upstairs', 'traced']]);
  eq(from('s_alice_runs_upstairs').map(e => e.to).sort(), ['s_deviant', 's_fatal_todd_kills']);
  assert(/stay still|obey/i.test(from('s_alice_runs_upstairs').find(e => e.to === 's_fatal_todd_kills').label),
    'the fatal branch must follow obeying/staying still');
  assert(/deviant/i.test(byId.get('s_deviant').label),
    'the alternate branch must lead to the deviant event');
  eq(to('s_fatal_todd_kills').map(e => e.from), ['s_alice_runs_upstairs']);
  eq(from('s_fatal_todd_kills'), []);
  eq(from('s_deviant').map(e => e.to).sort(), ['s_go_upstairs', 's_reason_todd']);
  eq(from('s_go_upstairs').map(e => e.to), ['s_reach_alice']);
  eq(from('s_reason_todd').map(e => e.to), ['s_todd_upstairs_first']);
  eq(from('s_todd_upstairs_first'), []);
  assert(!real.edges.some(e => e.from === 's_fatal_todd_kills' || e.to === 's_alive' && e.from === 's_fatal_todd_kills'),
    'fatal outcome must not imply Todd survived or died');
  const ids = ['e_stormy_todd_orders_alice_upstairs', 'e_stormy_alice_upstairs_stay_still',
    'e_stormy_alice_upstairs_deviant', 'e_stormy_deviant_go_upstairs',
    'e_stormy_go_upstairs_reach_alice', 'e_stormy_deviant_reason', 'e_stormy_reason_knocked'];
  eq(ids.length, 7);
  ids.forEach(id => {
    const edge = real.edges.find(e => e.id === id);
    assert(edge && edge.kind === 'traced' && edge.src.includes('powerpyxStormy') && edge.src.includes('gamerGuidesStormy'),
      id + ' must be a sourced traced transition');
  });
});

check('conditions keep each checkpoint timing alternative attached to its own edge', () => {
  eq(real.conditions.map(c => [c.id, c.operator]), [
    ['cond_key_relationship', 'SINGLE'],
    ['cond_meet_todd_access', 'AND'],
    ['cond_checkpoint_detour_late', 'AND'],
    ['cond_checkpoint_detour_ontime', 'AND'],
    ['cond_window_qte_success', 'SINGLE']
  ]);
  const meet = real.conditions.find(c => c.id === 'cond_meet_todd_access');
  eq(meet.appliesTo, ['e_stormy_alive_meet', 'e_kara_terminal_meet']);
  eq(meet.requirements, [
    'Todd was not killed in Stormy Night.',
    'Kara and Alice reached the bus terminal.'
  ]);
  const late = real.conditions.find(c => c.id === 'cond_checkpoint_detour_late');
  const ontime = real.conditions.find(c => c.id === 'cond_checkpoint_detour_ontime');
  eq(late.appliesTo, ['e_kara_detour_late']);
  eq(ontime.appliesTo, ['e_kara_detour_terminal']);
  assert(late.requirements.some(r => /wait/i.test(r)) && late.requirements.some(r => /below 11/.test(r)),
    'late connector should require both waiting and below 11 minutes');
  assert(ontime.requirements.some(r => /immediately/i.test(r)) && ontime.requirements.some(r => /above 11/.test(r)),
    'on-time connector should require an immediate detour and above 11 minutes');
  assert(!/above 11/.test(JSON.stringify(late)) && !/below 11/.test(JSON.stringify(ontime)),
    'timing alternatives must not be mixed between outcome edges');
  const edgeIds = new Set(real.edges.map(e => e.id));
  real.conditions.forEach(c => c.appliesTo.forEach(id => assert(edgeIds.has(id), id + ' is not an existing edge')));
});

check('unknowns stay unknown and no source-vs-source conflict is invented', () => {
  eq(real.uncertainties.map(u => u.status), ['unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown']);
  eq(real.uncertainties.map(u => u.id), [
    'u_box_trigger', 'u_key_threshold', 'u_home_first_floor_order', 'u_stormy_internal',
    'u_checkpoint_timer_11', 'u_gun_state_check', 'u_window_route_outcome',
    'u_stormy_escape_todd_state'
  ]);
  eq(real.conflicts, []);
  real.uncertainties.forEach(u => {
    assert(u.explanation && u.sources.length, u.id + ' lacks an explanation or source');
  });
});

check('the checkpoint late branch still reaches the terminal and is not a carried cross-chapter state', () => {
  const byId = new Map(real.nodes.map(n => [n.id, n]));
  const late = real.edges.filter(e => e.from === 'k_late_bus');
  eq(late.map(e => e.to), ['k_terminal']);
  const checkpoint = byId.get('k_checkpoint');
  eq(checkpoint.kind, 'choice');
  assert(/chapter-local/i.test(checkpoint.sub || ''), 'checkpoint choice should be marked chapter-local');
  const cross = real.edges.filter(e => byId.get(e.from).chapter !== byId.get(e.to).chapter);
  assert(!cross.some(e => [e.from, e.to].includes('k_checkpoint')), 'checkpoint choice must not be a cross-chapter state');
  const timer = real.uncertainties.find(u => u.id === 'u_checkpoint_timer_11');
  assert(timer && timer.nodes.includes('k_detour') && timer.nodes.includes('k_late_bus'), 'timer uncertainty must attach to the detour branch');
  assert(!/<=|>=/.test(JSON.stringify(timer)), 'timer uncertainty must not invent <= or >=');
});

check('optional Home chapter clues are not represented as traced chart paths', () => {
  for (const id of ['e_home_go_gun_seen', 'e_home_room_window']) {
    const edge = real.edges.find(e => e.id === id);
    eq(edge.kind, 'conditional');
    assert(/optional/i.test(edge.label || '') && /optional/i.test(edge.note || ''), id + ' must be labeled as an optional action');
  }
});

check('A New Home first-floor events keep only source-supported local progressions', () => {
  const byId = new Map(real.nodes.map(n => [n.id, n]));
  const sources = {
    a_read_android_power: ['powerpyxHome'],
    a_read_connecting_dots: ['powerpyxHome'],
    a_wash_dishes: ['powerpyxHome', 'gamefaqs'],
    a_take_laundry_backyard: ['powerpyxHome', 'gamefaqs'],
    a_rewash_clothes: ['powerpyxHome', 'gamefaqs'],
    a_find_red_ice: ['powerpyxHome', 'gamefaqs'],
    a_enrage_todd: ['powerpyxHome', 'gamefaqs'],
    a_watch_todd_tv: ['gamefaqs'],
    a_block_todd_view: ['powerpyxHome', 'gamefaqs'],
    a_activate_vacuum: ['powerpyxHome', 'gamefaqs'],
    a_take_out_trash: ['powerpyxHome', 'gamefaqs']
  };
  Object.entries(sources).forEach(([id, refs]) => {
    const node = byId.get(id);
    assert(node && node.chapter === 'home', id + ' must be an A New Home event');
    assert(refs.every(ref => node.src.includes(ref)), id + ' must cite its supporting source');
    assert(!/\b(optional (activity|event|action|branch)|is mandatory|must be completed|are exclusive|mutually exclusive)\b/i.test(node.note || ''), id + ' must not claim unsupported optionality or requirements');
  });
  const expected = [
    ['e_home_backyard_rewash_clothes', 'a_take_laundry_backyard', 'a_rewash_clothes'],
    ['e_home_rewash_red_ice', 'a_rewash_clothes', 'a_find_red_ice'],
    ['e_home_red_ice_enrage_todd', 'a_find_red_ice', 'a_enrage_todd'],
    ['e_home_watch_tv_block_view', 'a_watch_todd_tv', 'a_block_todd_view']
  ];
  expected.forEach(([id, from, to]) => {
    const edge = real.edges.find(e => e.id === id);
    assert(edge && edge.kind === 'traced' && edge.from === from && edge.to === to, id + ' must keep its local source-stated progression');
    assert(edge.src.length > 0, id + ' must cite its source');
  });
  assert(!real.edges.some(e => e.from === 'a_clean1' && Object.keys(sources).includes(e.to)),
    'do not invent generic first-floor context spokes');
  const mandatory = real.edges.find(e => e.id === 'e_home_clean1_ask');
  eq([mandatory.from, mandatory.to, mandatory.kind], ['a_clean1', 'a_ask', 'traced']);
  const unknown = real.uncertainties.find(u => u.id === 'u_home_first_floor_order');
  assert(unknown && unknown.status === 'unknown', 'unresolved order and requirements must be recorded');
  Object.keys(sources).forEach(id => assert(unknown.nodes.includes(id), id + ' missing from first-floor uncertainty'));
  ['e_home_backyard_rewash_clothes', 'e_home_rewash_red_ice', 'e_home_red_ice_enrage_todd', 'e_home_watch_tv_block_view'].forEach(id => assert(unknown.edges.includes(id), id + ' missing from first-floor uncertainty'));
});

check('gun and window expansion keeps possession, outcomes and route limits separate', () => {
  const from = (id) => real.edges.filter(e => e.from === id).map(e => e.to).sort();
  eq(from('s_kara_shoots_todd'), ['s_dead', 's_gun_carried']);
  eq(from('s_alice_shoots_todd'), ['s_dead']);
  eq(from('s_gun_struggle'), ['s_alice_shoots_todd', 's_kara_shoots_todd']);
  eq(from('s_window_open'), ['s_window_go_out']);
  const windowAccess = real.edges.find(e => e.id === 'e_stormy_window_go_out_access');
  assert(windowAccess && windowAccess.kind === 'prerequisite', 'window availability must stay a prerequisite');
  assert(!real.edges.some(e => e.from === 's_window_open' && ['k_terminal', 'k_meet'].includes(e.to)),
    'the window route must not connect directly to the terminal or meeting');
  const gunIn = real.edges.filter(e => e.to === 's_gun_carried');
  eq(gunIn.map(e => e.from), ['s_kara_shoots_todd']);
  const gun = real.nodes.find(n => n.id === 's_gun_carried');
  assert(/supplemental carried state/i.test(gun.sub || ''), 's_gun_carried should be marked as a supplemental carried state');
  const window = real.uncertainties.find(u => u.id === 'u_window_route_outcome');
  assert(window && window.nodes.includes('a_window_open') && window.nodes.includes('s_window_open'),
    'window uncertainty must attach to both window nodes');
});

check('the two successful non-gun escape routes stay separate and Todd links stay inferential', () => {
  const edgesFrom = (id) => real.edges.filter(e => e.from === id);
  const corridor = edgesFrom('s_reach_alice').filter(e => e.to === 's_run_away');
  eq(corridor.map(e => e.id), ['e_stormy_reach_run_away']);
  eq(edgesFrom('s_run_away').map(e => e.to), ['s_hide_corridor']);
  eq(edgesFrom('s_hide_corridor').map(e => e.to), ['s_todd_passes']);
  eq(edgesFrom('s_todd_passes').map(e => e.to), ['s_front_backyard_escape']);

  eq(edgesFrom('s_reach_alice').filter(e => e.to === 's_lock_room').map(e => e.id),
    ['e_stormy_reach_lock_room']);
  eq(edgesFrom('s_lock_room').map(e => e.to), ['s_window_go_out']);
  eq(edgesFrom('s_window_go_out').map(e => e.to), ['s_window_qte']);
  eq(edgesFrom('s_window_qte').map(e => e.to), ['s_window_reach_bus']);

  const corridorNodes = ['s_reach_alice', 's_run_away', 's_hide_corridor', 's_todd_passes', 's_front_backyard_escape'];
  const windowNodes = ['s_reach_alice', 's_lock_room', 's_window_go_out', 's_window_qte', 's_window_reach_bus'];
  corridorNodes.forEach(id => assert(!windowNodes.includes(id) || id === 's_reach_alice',
    'routes must not share intermediate nodes: ' + id));
  assert(!edgesFrom('s_front_backyard_escape').some(e => e.to === 's_window_reach_bus'),
    'the corridor route must not feed the window route');
  assert(!edgesFrom('s_window_reach_bus').some(e => e.to === 's_front_backyard_escape'),
    'the window route must not feed the corridor route');

  for (const [from, id] of [
    ['s_front_backyard_escape', 'e_stormy_front_backyard_alive'],
    ['s_window_reach_bus', 'e_stormy_window_bus_alive']
  ]) {
    const out = edgesFrom(from);
    eq(out.map(e => e.id), [id]);
    eq(out[0].kind, 'hypothesis');
    assert(/UNRESOLVED inference/i.test(out[0].label || ''), id + ' must label itself as an unresolved inference');
    assert(/not state|does not state|unstated/i.test(out[0].note || ''),
      id + ' must say the source does not state Todd’s later state');
    assert(out[0].src.length > 0, id + ' needs its own source refs');
  }

  const qteCondition = real.conditions.find(c => c.id === 'cond_window_qte_success');
  eq(qteCondition.appliesTo, ['e_stormy_go_out_qte']);
  eq(qteCondition.requirements, ['Pass the reported window-climb QTE.']);
  assert(!real.conditions.some(c => ['cond_corridor_escape', 'cond_window_escape'].includes(c.id)),
    'whole-route conditions must not be attached to earlier transition edges');
  const byEdge = new Map(real.conditions.flatMap(c => c.appliesTo.map(id => [id, c])));
  for (const id of ['e_stormy_reach_run_away', 'e_stormy_run_hide', 'e_stormy_hide_todd_passes',
    'e_stormy_todd_passes_front_backyard', 'e_stormy_reach_lock_room', 'e_stormy_lock_go_out',
    'e_stormy_qte_bus']) {
    assert(!byEdge.has(id), id + ' must not inherit requirements from later route steps');
  }
  eq(byEdge.get('e_stormy_go_out_qte').id, 'cond_window_qte_success');

  const unknown = real.uncertainties.find(u => u.id === 'u_stormy_escape_todd_state');
  assert(unknown, 'the shared Todd-state inference must have an explicit unknown record');
  assert(unknown.nodes.includes('s_alive') && unknown.nodes.includes('s_front_backyard_escape') &&
    unknown.nodes.includes('s_window_reach_bus'), 'Todd-state unknown must attach to both endpoints');
  assert(unknown.edges.includes('e_stormy_front_backyard_alive') &&
    unknown.edges.includes('e_stormy_window_bus_alive'), 'Todd-state unknown must attach to both inference edges');
  assert(/not state|does not state|unstated/i.test(unknown.explanation) && /inference/i.test(unknown.explanation),
    'Todd-state unknown must explain the missing state and the inference');
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
rejects('rejects an undocumented cross-chapter edge', d => {
  d.edges.push({ id: 'e_fixture_cross', from: 'a_box', to: 's_alive', kind: 'traced', src: ['steam'] });
}, /unexpected cross-chapter edge a_box->s_alive/);
rejects('rejects a late-bus branch that stops before the terminal', d => {
  d.edges = d.edges.filter(e => e.id !== 'e_kara_late_terminal');
}, /k_late_bus must not be a silent dead end/);
rejects('rejects a gun-carry edge from Alice shooting Todd', d => {
  d.edges.push({ id: 'e_fixture_alice_gun', from: 's_alice_shoots_todd', to: 's_gun_carried', kind: 'traced', src: ['powerpyxStormy'] });
}, /s_alice_shoots_todd must not feed s_gun_carried|s_gun_carried must have exactly one incoming edge/);
rejects('rejects a window route that claims a downstream escape outcome', d => {
  d.edges.push({ id: 'e_fixture_window_escape', from: 's_window_open', to: 'k_terminal', kind: 'traced', src: ['powerpyxStormy'] });
}, /s_window_open must not connect directly to the terminal or meeting|s_window_open should have exactly one prerequisite edge/);
rejects('rejects removing the unresolved 11-minute uncertainty', d => {
  d.uncertainties = d.uncertainties.filter(u => u.id !== 'u_checkpoint_timer_11');
}, /u_checkpoint_timer_11 is missing/);
rejects('rejects inventing an inclusive 11-minute boundary', d => {
  const edge = d.edges.find(e => e.id === 'e_kara_detour_late');
  edge.note = 'Timer <= 11 minutes gives the late bus.';
}, /must not invent <= or >=/);
rejects('rejects a non-gun corridor route that loses its exit step', d => {
  d.edges = d.edges.filter(e => e.id !== 'e_stormy_todd_passes_front_backyard');
}, /e_stormy_todd_passes_front_backyard.*is missing/);
rejects('rejects a non-gun escape link presented as traced rather than inferred', d => {
  d.edges.find(e => e.id === 'e_stormy_front_backyard_alive').kind = 'traced';
}, /e_stormy_front_backyard_alive must be a hypothesis from s_front_backyard_escape to s_alive/);
rejects('rejects dropping the window prerequisite into the window exit', d => {
  d.edges = d.edges.filter(e => e.id !== 'e_stormy_window_go_out_access');
}, /s_window_open should have exactly one prerequisite edge into the window exit/);
rejects('rejects a route that connects an escape endpoint straight to the meeting', d => {
  d.edges.push({ id: 'e_fixture_escape_meet', from: 's_window_reach_bus', to: 'k_meet', kind: 'traced', src: ['powerpyxStormy'] });
}, /s_window_reach_bus must not connect directly to the terminal or meeting/);
rejects('rejects attaching a whole-route condition to early route transitions', d => {
  d.conditions.push({ id: 'cond_corridor_escape', appliesTo: ['e_stormy_reach_run_away', 'e_stormy_todd_passes_front_backyard'], operator: 'AND', summary: 'Whole route.', requirements: ['Early step.', 'Later exit.'], sources: ['powerpyxStormy'] });
}, /cond_corridor_escape must not attach whole-route requirements/);

rejects('rejects removing the explicit Todd-state inference record', d => {
  d.uncertainties = d.uncertainties.filter(u => u.id !== 'u_stormy_escape_todd_state');
}, /u_stormy_escape_todd_state is missing/);

rejects('rejects a Stormy entry edge with no source refs', d => {
  d.edges.find(e => e.id === 'e_stormy_deviant_go_upstairs').src = [];
}, /edge s_deviant->s_go_upstairs has no src keys/);

rejects('rejects merging the fatal non-deviant outcome into Todd killed', d => {
  d.nodes.find(n => n.id === 's_fatal_todd_kills').label = 'Todd killed';
}, /fatal non-deviant outcome must not reuse the Todd-killed label/);

rejects('rejects linking the fatal non-deviant outcome to Todd survives', d => {
  d.edges.push({ id: 'e_fixture_fatal_alive', from: 's_fatal_todd_kills', to: 's_alive', kind: 'traced', src: ['powerpyxStormy'] });
}, /s_fatal_todd_kills must remain terminal|s_fatal_todd_kills must not reach s_alive/);

rejects('rejects a deviant shortcut that skips the reported go-upstairs step', d => {
  d.edges.push({ id: 'e_fixture_deviant_alice', from: 's_deviant', to: 's_reach_alice', kind: 'traced', src: ['powerpyxStormy'] });
}, /s_deviant should offer only go-upstairs and reason-with-Todd alternatives/);

rejects('rejects extending the Reason with Todd endpoint into Todd killed', d => {
  d.edges.push({ id: 'e_fixture_reason_dead', from: 's_todd_upstairs_first', to: 's_dead', kind: 'traced', src: ['powerpyxStormy'] });
}, /s_todd_upstairs_first must remain a scoped endpoint/);

rejects('rejects a duplicate first-floor event ID', d => {
  const node = d.nodes.find(n => n.id === 'a_wash_dishes');
  node.id = 'a_take_out_trash';
}, /duplicate node id "a_take_out_trash"/);

rejects('rejects removing the laundry to Red Ice progression', d => {
  d.edges = d.edges.filter(e => e.id !== 'e_home_rewash_red_ice');
}, /u_home_first_floor_order.*missing edge|A New Home first-floor events|e_home_rewash_red_ice must preserve/);

rejects('rejects a generic chore spoke from the first-floor stage', d => {
  d.edges.push({ id: 'e_fixture_chore_spoke', from: 'a_clean1', to: 'a_wash_dishes', kind: 'conditional', src: ['powerpyxHome'] });
}, /unsupported CLEAN FIRST FLOOR spokes/);

rejects('rejects claiming that first-floor chores are optional', d => {
  d.nodes.find(n => n.id === 'a_wash_dishes').note = 'Optional activity.';
}, /must not claim unsupported optionality/);

rejects('rejects removing the first-floor ordering uncertainty', d => {
  d.uncertainties = d.uncertainties.filter(u => u.id !== 'u_home_first_floor_order');
}, /u_home_first_floor_order must remain explicit/);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
