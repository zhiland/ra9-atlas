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
  check('exactly two cross-chapter links, both into the Kara region', () => {
    const errors = [];
    const cross = edges.filter(e => byId.has(e.from) && byId.has(e.to) && byId.get(e.from).chapter !== byId.get(e.to).chapter);
    if (cross.length !== 2) errors.push(`expected 2 cross-chapter edges, found ${cross.length}`);
    for (const e of cross) {
      if (byId.get(e.to).chapter !== 'kara') errors.push(`cross-chapter edge ${e.from}->${e.to} does not land in "kara"`);
      if (e.kind !== 'hypothesis' && e.kind !== 'prerequisite') {
        errors.push(`cross-chapter edge ${e.from}->${e.to} must be a hypothesis or prerequisite, not "${e.kind}"`);
      }
    }
    const kinds = cross.map(e => e.kind).sort().join(',');
    if (kinds !== 'hypothesis,prerequisite') errors.push(`cross-chapter kinds should be hypothesis + prerequisite, found "${kinds}"`);
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

  /* ---------- 5. Reachability over non-hypothesis edges ---------- */
  const confirmedKinds = new Set(['traced', 'conditional', 'prerequisite']);
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
    if (actual.nodes !== 18) errors.push(`expected 18 boxes, found ${actual.nodes}`);
    if (actual.edges !== 16) errors.push(`expected 16 connectors, found ${actual.edges}`);
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
    `(${c.tracedEdges} traced + ${c.conditionalEdges} reported condition + ${c.prerequisiteEdges} prerequisite gates + ${c.hypothesisEdges} unresolved hypothesis; ${c.crossChapterEdges} cross-chapter).`);
  console.log(`Contract: ${result.counts.conditions} conditions, ${result.counts.uncertainties} uncertainties, ${result.counts.conflicts} conflicts.`);

  if (result.failed) {
    console.log('\nSome checks failed.');
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

module.exports = { readAtlasData, validateAtlas };

if (require.main === module) main();
