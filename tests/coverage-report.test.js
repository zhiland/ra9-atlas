'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildCoverageReport, renderMarkdown } = require('../tools/data/coverage-report');
const { compileSource } = require('../tools/data/build-atlas');
const source = require('../data/atlas.source.json');
const ledger = require('../data/legacy-index.json');
const root = path.resolve(__dirname, '..');
const cliPath = path.resolve(__dirname, '../tools/data/coverage-report.js');
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
const deepFreeze = value => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};
const NOTE = 'Structural inventory only: these counts observe the committed source structure. They are not source approval, gameplay verification, completeness evidence, or publication permission. Conditions and uncertainties are reported as totals only, never attributed to chapters.';

const makeFixture = () => ({
  chapters: [
    { id: 'alpha', name: 'Alpha', coverage: { status: 'partial', scope: 'Alpha | slice\nsecond line' } },
    { id: 'beta', name: 'Beta', coverage: { status: 'checked-against-chart', scope: 'Beta fixture scope.' } },
    { id: 'gamma', name: 'Gamma', coverage: { status: 'partial', scope: 'Zero-edge chapter.' } }
  ],
  nodes: [
    { id: 'a1', chapter: 'alpha' },
    { id: 'a2', chapter: 'alpha' },
    { id: 'b1', chapter: 'beta' },
    { id: 'b2', chapter: 'beta' },
    { id: 'g1', chapter: 'gamma' }
  ],
  edges: [
    { id: 'e_a_internal', from: 'a1', to: 'a2', kind: 'traced' },
    { id: 'e_b_internal', from: 'b1', to: 'b2', kind: 'prerequisite' },
    { id: 'e_cross_ab', from: 'a2', to: 'b1', kind: 'traced' },
    { id: 'e_cross_ba', from: 'b2', to: 'a1', kind: 'conditional' },
    { id: 'e_withdrawn_cross', from: 'a1', to: 'b2', kind: 'withdrawn' },
    { id: 'e_withdrawn_internal', from: 'b2', to: 'b1', kind: 'withdrawn' }
  ],
  conditions: [{ id: 'c_alpha', appliesTo: ['e_a_internal'], operator: 'SINGLE' }],
  uncertainties: [{ id: 'u_alpha', status: 'unknown' }],
  conflicts: []
});

test('fixture report: versioned envelope, totals and source-order rows', () => {
  const report = buildCoverageReport(makeFixture());
  assert.deepEqual(report, {
    format: 'ra9-atlas.coverage-report',
    version: 1,
    totals: {
      regions: 3,
      nodes: 5,
      edgeRecords: 6,
      activeEdges: 4,
      withdrawnEdges: 2,
      internalActiveEdges: 2,
      crossChapterActiveEdges: 2,
      conditions: 1,
      uncertainties: 1,
      conflicts: 0
    },
    chapters: [
      {
        id: 'alpha', name: 'Alpha',
        coverage: { status: 'partial', scope: 'Alpha | slice\nsecond line' },
        nodes: 2, internalActiveEdges: 1,
        outgoingCrossChapterActiveEdges: 1, incomingCrossChapterActiveEdges: 1,
        withdrawnEdges: 1
      },
      {
        id: 'beta', name: 'Beta',
        coverage: { status: 'checked-against-chart', scope: 'Beta fixture scope.' },
        nodes: 2, internalActiveEdges: 1,
        outgoingCrossChapterActiveEdges: 1, incomingCrossChapterActiveEdges: 1,
        withdrawnEdges: 1
      },
      {
        id: 'gamma', name: 'Gamma',
        coverage: { status: 'partial', scope: 'Zero-edge chapter.' },
        nodes: 1, internalActiveEdges: 0,
        outgoingCrossChapterActiveEdges: 0, incomingCrossChapterActiveEdges: 0,
        withdrawnEdges: 0
      }
    ],
    note: NOTE
  });
});

test('cross-chapter and withdrawn records never inflate internal counts', () => {
  const report = buildCoverageReport(makeFixture());
  const { totals, chapters: rows } = report;
  assert.equal(totals.internalActiveEdges + totals.crossChapterActiveEdges, totals.activeEdges);
  assert.equal(totals.activeEdges + totals.withdrawnEdges, totals.edgeRecords);
  // The withdrawn a1->b2 edge spans chapters but counts only as withdrawn,
  // attributed once to alpha; gamma keeps zero of everything.
  assert.equal(rows[0].withdrawnEdges, 1);
  assert.equal(rows[1].withdrawnEdges, 1);
  assert.deepEqual(
    [rows[2].internalActiveEdges, rows[2].outgoingCrossChapterActiveEdges, rows[2].incomingCrossChapterActiveEdges, rows[2].withdrawnEdges],
    [0, 0, 0, 0]
  );
  assert.equal(rows.reduce((n, row) => n + row.outgoingCrossChapterActiveEdges, 0), totals.crossChapterActiveEdges);
  assert.equal(rows.reduce((n, row) => n + row.incomingCrossChapterActiveEdges, 0), totals.crossChapterActiveEdges);
  assert.equal(rows.reduce((n, row) => n + row.withdrawnEdges, 0), totals.withdrawnEdges);
});

test('does not mutate its input', () => {
  const atlas = makeFixture();
  const before = structuredClone(atlas);
  buildCoverageReport(deepFreeze(atlas));
  assert.deepEqual(atlas, before);
});

for (const [name, mutate, expected] of [
  ['null atlas', () => null, /atlas: expected an object/],
  ['missing edge array', atlas => { atlas.edges = null; }, /atlas\.edges: expected an array/],
  ['missing condition array', atlas => { atlas.conditions = 'nope'; }, /atlas\.conditions: expected an array/],
  ['duplicate chapter id', atlas => { atlas.chapters[1].id = 'alpha'; }, /duplicate chapter/],
  ['duplicate node id', atlas => { atlas.nodes[1].id = 'a1'; }, /duplicate node/],
  ['empty node id', atlas => { atlas.nodes[0].id = ''; }, /nodes\[0\]\.id/],
  ['unknown node chapter', atlas => { atlas.nodes[3].chapter = 'delta'; }, /unknown chapter "delta"/],
  ['duplicate edge id', atlas => { atlas.edges[1].id = atlas.edges[0].id; }, /duplicate edge/],
  ['unknown edge from', atlas => { atlas.edges[0].from = 'missing'; }, /edges\[0\]\.from: unknown node "missing"/],
  ['unknown edge to', atlas => { atlas.edges[2].to = 'missing2'; }, /edges\[2\]\.to: unknown node "missing2"/],
  ['non-string edge kind', atlas => { atlas.edges[0].kind = 7; }, /edges\[0\]\.kind/],
  ['missing chapter coverage', atlas => { delete atlas.chapters[0].coverage; }, /coverage/],
  ['duplicate uncertainty id', atlas => { atlas.uncertainties.push({ id: 'u_alpha' }); }, /duplicate uncertainties id/]
]) test(`reject ${name}`, () => {
  const atlas = makeFixture();
  const target = mutate(atlas);
  assert.throws(() => buildCoverageReport(target === undefined ? atlas : target), expected);
});

const canonicalTotals = {
  regions: 7,
  nodes: 128,
  edgeRecords: 113,
  activeEdges: 111,
  withdrawnEdges: 2,
  internalActiveEdges: 106,
  crossChapterActiveEdges: 5,
  conditions: 6,
  uncertainties: 22,
  conflicts: 0
};

test('canonical source yields the documented structural totals', () => {
  compileSource(source, ledger);
  const before = structuredClone(source.atlas);
  const report = buildCoverageReport(source.atlas);
  assert.deepEqual(source.atlas, before);
  assert.equal(report.format, 'ra9-atlas.coverage-report');
  assert.equal(report.version, 1);
  assert.deepEqual(report.totals, canonicalTotals);
  assert.equal(report.note, NOTE);
  assert.match(report.note, /Structural inventory only/);
  assert.deepEqual(report.chapters.map(row => row.id), source.atlas.chapters.map(chapter => chapter.id));
});

test('canonical chapter rows match the documented per-region inventory', () => {
  const report = buildCoverageReport(source.atlas);
  const rows = new Map(report.chapters.map(row => [row.id, row]));
  const expected = {
    home: { nodes: 35, internal: 18, out: 3, in: 0, withdrawn: 2 },
    stormy: { nodes: 24, internal: 24, out: 1, in: 2, withdrawn: 0 },
    kara: { nodes: 9, internal: 10, out: 0, in: 2, withdrawn: 0 },
    hostage: { nodes: 33, internal: 37, out: 1, in: 0, withdrawn: 0 },
    'public-enemy': { nodes: 1, internal: 0, out: 0, in: 1, withdrawn: 0 },
    'shades-of-color': { nodes: 12, internal: 5, out: 0, in: 0, withdrawn: 0 },
    'the-painter': { nodes: 14, internal: 12, out: 0, in: 0, withdrawn: 0 }
  };
  for (const [chapterId, want] of Object.entries(expected)) {
    const row = rows.get(chapterId);
    assert.ok(row, `missing row ${chapterId}`);
    assert.equal(row.nodes, want.nodes, `${chapterId} nodes`);
    assert.equal(row.internalActiveEdges, want.internal, `${chapterId} internal active`);
    assert.equal(row.outgoingCrossChapterActiveEdges, want.out, `${chapterId} outgoing cross`);
    assert.equal(row.incomingCrossChapterActiveEdges, want.in, `${chapterId} incoming cross`);
    assert.equal(row.withdrawnEdges, want.withdrawn, `${chapterId} withdrawn`);
  }
  const all = report.chapters;
  assert.equal(all.reduce((n, row) => n + row.nodes, 0), 128);
  assert.equal(all.reduce((n, row) => n + row.internalActiveEdges, 0), 106);
  assert.equal(all.reduce((n, row) => n + row.outgoingCrossChapterActiveEdges, 0), 5);
  assert.equal(all.reduce((n, row) => n + row.incomingCrossChapterActiveEdges, 0), 5);
  assert.equal(all.reduce((n, row) => n + row.withdrawnEdges, 0), 2);
  assert.equal(report.totals.internalActiveEdges + report.totals.crossChapterActiveEdges, report.totals.activeEdges);
  // Declared coverage is copied, not inferred.
  const hostage = source.atlas.chapters.find(chapter => chapter.id === 'hostage');
  assert.deepEqual(rows.get('hostage').coverage, { status: hostage.coverage.status, scope: hostage.coverage.scope });
});

test('markdown escapes pipes and newlines in declared text', () => {
  const markdown = renderMarkdown(buildCoverageReport(makeFixture()));
  assert.ok(markdown.includes('Alpha \\| slice<br>second line'));
  assert.ok(!markdown.includes('Alpha | slice\nsecond'));
  assert.match(markdown, /\| Regions \| 3 \|/);
  assert.match(markdown, /\| Nodes \| 5 \|/);
  assert.match(markdown, /\| Active internal edges \| 2 \|/);
  assert.match(markdown, /\| Active cross-chapter edges \| 2 \|/);
  assert.match(markdown, /## Verification limits/);
  assert.match(markdown, /Structural inventory only/);
  assert.ok(markdown.endsWith('\n'));
});

test('requiring the module has no CLI side effects', () => {
  const run = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(cliPath)})`], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  assert.equal(run.stderr, '');
});

const cli = (...args) => spawnSync(process.execPath, [cliPath, ...args], { cwd: root, encoding: 'utf8' });

test('cli default JSON matches the module and is canonical', () => {
  const run = cli();
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  const report = JSON.parse(run.stdout);
  assert.deepEqual(report.totals, canonicalTotals);
  assert.deepEqual(report, buildCoverageReport(source.atlas));
});

test('cli output is deterministic and free of absolute paths', () => {
  const first = cli();
  const second = cli();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  assert.ok(!first.stdout.includes(root));
  const markdown = cli('--markdown');
  assert.equal(markdown.status, 0, markdown.stderr);
  assert.equal(markdown.stdout, cli('--markdown').stdout);
  assert.ok(!markdown.stdout.includes(root));
});

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ra9-coverage-test-'));
try {
  const src = path.join(temp, 'source.json');
  const idx = path.join(temp, 'ledger.json');
  fs.writeFileSync(src, JSON.stringify(source));
  fs.writeFileSync(idx, JSON.stringify(ledger));
  const snapshot = file => ({ text: fs.readFileSync(file, 'utf8'), mtime: fs.statSync(file).mtimeMs });

  test('cli json from explicit source and ledger', () => {
    const run = cli('--source', src, '--ledger', idx);
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), buildCoverageReport(source.atlas));
  });

  test('cli markdown renders totals table, chapter rows and limits', () => {
    const run = cli('--markdown', '--source', src, '--ledger', idx);
    assert.equal(run.status, 0, run.stderr);
    const markdown = run.stdout;
    assert.match(markdown, /\| Regions \| 7 \|/);
    assert.match(markdown, /\| Nodes \| 128 \|/);
    assert.match(markdown, /\| Edge records \| 113 \|/);
    assert.match(markdown, /\| Active edges \| 111 \|/);
    assert.match(markdown, /\| Withdrawn edges \| 2 \|/);
    assert.match(markdown, /\| Active internal edges \| 106 \|/);
    assert.match(markdown, /\| Active cross-chapter edges \| 5 \|/);
    assert.match(markdown, /\| Conditions \| 6 \|/);
    assert.match(markdown, /\| Uncertainties \| 22 \|/);
    assert.match(markdown, /\| Conflicts \| 0 \|/);
    assert.match(markdown, /\| A New Home \| home \|/);
    assert.match(markdown, /## Verification limits/);
    assert.match(markdown, /Structural inventory only/);
    assert.ok(markdown.endsWith('\n'));
  });

  test('cli never writes inputs and creates no report file', () => {
    const before = [snapshot(src), snapshot(idx)];
    const repoBefore = [snapshot(path.join(root, 'data/atlas.source.json')), snapshot(path.join(root, 'data/legacy-index.json'))];
    assert.equal(cli('--source', src, '--ledger', idx).status, 0);
    assert.equal(cli('--markdown', '--source', src, '--ledger', idx).status, 0);
    assert.equal(cli().status, 0);
    assert.notEqual(cli('--source', path.join(temp, 'absent.json'), '--ledger', idx).status, 0);
    assert.deepEqual([snapshot(src), snapshot(idx)], before);
    assert.deepEqual([snapshot(path.join(root, 'data/atlas.source.json')), snapshot(path.join(root, 'data/legacy-index.json'))], repoBefore);
    assert.deepEqual(fs.readdirSync(temp).sort(), ['ledger.json', 'source.json']);
  });

  test('reject unknown flags and missing values', () => {
    for (const args of [['--verbose'], ['--markdown=true'], ['--source'], ['--ledger', '--markdown'], ['--source', 'x.json', '--ledger']]) {
      const run = cli(...args);
      assert.notEqual(run.status, 0, args.join(' '));
      assert.match(run.stderr, /Unknown flag|Missing value/);
      assert.equal(run.stdout, '');
    }
    assert.match(cli('--verbose').stderr, /Unknown flag: --verbose/);
    assert.match(cli('--source').stderr, /Missing value for --source/);
    assert.match(cli('--ledger', '--markdown').stderr, /Missing value for --ledger/);
  });

  test('missing files fail cleanly without paths in output', () => {
    const absent = path.join(temp, 'absent.json');
    const bySource = cli('--source', absent);
    assert.notEqual(bySource.status, 0);
    assert.match(bySource.stderr, /Cannot read source file/);
    assert.equal(bySource.stdout, '');
    const byLedger = cli('--ledger', absent);
    assert.notEqual(byLedger.status, 0);
    assert.match(byLedger.stderr, /Cannot read ledger file/);
    assert.equal(byLedger.stdout, '');
  });

  test('stale ledger is rejected before counting', () => {
    const stale = structuredClone(ledger);
    stale.nodes[0] = 'stale-node';
    const stalePath = path.join(temp, 'stale-ledger.json');
    fs.writeFileSync(stalePath, JSON.stringify(stale));
    const run = cli('--source', src, '--ledger', stalePath);
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /ledger mismatch/i);
    assert.equal(run.stdout, '');
    fs.rmSync(stalePath);
  });

  test('invalid source envelope is rejected', () => {
    const badPath = path.join(temp, 'bad-source.json');
    fs.writeFileSync(badPath, '{}');
    const run = cli('--source', badPath, '--ledger', idx);
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /expected fields format, version, atlas/);
    assert.equal(run.stdout, '');
    fs.rmSync(badPath);
    const unparseable = path.join(temp, 'broken.json');
    fs.writeFileSync(unparseable, '{not json');
    const badJson = cli('--source', unparseable, '--ledger', idx);
    assert.notEqual(badJson.status, 0);
    assert.match(badJson.stderr, /not valid JSON/);
    fs.rmSync(unparseable);
  });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log(`${count} coverage-report tests passed`);
