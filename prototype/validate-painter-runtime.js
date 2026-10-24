'use strict';

// Bounded source-regression fence. This checks the reviewed slice, not gameplay.
const NODES = [
  ['pt_arrive', 'ARRIVING HOME', 'stage'],
  ['pt_package', 'DROP OFF PACKAGE', 'action'],
  ['pt_wake', 'WAKE CARL', 'action'],
  ['pt_breakfast', 'SERVE BREAKFAST', 'action'],
  ['pt_clothes', 'CARL NOTICES MARKUS\' CLOTHES', 'action'],
  ['pt_birds', 'ACTIVATE BIRDS', 'action'],
  ['pt_north', 'READ "NORTH POLE RUSSIA"', 'action'],
  ['pt_titan', 'READ "LIFE ON TITAN"', 'action'],
  ['pt_find', 'FIND SOMETHING TO DO', 'stage']
];
const EDGES = [
  ['e_pt_arrive_package', 'pt_arrive', 'pt_package'],
  ['e_pt_package_wake', 'pt_package', 'pt_wake'],
  ['e_pt_wake_breakfast', 'pt_wake', 'pt_breakfast'],
  ['e_pt_wake_clothes', 'pt_wake', 'pt_clothes'],
  ['e_pt_breakfast_find', 'pt_breakfast', 'pt_find']
];
const UNKNOWN_IDS = ['u_pt_detached_origins', 'u_pt_order', 'u_pt_clothes', 'u_pt_build'];
const DETACHED = ['pt_birds', 'pt_north', 'pt_titan'];
const list = value => Array.isArray(value) ? value : [];
const records = value => list(value).filter(item => item && typeof item === 'object');
const includes = (values, id) => list(values).includes(id);

function painterRuntimeErrors(atlas) {
  const errors = [];
  if (!atlas || typeof atlas !== 'object') return ['Painter atlas must be an object'];
  const chapter = records(atlas.chapters).find(c => c.id === 'the-painter');
  if (!chapter || chapter.coverage?.status !== 'partial') errors.push('Painter chapter must exist with partial coverage');
  for (const source of ['steamPainter', 'powerpyxPainter']) {
    if (!includes(chapter?.coverage?.sources, source)) errors.push(`Painter coverage needs source ${source}`);
  }
  const nodes = records(atlas.nodes);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const chapterNodes = nodes.filter(n => n.chapter === 'the-painter');
  const leisureIds = ['pt_activity','pt_chess','pt_book','pt_piano','pt_studio'];
  if (chapterNodes.length !== NODES.length + leisureIds.length || chapterNodes.some(n => !NODES.some(row => row[0] === n.id) && !leisureIds.includes(n.id))) errors.push('Painter must retain exactly the reviewed opening and leisure nodes');
  for (const [id, label, kind] of NODES) {
    const node = byId.get(id);
    if (!node || node.chapter !== 'the-painter' || node.label !== label || node.kind !== kind || node.status !== 'ocr' || !includes(node.src, 'steamPainter')) {
      errors.push(`Painter node ${id} must retain its reviewed label, kind, chart status and source`);
    }
  }
  const ids = new Set(NODES.map(n => n[0]));
  const touching = records(atlas.edges).filter(e => ids.has(e.from) || ids.has(e.to));
  const bridge = touching.filter(e => e.id === 'e_pt_find_activity' && e.from === 'pt_find' && e.to === 'pt_activity');
  if (touching.length !== EDGES.length + 1 || bridge.length !== 1) errors.push('Painter must retain five opening connectors and one approved leisure bridge');
  for (const [id, from, to] of EDGES) {
    const edge = touching.find(e => e.id === id);
    if (!edge || edge.from !== from || edge.to !== to || edge.kind !== 'traced' || edge.fromOption != null || !includes(edge.src, 'steamPainter')) {
      errors.push(`Painter edge ${id} must retain reviewed endpoints, traced kind and chart source without an option`);
    }
  }
  const allowed = new Set(EDGES.map(e => e[0]));
  for (const edge of touching) if (!allowed.has(edge.id) && !bridge.includes(edge)) errors.push(`Unexpected Painter edge ${edge.id}`);
  for (const condition of records(atlas.conditions)) {
    if (list(condition.appliesTo).some(id => allowed.has(id))) errors.push('Painter reviewed edges must not acquire eligibility conditions');
  }
  const unknowns = records(atlas.uncertainties);
  for (const id of UNKNOWN_IDS) {
    const record = unknowns.find(u => u.id === id);
    const ownRef = record && (list(record.nodes).some(id => ids.has(id)) || list(record.edges).some(id => allowed.has(id)));
    if (!record || record.status !== 'unknown' || typeof record.explanation !== 'string' || !record.explanation.trim() || !ownRef) errors.push(`Painter unknown ${id} needs explanation and a chapter reference`);
  }
  const detached = unknowns.find(u => u.id === 'u_pt_detached_origins');
  if (!detached || JSON.stringify([...list(detached.nodes)].sort()) !== JSON.stringify([...DETACHED].sort()) || list(detached.edges).length) errors.push('Painter detached origins must retain exactly three node references and no invented edge');
  return errors;
}

module.exports = { painterRuntimeErrors };
