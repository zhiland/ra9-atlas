'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { compileSource } = require('./build-atlas');

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = value => typeof value === 'string' && value.length > 0;

const NOTE = 'Structural inventory only: these counts observe the committed source structure. They are not source approval, gameplay verification, completeness evidence, or publication permission. Conditions and uncertainties are reported as totals only, never attributed to chapters.';

/* Pure structural coverage inventory. Validates dense arrays and identities,
   rejects sparse-array holes, duplicate chapter/node/edge IDs and unknown
   chapter or endpoint references, and never mutates the input. Counts are
   observations, not approval. */
function buildCoverageReport(atlas) {
  if (!object(atlas)) throw new Error('atlas: expected an object');
  for (const key of ['chapters', 'nodes', 'edges', 'conditions', 'uncertainties', 'conflicts']) {
    const list = atlas[key];
    if (!Array.isArray(list)) throw new Error(`atlas.${key}: expected an array`);
    // forEach skips holes while `.length` still counts them, so a sparse array
    // would silently undercount entries; every index must be a present element.
    for (let i = 0; i < list.length; i++) {
      if (!(i in list)) throw new Error(`${key}[${i}]: expected an object, found a sparse array hole`);
    }
  }
  const chapters = atlas.chapters;
  const chapterIds = new Set();
  chapters.forEach((chapter, i) => {
    if (!object(chapter)) throw new Error(`chapters[${i}]: expected an object`);
    if (!id(chapter.id)) throw new Error(`chapters[${i}].id: expected a nonempty string`);
    if (chapterIds.has(chapter.id)) throw new Error(`chapters[${i}].id: duplicate chapter id "${chapter.id}"`);
    if (!id(chapter.name)) throw new Error(`chapters[${i}].name: expected a nonempty string`);
    const coverage = chapter.coverage;
    if (!object(coverage) || !id(coverage.status) || !id(coverage.scope)) {
      throw new Error(`chapters[${i}].coverage: expected declared status and scope strings`);
    }
    chapterIds.add(chapter.id);
  });
  for (const key of ['conditions', 'uncertainties', 'conflicts']) {
    const seen = new Set();
    atlas[key].forEach((record, i) => {
      if (!object(record)) throw new Error(`${key}[${i}]: expected an object`);
      if (!id(record.id)) throw new Error(`${key}[${i}].id: expected a nonempty string`);
      if (seen.has(record.id)) throw new Error(`${key}[${i}].id: duplicate ${key} id "${record.id}"`);
      seen.add(record.id);
    });
  }
  const rows = new Map(chapters.map(chapter => [chapter.id, {
    nodes: 0,
    internalActiveEdges: 0,
    outgoingCrossChapterActiveEdges: 0,
    incomingCrossChapterActiveEdges: 0,
    withdrawnEdges: 0
  }]));
  const nodeChapters = new Map();
  atlas.nodes.forEach((node, i) => {
    if (!object(node)) throw new Error(`nodes[${i}]: expected an object`);
    if (!id(node.id)) throw new Error(`nodes[${i}].id: expected a nonempty string`);
    if (nodeChapters.has(node.id)) throw new Error(`nodes[${i}].id: duplicate node id "${node.id}"`);
    if (!id(node.chapter)) throw new Error(`nodes[${i}].chapter: expected a nonempty string`);
    if (!chapterIds.has(node.chapter)) throw new Error(`nodes[${i}].chapter: unknown chapter "${node.chapter}"`);
    nodeChapters.set(node.id, node.chapter);
    rows.get(node.chapter).nodes++;
  });
  const edgeIds = new Set();
  const totals = {
    regions: chapters.length,
    nodes: atlas.nodes.length,
    edgeRecords: 0,
    activeEdges: 0,
    withdrawnEdges: 0,
    internalActiveEdges: 0,
    crossChapterActiveEdges: 0,
    conditions: atlas.conditions.length,
    uncertainties: atlas.uncertainties.length,
    conflicts: atlas.conflicts.length
  };
  atlas.edges.forEach((edge, i) => {
    if (!object(edge)) throw new Error(`edges[${i}]: expected an object`);
    if (!id(edge.id)) throw new Error(`edges[${i}].id: expected a nonempty string`);
    if (edgeIds.has(edge.id)) throw new Error(`edges[${i}].id: duplicate edge id "${edge.id}"`);
    edgeIds.add(edge.id);
    if (!id(edge.kind)) throw new Error(`edges[${i}].kind: expected a nonempty string`);
    for (const endpoint of ['from', 'to']) {
      if (!id(edge[endpoint])) throw new Error(`edges[${i}].${endpoint}: expected a nonempty string`);
      if (!nodeChapters.has(edge[endpoint])) throw new Error(`edges[${i}].${endpoint}: unknown node "${edge[endpoint]}"`);
    }
    totals.edgeRecords++;
    const sourceChapter = nodeChapters.get(edge.from);
    const targetChapter = nodeChapters.get(edge.to);
    if (edge.kind === 'withdrawn') {
      // Withdrawn records keep history without counting as active; they are
      // attributed once, by their source (from) chapter.
      totals.withdrawnEdges++;
      rows.get(sourceChapter).withdrawnEdges++;
      return;
    }
    totals.activeEdges++;
    if (sourceChapter === targetChapter) {
      totals.internalActiveEdges++;
      rows.get(sourceChapter).internalActiveEdges++;
    } else {
      // Cross-chapter edges never inflate internal counts.
      totals.crossChapterActiveEdges++;
      rows.get(sourceChapter).outgoingCrossChapterActiveEdges++;
      rows.get(targetChapter).incomingCrossChapterActiveEdges++;
    }
  });
  return {
    format: 'ra9-atlas.coverage-report',
    version: 1,
    totals,
    chapters: chapters.map(chapter => ({
      id: chapter.id,
      name: chapter.name,
      coverage: { status: chapter.coverage.status, scope: chapter.coverage.scope },
      nodes: rows.get(chapter.id).nodes,
      internalActiveEdges: rows.get(chapter.id).internalActiveEdges,
      outgoingCrossChapterActiveEdges: rows.get(chapter.id).outgoingCrossChapterActiveEdges,
      incomingCrossChapterActiveEdges: rows.get(chapter.id).incomingCrossChapterActiveEdges,
      withdrawnEdges: rows.get(chapter.id).withdrawnEdges
    })),
    note: NOTE
  };
}

/* Deterministic Markdown rendering. Table cells escape backslashes and pipes,
   escape HTML-significant characters (&, <, >) so declared text can never
   introduce raw markup, and only then turn CR/LF line breaks into the
   reporter's own <br>, so declared text cannot break layout. */
function renderMarkdown(report) {
  const cell = value => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n|\r|\n/g, '<br>');
  const lines = [
    '# Atlas structural coverage report',
    '',
    'Totals observed from the committed source and ledger:',
    '',
    '| Metric | Count |',
    '| --- | ---: |'
  ];
  const metrics = [
    ['Regions', 'regions'],
    ['Nodes', 'nodes'],
    ['Edge records', 'edgeRecords'],
    ['Active edges', 'activeEdges'],
    ['Withdrawn edges', 'withdrawnEdges'],
    ['Active internal edges', 'internalActiveEdges'],
    ['Active cross-chapter edges', 'crossChapterActiveEdges'],
    ['Conditions', 'conditions'],
    ['Uncertainties', 'uncertainties'],
    ['Conflicts', 'conflicts']
  ];
  for (const [label, key] of metrics) lines.push(`| ${label} | ${report.totals[key]} |`);
  lines.push(
    '',
    'Chapters in source order:',
    '',
    '| Chapter | ID | Coverage status | Coverage scope | Nodes | Internal active edges | Outgoing cross-chapter edges | Incoming cross-chapter edges | Withdrawn edges |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |'
  );
  for (const row of report.chapters) {
    lines.push(`| ${cell(row.name)} | ${cell(row.id)} | ${cell(row.coverage.status)} | ${cell(row.coverage.scope)} | ${row.nodes} | ${row.internalActiveEdges} | ${row.outgoingCrossChapterActiveEdges} | ${row.incomingCrossChapterActiveEdges} | ${row.withdrawnEdges} |`);
  }
  lines.push(
    '',
    '## Verification limits',
    '',
    `- ${report.note}`,
    '- Declared coverage status and scope are copied from the source, never inferred.',
    '- Every count is a record count; no completeness or source certainty follows from it.'
  );
  return `${lines.join('\n')}\n`;
}

function parseArgs(args) {
  const options = { source: null, ledger: null, markdown: false };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--markdown') { options.markdown = true; continue; }
    if (flag !== '--source' && flag !== '--ledger') throw new Error(`Unknown flag: ${flag}`);
    const value = args[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[flag.slice(2)] = value;
    i++;
  }
  return options;
}

/* Read-only load: both files are validated with the existing compileSource
   gate (ledger identity plus the full atlas validator) before any counting.
   Error messages carry only the label as given, never an absolute path. */
function loadAtlas(options) {
  const root = path.resolve(__dirname, '../..');
  const parsed = {};
  for (const label of ['source', 'ledger']) {
    const fallback = label === 'source' ? 'data/atlas.source.json' : 'data/legacy-index.json';
    const shown = options[label] === null ? fallback : options[label];
    const file = options[label] === null ? path.join(root, fallback) : path.resolve(options[label]);
    let text;
    try { text = fs.readFileSync(file, 'utf8'); }
    catch { throw new Error(`Cannot read ${label} file: ${shown}`); }
    try { parsed[label] = JSON.parse(text); }
    catch (error) { throw new Error(`${label} file is not valid JSON: ${error.message}`); }
  }
  compileSource(parsed.source, parsed.ledger);
  return parsed.source.atlas;
}

function main(args) {
  const options = parseArgs(args);
  const report = buildCoverageReport(loadAtlas(options));
  if (options.markdown) process.stdout.write(renderMarkdown(report));
  else console.log(JSON.stringify(report, null, 2));
}

module.exports = { buildCoverageReport, renderMarkdown };
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
