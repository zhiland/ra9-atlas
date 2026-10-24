'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { compileSource } = require('./build-atlas');

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = value => typeof value === 'string' && value.length > 0;

const ARRAY_COLLECTIONS = ['chapters', 'nodes', 'edges', 'conditions', 'uncertainties', 'conflicts'];
const OBJECT_COLLECTIONS = ['refs', 'detail', 'meta', 'canvas'];
const ATLAS_FIELDS = new Set([...ARRAY_COLLECTIONS, ...OBJECT_COLLECTIONS]);
/* Singular label for duplicate-ID messages ("uncertainties" -> "uncertainty"). */
const SINGULAR = { chapters: 'chapter', nodes: 'node', edges: 'edge', conditions: 'condition', uncertainties: 'uncertainty', conflicts: 'conflict' };
const INDEXED_COLLECTIONS = ['nodes', 'edges'];
const VALUE_CHANGED = '(value changed)';

const NOTE = 'Structural differences only: this report compares two independently validated snapshots and records structural differences between them. It never decides which version is true or approved, grants no compatibility or publication permission, performs no gameplay verification, and is not evidence of release readiness.';

/* Stable lexical (UTF-16 code unit) order for identifiers, keys and field
   lists. Locale-sensitive comparison (localeCompare) would make output depend
   on the host environment, breaking determinism. */
const compareLexical = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* Deep JSON equality: object key insertion order is irrelevant, array element
   order matters, and an absent field differs from an explicit null. */
function deepEqual(before, after) {
  if (before === after) return true;
  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after) || before.length !== after.length) return false;
    for (let i = 0; i < before.length; i++) if (!deepEqual(before[i], after[i])) return false;
    return true;
  }
  if (object(before) && object(after)) {
    const keys = Object.keys(before);
    if (keys.length !== Object.keys(after).length) return false;
    return keys.every(key =>
      Object.prototype.hasOwnProperty.call(after, key) && deepEqual(before[key], after[key]));
  }
  return false;
}

/* Sorted top-level field names whose values differ (or whose presence
   differs) between two records. Absent fields differ from null. */
function changedFields(before, after) {
  const fields = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const presentBefore = Object.prototype.hasOwnProperty.call(before, key);
    const presentAfter = Object.prototype.hasOwnProperty.call(after, key);
    if (presentBefore !== presentAfter || !deepEqual(before[key], after[key])) fields.push(key);
  }
  return fields.sort(compareLexical);
}

/* Structural validation of one side. Errors identify side, collection and
   index. Each of the six keyed arrays must be dense, hold objects with
   nonempty string IDs and reject duplicates; refs/detail/meta/canvas must be
   objects. This runs before any comparison so neither input is read past a
   structural failure. */
function validateAtlas(atlas, side) {
  if (!object(atlas)) throw new Error(`${side}: expected an object`);
  for (const key of Object.keys(atlas)) {
    if (!ATLAS_FIELDS.has(key)) throw new Error(`${side}.${key}: unsupported atlas field`);
  }
  for (const key of ARRAY_COLLECTIONS) {
    const list = atlas[key];
    if (!Array.isArray(list)) throw new Error(`${side}.${key}: expected an array`);
    // forEach skips holes while `.length` still counts them, so a sparse array
    // would silently skip entries; every index must be a present element.
    for (let i = 0; i < list.length; i++) {
      if (!(i in list)) throw new Error(`${side}.${key}[${i}]: expected an object, found a sparse array hole`);
    }
    const seen = new Set();
    list.forEach((entry, i) => {
      if (!object(entry)) throw new Error(`${side}.${key}[${i}]: expected an object`);
      if (!id(entry.id)) throw new Error(`${side}.${key}[${i}].id: expected a nonempty string`);
      if (seen.has(entry.id)) throw new Error(`${side}.${key}[${i}].id: duplicate ${SINGULAR[key]} id "${entry.id}"`);
      seen.add(entry.id);
    });
  }
  for (const key of OBJECT_COLLECTIONS) {
    if (!object(atlas[key])) throw new Error(`${side}.${key}: expected an object`);
  }
}

function indexEntries(list) {
  const byId = new Map();
  list.forEach((entry, i) => byId.set(entry.id, { entry, index: i }));
  return byId;
}

function diffCollection(beforeList, afterList) {
  const beforeById = indexEntries(beforeList);
  const afterById = indexEntries(afterList);
  const added = [];
  const removed = [];
  const changed = [];
  for (const entry of afterList) if (!beforeById.has(entry.id)) added.push(entry.id);
  for (const entry of beforeList) if (!afterById.has(entry.id)) removed.push(entry.id);
  for (const entry of beforeList) {
    const match = afterById.get(entry.id);
    if (match && !deepEqual(entry, match.entry)) {
      changed.push({ id: entry.id, fields: changedFields(entry, match.entry) });
    }
  }
  // Reordering is defined by the relative order of IDs COMMON to both arrays,
  // so append/add/remove alone never counts as reordering.
  const commonBefore = beforeList.filter(entry => afterById.has(entry.id)).map(entry => entry.id);
  const commonAfter = afterList.filter(entry => beforeById.has(entry.id)).map(entry => entry.id);
  const reordered = commonBefore.some((entryId, i) => entryId !== commonAfter[i]);
  return {
    added: added.sort(compareLexical),
    removed: removed.sort(compareLexical),
    changed: changed.sort((a, b) => compareLexical(a.id, b.id)),
    reordered
  };
}

/* Retained IDs whose array position moved. `?edge=N` permalinks address
   array indices, so index movement is reported as an observation for both
   ledger-backed collections, sorted by ID. */
function indexMoves(beforeList, afterList) {
  const afterById = indexEntries(afterList);
  const moves = [];
  beforeList.forEach((entry, i) => {
    const match = afterById.get(entry.id);
    if (match && match.index !== i) moves.push({ id: entry.id, before: i, after: match.index });
  });
  return moves.sort((a, b) => compareLexical(a.id, b.id));
}

function diffMap(beforeMap, afterMap) {
  const beforeKeys = Object.keys(beforeMap);
  const afterKeys = Object.keys(afterMap);
  const beforeSet = new Set(beforeKeys);
  const afterSet = new Set(afterKeys);
  const changed = [];
  for (const key of beforeKeys) {
    if (!afterSet.has(key)) continue;
    const beforeValue = beforeMap[key];
    const afterValue = afterMap[key];
    if (deepEqual(beforeValue, afterValue)) continue;
    // Records diff into changed field names; anything else (scalar
    // replacement or a value type change) carries the explicit marker.
    if (object(beforeValue) && object(afterValue)) changed.push({ key, fields: changedFields(beforeValue, afterValue) });
    else changed.push({ key, fields: [VALUE_CHANGED] });
  }
  return {
    added: afterKeys.filter(key => !beforeSet.has(key)).sort(compareLexical),
    removed: beforeKeys.filter(key => !afterSet.has(key)).sort(compareLexical),
    changed: changed.sort((a, b) => compareLexical(a.key, b.key))
  };
}

/* Pure semantic diff of two validated inner atlas objects. Validates both
   sides, never mutates either input and never returns references into them:
   the report contains only freshly created strings, numbers and booleans.
   The report records structural differences only and never decides which
   snapshot is true, approved, compatible or release-ready. */
function buildAtlasDiff(beforeAtlas, afterAtlas) {
  validateAtlas(beforeAtlas, 'before');
  validateAtlas(afterAtlas, 'after');
  const collections = {};
  const legacyIndexChanges = {};
  let hasChanges = false;
  for (const key of ARRAY_COLLECTIONS) {
    const result = diffCollection(beforeAtlas[key], afterAtlas[key]);
    collections[key] = result;
    if (result.added.length || result.removed.length || result.changed.length || result.reordered) hasChanges = true;
    if (INDEXED_COLLECTIONS.includes(key)) {
      legacyIndexChanges[key] = indexMoves(beforeAtlas[key], afterAtlas[key]);
      if (legacyIndexChanges[key].length) hasChanges = true;
    }
  }
  const refs = diffMap(beforeAtlas.refs, afterAtlas.refs);
  const detail = diffMap(beforeAtlas.detail, afterAtlas.detail);
  const meta = { changed: changedFields(beforeAtlas.meta, afterAtlas.meta) };
  const canvas = { changed: changedFields(beforeAtlas.canvas, afterAtlas.canvas) };
  for (const section of [refs, detail]) {
    if (section.added.length || section.removed.length || section.changed.length) hasChanges = true;
  }
  if (meta.changed.length || canvas.changed.length) hasChanges = true;
  return {
    format: 'ra9-atlas.semantic-diff',
    version: 1,
    hasChanges,
    collections,
    refs,
    detail,
    meta,
    canvas,
    legacyIndexChanges,
    note: NOTE
  };
}

/* Deterministic Markdown rendering. Table cells escape backslashes and pipes,
   escape HTML-significant characters (&, <, >) so declared text can never
   introduce raw markup, and only then turn CR/LF line breaks into the
   reporter's own <br>, so declared text cannot break layout. Inline text
   (lists outside tables) escapes the same HTML-significant characters. */
function renderMarkdown(report) {
  const cell = value => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n|\r|\n/g, '<br>');
  const inline = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n|\r|\n/g, '<br>');
  const list = values => (values.length ? values.map(inline).join(', ') : '(none)');
  const yesNo = value => (value ? 'yes' : 'no');
  const lines = [
    '# Atlas semantic diff',
    '',
    'Structural comparison of two independently validated atlas snapshots.',
    '',
    `- Has changes: ${yesNo(report.hasChanges)}`,
    '',
    '## Keyed collections',
    '',
    '| Collection | Added | Removed | Changed | Reordered |',
    '| --- | ---: | ---: | ---: | --- |'
  ];
  for (const key of ARRAY_COLLECTIONS) {
    const section = report.collections[key];
    lines.push(`| ${key} | ${section.added.length} | ${section.removed.length} | ${section.changed.length} | ${yesNo(section.reordered)} |`);
  }
  for (const key of ARRAY_COLLECTIONS) {
    const section = report.collections[key];
    lines.push(
      '',
      `### ${key}`,
      '',
      `- Added IDs: ${list(section.added)}`,
      `- Removed IDs: ${list(section.removed)}`
    );
    if (section.changed.length) {
      lines.push('- Changed entries:', '', '| ID | Changed top-level fields |', '| --- | --- |');
      for (const entry of section.changed) lines.push(`| ${cell(entry.id)} | ${cell(entry.fields.join(', '))} |`);
    } else {
      lines.push('- Changed entries: (none)');
    }
    lines.push(`- Reordered: ${yesNo(section.reordered)}`);
  }
  lines.push(
    '',
    '## Metadata changes',
    '',
    `- meta changed top-level fields: ${list(report.meta.changed)}`,
    `- canvas changed top-level fields: ${list(report.canvas.changed)}`
  );
  for (const [title, key] of [['Reference changes (refs)', 'refs'], ['Detail changes (detail)', 'detail']]) {
    const section = report[key];
    lines.push(
      '',
      `## ${title}`,
      '',
      `- Added keys: ${list(section.added)}`,
      `- Removed keys: ${list(section.removed)}`
    );
    if (section.changed.length) {
      lines.push('- Changed keys:', '', '| Key | Changed fields |', '| --- | --- |');
      for (const entry of section.changed) lines.push(`| ${cell(entry.key)} | ${cell(entry.fields.join(', '))} |`);
    } else {
      lines.push('- Changed keys: (none)');
    }
  }
  lines.push('', '## Legacy index movements');
  const moves = [...report.legacyIndexChanges.nodes.map(move => ['nodes', move]),
    ...report.legacyIndexChanges.edges.map(move => ['edges', move])];
  if (moves.length) {
    lines.push('', '| Collection | ID | Before index | After index |', '| --- | --- | ---: | ---: |');
    for (const [collection, move] of moves) {
      lines.push(`| ${collection} | ${cell(move.id)} | ${move.before} | ${move.after} |`);
    }
  } else {
    lines.push('', '- No retained node or edge ID changed its array index.');
  }
  lines.push(
    '',
    '## Limits',
    '',
    `- ${inline(report.note)}`,
    '- Identifiers, keys and field lists are sorted in stable lexical code-unit order, never locale-sensitive order.',
    '- `reordered` compares only IDs common to both arrays: additions, removals and appends alone are never reordering.',
    '- `legacyIndexChanges` lists retained node and edge IDs whose array positions moved; `?edge=N` permalinks address array indices, so a moved index is reported as an observation without judging either snapshot.',
    `- \`${VALUE_CHANGED}\` marks a whole-value replacement, including a value type change, where no record field names can be listed.`,
    '- Neither snapshot is preferred: the diff makes no approval, compatibility, gameplay or release-readiness claim.'
  );
  return `${lines.join('\n')}\n`;
}

function parseArgs(args) {
  const valueFlags = ['--before-source', '--before-ledger', '--after-source', '--after-ledger'];
  const options = { markdown: false };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--markdown') { options.markdown = true; continue; }
    if (!valueFlags.includes(flag)) throw new Error(`Unknown flag: ${flag}`);
    const value = args[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[flag.slice(2)] = value;
    i++;
  }
  for (const flag of valueFlags) {
    if (options[flag.slice(2)] === undefined) throw new Error(`Missing required flag: ${flag}`);
  }
  return options;
}

/* Read-only load of one snapshot. Both files are read, parsed and validated
   with the existing compileSource gate (envelope shape, ledger identity and
   the full atlas validator) before any diffing. Generated JavaScript is never
   evaluated: compileSource validates objects and its generated string is
   discarded. Error messages carry only the label and the path as given,
   never a resolved absolute path. */
function loadAtlas(side, options) {
  const readJson = label => {
    const shown = options[`${side}-${label}`];
    let text;
    try { text = fs.readFileSync(path.resolve(shown), 'utf8'); }
    catch { throw new Error(`Cannot read ${side} ${label} file: ${shown}`); }
    try { return JSON.parse(text); }
    catch (error) { throw new Error(`${side} ${label} file is not valid JSON: ${error.message}`); }
  };
  const source = readJson('source');
  const ledger = readJson('ledger');
  try { compileSource(source, ledger); }
  catch (error) { throw new Error(`${side} snapshot failed validation: ${error.message}`); }
  return source.atlas;
}

function main(args) {
  const options = parseArgs(args);
  const before = loadAtlas('before', options);
  const after = loadAtlas('after', options);
  const report = buildAtlasDiff(before, after);
  if (options.markdown) process.stdout.write(renderMarkdown(report));
  else console.log(JSON.stringify(report, null, 2));
}

module.exports = { buildAtlasDiff, renderMarkdown };
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
