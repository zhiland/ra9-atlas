'use strict';

// Bounded source-regression fence. This checks the reviewed slice, not gameplay.
const NODES = [
  ['sc_park', 'WALKING IN THE PARK', 'stage'],
  ['sc_secret', 'READ "SECRET OF ANDROIDS"', 'action'],
  ['sc_climate', 'READ "CLIMATE CHANGE-UP"', 'action'],
  ['sc_vendor', 'STARE AT HOT DOG VENDOR', 'action'],
  ['sc_pushed', 'HOT DOG VENDOR PUSHES MARKUS', 'action'],
  ['sc_busker', 'LISTEN TO BUSKER', 'action'],
  ['sc_preacher', 'WATCH PREACHER', 'action'],
  ['sc_yells', 'PREACHER YELLS AT MARKUS', 'action'],
  ['sc_store', 'VISIT PAINTS STORE', 'action'],
  ['sc_package', 'COLLECT PACKAGE', 'action'],
  ['sc_protesters', 'PROTESTERS HARASS MARKUS', 'action'],
  ['sc_bus', 'MARKUS TOOK THE BUS', 'outcome']
];
const EDGES = [
  ['e_sc_park_store', 'sc_park', 'sc_store'],
  ['e_sc_store_package', 'sc_store', 'sc_package'],
  ['e_sc_package_bus', 'sc_package', 'sc_bus'],
  ['e_sc_vendor_push', 'sc_vendor', 'sc_pushed'],
  ['e_sc_preacher_yells', 'sc_preacher', 'sc_yells']
];
const UNKNOWN_IDS = ['u_sc_detached_origins', 'u_sc_order', 'u_sc_harassment', 'u_sc_build'];
const DETACHED = ['sc_secret', 'sc_climate', 'sc_vendor', 'sc_busker', 'sc_preacher', 'sc_protesters'];
const list = value => Array.isArray(value) ? value : [];
const records = value => list(value).filter(item => item && typeof item === 'object');
const includes = (values, id) => list(values).includes(id);

function shadesRuntimeErrors(atlas) {
  const errors = [];
  if (!atlas || typeof atlas !== 'object') return ['Shades atlas must be an object'];
  const chapter = records(atlas.chapters).find(c => c.id === 'shades-of-color');
  if (!chapter || chapter.coverage?.status !== 'partial') errors.push('Shades chapter must exist with partial coverage');
  for (const source of ['steamShades', 'powerpyxShades']) {
    if (!includes(chapter?.coverage?.sources, source)) errors.push(`Shades coverage needs source ${source}`);
  }
  const nodes = records(atlas.nodes);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const chapterNodes = nodes.filter(n => n.chapter === 'shades-of-color');
  if (chapterNodes.length !== NODES.length) errors.push('Shades must retain exactly twelve nodes');
  for (const [id, label, kind] of NODES) {
    const node = byId.get(id);
    if (!node || node.chapter !== 'shades-of-color' || node.label !== label || node.kind !== kind || node.status !== 'ocr' || !includes(node.src, 'steamShades')) {
      errors.push(`Shades node ${id} must retain its reviewed label, kind, chart status and source`);
    }
  }
  const ids = new Set([...NODES.map(n => n[0]), ...chapterNodes.map(n => n.id)]);
  const touching = records(atlas.edges).filter(e => ids.has(e.from) || ids.has(e.to));
  if (touching.length !== EDGES.length) errors.push('Shades must retain exactly five reviewed connectors; no detached or cross-chapter edges');
  for (const [id, from, to] of EDGES) {
    const edge = touching.find(e => e.id === id);
    if (!edge || edge.from !== from || edge.to !== to || edge.kind !== 'traced' || edge.fromOption != null || !includes(edge.src, 'steamShades')) {
      errors.push(`Shades edge ${id} must retain reviewed endpoints, traced kind and chart source without an option`);
    }
  }
  const allowed = new Set(EDGES.map(e => e[0]));
  for (const edge of touching) if (!allowed.has(edge.id)) errors.push(`Unexpected Shades edge ${edge.id}`);
  for (const condition of records(atlas.conditions)) {
    if (list(condition.appliesTo).some(id => allowed.has(id))) errors.push('Shades reviewed edges must not acquire eligibility conditions');
  }
  const unknowns = records(atlas.uncertainties);
  for (const id of UNKNOWN_IDS) {
    const record = unknowns.find(u => u.id === id);
    const ownRef = record && (list(record.nodes).some(id => ids.has(id)) || list(record.edges).some(id => allowed.has(id)));
    if (!record || record.status !== 'unknown' || typeof record.explanation !== 'string' || !record.explanation.trim() || !ownRef) errors.push(`Shades unknown ${id} needs explanation and a chapter reference`);
  }
  const detached = unknowns.find(u => u.id === 'u_sc_detached_origins');
  if (!detached || JSON.stringify([...list(detached.nodes)].sort()) !== JSON.stringify([...DETACHED].sort()) || list(detached.edges).length) errors.push('Shades detached origins must retain exactly six node references and no invented edge');
  return errors;
}
module.exports = { shadesRuntimeErrors };
