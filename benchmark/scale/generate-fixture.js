#!/usr/bin/env node
/* Deterministic synthetic fixture for the graph-scale spike.
 *
 * Generates exactly 1,000 ATLAS-compatible nodes and 1,650 directed edges in
 * five neutral regions. This is not game content: the words, topology, and
 * evidence fields are invented solely to exercise the current SVG/DOM renderer.
 *
 * Run directly to write the generated classic script:
 *   node benchmark/scale/generate-fixture.js
 *
 * The benchmark runner calls writeFixture() itself. Output is intentionally
 * ignored by Git; the generator and seed are the reproducible source.
 *
 * Topology: each region is a layered left-to-right DAG (16 columns). Nodes in
 * a column connect forward to the next column, with additional branches and
 * two/three-column joins. Cross-region edges connect later columns of one
 * region to early columns of later regions. Edge kinds are assigned after
 * topology so each region contains traced, conditional, prerequisite, and
 * hypothesis examples. Edge labels are descriptive but synthetic.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SEED = 20261019;
const NODE_TARGET = 1000;
const EDGE_TARGET = 1650;
const COLUMNS = 16;
const NODE_W = 120;
const NODE_H = 52;
const CHOICE_H = 144;
const GAP_X = 36;
const GAP_Y = 18;
const FRAME_W = 2524;
const FRAME_H = 1240;
const MARGIN = 40;
const REGION_GAP = 80;

const REGIONS = [
  {
    id: 'north-archive',
    name: 'North Archive',
    code: 'Synthetic region 01 · intake and index',
    size: 210,
    desc: 'Generated records-intake region. Synthetic topology; not game content.'
  },
  {
    id: 'harbor-office',
    name: 'Harbor Office',
    code: 'Synthetic region 02 · dispatch and inspection',
    size: 205,
    desc: 'Generated dispatch region. Synthetic topology; not game content.'
  },
  {
    id: 'market-records',
    name: 'Market Records',
    code: 'Synthetic region 03 · claims desk',
    size: 200,
    desc: 'Generated claims region. Synthetic topology; not game content.'
  },
  {
    id: 'hill-clinic',
    name: 'Hill Clinic',
    code: 'Synthetic region 04 · referral desk',
    size: 195,
    desc: 'Generated referral region. Synthetic topology; not game content.'
  },
  {
    id: 'transit-annex',
    name: 'Transit Annex',
    code: 'Synthetic region 05 · route planning',
    size: 190,
    desc: 'Generated route-planning region. Synthetic topology; not game content.'
  }
];

const FRAME_POSITIONS = [
  { x: MARGIN, y: MARGIN },
  { x: MARGIN + FRAME_W + REGION_GAP, y: MARGIN },
  { x: MARGIN + (FRAME_W + REGION_GAP) * 2, y: MARGIN },
  { x: MARGIN, y: MARGIN + FRAME_H + REGION_GAP },
  { x: MARGIN + FRAME_W + REGION_GAP, y: MARGIN + FRAME_H + REGION_GAP }
];

/* Original formulation: 40 verbs × 25 objects = 1,000 unique labels. Every
   label is used exactly once. Object lengths are deliberately varied, including
   a few long phrases, so clipping and legibility are measured against labels
   comparable in length to the current production source labels. Do not filter
   this list by rendered length. */
const VERBS = [
  'Review', 'Trace', 'Compare', 'File', 'Inspect', 'Confirm', 'Request',
  'Verify', 'Record', 'Forward', 'Reconcile', 'Collect', 'Check', 'Escalate',
  'Schedule', 'Index', 'Audit', 'Mark', 'Route', 'Summarize', 'Assemble',
  'Dispatch', 'Estimate', 'Note', 'Open', 'Close', 'Assign', 'Prepare',
  'Validate', 'Update', 'Archive', 'Retrieve', 'Classify', 'Measure',
  'Report', 'Approve', 'Flag', 'Track', 'Transfer', 'Bundle'
];

const OBJECTS = [
  'intake ledger',
  'north corridor map',
  'sealed claim packet',
  'archive request',
  'harbor dispatch',
  'clinic referral',
  'transit timetable',
  'market inventory',
  'crate label',
  'staff rota',
  'visitor log',
  'priority queue',
  'storage manifest',
  'inspection note',
  'delivery window',
  'regional directory revision',
  'audit checklist',
  'correction form',
  'service counter',
  'route card',
  'preservation box',
  'repair request',
  'training record',
  'supply room list',
  'cross-region dispatch schedule'
];

const CHOICE_INDICES = [137, 503, 879];
const CHOICE_OPTIONS = [
  ['Hold for second review', 'Release to archive'],
  ['Route to north desk', 'Return to intake'],
  ['Schedule morning handoff', 'Defer to next shift']
];

const CONDITION_LABELS = [
  'second reviewer agrees',
  'intake window remains open',
  'desk has capacity',
  'record matches the index',
  'supervisor sign-off arrives',
  'request stays in scope',
  'duplicate check is clear',
  'route is available'
];

const PREREQUISITE_LABELS = [
  'intake check cleared',
  'referral accepted',
  'inspection note filed',
  'identity match confirmed',
  'storage slot assigned',
  'dispatch window booked',
  'reviewer assigned',
  'claim packet complete'
];

const HYPOTHESIS_LABELS = [
  'cross-region note may apply',
  'earlier index entry may matter',
  'carried desk state is unknown',
  'unconfirmed route dependency',
  'possible missing handoff',
  'unverified claim linkage'
];

const TRACED_LABELS = [
  'standard handoff',
  'follow-up path',
  'records joined',
  'alternate review',
  'confirmed route',
  'branch continues',
  'desk transfer',
  'index refreshed',
  'note carried forward',
  'routing step'
];

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLabels() {
  const all = [];
  VERBS.forEach(function (verb) {
    OBJECTS.forEach(function (object) {
      all.push(verb + ' ' + object);
    });
  });
  if (all.length !== NODE_TARGET) {
    throw new Error('label cross-product must equal node target: ' + all.length + ' / ' + NODE_TARGET);
  }
  if (new Set(all).size !== all.length) throw new Error('duplicate generated labels');
  const rand = mulberry32(SEED ^ 0x51ed270b);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = all[i]; all[i] = all[j]; all[j] = tmp;
  }
  return all;
}

const NODE_LABELS = buildLabels();

function kindFor(globalIndex) {
  if (CHOICE_INDICES.indexOf(globalIndex) !== -1) return 'choice';
  if (globalIndex % 19 === 0) return 'outcome';
  if (globalIndex % 11 === 0) return 'flag';
  return 'action';
}

function optionsFor(globalIndex) {
  const index = CHOICE_INDICES.indexOf(globalIndex);
  return index === -1 ? null : CHOICE_OPTIONS[index].slice();
}

function labelFor(globalIndex) {
  return NODE_LABELS[globalIndex];
}

function buildNodes() {
  const nodes = [];
  const byRegion = {};
  let globalIndex = 0;

  REGIONS.forEach(function (region, regionIndex) {
    const rows = Math.ceil(region.size / COLUMNS);
    const frame = FRAME_POSITIONS[regionIndex];
    const regionNodes = [];
    const columns = [];
    const columnExtra = [];
    for (let c = 0; c < COLUMNS; c++) { columns.push([]); columnExtra.push(0); }

    for (let local = 0; local < region.size; local++) {
      const col = Math.floor(local / rows);
      const row = local % rows;
      const id = 'syn-' + String(globalIndex + 1).padStart(4, '0');
      const kind = kindFor(globalIndex);
      const height = kind === 'choice' ? CHOICE_H : NODE_H;
      const node = {
        id: id,
        chapter: region.id,
        label: labelFor(globalIndex),
        kind: kind,
        x: frame.x + 32 + col * (NODE_W + GAP_X),
        y: frame.y + 64 + row * (NODE_H + GAP_Y) + columnExtra[col],
        w: NODE_W,
        h: height,
        status: 'synthetic',
        note: 'Synthetic fixture node. Not game content, evidence, or a real workflow.'
      };
      const options = optionsFor(globalIndex);
      if (options) node.options = options;
      columnExtra[col] += height - NODE_H;
      nodes.push(node);
      regionNodes.push(node);
      columns[col].push(node);
      globalIndex++;
    }

    byRegion[region.id] = { region: region, nodes: regionNodes, columns: columns, frame: frame };
  });

  return { nodes: nodes, byRegion: byRegion };
}

function buildEdges(byRegion, nodes) {
  const edges = [];
  const seen = new Set();
  const rand = mulberry32(SEED);

  function add(from, to, origin) {
    if (!from || !to || from.id === to.id) return false;
    const key = from.id + '>' + to.id;
    if (seen.has(key)) return false;
    seen.add(key);
    edges.push({ from: from.id, to: to.id, origin: origin || 'local' });
    return true;
  }

  // Base layered links: every non-final node reaches at least one node in the
  // next column. Branches and longer joins add fan-out and fan-in.
  REGIONS.forEach(function (region, regionIndex) {
    const r = byRegion[region.id];
    r.nodes.forEach(function (node, local) {
      const col = Math.floor(local / Math.ceil(region.size / COLUMNS));
      const row = local % Math.ceil(region.size / COLUMNS);
      const next = r.columns[col + 1];
      if (next && next.length) {
        add(node, next[(row + regionIndex) % next.length], 'local');
      }
      if (local % 3 === 0) {
        const branch = r.columns[col + 2];
        if (branch && branch.length) {
          add(node, branch[(row + 1 + regionIndex) % branch.length], 'branch');
        }
      }
      if (local % 5 === 0) {
        const join = r.columns[col + 3];
        if (join && join.length) {
          add(node, join[(row + 2 + regionIndex) % join.length], 'join');
        }
      }
      if (local % 11 === 0 && col < COLUMNS - 3) {
        const extra = r.columns[col + 4];
        if (extra && extra.length) {
          add(node, extra[rand() % extra.length], 'extra');
        }
      }
    });
  });

  // Cross-region edges: adjacent regions plus a few longer jumps. These keep
  // the topology acyclic because region order is never reversed.
  for (let r = 0; r < REGIONS.length - 1; r++) {
    const source = byRegion[REGIONS[r].id];
    const target = byRegion[REGIONS[r + 1].id];
    const sourcePool = source.nodes.filter(function (n) {
      const local = source.nodes.indexOf(n);
      return Math.floor(local / Math.ceil(source.region.size / COLUMNS)) >= COLUMNS - 4;
    });
    const targetPool = target.nodes.filter(function (n) {
      const local = target.nodes.indexOf(n);
      return Math.floor(local / Math.ceil(target.region.size / COLUMNS)) < 4;
    });
    for (let i = 0; i < 30; i++) {
      add(sourcePool[i % sourcePool.length], targetPool[(i * 7 + r) % targetPool.length], 'cross');
    }
    if (r + 2 < REGIONS.length) {
      const far = byRegion[REGIONS[r + 2].id];
      const farPool = far.nodes.filter(function (n) {
        const local = far.nodes.indexOf(n);
        return Math.floor(local / Math.ceil(far.region.size / COLUMNS)) < 3;
      });
      for (let i = 0; i < 10; i++) {
        add(sourcePool[(i * 11 + 3) % sourcePool.length], farPool[(i * 5 + 1) % farPool.length], 'cross');
      }
    }
  }

  // Fill to the exact target with additional forward links. A bounded loop
  // keeps the generator deterministic; the retry guard makes seed drift loud
  // rather than silently changing the fixture size.
  let guard = 0;
  while (edges.length < EDGE_TARGET && guard < 20000) {
    guard++;
    const region = REGIONS[Math.floor(rand() * REGIONS.length)];
    const r = byRegion[region.id];
    const rows = Math.ceil(region.size / COLUMNS);
    const local = Math.floor(rand() * region.size);
    const col = Math.floor(local / rows);
    if (col >= COLUMNS - 1) continue;
    const span = 1 + Math.floor(rand() * Math.min(4, COLUMNS - 1 - col));
    const target = r.columns[col + span];
    if (!target || !target.length) continue;
    add(r.nodes[local], target[Math.floor(rand() * target.length)], 'fill');
  }

  if (edges.length !== EDGE_TARGET) {
    throw new Error('edge target not reached: ' + edges.length + ' / ' + EDGE_TARGET);
  }

  const nodeChapter = {};
  nodes.forEach(function (n) { nodeChapter[n.id] = n.chapter; });
  const random = mulberry32(SEED ^ 0x9e3779b9);

  edges.forEach(function (edge, index) {
    let kind = 'traced';
    if (index % 97 === 0) kind = 'hypothesis';
    else if (index % 59 === 0) kind = 'prerequisite';
    else if (index % 23 === 0) kind = 'conditional';

    edge.kind = kind;
    edge.crossChapter = nodeChapter[edge.from] !== nodeChapter[edge.to];

    if (kind === 'conditional') {
      edge.label = 'condition: ' + CONDITION_LABELS[index % CONDITION_LABELS.length];
    } else if (kind === 'prerequisite') {
      edge.label = 'prerequisite: ' + PREREQUISITE_LABELS[index % PREREQUISITE_LABELS.length];
    } else if (kind === 'hypothesis') {
      edge.label = 'UNRESOLVED hypothesis · ' + HYPOTHESIS_LABELS[index % HYPOTHESIS_LABELS.length];
    } else if (edge.crossChapter || index % 13 === 0) {
      edge.label = TRACED_LABELS[index % TRACED_LABELS.length];
    }

    if (edge.label) {
      // Roughly two-thirds of labels carry explicit positions, as the sample
      // data does when the automatic midpoint is poor. The rest exercise the
      // renderer's getTotalLength/getPointAtLength path.
      if (random() < 0.68) {
        const a = nodes.find(function (n) { return n.id === edge.from; });
        const b = nodes.find(function (n) { return n.id === edge.to; });
        edge.labelAt = {
          x: Math.round((a.x + a.w / 2 + b.x + b.w / 2) / 2),
          y: Math.round((a.y + a.h / 2 + b.y + b.h / 2) / 2) - 10
        };
      }
    }

    delete edge.origin;
    delete edge.crossChapter;
  });

  return edges;
}

function generate() {
  const built = buildNodes();
  const nodes = built.nodes;
  const edges = buildEdges(built.byRegion, nodes);

  if (nodes.length !== NODE_TARGET) {
    throw new Error('node count mismatch: ' + nodes.length + ' / ' + NODE_TARGET);
  }

  const countByKind = function (kind) {
    return edges.filter(function (e) { return e.kind === kind; }).length;
  };
  const nodeChapter = {};
  nodes.forEach(function (n) { nodeChapter[n.id] = n.chapter; });
  const crossChapter = edges.filter(function (e) {
    return nodeChapter[e.from] !== nodeChapter[e.to];
  }).length;

  const chapters = REGIONS.map(function (region, index) {
    return {
      id: region.id,
      name: region.name,
      code: region.code,
      frame: {
        x: FRAME_POSITIONS[index].x,
        y: FRAME_POSITIONS[index].y,
        w: FRAME_W,
        h: FRAME_H
      },
      desc: region.desc
    };
  });

  const counts = {
    chapters: chapters.length,
    nodes: nodes.length,
    edges: edges.length,
    tracedEdges: countByKind('traced'),
    conditionalEdges: countByKind('conditional'),
    prerequisiteEdges: countByKind('prerequisite'),
    hypothesisEdges: countByKind('hypothesis'),
    crossChapterEdges: crossChapter
  };

  const canvas = {
    width: FRAME_POSITIONS[2].x + FRAME_W + MARGIN,
    height: FRAME_POSITIONS[4].y + FRAME_H + MARGIN
  };

  const detail = {};
  nodes.forEach(function (n) {
    detail[n.id] = {
      status: 'Synthetic fixture · not evidence',
      summary: 'Generated benchmark node for ' + n.chapter + '. It exists only to exercise the current SVG/DOM renderer; no real workflow, game event, or evidence is represented.',
      unknown: 'Everything about this node is synthetic. Do not reuse it as content.',
      src: []
    };
  });

  const atlas = {
    meta: {
      project: 'ra9-atlas',
      poc: 'Synthetic scale benchmark',
      title: 'ra9-atlas · synthetic scale fixture',
      subtitle: '1,000 generated nodes · 1,650 generated connectors · not game content',
      version: 'synthetic',
      platform: 'benchmark',
      disclaimer: 'Synthetic fixture generated for renderer measurement only. Not game content, not evidence, and not a claim about gameplay or any real workflow.',
      counts: counts
    },
    refs: {},
    canvas: canvas,
    chapters: chapters,
    nodes: nodes,
    edges: edges,
    detail: detail
  };

  const sortedLabelLengths = nodes.map(function (n) { return n.label.length; }).sort(function (a, b) { return a - b; });
  const labelMedian = sortedLabelLengths.length % 2
    ? sortedLabelLengths[Math.floor(sortedLabelLengths.length / 2)]
    : (sortedLabelLengths[sortedLabelLengths.length / 2 - 1] + sortedLabelLengths[sortedLabelLengths.length / 2]) / 2;
  const labelStats = {
    unique: new Set(nodes.map(function (n) { return n.label; })).size,
    min: sortedLabelLengths[0],
    median: labelMedian,
    max: sortedLabelLengths[sortedLabelLengths.length - 1],
    over30: sortedLabelLengths.filter(function (length) { return length > 30; }).length,
    choiceNodes: nodes.filter(function (n) { return n.kind === 'choice'; }).length
  };

  const detailNode = built.byRegion['harbor-office'].nodes[102];
  const searchNode = nodes[517];
  const fixtureMeta = {
    synthetic: true,
    seed: SEED,
    topology: 'five regions × 16 layered columns; forward branches, joins, and cross-region links',
    nodeTarget: NODE_TARGET,
    edgeTarget: EDGE_TARGET,
    counts: counts,
    labelStats: labelStats,
    representative: {
      detailNodeId: detailNode.id,
      detailNodeLabel: detailNode.label,
      chapterId: detailNode.chapter,
      searchQuery: searchNode.label,
      searchNodeId: searchNode.id
    }
  };

  return { atlas: atlas, meta: fixtureMeta };
}

function writeFixture(outFile) {
  const generated = generate();
  const target = outFile || path.join(__dirname, 'generated', 'atlas-1000-data.js');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const banner = '/* GENERATED FILE — synthetic benchmark fixture, not game content.\n' +
    '   Regenerate with: node benchmark/scale/generate-fixture.js (seed ' + SEED + ').\n' +
    '   Source generator: benchmark/scale/generate-fixture.js. */\n';
  fs.writeFileSync(
    target,
    banner +
      'var ATLAS = ' + JSON.stringify(generated.atlas, null, 2) + ';\n' +
      'var ATLAS_FIXTURE_META = ' + JSON.stringify(generated.meta, null, 2) + ';\n'
  );
  return target;
}

if (require.main === module) {
  const file = writeFixture(process.argv[2]);
  const generated = generate();
  console.log('wrote ' + file);
  console.log(JSON.stringify(generated.meta.counts, null, 2));
  console.log('representative:', JSON.stringify(generated.meta.representative, null, 2));
}

module.exports = { SEED: SEED, generate: generate, writeFixture: writeFixture };
