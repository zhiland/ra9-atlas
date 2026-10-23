'use strict';

const fs = require('node:fs');
const path = require('node:path');

function validateInventory(inventory, atlas) {
  const errors = [];
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const fail = (where, message) => errors.push(`${where}: ${message}`);
  const array = (value, where, nonempty = false) => {
    if (!Array.isArray(value)) { fail(where, 'must be an array'); return []; }
    if (nonempty && !value.length) fail(where, 'must not be empty');
    return value;
  };
  const ids = (items, where) => {
    const seen = new Set();
    items.forEach((item, i) => {
      if (!object(item)) { fail(`${where}[${i}]`, 'must be an object'); return; }
      if (!text(item.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) {
        fail(`${where}[${i}].id`, 'must be a lowercase hyphen ID');
      } else if (seen.has(item.id)) fail(`${where}[${i}].id`, `duplicate ID ${item.id}`);
      else seen.add(item.id);
    });
    return seen;
  };
  if (!object(inventory)) return ['inventory: must be an object'];
  if (inventory.format !== 'ra9-atlas.chapter-inventory') fail('format', 'unsupported format');
  if (inventory.version !== 1) fail('version', 'unsupported version');
  const sources = array(inventory.sources, 'sources', true);
  const sourceIds = ids(sources, 'sources');
  sources.forEach((source, i) => {
    if (!object(source)) return;
    const where = `sources[${i}]`;
    let validUrl = false;
    if (source.url === null) validUrl = source.id === 'runtime-coverage-ledger';
    else if (typeof source.url === 'string') {
      try { validUrl = new URL(source.url).protocol === 'https:'; } catch { /* Invalid URL. */ }
    }
    if (!validUrl) fail(`${where}.url`, 'requires an HTTPS URL, or null for runtime-coverage-ledger');
    const date = source.accessDate;
    let validDate = false;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parsed = new Date(`${date}T00:00:00.000Z`);
      validDate = !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
    }
    if (!validDate) fail(`${where}.accessDate`, 'requires a valid ISO calendar date');
    for (const field of ['locator', 'accessOutcome', 'attribution', 'independenceNote']) {
      if (!text(source[field])) fail(`${where}.${field}`, 'must be nonempty text');
    }
  });
  const refs = (value, where) => {
    const entries = array(value, where, true);
    entries.forEach((id, i) => {
      if (!sourceIds.has(id)) fail(`${where}[${i}]`, `unknown source ${String(id)}`);
    });
    if (new Set(entries).size !== entries.length) fail(where, 'duplicate source reference');
    return entries;
  };
  if (!object(inventory.reconciliation)) fail('reconciliation', 'must be an object');
  else {
    if (!['partial', 'reconciled-source-indices'].includes(inventory.reconciliation.state)) fail('reconciliation.state', 'unsupported state');
    if (!text(inventory.reconciliation.scope)) fail('reconciliation.scope', 'must be nonempty text');
    array(inventory.reconciliation.limitations, 'reconciliation.limitations', true).forEach((v, i) => {
      if (!text(v)) fail(`reconciliation.limitations[${i}]`, 'must be nonempty text');
    });
  }
  const unknowns = array(inventory.unknowns, 'unknowns', true);
  ids(unknowns, 'unknowns');
  unknowns.forEach((u, i) => {
    if (!object(u)) return;
    if (!text(u.explanation)) fail(`unknowns[${i}].explanation`, 'must be nonempty text');
    refs(u.sources, `unknowns[${i}].sources`);
  });
  const runtime = new Map();
  if (!object(atlas)) fail('atlas', 'must be an object');
  array(atlas && atlas.chapters, 'atlas.chapters', true).forEach((chapter, i) => {
    if (!object(chapter) || !text(chapter.id)) { fail(`atlas.chapters[${i}]`, 'requires chapter ID'); return; }
    if (runtime.has(chapter.id)) fail('atlas.chapters', `duplicate runtime ID ${chapter.id}`);
    runtime.set(chapter.id, chapter.coverage && chapter.coverage.status);
  });
  const chapters = array(inventory.chapters, 'chapters', true);
  ids(chapters, 'chapters');
  const charts = [];
  const mapped = new Map();
  chapters.forEach((chapter, ci) => {
    if (!object(chapter)) return;
    const where = `chapters[${ci}]`;
    if (chapter.order !== ci + 1) fail(`${where}.order`, 'must follow contiguous array order starting at 1');
    if (!text(chapter.title)) fail(`${where}.title`, 'must be nonempty text');
    refs(chapter.sources, `${where}.sources`);
    array(chapter.charts, `${where}.charts`).forEach((chart, i) => {
      charts.push(chart);
      const at = `${where}.charts[${i}]`;
      if (!object(chart)) return;
      if (![null, 'kara', 'connor', 'markus'].includes(chart.character)) fail(`${at}.character`, 'must be null, kara, connor or markus');
      const kinds = ['source-index-entry', 'character-heading', 'character-route-heading'];
      if (!kinds.includes(chart.kind)) fail(`${at}.kind`, 'unsupported heading kind');
      if (chart.kind === 'character-route-heading') {
        if (!text(chart.route)) fail(`${at}.route`, 'route heading requires a nonempty route');
      } else if (chart.route !== null) fail(`${at}.route`, 'non-route heading requires null');
      if (['character-heading', 'character-route-heading'].includes(chart.kind) && chart.character === null) fail(`${at}.character`, 'explicit character heading requires a character');
      if (!text(chart.label)) fail(`${at}.label`, 'must be nonempty text');
      const chartSources = refs(chart.sources, `${at}.sources`);
      array(chart.locator, `${at}.locator`, true).forEach((locator, li) => {
        const lp = `${at}.locator[${li}]`;
        if (!object(locator)) { fail(lp, 'must be an object'); return; }
        if (!sourceIds.has(locator.source)) fail(`${lp}.source`, 'unknown source');
        else if (!chartSources.includes(locator.source)) fail(`${lp}.source`, 'source must also occur in chart sources');
        if (!text(locator.heading) || !text(locator.location)) fail(lp, 'requires nonempty heading and location');
      });
      if (!['not-added', 'partial', 'checked-against-chart'].includes(chart.coverage)) fail(`${at}.coverage`, 'unsupported coverage');
      const runtimeIds = array(chart.runtimeChapterIds, `${at}.runtimeChapterIds`);
      if (runtimeIds.length === 0 && chart.coverage !== 'not-added') fail(`${at}.coverage`, 'unmapped chart must have not-added coverage');
      runtimeIds.forEach((id, ri) => {
        const rp = `${at}.runtimeChapterIds[${ri}]`;
        if (!runtime.has(id)) fail(rp, `unknown runtime chapter ${String(id)}`);
        else if (chart.coverage !== runtime.get(id)) fail(`${at}.coverage`, `coverage differs from runtime chapter ${id}`);
        if (mapped.has(id)) fail(rp, `runtime chapter ${id} mapped more than once`);
        mapped.set(id, at);
      });
    });
  });
  ids(charts, 'charts');
  for (const id of runtime.keys()) if (!mapped.has(id)) fail('runtimeChapterIds', `runtime chapter ${id} is not mapped`);
  return errors;
}

module.exports = { validateInventory };

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '../..');
    const inventory = JSON.parse(fs.readFileSync(process.argv[2] || path.join(root, 'data/chapter-inventory.json'), 'utf8'));
    const source = JSON.parse(fs.readFileSync(process.argv[3] || path.join(root, 'data/atlas.source.json'), 'utf8'));
    const errors = validateInventory(inventory, source.atlas);
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log('PASS: chapter inventory structural validation');
  } catch (error) {
    console.error(`Inventory validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
