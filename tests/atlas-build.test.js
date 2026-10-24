'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { compileSource } = require('../tools/data/build-atlas');
const source = require('../data/atlas.source.json');
const ledger = require('../data/legacy-index.json');
const clone = value => JSON.parse(JSON.stringify(value));
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
const compiled = compileSource(source, ledger);
test('deterministic lossless complete graph', () => {
  assert.equal(compiled, compileSource(clone(source), clone(ledger)));
  assert.deepEqual(new Function(compiled + '\nreturn ATLAS;')(), source.atlas);
});
for (const key of ['format', 'version']) {
  for (const target of ['source', 'ledger']) test(`reject unsupported ${target} ${key}`, () => {
    const s = clone(source), l = clone(ledger);
    (target === 'source' ? s : l)[key] = 'unsupported';
    assert.throws(() => compileSource(s, l));
  });
}
for (const [name, mutate] of [
  ['node order', s => s.atlas.nodes.reverse()],
  ['edge order', s => s.atlas.edges.reverse()],
  ['endpoint', s => { s.atlas.edges[0].to = 'room'; }],
  ['option', s => { s.atlas.edges[0].fromOption = 123; }],
  ['graph invalid', s => { s.atlas.nodes[0].x = null; }],
]) test(`reject ${name}`, () => { const s = clone(source); mutate(s); assert.throws(() => compileSource(s, ledger)); });
for (const [name, mutate] of [
  ['missing ledger option', l => { delete l.edges[0].fromOption; }],
  ['extra ledger field', l => { l.edges[0].unexpected = true; }],
  ['invalid ledger nodes', l => { l.nodes = null; }],
]) test(name, () => { const l = clone(ledger); mutate(l); assert.throws(() => compileSource(source, l)); });
test('reject object-literal prototype special key without data loss', () => { const s = clone(source); s.atlas.meta.extra = JSON.parse('{"__proto__":{"sourceNote":"kept"}}'); assert.throws(() => compileSource(s, ledger), /__proto__/); });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ra9-build-test-'));
try {
  const src = path.join(temp, 'source.json'), idx = path.join(temp, 'ledger.json'), out = path.join(temp, 'atlas.js');
  fs.writeFileSync(src, JSON.stringify(source)); fs.writeFileSync(idx, JSON.stringify(ledger));
  const cli = (...flags) => spawnSync(process.execPath, [path.resolve(__dirname, '../tools/data/build-atlas.js'), '--source', src, '--ledger', idx, '--out', out, ...flags], { encoding: 'utf8' });
  test('check missing output does not write', () => { assert.notEqual(cli('--check').status, 0); assert.ok(!fs.existsSync(out)); });
  test('generate and exact check', () => { assert.equal(cli().status, 0); assert.equal(fs.readFileSync(out, 'utf8'), compiled); assert.equal(cli('--check').status, 0); });
  test('generation preserves a pre-existing process-named staging file', () => {
    const preload = path.join(temp, 'preload.js');
    fs.writeFileSync(preload, `require('node:fs').writeFileSync(${JSON.stringify(out)} + '.' + process.pid + '.tmp', 'existing user bytes');`);
    const run = spawnSync(process.execPath, ['--require', preload, path.resolve(__dirname, '../tools/data/build-atlas.js'), '--source', src, '--ledger', idx, '--out', out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const old = fs.readdirSync(temp).find(name => /^atlas\.js\.\d+\.tmp$/.test(name));
    assert.ok(old); assert.equal(fs.readFileSync(path.join(temp, old), 'utf8'), 'existing user bytes');
  });
  test('stale check leaves bytes and timestamp intact', () => {
    fs.writeFileSync(out, 'sentinel'); const before = fs.statSync(out).mtimeMs;
    assert.notEqual(cli('--check').status, 0); assert.equal(fs.readFileSync(out, 'utf8'), 'sentinel'); assert.equal(fs.statSync(out).mtimeMs, before);
  });
  test('invalid source never overwrites output', () => { fs.writeFileSync(src, '{}'); assert.notEqual(cli().status, 0); assert.equal(fs.readFileSync(out, 'utf8'), 'sentinel'); });
  test('reject invalid flags', () => { fs.writeFileSync(src, JSON.stringify(source)); assert.notEqual(cli('--unknown').status, 0); assert.notEqual(cli('--source').status, 0); });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log(`${count} build tests passed`);
