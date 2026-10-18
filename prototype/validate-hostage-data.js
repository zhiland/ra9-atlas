/* Node / edge / layout validator for prototype/hostage-data.js (PoC3 — The Hostage).
   Dependency-free: Node core modules only. Loads the data file as text and evaluates
   it in a function scope, matching the pattern of validate-map-data.js.

   Run:  node prototype/validate-hostage-data.js
   Exit code 1 if any check fails. */

'use strict';

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'hostage-data.js');
const source = fs.readFileSync(dataFile, 'utf8');
const { HOSTAGE } = new Function(source + '\nreturn { HOSTAGE };')();

const nodes = HOSTAGE.nodes;
const edges = HOSTAGE.edges;
const meta = HOSTAGE.meta;
const canvas = HOSTAGE.canvas;
const byId = new Map(nodes.map(n => [n.id, n]));

const checks = [];
const check = (name, run) => checks.push({ name, errors: run() });

/* ---------- 1. Node identity ---------- */
check('unique node IDs', () => {
  const errors = [];
  const seen = new Set();
  for (const n of nodes) {
    if (seen.has(n.id)) errors.push(`duplicate node id "${n.id}"`);
    seen.add(n.id);
  }
  return errors;
});

check('node kind is known and labels are non-empty', () => {
  const errors = [];
  const kinds = new Set(['start', 'action', 'choice', 'flag', 'stage', 'ending']);
  for (const n of nodes) {
    if (!kinds.has(n.kind)) errors.push(`node "${n.id}" has unknown kind "${n.kind}"`);
    if (!n.label) errors.push(`node "${n.id}" has no label`);
    if (n.kind === 'choice') {
      if (!Array.isArray(n.options) || n.options.length !== 2) {
        errors.push(`choice node "${n.id}" must list exactly 2 option labels`);
      }
    }
  }
  return errors;
});

/* ---------- 2. Edge integrity ---------- */
check('edge endpoints exist', () => {
  const errors = [];
  for (const e of edges) {
    if (!byId.has(e.from)) errors.push(`edge from "${e.from}" has no node`);
    if (!byId.has(e.to)) errors.push(`edge to "${e.to}" has no node`);
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

check('edge certainty is valid and uncertain edges carry a reason', () => {
  const errors = [];
  for (const e of edges) {
    if (e.certainty !== 'certain' && e.certainty !== 'uncertain') {
      errors.push(`edge ${e.from}->${e.to} has invalid certainty "${e.certainty}"`);
    }
    if (e.certainty === 'uncertain' && !(e.note && e.note.trim())) {
      errors.push(`uncertain edge ${e.from}->${e.to} has no note explaining the ambiguity`);
    }
  }
  return errors;
});

check('choice edge ports name a real option row', () => {
  const errors = [];
  for (const e of edges) {
    if (e.fromOption == null) continue;
    const n = byId.get(e.from);
    if (!n || n.kind !== 'choice' || !Number.isInteger(e.fromOption) ||
        e.fromOption < 0 || e.fromOption >= n.options.length) {
      errors.push(`edge ${e.from}->${e.to} has an invalid fromOption`);
    }
  }
  return errors;
});

/* ---------- 3. Documented dead ends ---------- */
check('GET CLOSE ENOUGH stays a documented dead end (no invented outgoing link)', () => {
  const errors = [];
  const out = edges.filter(e => e.from === 'get_close');
  if (out.length) errors.push(`get_close gained an outgoing edge; the screenshot shows none`);
  const node = byId.get('get_close');
  if (!node || !/no outgoing/i.test(node.note || '')) {
    errors.push('get_close note no longer states that no outgoing connector is visible');
  }
  return errors;
});

/* ---------- 4. Counts reconciliation ---------- */
check('inventory counts match the transcription', () => {
  const errors = [];
  const kindCount = k => nodes.filter(n => n.kind === k).length;
  const labelCount = nodes.reduce((sum, n) => sum + (n.kind === 'choice' ? n.options.length : 1), 0);
  const choiceOptions = nodes.filter(n => n.kind === 'choice').reduce((s, n) => s + n.options.length, 0);
  const certain = edges.filter(e => e.certainty === 'certain').length;
  const uncertain = edges.filter(e => e.certainty === 'uncertain').length;
  const actual = {
    labels: labelCount,
    nodes: nodes.length,
    actionNodes: kindCount('action') + kindCount('flag'),
    choiceGroups: kindCount('choice'),
    choiceOptions,
    stageLabels: kindCount('stage'),
    startNodes: kindCount('start'),
    endings: kindCount('ending'),
    edges: edges.length,
    certainEdges: certain,
    uncertainEdges: uncertain
  };
  for (const [key, value] of Object.entries(actual)) {
    if (meta.counts[key] !== value) {
      errors.push(`meta.counts.${key} is ${meta.counts[key]} but the data has ${value}`);
    }
  }
  if (actual.labels !== 40) errors.push(`expected 40 unique graph labels, found ${actual.labels}`);
  if (actual.endings !== 6) errors.push(`expected 6 terminal outcomes, found ${actual.endings}`);
  return errors;
});

/* ---------- 5. Layout ---------- */
const overlap = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

check('nodes stay inside the canvas and have positive size', () => {
  const errors = [];
  for (const n of nodes) {
    if (!(n.w > 0 && n.h > 0)) errors.push(`node "${n.id}" has non-positive size`);
    if (n.x < 0 || n.y < 0 || n.x + n.w > canvas.width || n.y + n.h > canvas.height) {
      errors.push(`node "${n.id}" falls outside the ${canvas.width}×${canvas.height} canvas`);
    }
  }
  return errors;
});

check('no two nodes overlap', () => {
  const errors = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (overlap(nodes[i], nodes[j])) {
        errors.push(`nodes "${nodes[i].id}" and "${nodes[j].id}" overlap`);
      }
    }
  }
  return errors;
});

check('stage frames contain their declared children and only their children', () => {
  const errors = [];
  for (const stage of nodes.filter(n => n.kind === 'stage')) {
    const f = stage.frame;
    if (!f) continue;
    if (f.x < 0 || f.y < 0 || f.x + f.w > canvas.width || f.y + f.h > canvas.height) {
      errors.push(`stage "${stage.id}" frame falls outside the canvas`);
    }
    const labelInside = stage.x >= f.x && stage.y >= f.y &&
      stage.x + stage.w <= f.x + f.w && stage.y + stage.h <= f.y + f.h;
    if (!labelInside) errors.push(`stage "${stage.id}" label box is not inside its own frame`);
    const children = new Set(stage.children || []);
    for (const childId of children) {
      const child = byId.get(childId);
      if (!child) { errors.push(`stage "${stage.id}" lists missing child "${childId}"`); continue; }
      const inside = child.x >= f.x && child.y >= f.y &&
        child.x + child.w <= f.x + f.w && child.y + child.h <= f.y + f.h;
      if (!inside) errors.push(`stage "${stage.id}" child "${childId}" is not inside its frame`);
    }
    for (const other of nodes) {
      if (other.id === stage.id || children.has(other.id)) continue;
      if (overlap(f, other)) {
        errors.push(`stage "${stage.id}" frame overlaps non-child node "${other.id}"`);
      }
    }
  }
  return errors;
});

/* ---------- 6. Connectivity of orthogonal routes ----------
   Mirrors the renderer's router. A routed segment must not pass through the
   interior of a node that is not the edge's own source or target. */
function routeSegments(edge, stagger) {
  const a = byId.get(edge.from), b = byId.get(edge.to);
  const fromY = edge.fromOption == null ? a.y + a.h / 2 :
    a.y + (edge.fromOption + 0.5) * a.h / a.options.length;
  const sameCol = Math.abs((a.x + a.w / 2) - (b.x + b.w / 2)) < 26;
  if (sameCol) {
    const cx = a.x + a.w / 2;
    const y1 = b.y > a.y ? a.y + a.h : a.y;
    const y2 = b.y > a.y ? b.y : b.y + b.h;
    return [{ v: true, x: cx, y1: Math.min(y1, y2), y2: Math.max(y1, y2) }];
  }
  if (b.x >= a.x + a.w) {
    const sx = a.x + a.w, sy = fromY, tx = b.x, ty = b.y + b.h / 2;
    const mx = (edge.via != null) ? edge.via : (sx + tx) / 2 + stagger * 16;
    return [
      { v: false, y: sy, x1: Math.min(sx, mx), x2: Math.max(sx, mx) },
      { v: true, x: mx, y1: Math.min(sy, ty), y2: Math.max(sy, ty) },
      { v: false, y: ty, x1: Math.min(mx, tx), x2: Math.max(mx, tx) }
    ];
  }
  const sx = a.x, sy = fromY, tx = b.x + b.w, ty = b.y + b.h / 2;
  const mx = (edge.via != null) ? edge.via : (sx + tx) / 2 - stagger * 16;
  return [
    { v: false, y: sy, x1: Math.min(sx, mx), x2: Math.max(sx, mx) },
    { v: true, x: mx, y1: Math.min(sy, ty), y2: Math.max(sy, ty) },
    { v: false, y: ty, x1: Math.min(mx, tx), x2: Math.max(mx, tx) }
  ];
}

check('orthogonal routes avoid passing through unrelated nodes', () => {
  const errors = [];
  const tol = 2;
  const stagger = {};
  for (const e of edges) {
    stagger[e.from] = stagger[e.from] || 0;
    const segs = routeSegments(e, stagger[e.from]++);
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

/* ---------- Report ---------- */
let failed = false;
console.log('hostage-data.js node/edge/layout validation');
for (const { name, errors } of checks) {
  if (errors.length) {
    failed = true;
    console.log(`  FAIL  ${name}`);
    for (const message of errors) console.log(`        - ${message}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

const c = meta.counts;
console.log(`\nInventory: ${nodes.length} boxes, ${c.labels} labels (incl. ${c.endings} endings), ` +
  `${c.choiceGroups} choice groups (${c.choiceOptions} options), ${c.stageLabels} stage containers.`);
console.log(`Edges: ${c.edges} total — ${c.certainEdges} certain, ${c.uncertainEdges} uncertain (dashed).`);

if (failed) {
  console.log('\nSome checks failed.');
  process.exit(1);
}
console.log('\nAll checks passed.');
