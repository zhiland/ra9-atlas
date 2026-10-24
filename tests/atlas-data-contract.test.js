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

check('the sample declares contract version 1.1 and separate coverage records', () => {
  eq(real.meta.contractVersion, '1.1');
  eq(real.chapters.map(c => c.coverage.status), ['partial', 'partial', 'partial', 'checked-against-chart', 'partial', 'partial', 'partial']);
  real.chapters.forEach(c => {
    assert(c.coverage.scope && c.coverage.included && c.coverage.omitted, c.id + ' coverage scope/inclusion/omission missing');
    assert(c.coverage.sources.length > 0, c.id + ' coverage has no sources');
  });
});

check('published node IDs keep their order and later slices are appended', () => {
  eq(real.nodes.slice(0, 68).map(n => n.id), [
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
    'a_rewash_clothes', 'a_find_red_ice', 'a_enrage_todd', 'a_watch_todd_tv', 'a_block_todd_view', 'a_activate_vacuum', 'a_take_out_trash',
    'a_clean_todd_room', 'a_tidy_pills', 'a_make_todd_bed', 'a_alice_goes_room', 'a_clean_toilet',
    'a_arrange_bathroom_bottles', 'a_store_bathroom_clothes', 'a_mop_bathroom', 'a_read_android_qb',
    'a_read_putting_price', 'a_read_alice_floor_book', 'a_read_alice_shelf_books'
  ]);
  eq(real.nodes.slice(68, 102).map(n => n.id), [
    'mission_start', 'fish', 'talk_allen', 'stage-search', 'inv_father', 'learn_cause', 'learn_name',
    'inv_gun_case', 'inv_cop_body', 'cops_gun', 'wasted_time', 'go_outside', 'swat_injured',
    'stage-confront', 'stage-negotiate', 'approach', 'helicopter', 'gun_talk', 'wounded_cop',
    'fail_negotiate', 'honest_deviant', 'lie_deviant', 'trust', 'sacrifice_self', 'use_gun',
    'get_close', 'deviant_jumps', 'end_failed', 'end_leapt', 'end_snipers', 'end_died',
    'end_deviant_shot', 'end_connor_shot', 'pe_meet_cop'
  ]);
  eq(real.nodes.length, 128);
});

check('published edge IDs keep their order and later slices are appended', () => {
  eq(real.edges.slice(0, 55).map(e => e.id), [
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
    'e_home_rewash_red_ice', 'e_home_red_ice_enrage_todd', 'e_home_watch_tv_block_view', 'e_home_backyard_rewash_clothes',
    'e_home_pills_gun', 'e_home_todd_bed_alice_room'
  ]);
  eq(real.edges.slice(55, 93).map(e => e.id), [
    'e_hostage_start_allen', 'e_hostage_allen_search',
    'e_hostage_search_father', 'e_hostage_father_cause', 'e_hostage_search_name',
    'e_hostage_search_gun_case', 'e_hostage_search_cop_body', 'e_hostage_cop_body_gun',
    'e_hostage_search_wasted', 'e_hostage_search_outside', 'e_hostage_wasted_confront',
    'e_hostage_outside_confront', 'e_hostage_confront_negotiate',
    'e_hostage_negotiate_approach', 'e_hostage_negotiate_helicopter',
    'e_hostage_negotiate_gun_talk', 'e_hostage_negotiate_wounded_cop',
    'e_hostage_negotiate_honest', 'e_hostage_negotiate_lie', 'e_hostage_negotiate_sacrifice',
    'e_hostage_negotiate_use_gun', 'e_hostage_negotiate_get_close',
    'e_hostage_lie_trust', 'e_hostage_honest_jumps', 'e_hostage_trust_fail_jumps',
    'e_hostage_trust_build_snipers', 'e_hostage_jumps_failed', 'e_hostage_jumps_leapt',
    'e_hostage_sacrifice_died', 'e_hostage_gun_deviant_shot', 'e_hostage_gun_connor_shot',
    'e_hostage_start_fish', 'e_hostage_search_swat', 'e_hostage_negotiate_fail',
    'e_hostage_approach_fail', 'e_hostage_fail_jumps',
    'e_hostage_save_cop_public_enemy', 'e_hostage_cold_approach_fail'
  ]);
  eq(real.edges.length, 113);
  eq(real.edges.map(e => [e.from, e.to, e.kind]).slice(0, 55), [
    ['a_welcome', 'a_todd', 'traced'], ['a_todd', 'a_clean1', 'traced'],
    ['a_clean1', 'a_ask', 'withdrawn'], ['a_ask', 'a_go', 'traced'],
    ['a_go', 'a_clean2', 'traced'], ['a_clean2', 'a_room', 'traced'],
    ['a_room', 'a_talk', 'withdrawn'], ['a_talk', 'a_key', 'conditional'],
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
    ['a_take_laundry_backyard', 'a_rewash_clothes', 'traced'],
    ['a_tidy_pills', 'a_gun_seen', 'traced'],
    ['a_make_todd_bed', 'a_alice_goes_room', 'traced']
  ]);
  eq(real.edges.map(e => [e.from, e.to, e.kind]).slice(55, 93), [
    ['mission_start', 'talk_allen', 'traced'], ['talk_allen', 'stage-search', 'traced'],
    ['stage-search', 'inv_father', 'traced'], ['inv_father', 'learn_cause', 'traced'],
    ['stage-search', 'learn_name', 'traced'], ['stage-search', 'inv_gun_case', 'traced'],
    ['stage-search', 'inv_cop_body', 'traced'], ['inv_cop_body', 'cops_gun', 'traced'],
    ['stage-search', 'wasted_time', 'traced'], ['stage-search', 'go_outside', 'traced'],
    ['wasted_time', 'stage-confront', 'traced'], ['go_outside', 'stage-confront', 'traced'],
    ['stage-confront', 'stage-negotiate', 'traced'],
    ['stage-negotiate', 'approach', 'traced'], ['stage-negotiate', 'helicopter', 'traced'],
    ['stage-negotiate', 'gun_talk', 'traced'], ['stage-negotiate', 'wounded_cop', 'traced'],
    ['stage-negotiate', 'honest_deviant', 'traced'], ['stage-negotiate', 'lie_deviant', 'traced'],
    ['stage-negotiate', 'sacrifice_self', 'traced'], ['stage-negotiate', 'use_gun', 'traced'],
    ['stage-negotiate', 'get_close', 'traced'],
    ['lie_deviant', 'trust', 'traced'], ['honest_deviant', 'deviant_jumps', 'traced'],
    ['trust', 'deviant_jumps', 'traced'], ['trust', 'end_snipers', 'traced'],
    ['deviant_jumps', 'end_failed', 'traced'], ['deviant_jumps', 'end_leapt', 'traced'],
    ['sacrifice_self', 'end_died', 'traced'], ['use_gun', 'end_deviant_shot', 'traced'],
    ['use_gun', 'end_connor_shot', 'traced'],
    ['mission_start', 'fish', 'uncertain'], ['stage-search', 'swat_injured', 'uncertain'],
    ['stage-negotiate', 'fail_negotiate', 'uncertain'], ['approach', 'fail_negotiate', 'uncertain'],
    ['fail_negotiate', 'deviant_jumps', 'traced'],
    ['wounded_cop', 'pe_meet_cop', 'prerequisite'], ['approach', 'fail_negotiate', 'uncertain']
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
    ['cond_window_qte_success', 'SINGLE'],
    ['cond_hostage_save_cop_meet', 'SINGLE']
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
  eq(real.uncertainties.map(u => u.status), Array(22).fill('unknown'));
  eq(real.uncertainties.map(u => u.id), [
    'u_box_trigger', 'u_key_threshold', 'u_home_first_floor_order', 'u_home_second_floor_order', 'u_stormy_internal',
    'u_checkpoint_timer_11', 'u_gun_state_check', 'u_window_route_outcome',
    'u_stormy_escape_todd_state', 'u_hostage_chart_uncertain',
    'u_sc_detached_origins', 'u_sc_order', 'u_sc_harassment', 'u_sc_build', 'u_pt_detached_origins', 'u_pt_order', 'u_pt_clothes', 'u_pt_build', 'u_ptl_group_semantics', 'u_ptl_common_exit', 'u_ptl_completion', 'u_ptl_build'
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
  assert(!real.edges.some(e => e.from === 'a_clean1' && Object.keys(sources).includes(e.to) && e.id !== 'e_home_clean1_trash'),
    'do not invent generic first-floor context spokes');
  const mandatory = real.edges.find(e => e.id === 'e_home_clean1_ask');
  eq([mandatory.from, mandatory.to, mandatory.kind], ['a_clean1', 'a_ask', 'withdrawn']);
  const unknown = real.uncertainties.find(u => u.id === 'u_home_first_floor_order');
  assert(unknown && unknown.status === 'unknown', 'unresolved order and requirements must be recorded');
  Object.keys(sources).forEach(id => assert(unknown.nodes.includes(id), id + ' missing from first-floor uncertainty'));
  ['e_home_backyard_rewash_clothes', 'e_home_rewash_red_ice', 'e_home_red_ice_enrage_todd', 'e_home_watch_tv_block_view'].forEach(id => assert(unknown.edges.includes(id), id + ' missing from first-floor uncertainty'));
});

check('A New Home second-floor expansion appends twelve guide-reported events with scoped sources', () => {
  const byId = new Map(real.nodes.map(n => [n.id, n]));
  const ids = [
    'a_clean_todd_room', 'a_tidy_pills', 'a_make_todd_bed', 'a_alice_goes_room',
    'a_clean_toilet', 'a_arrange_bathroom_bottles', 'a_store_bathroom_clothes', 'a_mop_bathroom',
    'a_read_android_qb', 'a_read_putting_price', 'a_read_alice_floor_book', 'a_read_alice_shelf_books'
  ];
  eq(real.nodes.slice(56, 68).map(n => n.id), ids, 'the 12 second-floor events must be appended in order');
  const sources = {
    a_clean_todd_room: ['powerpyxHome', 'gamefaqs'],
    a_tidy_pills: ['powerpyxHome', 'gamefaqs'],
    a_make_todd_bed: ['powerpyxHome', 'gamefaqs'],
    a_alice_goes_room: ['powerpyxHome', 'gamefaqs'],
    a_clean_toilet: ['powerpyxHome', 'gamefaqs'],
    a_arrange_bathroom_bottles: ['powerpyxHome', 'gamefaqs'],
    a_store_bathroom_clothes: ['powerpyxHome', 'gamefaqs'],
    a_mop_bathroom: ['powerpyxHome', 'gamefaqs'],
    a_read_android_qb: ['powerpyxHome'],
    a_read_putting_price: ['powerpyxHome'],
    a_read_alice_floor_book: ['powerpyxHome', 'gamefaqs'],
    a_read_alice_shelf_books: ['powerpyxHome']
  };
  ids.forEach(id => {
    const node = byId.get(id);
    assert(node && node.chapter === 'home' && node.kind === 'action', id + ' must be an A New Home action event');
    eq(node.src, sources[id], id + ' source attribution');
    assert(/second-floor/i.test(node.sub || ''), id + ' must identify its second-floor context');
    assert(!/\b(optional (activity|event|action|branch)|is mandatory|must be completed|are exclusive|mutually exclusive)\b/i.test(node.note || ''),
      id + ' must not claim unsupported optionality or necessity');
  });
  assert(/PowerPyx-only/i.test(byId.get('a_read_android_qb').note) && /PowerPyx-only/i.test(byId.get('a_read_putting_price').note),
    'the two exact Todd-room magazine titles must stay PowerPyx-only');
});

check('the two second-floor relation edges keep exact semantics and source attribution', () => {
  const ids = ['a_clean_todd_room', 'a_tidy_pills', 'a_make_todd_bed', 'a_alice_goes_room', 'a_clean_toilet',
    'a_arrange_bathroom_bottles', 'a_store_bathroom_clothes', 'a_mop_bathroom', 'a_read_android_qb',
    'a_read_putting_price', 'a_read_alice_floor_book', 'a_read_alice_shelf_books'];
  const touching = real.edges.filter(e => ids.includes(e.from) || ids.includes(e.to));
  eq(touching.map(e => [e.id, e.from, e.to, e.kind, e.src]), [
    ['e_home_pills_gun', 'a_tidy_pills', 'a_gun_seen', 'traced', ['gamefaqs']],
    ['e_home_todd_bed_alice_room', 'a_make_todd_bed', 'a_alice_goes_room', 'traced', ['powerpyxHome', 'gamefaqs']]
  ]);
  eq(real.edges.slice(53, 55).map(e => e.id), ['e_home_pills_gun', 'e_home_todd_bed_alice_room'],
    'the two new relations must stay appended after the prior second-floor slice');
  const pills = real.edges.find(e => e.id === 'e_home_pills_gun');
  assert(/reported sequence/i.test(pills.note) && /not an eligibility requirement/i.test(pills.note),
    'the pills-to-gun link must be a reported sequence, not an eligibility requirement');
  assert(/pill bottle/i.test(pills.note) && /GameFAQs/i.test(pills.note), 'the pills-to-gun link must state the GameFAQs pill-bottle sequence');
  const bed = real.edges.find(e => e.id === 'e_home_todd_bed_alice_room');
  assert(/reported sequence/i.test(bed.note) && /not an eligibility requirement/i.test(bed.note),
    'the bed-to-Alice-room link must be a reported sequence, not an eligibility requirement');
  assert(!real.conditions.some(c => c.appliesTo.some(id => ['e_home_pills_gun', 'e_home_todd_bed_alice_room'].includes(id))),
    'second-floor sequence edges must not inherit later requirements');
});

check('second-floor guide order is recorded without universal room prerequisites or a Talk AND gate', () => {
  const ids = ['a_clean_todd_room', 'a_tidy_pills', 'a_make_todd_bed', 'a_alice_goes_room', 'a_clean_toilet',
    'a_arrange_bathroom_bottles', 'a_store_bathroom_clothes', 'a_mop_bathroom', 'a_read_android_qb',
    'a_read_putting_price', 'a_read_alice_floor_book', 'a_read_alice_shelf_books'];
  const uncertainty = real.uncertainties.find(u => u.id === 'u_home_second_floor_order');
  assert(uncertainty && uncertainty.status === 'unknown', 'the differing second-floor guide orders must stay unknown');
  ids.concat('a_talk').forEach(id => assert(uncertainty.nodes.includes(id), id + ' missing from second-floor order uncertainty'));
  ['e_home_pills_gun', 'e_home_todd_bed_alice_room'].forEach(id => assert(uncertainty.edges.includes(id), id + ' missing from second-floor order uncertainty'));
  assert(/different orders/i.test(uncertainty.explanation), 'the uncertainty must record the source-specific order difference');
  assert(/not universal|not.*AND gate/i.test(uncertainty.explanation), 'the uncertainty must not encode a universal room-cleaning gate');
  assert(!real.edges.some(e => ids.includes(e.from) && ['a_talk', 'a_clean2', 'a_room'].includes(e.to)),
    'second-floor events must not become generic prerequisites or spokes');
  const talkConditions = real.conditions.filter(c => c.appliesTo.includes('e_home_talk_key'));
  eq(talkConditions.map(c => [c.id, c.operator]), [['cond_key_relationship', 'SINGLE']]);
  assert(!real.conditions.some(c => c.appliesTo.includes('e_home_room_talk') && c.operator === 'AND'),
    'Talk with Alice must not gain a universal AND room-cleaning condition');
});

check('the unsupported exact Alice-key relationship level stays removed', () => {
  assert(!/Neutral/i.test(JSON.stringify(real)), 'the atlas data must not claim a Neutral relationship level');
  const key = real.nodes.find(n => n.id === 'a_key');
  const detail = real.detail.a_key;
  const condition = real.conditions.find(c => c.id === 'cond_key_relationship');
  const uncertainty = real.uncertainties.find(u => u.id === 'u_key_threshold');
  const text = [key.note, key.sub, detail.status, detail.summary, detail.unknown, condition.summary,
    condition.requirements.join(' '), uncertainty.explanation].join(' ');
  assert(!/\b(Neutral|Warm|Distant)\b/i.test(text), 'no named or exact relationship level may be claimed');
  assert(/not state|does not state|unstated|not named|exact relationship level/i.test(text),
    'the key text must say the exact relationship level is unknown');
  eq([condition.id, condition.operator, condition.appliesTo, condition.requirements.length],
    ['cond_key_relationship', 'SINGLE', ['e_home_talk_key'], 1]);
  const keyBox = real.edges.find(e => e.id === 'e_home_key_box');
  eq([keyBox.from, keyBox.to, keyBox.kind], ['a_key', 'a_box', 'traced']);
  assert(uncertainty && uncertainty.status === 'unknown', 'u_key_threshold must stay unknown');
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

check('The Hostage chart preserves its 36 pictured connectors and maps 37 explicit edge claims', () => {
  const hostage = real.chapters.find(c => c.id === 'hostage');
  assert(hostage && hostage.coverage.status === 'checked-against-chart', 'Hostage must stay checked against the full chart');
  eq(hostage.frame, { x: 0, y: 1120, w: 4450, h: 1340 });
  const nodes = real.nodes.filter(n => n.chapter === 'hostage');
  eq(nodes.length, 33);
  eq(nodes.filter(n => n.kind === 'stage').map(n => n.label),
    ['SEARCH FOR CLUES', 'CONFRONT DEVIANT OUTSIDE', 'NEGOTIATE WITH DEVIANT']);
  eq(nodes.filter(n => n.kind === 'choice').length, 7);
  eq(nodes.filter(n => n.kind === 'choice').flatMap(n => n.options).length, 14);
  eq(nodes.filter(n => n.kind === 'outcome').map(n => n.label), [
    'CONNOR FAILED TO REACH DEVIANT IN TIME', 'CONNOR LEAPT FOR EMMA AND FELL',
    'SNIPERS SHOT DEVIANT', 'CONNOR DIED PROTECTING EMMA',
    'DEVIANT SHOT CONNOR', 'CONNOR SHOT DEVIANT'
  ]);
  const visible = nodes.flatMap(n => n.kind === 'choice' ? n.options : [n.label]);
  eq(visible.length, 40);
  eq(new Set(visible).size, 40);
  ['MISSION START', 'SAVE FISH', 'LEAVE FISH', 'TALK TO CAPT. ALLEN', 'SEARCH FOR CLUES',
    "INVESTIGATE FATHER'S BODY", 'LEARN CAUSE OF INCIDENT', "LEARN DEVIANT'S NAME",
    'INVESTIGATE GUN CASE', "INVESTIGATE COP'S BODY", "TAKE COP'S GUN", "LEAVE COP'S GUN",
    'WASTED TOO MUCH TIME', 'GO OUTSIDE', 'SWAT INJURED', 'CONFRONT DEVIANT OUTSIDE',
    'NEGOTIATE WITH DEVIANT', 'FRIENDLY APPROACH', 'COLD APPROACH',
    'REFUSE TO DISMISS HELICOPTER', 'DISMISS HELICOPTER', 'BE HONEST ABOUT GUN',
    'LIE ABOUT GUN', 'LEAVE WOUNDED COP', 'SAVE WOUNDED COP', 'FAIL TO NEGOTIATE',
    'BE HONEST WITH DEVIANT', 'LIE TO DEVIANT', 'FAIL TO BUILD TRUST', 'BUILD TRUST',
    'SACRIFICE SELF', 'USE GUN', 'GET CLOSE ENOUGH', 'DEVIANT JUMPS WITH EMMA'
  ].forEach(label => assert(visible.includes(label), 'missing Hostage label ' + label));
  const chartEdges = real.edges.filter(e => {
    const from = real.nodes.find(n => n.id === e.from), to = real.nodes.find(n => n.id === e.to);
    return from.chapter === 'hostage' && to.chapter === 'hostage';
  });
  eq(hostage.coverage.visibleConnectorCount, 36);
  eq(hostage.coverage.modeledEdgeClaimCount, 37);
  eq(chartEdges.length, 37);
  eq(chartEdges.filter(e => e.kind === 'traced').length, 32);
  eq(chartEdges.filter(e => e.kind === 'uncertain').length, 5);
  const friendly = chartEdges.find(e => e.id === 'e_hostage_approach_fail');
  const cold = chartEdges.find(e => e.id === 'e_hostage_cold_approach_fail');
  const jumps = chartEdges.find(e => e.id === 'e_hostage_fail_jumps');
  eq([friendly.fromOption, friendly.kind, real.edges.indexOf(friendly)], [0, 'uncertain', 89]);
  eq([cold.fromOption, cold.kind, real.edges.indexOf(cold)], [1, 'uncertain', 92]);
  eq([jumps.kind, real.edges.indexOf(jumps)], ['traced', 90]);
  assert(/narrowed.*Friendly/i.test(friendly.note), 'old edge index 89 must state its narrowed Friendly meaning');
  assert(/selected.*Cold Approach/i.test(cold.note), 'new edge must remain scoped to the selected Cold path');
  assert(/full Steam chart/i.test(jumps.note) && /not gameplay verification/i.test(jumps.note),
    'resolved FAIL→Jumps must stay a chart-image reading, not a gameplay claim');
  assert(chartEdges.some(e => e.from === 'approach' && e.fromOption === 0 && e.to === 'fail_negotiate') &&
    chartEdges.some(e => e.from === 'approach' && e.fromOption === 1 && e.to === 'fail_negotiate'),
    'option-specific links to one target must remain separate claims');
  assert(chartEdges.filter(e => e.kind === 'uncertain').every(e => e.note), 'uncertain connectors need notes');
  eq(real.edges.filter(e => e.from === 'get_close'), []);
  const unknown = real.uncertainties.find(u => u.id === 'u_hostage_chart_uncertain');
  assert(unknown && unknown.status === 'unknown', 'Hostage chart uncertainty must stay explicit');
  eq(unknown.edges, chartEdges.filter(e => e.kind === 'uncertain').map(e => e.id));
  assert(/chart-transcription uncertainty/i.test(unknown.explanation), 'chart uncertainty should be scoped to the screenshot');
  assert(!unknown.edges.includes('e_hostage_save_cop_public_enemy'), 'chart uncertainty must not include the saved-cop gate');
});

check('the saved-cop Public Enemy carry is one guide-supported prerequisite and no leave consequence', () => {
  const pe = real.chapters.find(c => c.id === 'public-enemy');
  assert(pe && pe.coverage.status === 'partial', 'Public Enemy must stay a partial one-node region');
  const enemyNodes = real.nodes.filter(n => n.chapter === 'public-enemy');
  eq(enemyNodes.map(n => n.id), ['pe_meet_cop']);
  eq(enemyNodes[0].label, 'Meet Cop From Hostage Situation');
  const gate = real.edges.find(e => e.id === 'e_hostage_save_cop_public_enemy');
  assert(gate, 'saved-cop cross edge missing');
  eq([gate.from, gate.to, gate.fromOption, gate.kind], ['wounded_cop', 'pe_meet_cop', 1, 'prerequisite']);
  assert(gate.src.includes('powerpyxHostage') && gate.src.includes('powerpyxPublicEnemy'), 'saved-cop edge needs both PowerPyx references');
  assert(/guide-reported, not gameplay-verified/i.test(gate.note), 'saved-cop edge must state the evidence limit');
  eq(real.edges.filter(e => e.from === 'pe_meet_cop'), []);
  eq(real.edges.filter(e => e.from === 'wounded_cop').map(e => [e.fromOption, e.to]), [[1, 'pe_meet_cop']]);
  const condition = real.conditions.find(c => c.id === 'cond_hostage_save_cop_meet');
  eq([condition.operator, condition.appliesTo, condition.requirements],
    ['SINGLE', ['e_hostage_save_cop_public_enemy'], ['SAVE WOUNDED COP was chosen in The Hostage.']]);
  assert(!real.conditions.some(c => c.id !== 'cond_hostage_save_cop_meet' && c.appliesTo.includes('e_hostage_save_cop_public_enemy')),
    'the saved-cop edge must not inherit another condition');
  assert(!/cop (dies|is killed)|rescue/i.test(gate.label || ''), 'the saved-cop edge must not add later cop outcomes');
});

console.log('atlas-data.js — malformed fixtures');
rejects('rejects duplicate node IDs', d => { d.nodes[1].id = d.nodes[0].id; }, /duplicate node id/);
rejects('rejects duplicate chapter IDs', d => { d.chapters[1].id = d.chapters[0].id; }, /duplicate chapter id/);
rejects('rejects duplicate edge IDs', d => { d.edges[1].id = d.edges[0].id; }, /duplicate edge id/);
rejects('rejects duplicate directed choice-option edges', d => {
  const duplicate = JSON.parse(JSON.stringify(d.edges.find(e => e.id === 'e_hostage_cold_approach_fail')));
  duplicate.id = 'e_fixture_duplicate_cold';
  d.edges.push(duplicate);
}, /duplicate edge approach#1->fail_negotiate/);
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

rejects('rejects Hostage coverage that omits saved-cop carry sources', d => {
  d.chapters.find(c => c.id === 'hostage').coverage.sources = ['steam', 'powerpyxHostage'];
}, /hostage coverage must include the chart\/carry source "powerpyxPublicEnemy"/);

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

rejects('rejects removing a second-floor event', d => {
  d.nodes = d.nodes.filter(n => n.id !== 'a_mop_bathroom');
}, /a_mop_bathroom must be an A New Home action event/);

rejects('rejects an inferred second-floor chore spoke', d => {
  d.edges.push({ id: 'e_fixture_second_floor_spoke', from: 'a_make_todd_bed', to: 'a_clean_todd_room', kind: 'traced', src: ['powerpyxHome'] });
}, /second-floor events must have exactly two local relation edges/);

rejects('rejects a second-floor chore becoming a universal Talk with Alice prerequisite', d => {
  d.edges.push({ id: 'e_fixture_second_floor_talk', from: 'a_mop_bathroom', to: 'a_talk', kind: 'traced', src: ['powerpyxHome'] });
}, /must not become universal prerequisites for Talk with Alice|must have exactly two local relation edges/);

rejects('rejects changing the pills-to-gun source to a guide that does not state the sequence', d => {
  d.edges.find(e => e.id === 'e_home_pills_gun').src = ['powerpyxHome'];
}, /e_home_pills_gun must keep its source attribution/);

rejects('rejects presenting the pills-to-gun report as a prerequisite', d => {
  d.edges.find(e => e.id === 'e_home_pills_gun').kind = 'prerequisite';
}, /e_home_pills_gun must preserve its reported local sequence/);

rejects('rejects removing the second-floor order uncertainty', d => {
  d.uncertainties = d.uncertainties.filter(u => u.id !== 'u_home_second_floor_order');
}, /u_home_second_floor_order must remain explicit/);

rejects('rejects a universal AND condition for Talk with Alice', d => {
  const condition = d.conditions.find(c => c.id === 'cond_key_relationship');
  condition.operator = 'AND';
  condition.requirements = ['Clean Todd’s room.', 'Alice trusts Kara enough to give the key.'];
}, /cond_key_relationship must stay SINGLE/);

rejects('rejects restoring an exact Neutral relationship level', d => {
  const condition = d.conditions.find(c => c.id === 'cond_key_relationship');
  condition.requirements = ['Reported relationship level: Neutral or higher.'];
}, /must not claim a named or exact relationship level/);

rejects('rejects removing the key-to-box relation', d => {
  d.edges = d.edges.filter(e => e.id !== 'e_home_key_box');
}, /e_home_key_box must stay the traced a_key → a_box relation/);

rejects('rejects giving GET CLOSE ENOUGH an outgoing resolution', d => {
  d.edges.push({ id: 'e_fixture_get_close', from: 'get_close', to: 'end_connor_shot', kind: 'traced', src: ['steam'] });
}, /GET CLOSE ENOUGH must stay a no-outgoing-edge endpoint/);

rejects('rejects moving the saved-cop gate off the SAVE option', d => {
  d.edges.find(e => e.id === 'e_hostage_save_cop_public_enemy').fromOption = 0;
}, /saved-cop edge must leave the SAVE WOUNDED COP option/);

rejects('rejects retargeting the saved-cop prerequisite', d => {
  d.edges.find(e => e.id === 'e_hostage_save_cop_public_enemy').to = 'end_connor_shot';
}, /saved-cop edge must target pe_meet_cop|missing documented cross-chapter edge/);

rejects('rejects weakening the saved-cop prerequisite to a traced link', d => {
  d.edges.find(e => e.id === 'e_hostage_save_cop_public_enemy').kind = 'traced';
}, /saved-cop edge must stay a prerequisite|missing documented cross-chapter edge/);

rejects('rejects extending the Public Enemy slice past Meet Cop', d => {
  d.edges.push({ id: 'e_fixture_pe_after', from: 'pe_meet_cop', to: 'k_meet', kind: 'traced', src: ['powerpyxPublicEnemy'] });
}, /pe_meet_cop must not gain an outgoing consequence/);

rejects('rejects dropping the saved-cop condition', d => {
  d.conditions = d.conditions.filter(c => c.id !== 'cond_hostage_save_cop_meet');
}, /saved-cop edge must have exactly one condition/);

rejects('rejects drawing a consequence for LEAVE WOUNDED COP', d => {
  d.edges.push({ id: 'e_fixture_leave_cop', from: 'wounded_cop', to: 'fail_negotiate', fromOption: 0, kind: 'traced', src: ['steam'] });
}, /LEAVE WOUNDED COP must have no drawn consequence/);

rejects('rejects relabelling an unrelated uncertain Hostage connector as traced', d => {
  d.edges.find(e => e.id === 'e_hostage_start_fish').kind = 'traced';
}, /5 uncertain edge claims|must reference exactly the 5 uncertain edge claims/);

rejects('rejects merging Hostage chart uncertainty into the saved-cop gate', d => {
  const unknown = d.uncertainties.find(u => u.id === 'u_hostage_chart_uncertain');
  unknown.edges.push('e_hostage_save_cop_public_enemy');
}, /must reference exactly the 5 uncertain edge claims|must not absorb the guide-supported saved-cop prerequisite/);

rejects('rejects changing a Hostage stage container into a plain box', d => {
  d.nodes.find(n => n.id === 'stage-negotiate').kind = 'action';
}, /hostage should have 3 stage containers/);

check('source correction preserves withdrawn identities and appends exact replacement topology', () => {
  eq(real.edges.slice(93, 96).map(e => [e.id, e.from, e.to]), [
    ['e_home_clean1_trash', 'a_clean1', 'a_take_out_trash'],
    ['e_home_trash_ask', 'a_take_out_trash', 'a_ask'],
    ['e_home_clean2_talk', 'a_clean2', 'a_talk']
  ]);
  eq([real.edges[2].id, real.edges[2].from, real.edges[2].to, real.edges[2].kind],
    ['e_home_clean1_ask', 'a_clean1', 'a_ask', 'withdrawn']);
  eq([real.edges[6].id, real.edges[6].from, real.edges[6].to, real.edges[6].kind],
    ['e_home_room_talk', 'a_room', 'a_talk', 'withdrawn']);
  eq(real.edges[2].replacedBy, ['e_home_clean1_trash', 'e_home_trash_ask']);
  eq(real.edges[6].replacedBy, ['e_home_clean2_talk']);
  eq(['a_clean1', 'a_clean2'].map(id => real.nodes.find(n => n.id === id).kind), ['stage', 'stage']);
  eq(real.meta.counts.activeEdges, 111);
  eq(real.meta.counts.withdrawnEdges, 2);
});
rejects('rejects a withdrawn claim with no reason', d => { delete d.edges[2].note; }, /withdrawal reason/);
rejects('rejects a withdrawn claim with a dangling replacement', d => { d.edges[2].replacedBy = ['e_missing']; }, /must be an active edge/);
rejects('rejects withdrawal cycles or replacement chains', d => { d.edges[2].replacedBy = [d.edges[6].id]; }, /must be an active edge/);
rejects('rejects duplicate replacement references', d => { d.edges[2].replacedBy.push(d.edges[2].replacedBy[0]); }, /repeats a replacement/);
rejects('rejects replacement metadata on an active claim', d => { d.edges[0].replacedBy = [d.edges[1].id]; }, /active but has replacedBy/);
rejects('rejects a live condition on a withdrawn claim', d => { d.conditions[0].appliesTo = [d.edges[2].id]; }, /withdrawn but retains a live condition/);
rejects('rejects diagonal authored paths', d => { d.edges[94].points[1][1] += 5; }, /points must be orthogonal/);
rejects('rejects unanchored authored paths', d => { d.edges[94].points[0][0] -= 1; }, /anchored to endpoint borders/);
rejects('rejects malformed authored paths', d => { d.edges[94].points = ['not a coordinate pair']; }, /finite coordinate pairs/);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
