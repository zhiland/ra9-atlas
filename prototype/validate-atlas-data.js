/* Node / edge / condition / provenance / layout validator for
   prototype/atlas-data.js (PoC4). Dependency-free: Node core modules only.
   Loads the data file as text and evaluates it in a function scope, matching
   the existing project validators.

   Run:  node prototype/validate-atlas-data.js
   Exit code 1 if any check fails.

   The exported validateAtlas(data) function is also used by
   tests/atlas-data-contract.test.js with deliberately malformed copies of the
   real sample. It never verifies a game claim; it only checks structure. */

'use strict';

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'atlas-data.js');
const CLAIM_STATUSES = new Set(['ocr', 'guide', 'user', 'unresolved', 'mixed']);
const COVERAGE_STATUSES = new Set(['not-added', 'partial', 'checked-against-chart']);
const EDGE_KINDS = new Set(['traced', 'conditional', 'prerequisite', 'hypothesis']);
const CONDITION_OPERATORS = new Set(['SINGLE', 'AND', 'OR']);

function readAtlasData(file) {
  const source = fs.readFileSync(file || dataFile, 'utf8');
  return new Function(source + '\nreturn { ATLAS };')().ATLAS;
}

function validateAtlas(ATLAS) {
  const nodes = ATLAS.nodes || [];
  const edges = ATLAS.edges || [];
  const chapters = ATLAS.chapters || [];
  const conditions = ATLAS.conditions || [];
  const uncertainties = ATLAS.uncertainties || [];
  const conflicts = ATLAS.conflicts || [];
  const refs = ATLAS.refs || {};
  const meta = ATLAS.meta || {};
  const canvas = ATLAS.canvas || { width: 0, height: 0 };
  const byId = new Map(nodes.map(n => [n.id, n]));
  const chapterById = new Map(chapters.map(c => [c.id, c]));
  const edgeById = new Map(edges.filter(e => e && e.id).map(e => [e.id, e]));
  const confirmedKinds = new Set(['traced', 'conditional', 'prerequisite']);

  const checks = [];
  const check = (name, run) => checks.push({ name, errors: run() });

  function sourceRefErrors(owner, value, required, field) {
    const label = field || 'src';
    const errors = [];
    if (required && (!Array.isArray(value) || !value.length)) {
      errors.push(`${owner} has no ${label} keys`);
      return errors;
    }
    if (value == null) return errors;
    if (!Array.isArray(value)) {
      errors.push(`${owner} ${label} must be an array`);
      return errors;
    }
    for (const key of value) if (!refs[key]) errors.push(`${owner} references unknown ref "${key}"`);
    return errors;
  }

  /* ---------- 1. Identity, vocabulary and coverage ---------- */
  check('unique node, chapter, edge, condition and evidence-record IDs', () => {
    const errors = [];
    function unique(list, label) {
      const seen = new Set();
      if (!Array.isArray(list)) {
        errors.push(`${label} records must be an array`);
        return;
      }
      list.forEach((record, index) => {
        const id = record && record.id;
        if (typeof id !== 'string' || !id.trim()) {
          errors.push(`${label} record at index ${index} has no id`);
          return;
        }
        if (seen.has(id)) errors.push(`duplicate ${label} id "${id}"`);
        seen.add(id);
      });
    }
    unique(nodes, 'node');
    unique(chapters, 'chapter');
    unique(edges, 'edge');
    unique(conditions, 'condition');
    unique(uncertainties, 'uncertainty');
    unique(conflicts, 'conflict');
    return errors;
  });

  check('source registry and contract version are declared', () => {
    const errors = [];
    if (meta.contractVersion !== '1.0') errors.push(`meta.contractVersion should be "1.0", found "${meta.contractVersion}"`);
    if (!ATLAS.refs || typeof ATLAS.refs !== 'object' || Array.isArray(ATLAS.refs)) {
      errors.push('ATLAS.refs must be an object of source references');
      return errors;
    }
    for (const [key, url] of Object.entries(refs)) {
      if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
        errors.push(`ref "${key}" is not an http(s) URL`);
      }
    }
    return errors;
  });

  check('node kinds, claim statuses, labels and sources are valid', () => {
    const errors = [];
    const kinds = new Set(['action', 'flag', 'choice', 'outcome']);
    for (const n of nodes) {
      if (!kinds.has(n.kind)) errors.push(`node "${n.id}" has unknown kind "${n.kind}"`);
      if (!CLAIM_STATUSES.has(n.status)) errors.push(`node "${n.id}" has unknown status "${n.status}"`);
      if (!n.label) errors.push(`node "${n.id}" has no label`);
      if (!chapterById.has(n.chapter)) errors.push(`node "${n.id}" references missing chapter "${n.chapter}"`);
      errors.push(...sourceRefErrors(`node "${n.id}"`, n.src, true));
      if (n.kind === 'choice') {
        if (!Array.isArray(n.options) || n.options.length !== 2 || n.options.some(o => !o)) {
          errors.push(`choice node "${n.id}" must list exactly 2 non-empty option labels`);
        }
      }
    }
    return errors;
  });

  check('chapter coverage is separate, valid and sourced', () => {
    const errors = [];
    for (const c of chapters) {
      const coverage = c.coverage;
      if (!coverage || typeof coverage !== 'object') {
        errors.push(`chapter "${c.id}" has no coverage record`);
        continue;
      }
      if (!COVERAGE_STATUSES.has(coverage.status)) {
        errors.push(`chapter "${c.id}" has unknown coverage status "${coverage.status}"`);
      }
      if (typeof coverage.scope !== 'string' || !coverage.scope.trim()) {
        errors.push(`chapter "${c.id}" coverage has no scope`);
      }
      if (typeof coverage.included !== 'string' || !coverage.included.trim()) {
        errors.push(`chapter "${c.id}" coverage has no included-sample note`);
      }
      if (typeof coverage.omitted !== 'string' || !coverage.omitted.trim()) {
        errors.push(`chapter "${c.id}" coverage has no omitted-parts note`);
      }
      errors.push(...sourceRefErrors(`chapter "${c.id}" coverage`, coverage.sources, true, 'source'));
    }
    return errors;
  });

  check('detail entries reference real nodes, refs and source lists', () => {
    const errors = [];
    for (const [id, d] of Object.entries(ATLAS.detail || {})) {
      if (!byId.has(id)) errors.push(`detail entry "${id}" has no node`);
      if (!d.status) errors.push(`detail "${id}" has no status string`);
      errors.push(...sourceRefErrors(`detail "${id}"`, d.src, true));
      if (d.cross) {
        if (!byId.has(d.cross.node)) errors.push(`detail "${id}" cross node "${d.cross.node}" is missing`);
        if (!chapterById.has(d.cross.chapter)) errors.push(`detail "${id}" cross chapter "${d.cross.chapter}" is missing`);
      }
    }
    return errors;
  });

  /* ---------- 2. Edge integrity ---------- */
  check('edge endpoints exist and kinds and sources are valid', () => {
    const errors = [];
    for (const e of edges) {
      if (!byId.has(e.from)) errors.push(`edge from "${e.from}" has no node`);
      if (!byId.has(e.to)) errors.push(`edge to "${e.to}" has no node`);
      if (!EDGE_KINDS.has(e.kind)) errors.push(`edge ${e.from}->${e.to} has unknown kind "${e.kind}"`);
      errors.push(...sourceRefErrors(`edge ${e.from}->${e.to}`, e.src, true));
    }
    return errors;
  });

  check('no self-loops and no duplicate directed edges', () => {
    const errors = [];
    const seen = new Set();
    for (const e of edges) {
      if (e.from === e.to) errors.push(`self-loop on "${e.from}"`);
      const key = `${e.from}->${e.to}`;
      if (seen.has(key)) errors.push(`duplicate edge ${key}`);
      seen.add(key);
    }
    return errors;
  });

  check('uncertainty styles carry notes and explicit label text', () => {
    const errors = [];
    for (const e of edges) {
      if ((e.kind === 'hypothesis' || e.kind === 'conditional' || e.kind === 'prerequisite') && !(e.note && e.note.trim())) {
        errors.push(`edge ${e.from}->${e.to} (${e.kind}) has no note explaining the evidence`);
      }
      if (e.kind === 'hypothesis') {
        if (!(e.label && /UNRESOLVED/.test(e.label))) {
          errors.push(`hypothesis edge ${e.from}->${e.to} must carry an UNRESOLVED label`);
        }
      }
      if (e.kind === 'prerequisite' && !(e.label && /prerequisite/i.test(e.label))) {
        errors.push(`prerequisite edge ${e.from}->${e.to} must label itself as a prerequisite`);
      }
      if (e.fromOption != null) {
        const n = byId.get(e.from);
        if (!n || n.kind !== 'choice' || !Number.isInteger(e.fromOption) || e.fromOption < 0 || e.fromOption >= n.options.length) {
          errors.push(`edge ${e.from}->${e.to} has an invalid fromOption`);
        }
      }
    }
    return errors;
  });

  /* ---------- 3. Conditions and evidence records ---------- */
  check('conditions are plain-English groups over existing edge IDs', () => {
    const errors = [];
    if (!Array.isArray(ATLAS.conditions)) errors.push('ATLAS.conditions must be an array');
    for (const c of conditions) {
      if (!CONDITION_OPERATORS.has(c.operator)) {
        errors.push(`condition "${c.id}" has unknown operator "${c.operator}"`);
      }
      if (typeof c.summary !== 'string' || !c.summary.trim()) {
        errors.push(`condition "${c.id}" has no plain-English summary`);
      }
      if (!Array.isArray(c.requirements) || !c.requirements.length ||
          c.requirements.some(r => typeof r !== 'string' || !r.trim())) {
        errors.push(`condition "${c.id}" has malformed requirements`);
      } else {
        if (c.operator === 'SINGLE' && c.requirements.length !== 1) {
          errors.push(`condition "${c.id}" needs exactly one requirement for SINGLE`);
        }
        if ((c.operator === 'AND' || c.operator === 'OR') && c.requirements.length < 2) {
          errors.push(`condition "${c.id}" needs at least two requirements for ${c.operator}`);
        }
      }
      if (!Array.isArray(c.appliesTo) || !c.appliesTo.length) {
        errors.push(`condition "${c.id}" has no appliesTo edge IDs`);
      } else {
        for (const id of c.appliesTo) {
          if (typeof id !== 'string' || !edgeById.has(id)) {
            errors.push(`condition "${c.id}" applies to missing edge id "${id}"`);
          }
        }
      }
      errors.push(...sourceRefErrors(`condition "${c.id}"`, c.sources, true, 'source'));
    }
    return errors;
  });

  function evidenceRecordErrors(list, label, expectedStatus) {
    const errors = [];
    if (!Array.isArray(list)) {
      errors.push(`${label} records must be an array`);
      return errors;
    }
    for (const record of list) {
      const id = record && record.id;
      if (record.status !== expectedStatus) {
        errors.push(`${label} "${id}" has status "${record.status}", expected "${expectedStatus}"`);
      }
      if (typeof record.explanation !== 'string' || !record.explanation.trim()) {
        errors.push(`${label} "${id}" has no explanation`);
      }
      const hasNodes = Array.isArray(record.nodes) && record.nodes.length > 0;
      const hasEdges = Array.isArray(record.edges) && record.edges.length > 0;
      if (!hasNodes && !hasEdges) errors.push(`${label} "${id}" has no node or edge reference`);
      if (record.nodes != null) {
        if (!Array.isArray(record.nodes) || !record.nodes.length) {
          errors.push(`${label} "${id}" has malformed node references`);
        } else {
          for (const nodeId of record.nodes) {
            if (!byId.has(nodeId)) errors.push(`${label} "${id}" references missing node "${nodeId}"`);
          }
        }
      }
      if (record.edges != null) {
        if (!Array.isArray(record.edges) || !record.edges.length) {
          errors.push(`${label} "${id}" has malformed edge references`);
        } else {
          for (const edgeId of record.edges) {
            if (typeof edgeId !== 'string' || !edgeById.has(edgeId)) {
              errors.push(`${label} "${id}" references missing edge "${edgeId}"`);
            }
          }
        }
      }
      errors.push(...sourceRefErrors(`${label} "${id}"`, record.sources, true, 'source'));
    }
    return errors;
  }

  check('uncertainty and conflict records are complete and distinguishable', () => {
    const errors = [];
    errors.push(...evidenceRecordErrors(uncertainties, 'uncertainty', 'unknown'));
    errors.push(...evidenceRecordErrors(conflicts, 'conflict', 'conflict'));
    return errors;
  });

  /* ---------- 4. Cross-chapter structure ---------- */
  check('exactly four documented cross-chapter links keep their chapter directions', () => {
    const errors = [];
    const cross = edges.filter(e => byId.has(e.from) && byId.has(e.to) && byId.get(e.from).chapter !== byId.get(e.to).chapter);
    const expected = [
      { from: 'a_box', to: 'k_dialogue', kind: 'hypothesis' },
      { from: 's_alive', to: 'k_meet', kind: 'prerequisite' },
      { from: 'a_gun_seen', to: 's_take_gun', kind: 'prerequisite' },
      { from: 'a_window_open', to: 's_window_open', kind: 'prerequisite' }
    ];
    if (cross.length !== expected.length) errors.push(`expected 4 cross-chapter edges, found ${cross.length}`);
    const actual = new Set(cross.map(e => `${e.from}->${e.to}:${e.kind}`));
    for (const want of expected) {
      if (!actual.has(`${want.from}->${want.to}:${want.kind}`)) {
        errors.push(`missing documented cross-chapter edge ${want.from}->${want.to} (${want.kind})`);
      }
    }
    for (const e of cross) {
      if (!expected.some(want => want.from === e.from && want.to === e.to && want.kind === e.kind)) {
        errors.push(`unexpected cross-chapter edge ${e.from}->${e.to} (${e.kind})`);
      }
    }
    return errors;
  });

  check('cross-chapter edges have connector-specific source refs', () => {
    const errors = [];
    const cross = edges.filter(e => byId.has(e.from) && byId.has(e.to) && byId.get(e.from).chapter !== byId.get(e.to).chapter);
    for (const e of cross) {
      if (!Array.isArray(e.src) || !e.src.length) errors.push(`cross-chapter edge ${e.from}->${e.to} has no connector-specific source refs`);
      else for (const key of e.src) if (!refs[key]) errors.push(`cross-chapter edge ${e.from}->${e.to} references unknown ref "${key}"`);
    }
    return errors;
  });

  check('Meet Todd receives exactly the two reported prerequisite gates', () => {
    const errors = [];
    const incoming = edges.filter(e => e.to === 'k_meet');
    if (incoming.length !== 2) errors.push(`k_meet should have 2 incoming edges, found ${incoming.length}`);
    for (const e of incoming) {
      if (e.kind !== 'prerequisite') errors.push(`incoming edge ${e.from}->k_meet has kind "${e.kind}", expected prerequisite`);
    }
    const froms = incoming.map(e => e.from).sort().join(',');
    if (froms !== 'k_terminal,s_alive') errors.push(`gate sources should be k_terminal + s_alive, found "${froms}"`);
    return errors;
  });

  check('Alice box keeps a single unresolved hypothesis edge', () => {
    const errors = [];
    const out = edges.filter(e => e.from === 'a_box');
    if (out.length !== 1) errors.push(`a_box should have exactly 1 outgoing edge, found ${out.length}`);
    else {
      const e = out[0];
      if (e.kind !== 'hypothesis') errors.push(`a_box -> ${e.to} must stay kind "hypothesis", found "${e.kind}"`);
      if (e.to !== 'k_dialogue') errors.push(`a_box hypothesis should target the reported later dialogue node, found "${e.to}"`);
    }
    for (const e of edges) {
      if (e.from === 'a_box' && e.to === 'k_meet') errors.push('a_box -> k_meet must not exist as a confirmed causal edge');
    }
    const box = byId.get('a_box');
    if (!box || !/unresolved/i.test((box.note || '') + ' ' + (box.sub || ''))) {
      errors.push('a_box note/sub no longer states that the later trigger is unresolved');
    }
    const detail = (ATLAS.detail || {}).a_box;
    if (!detail || !/unresolved|cannot be distinguished/i.test((detail.status || '') + ' ' + (detail.unknown || ''))) {
      errors.push('a_box detail no longer carries the unresolved-trigger text');
    }
    return errors;
  });

  check('Todd fate states stay separate and attributed', () => {
    const errors = [];
    const alive = byId.get('s_alive'), dead = byId.get('s_dead');
    if (!alive || !dead) { errors.push('s_alive/s_dead missing'); return errors; }
    const deadOut = edges.filter(e => e.from === 's_dead');
    if (deadOut.length) errors.push('s_dead gained an outgoing edge; the reviewed sources do not describe a drawn link');
    const aliveOut = edges.filter(e => e.from === 's_alive');
    if (aliveOut.length !== 1 || aliveOut[0].to !== 'k_meet') errors.push('s_alive should feed the k_meet gate only');
    const goodbye = (ATLAS.detail || {}).k_goodbye;
    if (!goodbye || !/user-provided/i.test(goodbye.status || '')) {
      errors.push('k_goodbye detail no longer marks the sequence as user-provided');
    }
    return errors;
  });

  check('checkpoint detour reaches the terminal while the 11-minute boundary stays unresolved', () => {
    const errors = [];
    const checkpoint = byId.get('k_checkpoint'), detour = byId.get('k_detour'), late = byId.get('k_late_bus');
    if (!checkpoint || !detour || !late) {
      errors.push('k_checkpoint/k_detour/k_late_bus missing');
      return errors;
    }
    if (checkpoint.kind !== 'choice' || !Array.isArray(checkpoint.options) || checkpoint.options.length !== 2) {
      errors.push('k_checkpoint must stay a two-option choice');
    }
    const fromCheckpoint = edges.filter(e => e.from === 'k_checkpoint');
    if (!fromCheckpoint.some(e => e.fromOption === 0 && e.to === 'k_detour')) errors.push('checkpoint option 0 should lead to k_detour');
    if (!fromCheckpoint.some(e => e.fromOption === 1 && e.to === 'k_terminal')) errors.push('checkpoint option 1 should lead to k_terminal');
    const fromDetour = edges.filter(e => e.from === 'k_detour');
    if (!fromDetour.some(e => e.to === 'k_late_bus')) errors.push('k_detour should keep its late-bus branch');
    if (!fromDetour.some(e => e.to === 'k_terminal')) errors.push('k_detour should keep its on-time terminal branch');
    if (!edges.some(e => e.from === 'k_late_bus' && e.to === 'k_terminal')) {
      errors.push('k_late_bus must not be a silent dead end; it should still reach k_terminal');
    }
    const timer = uncertainties.find(u => u.id === 'u_checkpoint_timer_11');
    if (!timer) errors.push('u_checkpoint_timer_11 is missing');
    else {
      if (!timer.nodes || !timer.nodes.includes('k_detour') || !timer.nodes.includes('k_late_bus')) {
        errors.push('u_checkpoint_timer_11 must reference the detour and late-bus nodes');
      }
      const hasBoth = ['e_kara_detour_late', 'e_kara_detour_terminal'].every(id => timer.edges && timer.edges.includes(id));
      if (!hasBoth) errors.push('u_checkpoint_timer_11 must reference both detour timing edges');
    }
    const timingEdges = ['e_kara_detour_late', 'e_kara_detour_terminal']
      .map(id => edgeById.get(id)).filter(Boolean);
    const texts = [
      (checkpoint.sub || '') + ' ' + (checkpoint.note || ''),
      (detour.sub || '') + ' ' + (detour.note || ''),
      (late.sub || '') + ' ' + (late.note || ''),
      timingEdges.map(e => (e.label || '') + ' ' + (e.note || '')).join(' '),
      timer ? timer.explanation || '' : ''
    ].join(' ');
    if (!/11/.test(texts) || !/unresolved/i.test(texts)) {
      errors.push('checkpoint/detour/late-bus notes must state the unresolved 11-minute boundary');
    }
    if (/<=|>=/.test(texts)) errors.push('checkpoint branch must not invent <= or >= boundary wording');
    return errors;
  });

  check('checkpoint timing predicates stay attached to their own outcome edges', () => {
    const errors = [];
    const late = conditions.find(c => c.id === 'cond_checkpoint_detour_late');
    const ontime = conditions.find(c => c.id === 'cond_checkpoint_detour_ontime');
    if (!late || !ontime) return ['both edge-specific checkpoint timing conditions are required'];
    if (late.operator !== 'AND' || JSON.stringify(late.appliesTo) !== JSON.stringify(['e_kara_detour_late'])) {
      errors.push('late timing condition must apply only to e_kara_detour_late with AND');
    }
    if (ontime.operator !== 'AND' || JSON.stringify(ontime.appliesTo) !== JSON.stringify(['e_kara_detour_terminal'])) {
      errors.push('on-time condition must apply only to e_kara_detour_terminal with AND');
    }
    const lateText = JSON.stringify(late);
    const ontimeText = JSON.stringify(ontime);
    if (!/wait/i.test(lateText) || !/below 11/i.test(lateText) || /above 11/i.test(lateText)) {
      errors.push('late condition must state wait + below 11 only');
    }
    if (!/immediately/i.test(ontimeText) || !/above 11/i.test(ontimeText) || /below 11/i.test(ontimeText)) {
      errors.push('on-time condition must state immediate + above 11 only');
    }
    return errors;
  });

  check('optional A New Home room actions are not asserted as traced chart links', () => {
    const errors = [];
    for (const id of ['e_home_go_gun_seen', 'e_home_room_window']) {
      const edge = edgeById.get(id);
      if (!edge) errors.push(`${id} is missing`);
      else if (edge.kind !== 'conditional' || !/optional/i.test(`${edge.label || ''} ${edge.note || ''}`)) {
        errors.push(`${id} must be a sourced optional-action connector, not a traced chart link`);
      }
    }
    return errors;
  });

  check('A New Home first-floor events keep only source-supported local progressions', () => {
    const errors = [];
    const requiredSources = {
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
    const expected = [
      ['e_home_rewash_red_ice', 'a_rewash_clothes', 'a_find_red_ice'],
      ['e_home_red_ice_enrage_todd', 'a_find_red_ice', 'a_enrage_todd'],
      ['e_home_watch_tv_block_view', 'a_watch_todd_tv', 'a_block_todd_view'],
      ['e_home_backyard_rewash_clothes', 'a_take_laundry_backyard', 'a_rewash_clothes']
    ];
    for (const [id, refs] of Object.entries(requiredSources)) {
      const node = byId.get(id);
      if (!node || node.chapter !== 'home' || !['action', 'outcome'].includes(node.kind)) {
        errors.push(`${id} must be an A New Home action or outcome`);
        continue;
      }
      if (!Array.isArray(node.src) || refs.some(ref => !node.src.includes(ref))) {
        errors.push(`${id} is missing a supporting source`);
      }
      if (!/first-floor event|laundry sequence|during laundry|reported reaction/i.test(node.sub || '')) {
        errors.push(`${id} must identify its first-floor context`);
      }
      if (/\b(optional (activity|event|action|branch)|is mandatory|must be completed|are exclusive|mutually exclusive)\b/i.test(node.note || '')) {
        errors.push(`${id} must not claim unsupported optionality, necessity or exclusivity`);
      }
      const detail = ATLAS.detail && ATLAS.detail[id];
      if (detail && /\b(optional (activity|event|action|branch)|is mandatory|must be completed|are exclusive|mutually exclusive)\b/i.test(`${detail.status || ''} ${detail.summary || ''}`)) {
        errors.push(`${id} detail must not claim unsupported optionality, necessity or exclusivity`);
      }
    }
    const actual = edges.filter(e => Object.keys(requiredSources).includes(e.from) || Object.keys(requiredSources).includes(e.to));
    if (actual.length !== expected.length) errors.push('first-floor events must have only four documented local progression edges');
    for (const [id, from, to] of expected) {
      const edge = edgeById.get(id);
      if (!edge || edge.from !== from || edge.to !== to || edge.kind !== 'traced') {
        errors.push(`${id} must preserve its source-stated local progression`);
      }
      if (edge && (!Array.isArray(edge.src) || edge.src.length === 0)) errors.push(`${id} has no source refs`);
    }
    if (edges.some(e => e.from === 'a_clean1' && Object.keys(requiredSources).includes(e.to))) {
      errors.push('unrelated first-floor chores must not use unsupported CLEAN FIRST FLOOR spokes');
    }
    const uncertainty = uncertainties.find(u => u.id === 'u_home_first_floor_order');
    if (!uncertainty || uncertainty.status !== 'unknown') errors.push('u_home_first_floor_order must remain explicit');
    else {
      const text = uncertainty.explanation || '';
      if (!/different orders/i.test(text) || !/mandatory status/i.test(text)) {
        errors.push('u_home_first_floor_order must scope unknown order and mandatory status');
      }
      for (const id of Object.keys(requiredSources)) {
        if (!uncertainty.nodes || !uncertainty.nodes.includes(id)) errors.push(`u_home_first_floor_order must reference ${id}`);
      }
      for (const [id] of expected) {
        if (!uncertainty.edges || !uncertainty.edges.includes(id)) errors.push(`u_home_first_floor_order must reference ${id}`);
      }
    }
    const mandatory = edgeById.get('e_home_clean1_ask');
    if (!mandatory || mandatory.from !== 'a_clean1' || mandatory.to !== 'a_ask' || mandatory.kind !== 'traced') {
      errors.push('the original CLEAN FIRST FLOOR → ASK TO GO UPSTAIRS sequence must remain');
    }
    return errors;
  });

  check('Alice key keeps the key-to-box relation while the exact relationship level stays unstated', () => {
    const errors = [];
    const key = byId.get('a_key'), talk = byId.get('a_talk'), box = byId.get('a_box');
    if (!key || !talk || !box) {
      errors.push('a_key/a_talk/a_box missing');
      return errors;
    }
    const link = edgeById.get('e_home_talk_key');
    if (!link || link.from !== 'a_talk' || link.to !== 'a_key' || link.kind !== 'conditional') {
      errors.push('e_home_talk_key must stay the conditional a_talk → a_key connector');
    }
    const keyBox = edgeById.get('e_home_key_box');
    if (!keyBox || keyBox.from !== 'a_key' || keyBox.to !== 'a_box' || keyBox.kind !== 'traced') {
      errors.push('e_home_key_box must stay the traced a_key → a_box relation');
    }
    const relation = conditions.find(c => c.id === 'cond_key_relationship');
    if (!relation) errors.push('cond_key_relationship is missing');
    else {
      if (relation.operator !== 'SINGLE') errors.push('cond_key_relationship must stay SINGLE, not an AND/OR rule');
      if (JSON.stringify(relation.appliesTo) !== JSON.stringify(['e_home_talk_key'])) {
        errors.push('cond_key_relationship must apply only to e_home_talk_key');
      }
      if (!Array.isArray(relation.requirements) || relation.requirements.length !== 1) {
        errors.push('cond_key_relationship must keep exactly one unnamed-level requirement');
      }
    }
    const unknown = uncertainties.find(u => u.id === 'u_key_threshold');
    if (!unknown || unknown.status !== 'unknown') errors.push('u_key_threshold must stay explicit');
    else if (!unknown.nodes || !unknown.nodes.includes('a_key') ||
             !unknown.edges || !unknown.edges.includes('e_home_talk_key')) {
      errors.push('u_key_threshold must reference a_key and e_home_talk_key');
    }
    const applies = conditions.filter(c => c.appliesTo && c.appliesTo.includes('e_home_talk_key'));
    if (applies.length !== 1 || applies[0].id !== 'cond_key_relationship') {
      errors.push('e_home_talk_key must not gain additional room-cleaning or universal AND conditions');
    }
    const detail = (ATLAS.detail || {}).a_key;
    const text = [
      key.note || '', key.sub || '', link.label || '', link.note || '',
      JSON.stringify(relation || {}), unknown ? unknown.explanation || '' : '',
      detail ? `${detail.status || ''} ${detail.summary || ''} ${detail.unknown || ''}` : ''
    ].join(' ');
    if (/\b(Neutral|Warm|Distant)\b/i.test(text)) {
      errors.push('the A New Home key text must not claim a named or exact relationship level');
    }
    if (!/(not state|does not state|unstated|not named|without.*threshold|exact relationship level)/i.test(text)) {
      errors.push('the A New Home key text must state that the exact relationship level is unknown');
    }
    return errors;
  });

  check('A New Home second-floor events keep only the two reported local sequences and no universal room prerequisites', () => {
    const errors = [];
    const requiredSources = {
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
    for (const [id, refs] of Object.entries(requiredSources)) {
      const node = byId.get(id);
      if (!node || node.chapter !== 'home' || node.kind !== 'action') {
        errors.push(`${id} must be an A New Home action event`);
        continue;
      }
      if (!Array.isArray(node.src) || refs.some(ref => !node.src.includes(ref))) {
        errors.push(`${id} is missing a supporting source`);
      }
      if (!/second-floor/i.test(node.sub || '')) errors.push(`${id} must identify its second-floor context`);
      if (/\b(optional (activity|event|action|branch)|is mandatory|must be completed|are exclusive|mutually exclusive)\b/i.test(node.note || '')) {
        errors.push(`${id} must not claim unsupported optionality, necessity or exclusivity`);
      }
    }
    const expected = [
      ['e_home_pills_gun', 'a_tidy_pills', 'a_gun_seen', ['gamefaqs']],
      ['e_home_todd_bed_alice_room', 'a_make_todd_bed', 'a_alice_goes_room', ['powerpyxHome', 'gamefaqs']]
    ];
    const newIds = Object.keys(requiredSources);
    const touching = edges.filter(e => newIds.includes(e.from) || newIds.includes(e.to));
    if (touching.length !== expected.length) {
      errors.push(`second-floor events must have exactly two local relation edges, found ${touching.length}`);
    }
    for (const [id, from, to, sources] of expected) {
      const edge = edgeById.get(id);
      if (!edge || edge.from !== from || edge.to !== to || edge.kind !== 'traced') {
        errors.push(`${id} must preserve its reported local sequence as a traced relation`);
        continue;
      }
      if (JSON.stringify(edge.src || []) !== JSON.stringify(sources)) {
        errors.push(`${id} must keep its source attribution: ${sources.join(', ')}`);
      }
      if (!/reported sequence/i.test(edge.note || '') || !/not an eligibility requirement/i.test(edge.note || '')) {
        errors.push(`${id} note must call the relation a reported sequence, not an eligibility requirement`);
      }
    }
    if (edges.slice(-2).map(e => e.id).join(',') !== expected.map(item => item[0]).join(',')) {
      errors.push('the two second-floor relation edges must stay appended after all prior edges');
    }
    if (edges.some(e => newIds.includes(e.from) && e.to === 'a_talk')) {
      errors.push('second-floor events must not become universal prerequisites for Talk with Alice');
    }
    for (const condition of conditions) {
      if (condition.appliesTo && condition.appliesTo.some(id => ['e_home_pills_gun', 'e_home_todd_bed_alice_room'].includes(id))) {
        errors.push(`condition ${condition.id} must not attach a requirement to a second-floor sequence edge`);
      }
    }
    const uncertainty = uncertainties.find(u => u.id === 'u_home_second_floor_order');
    if (!uncertainty || uncertainty.status !== 'unknown') {
      errors.push('u_home_second_floor_order must remain explicit');
    } else {
      const text = uncertainty.explanation || '';
      if (!/different orders/i.test(text) || !/not universal|not.*AND gate/i.test(text)) {
        errors.push('u_home_second_floor_order must scope the differing guide orders without a universal gate');
      }
      for (const id of newIds.concat('a_talk')) {
        if (!uncertainty.nodes || !uncertainty.nodes.includes(id)) errors.push(`u_home_second_floor_order must reference ${id}`);
      }
      for (const [id] of expected) {
        if (!uncertainty.edges || !uncertainty.edges.includes(id)) errors.push(`u_home_second_floor_order must reference ${id}`);
      }
    }
    const toddRoomDetail = (ATLAS.detail || {}).a_clean_todd_room;
    const toddRoomText = toddRoomDetail
      ? `${toddRoomDetail.summary || ''} ${toddRoomDetail.unknown || ''}`
      : '';
    if (!/PowerPyx says Talk with Alice is available only after Todd.s room/i.test(toddRoomText) ||
        !/GameFAQs (?:instead )?says Alice.s room must be cleaned before Todd.s/i.test(toddRoomText)) {
      errors.push('Todd-room detail must preserve the source-specific Talk requirement and differing room order');
    }
    if (/does not make the room cleaning a prerequisite/i.test(toddRoomText)) {
      errors.push('Todd-room detail must not deny the PowerPyx prerequisite report');
    }
    for (const id of ['a_arrange_bathroom_bottles', 'a_store_bathroom_clothes', 'a_mop_bathroom']) {
      const detail = (ATLAS.detail || {})[id];
      const detailText = detail ? `${detail.summary || ''} ${detail.unknown || ''}` : '';
      if (!/PowerPyx lists cleaning the bathroom as one Talk with Alice prerequisite/i.test(detailText) ||
          !/not a verified chart box/i.test(detailText)) {
        errors.push(`${id} must distinguish bathroom-level Talk prerequisite reporting from the guide-listed microtask`);
      }
    }
    return errors;
  });

  check('only Kara shooting Todd carries the gun; window availability gates a distinct successful route', () => {
    const errors = [];
    const gunIn = edges.filter(e => e.to === 's_gun_carried');
    if (gunIn.length !== 1 || gunIn[0].from !== 's_kara_shoots_todd') {
      errors.push('s_gun_carried must have exactly one incoming edge from s_kara_shoots_todd');
    }
    if (edges.some(e => e.from === 's_alice_shoots_todd' && e.to === 's_gun_carried')) {
      errors.push('s_alice_shoots_todd must not feed s_gun_carried');
    }
    if (!edges.some(e => e.from === 's_kara_shoots_todd' && e.to === 's_dead')) errors.push('Kara shooting Todd should reach s_dead');
    if (!edges.some(e => e.from === 's_alice_shoots_todd' && e.to === 's_dead')) errors.push('Alice shooting Todd should reach s_dead');
    if (!edges.some(e => e.from === 's_take_gun' && e.to === 's_gun_struggle')) errors.push('taking the gun should lead to the reported struggle');
    const struggleOut = edges.filter(e => e.from === 's_gun_struggle').map(e => e.to).sort().join(',');
    if (struggleOut !== 's_alice_shoots_todd,s_kara_shoots_todd') {
      errors.push(`gun struggle outcomes should stay Kara + Alice, found "${struggleOut}"`);
    }
    if (!edges.some(e => e.from === 'a_gun_seen' && e.to === 's_take_gun' && e.kind === 'prerequisite')) {
      errors.push('the A New Home gun sighting should stay a prerequisite into s_take_gun');
    }
    if (!edges.some(e => e.from === 'a_window_open' && e.to === 's_window_open' && e.kind === 'prerequisite')) {
      errors.push('the A New Home opened window should stay a prerequisite into s_window_open');
    }
    const windowOut = edges.filter(e => e.from === 's_window_open');
    if (windowOut.length !== 1 || windowOut[0].to !== 's_window_go_out' || windowOut[0].kind !== 'prerequisite') {
      errors.push('s_window_open should have exactly one prerequisite edge into the window exit, not a generic escape');
    }
    if (edges.some(e => e.from === 's_window_open' && ['k_terminal', 'k_meet'].includes(e.to))) {
      errors.push('s_window_open must not connect directly to the terminal or meeting');
    }
    const window = uncertainties.find(u => u.id === 'u_window_route_outcome');
    if (!window) errors.push('u_window_route_outcome is missing');
    else if (!window.nodes || !window.nodes.includes('s_window_open')) {
      errors.push('u_window_route_outcome must reference s_window_open');
    }
    return errors;
  });

  check('two successful non-gun escape routes stay distinct and link to Todd only by inference', () => {
    const errors = [];
    const corridorNodes = ['s_reach_alice', 's_run_away', 's_hide_corridor', 's_todd_passes', 's_front_backyard_escape'];
    const windowNodes = ['s_lock_room', 's_window_go_out', 's_window_qte', 's_window_reach_bus'];
    const corridorChain = [
      ['e_stormy_reach_run_away', 's_reach_alice', 's_run_away'],
      ['e_stormy_run_hide', 's_run_away', 's_hide_corridor'],
      ['e_stormy_hide_todd_passes', 's_hide_corridor', 's_todd_passes'],
      ['e_stormy_todd_passes_front_backyard', 's_todd_passes', 's_front_backyard_escape']
    ];
    const windowChain = [
      ['e_stormy_reach_lock_room', 's_reach_alice', 's_lock_room'],
      ['e_stormy_window_go_out_access', 's_window_open', 's_window_go_out'],
      ['e_stormy_lock_go_out', 's_lock_room', 's_window_go_out'],
      ['e_stormy_go_out_qte', 's_window_go_out', 's_window_qte'],
      ['e_stormy_qte_bus', 's_window_qte', 's_window_reach_bus']
    ];
    for (const id of corridorNodes.concat(windowNodes)) if (!byId.has(id)) errors.push(`route node "${id}" is missing`);
    for (const [id, from, to] of corridorChain.concat(windowChain)) {
      const edge = edgeById.get(id);
      if (!edge) errors.push(`route edge "${id}" is missing`);
      else {
        if (edge.from !== from || edge.to !== to) errors.push(`route edge "${id}" should connect ${from}->${to}`);
        if (!edge.src || !edge.src.length) errors.push(`route edge "${id}" has no connector-specific sources`);
      }
    }
    const corridorKinds = corridorChain.map(([id]) => edgeById.get(id) && edgeById.get(id).kind);
    if (corridorKinds.some(kind => kind !== 'traced')) errors.push('corridor route steps should stay directly guide-stated traced links');
    const windowAccess = edgeById.get('e_stormy_window_go_out_access');
    if (!windowAccess || windowAccess.kind !== 'prerequisite' || !/prerequisite/i.test(windowAccess.label || '')) {
      errors.push('the A New Home window availability must stay a labelled prerequisite into the window exit');
    }
    const qteEdge = edgeById.get('e_stormy_go_out_qte');
    if (!qteEdge || qteEdge.kind !== 'conditional' || !/QTE/.test(`${qteEdge.label || ''} ${qteEdge.note || ''}`)) {
      errors.push('the window QTE success step must stay a sourced conditional edge');
    }
    const shared = corridorNodes.filter(id => windowNodes.includes(id));
    if (shared.length) errors.push(`corridor and window routes must not share step nodes: ${shared.join(',')}`);
    for (const [endpoint, edgeId] of [
      ['s_front_backyard_escape', 'e_stormy_front_backyard_alive'],
      ['s_window_reach_bus', 'e_stormy_window_bus_alive']
    ]) {
      const out = edges.filter(e => e.from === endpoint);
      if (out.length !== 1) errors.push(`${endpoint} must have exactly one outgoing inference edge, found ${out.length}`);
      const inference = edgeById.get(edgeId);
      if (!inference) errors.push(`${edgeId} is missing`);
      else {
        if (inference.from !== endpoint || inference.to !== 's_alive' || inference.kind !== 'hypothesis') {
          errors.push(`${edgeId} must be a hypothesis from ${endpoint} to s_alive`);
        }
        if (!/UNRESOLVED/.test(inference.label || '') || !/inference/i.test(inference.label || '')) {
          errors.push(`${edgeId} label must say UNRESOLVED inference`);
        }
        if (!/Todd/i.test(inference.note || '') || !/not state|does not state|unstated/i.test(inference.note || '')) {
          errors.push(`${edgeId} note must explain that the source does not state Todd’s later state`);
        }
        if (!inference.src || !inference.src.length) errors.push(`${edgeId} has no source refs`);
      }
      if (edges.some(e => e.from === endpoint && ['k_terminal', 'k_meet'].includes(e.to))) {
        errors.push(`${endpoint} must not connect directly to the terminal or meeting`);
      }
    }
    const routeEdgeIds = corridorChain.concat(windowChain).map(([id]) => id);
    for (const condition of conditions) {
      if (condition.id === 'cond_corridor_escape' || condition.id === 'cond_window_escape') {
        errors.push(`${condition.id} must not attach whole-route requirements to each transition`);
      }
      if (condition.appliesTo && condition.appliesTo.some(id => routeEdgeIds.includes(id)) &&
          condition.appliesTo.some(id => !routeEdgeIds.includes(id))) {
        errors.push(`condition ${condition.id} must not mix route-transition edges with unrelated edges`);
      }
    }
    const qteCondition = conditions.find(c => c.id === 'cond_window_qte_success');
    if (!qteCondition || qteCondition.operator !== 'SINGLE' ||
        JSON.stringify(qteCondition.appliesTo) !== JSON.stringify(['e_stormy_go_out_qte']) ||
        !/QTE/i.test(`${qteCondition.summary} ${qteCondition.requirements && qteCondition.requirements.join(' ')}`)) {
      errors.push('the window QTE success condition must apply only to its own transition');
    }
    const unknown = uncertainties.find(u => u.id === 'u_stormy_escape_todd_state');
    if (!unknown) errors.push('u_stormy_escape_todd_state is missing');
    else {
      for (const id of ['s_alive', 's_front_backyard_escape', 's_window_reach_bus']) {
        if (!unknown.nodes || !unknown.nodes.includes(id)) errors.push(`u_stormy_escape_todd_state must reference ${id}`);
      }
      for (const id of ['e_stormy_front_backyard_alive', 'e_stormy_window_bus_alive']) {
        if (!unknown.edges || !unknown.edges.includes(id)) errors.push(`u_stormy_escape_todd_state must reference ${id}`);
      }
      if (!/not state|does not state|unstated/i.test(unknown.explanation || '') || !/inference/i.test(unknown.explanation || '')) {
        errors.push('u_stormy_escape_todd_state must explain that Todd’s state is unstated and the links are inferences');
      }
    }
    return errors;
  });

  check('Stormy Night entry slice keeps fatal and deviant states separate and source-backed', () => {
    const errors = [];
    const requiredNodes = {
      s_todd_orders_stay: 'Todd orders Kara to stay still',
      s_alice_runs_upstairs: 'Alice runs upstairs',
      s_deviant: 'Kara becomes deviant',
      s_fatal_todd_kills: 'Todd kills Alice and Kara',
      s_go_upstairs: 'Go upstairs',
      s_reason_todd: 'Reason with Todd',
      s_todd_upstairs_first: 'Todd reaches Alice before Kara'
    };
    for (const [id, label] of Object.entries(requiredNodes)) {
      const node = byId.get(id);
      if (!node) { errors.push(`${id} is missing`); continue; }
      if (node.chapter !== 'stormy') errors.push(`${id} must stay in the Stormy Night chapter`);
      if (node.label !== label) errors.push(`${id} label should be "${label}", found "${node.label}"`);
      if (!node.src || !node.src.includes('powerpyxStormy') || !node.src.includes('gamerGuidesStormy')) {
        errors.push(`${id} needs both Stormy Night entry sources`);
      }
    }
    const order = byId.get('s_todd_orders_stay'), aliceUpstairs = byId.get('s_alice_runs_upstairs');
    if (order && order.kind !== 'action') errors.push('s_todd_orders_stay must be an event, not a carried-state gate');
    if (aliceUpstairs && aliceUpstairs.kind !== 'action') errors.push('s_alice_runs_upstairs must be an event');
    if (order && !/Alice then runs upstairs/i.test(order.note || '')) errors.push('the Todd order note must preserve the Alice-upstairs sequence');
    const fatal = byId.get('s_fatal_todd_kills'), dead = byId.get('s_dead'), alive = byId.get('s_alive');
    if (fatal && dead && fatal.label === dead.label) errors.push('the fatal non-deviant outcome must not reuse the Todd-killed label');
    if (fatal && !/fatal/i.test(fatal.note || '')) errors.push('s_fatal_todd_kills must identify itself as a fatal outcome');
    if (fatal && !/not .*Todd killed|distinct|separate/i.test(fatal.note || '')) {
      errors.push('s_fatal_todd_kills must distinguish itself from Todd killed');
    }

    const orderEdges = edges.filter(e => e.from === 's_todd_orders_stay');
    if (orderEdges.length !== 1 || orderEdges[0].to !== 's_alice_runs_upstairs' || orderEdges[0].kind !== 'traced') {
      errors.push('Todd’s stay-still order must lead to Alice running upstairs');
    }
    const aliceEdges = edges.filter(e => e.from === 's_alice_runs_upstairs');
    const deviantNode = nodes.find(n => n.id === 's_deviant');
    if (aliceEdges.length !== 2 || !aliceEdges.some(e => e.to === 's_fatal_todd_kills' && /stay still|obey/i.test(e.label || '')) ||
        !aliceEdges.some(e => e.to === 's_deviant') || !/deviant/i.test(deviantNode && deviantNode.label || '')) {
      errors.push('Alice running upstairs must branch to obey/stay-still fatal outcome or the deviant event');
    }
    const fatalIn = edges.filter(e => e.to === 's_fatal_todd_kills');
    if (fatalIn.length !== 1 || fatalIn[0].from !== 's_alice_runs_upstairs') {
      errors.push('s_fatal_todd_kills must follow the stay-still branch after Alice runs upstairs');
    }
    if (edges.some(e => e.from === 's_fatal_todd_kills')) {
      errors.push('s_fatal_todd_kills must remain terminal');
    }

    const deviantOut = edges.filter(e => e.from === 's_deviant').map(e => e.to).sort().join(',');
    if (deviantOut !== 's_go_upstairs,s_reason_todd') {
      errors.push(`s_deviant should offer only go-upstairs and reason-with-Todd alternatives, found "${deviantOut}"`);
    }
    const upstairsOut = edges.filter(e => e.from === 's_go_upstairs').map(e => e.to).join(',');
    if (upstairsOut !== 's_reach_alice') errors.push(`s_go_upstairs should join only s_reach_alice, found "${upstairsOut}"`);
    const reasonOut = edges.filter(e => e.from === 's_reason_todd').map(e => e.to).join(',');
    if (reasonOut !== 's_todd_upstairs_first') errors.push(`s_reason_todd should stop at s_todd_upstairs_first, found "${reasonOut}"`);
    if (edges.some(e => e.from === 's_todd_upstairs_first')) errors.push('s_todd_upstairs_first must remain a scoped endpoint');

    const entryEdgeIds = [
      'e_stormy_todd_orders_alice_upstairs', 'e_stormy_alice_upstairs_stay_still',
      'e_stormy_alice_upstairs_deviant',
      'e_stormy_deviant_go_upstairs',
      'e_stormy_go_upstairs_reach_alice', 'e_stormy_deviant_reason',
      'e_stormy_reason_knocked'
    ];
    for (const id of entryEdgeIds) {
      const edge = edgeById.get(id);
      if (!edge) { errors.push(`${id} is missing`); continue; }
      if (edge.kind !== 'traced') errors.push(`${id} should stay a directly guide-stated traced edge`);
      if (!edge.src || !edge.src.includes('powerpyxStormy') || !edge.src.includes('gamerGuidesStormy')) {
        errors.push(`${id} needs both Stormy Night entry sources`);
      }
      if (['s_alive', 's_dead', 'k_terminal', 'k_meet'].includes(edge.to)) {
        errors.push(`${id} must not imply a Todd-state or later-meeting outcome`);
      }
    }

    if (alive) {
      const aliveIn = edges.filter(e => e.to === 's_alive').map(e => e.from).sort();
      const expectedAlive = ['s_front_backyard_escape', 's_window_reach_bus'];
      if (JSON.stringify(aliveIn) !== JSON.stringify(expectedAlive)) {
        errors.push(`s_alive should keep only the two inferred escape endpoints, found "${aliveIn.join(',')}"`);
      }
    }
    return errors;
  });

  check('fatal or escape states cannot bypass the separate terminal and meeting gates', () => {
    const errors = [];
    const terminalIn = edges.filter(e => e.to === 'k_terminal');
    const terminalSources = terminalIn.map(e => e.from).sort().join(',');
    if (terminalSources !== 'k_checkpoint,k_detour,k_late_bus') {
      errors.push(`k_terminal should receive only the three checkpoint routes, found "${terminalSources}"`);
    }
    for (const e of edges) {
      if (!['k_terminal', 'k_meet'].includes(e.to)) continue;
      const from = byId.get(e.from);
      if (from && from.chapter === 'stormy' && e.from !== 's_alive') {
        errors.push(`Stormy Night state ${e.from} must not connect directly to ${e.to}; only s_alive may feed the meeting gate`);
      }
    }
    const dead = reachableFrom('s_dead');
    for (const kara of ['k_terminal', 'k_meet', 'k_dialogue', 'k_away', 'k_goodbye', 'k_check']) {
      if (dead.has(kara)) errors.push(`s_dead must not reach ${kara} through drawn edges`);
    }
    const fatal = byId.get('s_fatal_todd_kills');
    if (fatal) {
      const fatalOut = edges.filter(e => e.from === 's_fatal_todd_kills');
      if (fatalOut.length) errors.push('s_fatal_todd_kills gained an outgoing edge; the fatal non-deviant outcome must stop there');
      const fatalReach = reachableFrom('s_fatal_todd_kills');
      for (const kara of ['s_alive', 's_dead', 'k_terminal', 'k_meet', 'k_dialogue', 'k_away', 'k_check', 'k_goodbye']) {
        if (fatalReach.has(kara)) errors.push(`s_fatal_todd_kills must not reach ${kara} through drawn edges`);
      }
    }
    return errors;
  });

  /* ---------- 5. Reachability over non-hypothesis edges ---------- */
  function reachableFrom(startId) {
    const seen = new Set([startId]);
    const queue = [startId];
    while (queue.length) {
      const id = queue.shift();
      for (const e of edges) {
        if (e.from === id && confirmedKinds.has(e.kind) && !seen.has(e.to)) {
          seen.add(e.to);
          queue.push(e.to);
        }
      }
    }
    return seen;
  }

  check('reachability: survival reaches the positive outcome, box does not reach the meeting', () => {
    const errors = [];
    const alive = reachableFrom('s_alive');
    if (!alive.has('k_meet')) errors.push('s_alive can no longer reach k_meet');
    if (!alive.has('k_away')) errors.push('s_alive can no longer reach k_away');
    if (!alive.has('k_goodbye')) errors.push('s_alive can no longer reach k_goodbye');
    if (!alive.has('k_check')) errors.push('s_alive can no longer reach k_check');

    const terminal = reachableFrom('k_terminal');
    if (!terminal.has('k_meet')) errors.push('k_terminal can no longer reach k_meet');

    const checkpoint = reachableFrom('k_checkpoint');
    for (const kara of ['k_detour', 'k_late_bus', 'k_terminal', 'k_meet']) {
      if (!checkpoint.has(kara)) errors.push(`k_checkpoint can no longer reach ${kara} through confirmed edges`);
    }
    const late = reachableFrom('k_late_bus');
    if (!late.has('k_terminal')) errors.push('k_late_bus can no longer reach k_terminal through confirmed edges');
    if (!late.has('k_meet')) errors.push('k_late_bus can no longer reach k_meet through confirmed edges');

    const gunCarried = reachableFrom('s_kara_shoots_todd');
    if (!gunCarried.has('s_gun_carried')) errors.push('Kara shooting Todd no longer reaches the carried-gun state');
    const aliceShoots = reachableFrom('s_alice_shoots_todd');
    if (aliceShoots.has('s_gun_carried')) errors.push('Alice shooting Todd must not reach the carried-gun state');

    const dead = reachableFrom('s_dead');
    for (const kara of ['k_meet', 'k_dialogue', 'k_away', 'k_check', 'k_goodbye']) {
      if (dead.has(kara)) errors.push(`s_dead must not reach ${kara} through drawn edges`);
    }

    const box = reachableFrom('a_box');
    if (box.has('k_meet')) errors.push('a_box must not reach k_meet through confirmed edges');
    if (box.has('k_away') || box.has('k_goodbye')) errors.push('a_box must not reach persuasion outcomes through confirmed edges');
    return errors;
  });

  /* ---------- 6. Counts reconciliation ---------- */
  check('inventory counts match the data', () => {
    const errors = [];
    const kindCount = k => edges.filter(e => e.kind === k).length;
    const counts = meta.counts || {};
    const actual = {
      chapters: chapters.length,
      nodes: nodes.length,
      edges: edges.length,
      tracedEdges: kindCount('traced'),
      conditionalEdges: kindCount('conditional'),
      prerequisiteEdges: kindCount('prerequisite'),
      hypothesisEdges: kindCount('hypothesis'),
      crossChapterEdges: edges.filter(e => byId.has(e.from) && byId.has(e.to) && byId.get(e.from).chapter !== byId.get(e.to).chapter).length
    };
    for (const [key, value] of Object.entries(actual)) {
      if (counts[key] !== value) errors.push(`meta.counts.${key} is ${counts[key]} but the data has ${value}`);
    }
    if (actual.nodes !== 68) errors.push(`expected 68 boxes, found ${actual.nodes}`);
    if (actual.edges !== 55) errors.push(`expected 55 connectors, found ${actual.edges}`);
    return errors;
  });

  /* ---------- 7. Layout ---------- */
  const overlap = (a, b) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  check('nodes stay inside their own chapter frame and inside the canvas', () => {
    const errors = [];
    for (const n of nodes) {
      if (!(n.w > 0 && n.h > 0)) errors.push(`node "${n.id}" has non-positive size`);
      const c = chapterById.get(n.chapter);
      const f = c && c.frame;
      if (f) {
        const inside = n.x >= f.x && n.y >= f.y && n.x + n.w <= f.x + f.w && n.y + n.h <= f.y + f.h;
        if (!inside) errors.push(`node "${n.id}" is not inside chapter "${n.chapter}" frame`);
      }
      if (n.x < 0 || n.y < 0 || n.x + n.w > canvas.width || n.y + n.h > canvas.height) {
        errors.push(`node "${n.id}" falls outside the ${canvas.width}×${canvas.height} canvas`);
      }
    }
    return errors;
  });

  check('no two nodes overlap and chapter frames do not overlap each other', () => {
    const errors = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (overlap(nodes[i], nodes[j])) errors.push(`nodes "${nodes[i].id}" and "${nodes[j].id}" overlap`);
      }
    }
    for (let i = 0; i < chapters.length; i++) {
      for (let j = i + 1; j < chapters.length; j++) {
        if (overlap(chapters[i].frame, chapters[j].frame)) {
          errors.push(`chapter frames "${chapters[i].id}" and "${chapters[j].id}" overlap`);
        }
      }
    }
    return errors;
  });

  check('no node sits inside another chapter\'s frame', () => {
    const errors = [];
    for (const n of nodes) {
      for (const c of chapters) {
        if (c.id === n.chapter) continue;
        if (overlap(n, c.frame)) errors.push(`node "${n.id}" (chapter ${n.chapter}) overlaps frame of "${c.id}"`);
      }
    }
    return errors;
  });

  /* ---------- 8. Orthogonal routes avoid unrelated nodes ----------
     Mirrors the renderer's router in prototype/atlas-app.js. */
  function routeSegments(edge) {
    const a = byId.get(edge.from), b = byId.get(edge.to);
    const fromY = edge.fromOption == null ? a.y + a.h / 2 :
      a.y + (edge.fromOption + 0.5) * a.h / a.options.length;
    const sameCol = Math.abs((a.x + a.w / 2) - (b.x + b.w / 2)) < 26;
    const segs = [];
    const h = (y, x1, x2) => { if (Math.abs(x2 - x1) > 0.5) segs.push({ v: false, y, x1: Math.min(x1, x2), x2: Math.max(x1, x2) }); };
    const v = (x, y1, y2) => { if (Math.abs(y2 - y1) > 0.5) segs.push({ v: true, x, y1: Math.min(y1, y2), y2: Math.max(y1, y2) }); };
    if (sameCol) {
      const cx = a.x + a.w / 2, dx = b.x + b.w / 2;
      const down = b.y > a.y;
      v(cx, down ? a.y + a.h : a.y, down ? b.y : b.y + b.h);
      h(down ? b.y : b.y + b.h, cx, dx);
      return segs;
    }
    if (b.x >= a.x + a.w) {
      const sx = a.x + a.w, sy = fromY, tx = b.x, ty = b.y + b.h / 2;
      const mx = edge.via != null ? edge.via : (sx + tx) / 2;
      h(sy, sx, mx); v(mx, sy, ty); h(ty, mx, tx);
      return segs;
    }
    const sx = a.x, sy = fromY, tx = b.x + b.w, ty = b.y + b.h / 2;
    const mx = edge.via != null ? edge.via : (sx + tx) / 2;
    h(sy, sx, mx); v(mx, sy, ty); h(ty, mx, tx);
    return segs;
  }

  check('orthogonal routes avoid passing through unrelated nodes', () => {
    const errors = [];
    const tol = 2;
    for (const e of edges) {
      const from = byId.get(e.from), to = byId.get(e.to);
      if (!from || !to) continue;
      if (e.fromOption != null &&
          (!Array.isArray(from.options) || !Number.isInteger(e.fromOption) ||
           e.fromOption < 0 || e.fromOption >= from.options.length)) continue;
      const segs = routeSegments(e);
      for (const n of nodes) {
        if (n.id === e.from || n.id === e.to) continue;
        for (const s of segs) {
          if (s.v) {
            if (n.x + tol < s.x && s.x < n.x + n.w - tol &&
                s.y1 + tol < n.y + n.h - tol && n.y + tol < s.y2 - tol) {
              errors.push(`edge ${e.from}->${e.to} vertical at x=${Math.round(s.x)} crosses "${n.id}"`);
            }
          } else if (n.x + tol < s.x2 - tol && s.x1 + tol < n.x + n.w - tol &&
                     s.y > n.y + tol && s.y < n.y + n.h - tol) {
            errors.push(`edge ${e.from}->${e.to} horizontal at y=${Math.round(s.y)} crosses "${n.id}"`);
          }
        }
      }
    }
    return errors;
  });

  return {
    checks,
    failed: checks.some(c => c.errors.length),
    counts: { chapters: chapters.length, nodes: nodes.length, edges: edges.length, conditions: conditions.length, uncertainties: uncertainties.length, conflicts: conflicts.length }
  };
}

function main() {
  const ATLAS = readAtlasData(dataFile);
  const result = validateAtlas(ATLAS);
  console.log('atlas-data.js node/edge/condition/provenance/layout validation');
  for (const { name, errors } of result.checks) {
    if (errors.length) {
      console.log(`  FAIL  ${name}`);
      for (const message of errors) console.log(`        - ${message}`);
    } else {
      console.log(`  ok    ${name}`);
    }
  }

  const c = ATLAS.meta.counts;
  console.log(`\nInventory: ${c.chapters} chapters, ${c.nodes} boxes, ${c.edges} connectors ` +
    `(${c.tracedEdges} traced + ${c.conditionalEdges} conditional + ${c.prerequisiteEdges} prerequisite gates + ${c.hypothesisEdges} unresolved hypothesis; ${c.crossChapterEdges} cross-chapter).`);
  console.log(`Contract: ${result.counts.conditions} conditions, ${result.counts.uncertainties} uncertainties, ${result.counts.conflicts} conflicts.`);

  if (result.failed) {
    console.log('\nSome checks failed.');
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

module.exports = { readAtlasData, validateAtlas };

if (require.main === module) main();
