/* Usage note — run the checks from the repository root (or this folder):
     node prototype/validate-map-data.js
   Dependency-free: Node core modules only. It loads map-data.js as text and
   evaluates it in a function scope, so no module or fetch support is needed. */
'use strict';

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'map-data.js');
const source = fs.readFileSync(dataFile, 'utf8');
const { maps, detail } = new Function(source + '\nreturn { maps, detail };')();

const checks = [];
const check = (name, run) => checks.push({ name, errors: run() });

// 1. Map node IDs are unique within each map.
check('unique map node IDs', () => {
  const errors = [];
  for (const [mapId, map] of Object.entries(maps)) {
    const seen = new Set();
    for (const n of map.nodes) {
      if (seen.has(n.id)) errors.push(`duplicate node id "${n.id}" in map "${mapId}"`);
      seen.add(n.id);
    }
  }
  return errors;
});

// 2. Every edge endpoint exists as a node in the same map.
check('edge endpoints exist', () => {
  const errors = [];
  for (const [mapId, map] of Object.entries(maps)) {
    const ids = new Set(map.nodes.map(n => n.id));
    for (const e of map.edges) {
      if (!ids.has(e.from)) errors.push(`edge from "${e.from}" has no node in map "${mapId}"`);
      if (!ids.has(e.to)) errors.push(`edge to "${e.to}" has no node in map "${mapId}"`);
    }
  }
  return errors;
});

// 3. The cross-chapter Alice's box -> Todd example stays explicitly unresolved.
check('cross-chapter unresolved example', () => {
  const errors = [];
  const home = maps.home;
  const later = home && home.nodes.find(n => n.id === 'a-later');
  if (!later) errors.push('node "a-later" is missing from map "home"');
  else if (later.status !== 'unresolved') errors.push('node "a-later" is no longer marked status "unresolved"');

  const entry = detail['a-later'];
  if (!entry) errors.push('detail entry "a-later" is missing');
  else {
    if (!(entry.status || '').toLowerCase().includes('unresolved')) errors.push('detail "a-later" status is no longer unresolved');
    const jump = entry.jump;
    if (!Array.isArray(jump) || jump[0] !== 'kara' || jump[1] !== 'k-meet') errors.push('detail "a-later" jump is no longer the kara/k-meet cross-chapter link');
    else if (!(maps[jump[0]] || { nodes: [] }).nodes.some(n => n.id === jump[1])) errors.push(`jump target "${jump[0]}/${jump[1]}" has no node`);
  }

  const edge = (maps.all || { edges: [] }).edges.find(e => e.from === 'o-box' && e.to === 'o-meet');
  if (!edge) errors.push('overview edge o-box -> o-meet is missing');
  else {
    if (edge.kind !== 'unresolved') errors.push('overview edge o-box -> o-meet is no longer kind "unresolved"');
    if (!(edge.label || '').includes('UNRESOLVED')) errors.push('overview edge o-box -> o-meet label no longer states UNRESOLVED');
  }
  return errors;
});

let failed = false;
console.log('map-data.js validation');
for (const { name, errors } of checks) {
  if (errors.length) {
    failed = true;
    console.log(`  FAIL  ${name}`);
    for (const message of errors) console.log(`        - ${message}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

const nodeCount = Object.values(maps).reduce((sum, m) => sum + m.nodes.length, 0);
const edgeCount = Object.values(maps).reduce((sum, m) => sum + m.edges.length, 0);
if (failed) {
  console.log('\nSome checks failed.');
  process.exit(1);
}
console.log(`\nAll checks passed (${Object.keys(maps).length} maps, ${nodeCount} nodes, ${edgeCount} edges).`);
