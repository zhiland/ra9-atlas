#!/usr/bin/env node
/* Static layout regression for the stable PoC4 atlas.
 *
 * Run: node tests/atlas-layout.test.js   (npm run test:layout)
 *
 * This is a geometry-only check. It pins the corrected chapter frames and
 * node lanes, then reads the rendered world at 1440x900 to verify that:
 *   - A New Home keeps its compact node flow while leaving its relationship
 *     caption clear of the adjacent boxes;
 *   - Stormy Night and the Kara checkpoint branch keep clear node separation
 *     and vertical row gutters;
 *   - full node labels and sublabels still fit their boxes;
 *   - edge captions in Stormy Night / Battle for Detroit — Kara do not overlap
 *     nodes or one another, and each caption stays near its real connector;
 *   - focused chapter scales stay readable at the desktop test viewport.
 *
 * No game content, evidence, renderer behavior or camera logic is exercised
 * or changed here.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  const fallback = path.join(os.tmpdir(), 'opencode', 'pw-browsers');
  if (fs.existsSync(fallback)) process.env.PLAYWRIGHT_BROWSERS_PATH = fallback;
}

const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const EXPECTED = {
  canvas: { width: 4450, height: 1080 },
  frames: {
    home: { x: 30, y: 120, w: 1930, h: 530 },
    stormy: { x: 2000, y: 120, w: 1320, h: 860 },
    kara: { x: 3360, y: 120, w: 1060, h: 900 }
  },
  nodes: {
    a_welcome: { x: 50, y: 250, w: 170, h: 84 },
    a_todd: { x: 240, y: 250, w: 170, h: 84 },
    a_clean1: { x: 430, y: 250, w: 170, h: 84 },
    a_ask: { x: 620, y: 250, w: 170, h: 84 },
    a_go: { x: 810, y: 250, w: 170, h: 84 },
    a_clean2: { x: 1000, y: 250, w: 170, h: 84 },
    a_room: { x: 1190, y: 250, w: 170, h: 84 },
    a_talk: { x: 1380, y: 250, w: 170, h: 84 },
    a_key: { x: 1570, y: 250, w: 170, h: 84 },
    a_box: { x: 1760, y: 250, w: 170, h: 84 },
    a_gun_seen: { x: 1000, y: 400, w: 170, h: 84 },
    a_window_open: { x: 1190, y: 500, w: 170, h: 84 },
    a_read_android_power: { x: 620, y: 132, w: 170, h: 54 },
    a_read_connecting_dots: { x: 810, y: 192, w: 170, h: 54 },
    a_wash_dishes: { x: 620, y: 338, w: 170, h: 54 },
    a_take_laundry_backyard: { x: 620, y: 416, w: 170, h: 54 },
    a_rewash_clothes: { x: 620, y: 490, w: 170, h: 54 },
    a_find_red_ice: { x: 810, y: 384, w: 170, h: 54 },
    a_enrage_todd: { x: 1000, y: 500, w: 170, h: 54 },
    a_watch_todd_tv: { x: 810, y: 448, w: 170, h: 54 },
    a_block_todd_view: { x: 1000, y: 580, w: 170, h: 54 },
    a_activate_vacuum: { x: 810, y: 523, w: 170, h: 54 },
    a_take_out_trash: { x: 620, y: 562, w: 170, h: 54 },
    s_take_gun: { x: 2045, y: 210, w: 190, h: 84 },
    s_gun_struggle: { x: 2305, y: 210, w: 190, h: 84 },
    s_kara_shoots_todd: { x: 2565, y: 210, w: 190, h: 84 },
    s_gun_carried: { x: 2825, y: 210, w: 190, h: 84 },
    s_alice_shoots_todd: { x: 2565, y: 360, w: 190, h: 84 },
    s_dead: { x: 2825, y: 360, w: 190, h: 84 },
    s_window_open: { x: 2045, y: 500, w: 190, h: 84 },
    s_reach_alice: { x: 2305, y: 500, w: 190, h: 84 },
    s_alive: { x: 3085, y: 500, w: 190, h: 84 },
    s_run_away: { x: 2045, y: 640, w: 190, h: 84 },
    s_hide_corridor: { x: 2305, y: 640, w: 190, h: 84 },
    s_todd_passes: { x: 2565, y: 640, w: 190, h: 84 },
    s_front_backyard_escape: { x: 2825, y: 640, w: 190, h: 84 },
    s_lock_room: { x: 2045, y: 790, w: 190, h: 84 },
    s_window_go_out: { x: 2305, y: 790, w: 190, h: 84 },
    s_window_qte: { x: 2565, y: 790, w: 190, h: 84 },
    s_window_reach_bus: { x: 2825, y: 790, w: 190, h: 84 },
    s_todd_orders_stay: { x: 2240, y: 120, w: 190, h: 84 },
    s_alice_runs_upstairs: { x: 2500, y: 120, w: 190, h: 84 },
    s_deviant: { x: 2760, y: 120, w: 190, h: 84 },
    s_fatal_todd_kills: { x: 2240, y: 300, w: 190, h: 84 },
    s_go_upstairs: { x: 3085, y: 120, w: 190, h: 84 },
    s_reason_todd: { x: 3085, y: 690, w: 190, h: 84 },
    s_todd_upstairs_first: { x: 3085, y: 864, w: 190, h: 84 },
    k_checkpoint: { x: 3405, y: 220, w: 190, h: 110 },
    k_terminal: { x: 3905, y: 200, w: 190, h: 84 },
    k_meet: { x: 3905, y: 370, w: 190, h: 84 },
    k_goodbye: { x: 3905, y: 540, w: 190, h: 84 },
    k_detour: { x: 3655, y: 480, w: 190, h: 84 },
    k_late_bus: { x: 3655, y: 780, w: 190, h: 84 },
    k_dialogue: { x: 4165, y: 410, w: 210, h: 110 },
    k_away: { x: 4165, y: 250, w: 210, h: 84 },
    k_check: { x: 4165, y: 650, w: 210, h: 84 }
  }
};

let baseUrl = '';
let passed = 0;
let failed = 0;

function startServer() {
  return new Promise(function (resolve, reject) {
    const server = http.createServer(function (req, res) {
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
      catch (e) { res.writeHead(400); res.end('bad path'); return; }
      if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const relative = pathname.charAt(0) === '/' ? pathname.slice(1) : pathname;
      const filePath = path.resolve(root, relative);
      if (filePath !== root && !filePath.startsWith(root + path.sep)) {
        res.writeHead(403); res.end('outside repository'); return;
      }
      fs.readFile(filePath, function (err, data) {
        if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500); res.end('not found'); return; }
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', function () {
      baseUrl = 'http://127.0.0.1:' + server.address().port;
      resolve(server);
    });
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

async function ok(name, fn) {
  try {
    await fn();
    passed++;
    console.log('    ok    ' + name);
  } catch (err) {
    failed++;
    console.log('    FAIL  ' + name + '\n          ' + err.message);
  }
}

async function waitFrames(page) {
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  });
}

async function openAtlas(page) {
  await page.goto(baseUrl + '/prototype/poc4-editorial.html#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await page.locator('#world').waitFor({ state: 'visible' });
  await waitFrames(page);
}

function frameOf(chapters, id) {
  return chapters.filter(function (chapter) { return chapter.id === id; })[0];
}

function sameBox(actual, expected, label) {
  ['x', 'y', 'w', 'h'].forEach(function (key) {
    assert(actual[key] === expected[key],
      label + ' ' + key + ' changed: ' + actual[key] + ' (expected ' + expected[key] + ')');
  });
}

function overlaps(a, b) {
  return a.left < b.right - 0.5 && b.left < a.right - 0.5 &&
    a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
}

async function layoutSnapshot(page) {
  return page.evaluate(function () {
    const world = document.getElementById('world');
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    const wr = world.getBoundingClientRect();
    function rect(el) {
      const r = el.getBoundingClientRect();
      return {
        left: (r.left - wr.left) / matrix.a,
        top: (r.top - wr.top) / matrix.a,
        right: (r.right - wr.left) / matrix.a,
        bottom: (r.bottom - wr.top) / matrix.a,
        width: r.width / matrix.a,
        height: r.height / matrix.a
      };
    }
    const nodes = Array.prototype.slice.call(document.querySelectorAll('[data-node]')).map(function (el) {
      const source = ATLAS.nodes.filter(function (n) { return n.id === el.getAttribute('data-node'); })[0];
      return {
        id: el.getAttribute('data-node'),
        chapter: source.chapter,
        layout: { x: source.x, y: source.y, w: source.w, h: source.h },
        rect: rect(el),
        overflow: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      };
    });
    const labels = Array.prototype.slice.call(document.querySelectorAll('.edge-label')).map(function (el) {
      const index = Number(el.getAttribute('data-edge-label'));
      const edge = ATLAS.edges[index];
      const path = document.querySelector('#edge-' + index);
      const box = rect(el);
      const length = path.getTotalLength();
      let pathDistance = Infinity;
      for (let at = 0; at <= length; at += 1) {
        const point = path.getPointAtLength(at);
        const dx = Math.max(box.left - point.x, 0, point.x - box.right);
        const dy = Math.max(box.top - point.y, 0, point.y - box.bottom);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < pathDistance) pathDistance = distance;
      }
      return {
        index: index,
        id: edge.id,
        anchor: { x: edge.labelAt ? edge.labelAt.x : null, y: edge.labelAt ? edge.labelAt.y : null },
        rect: box,
        pathDistance: pathDistance,
        text: el.textContent.replace(/\s+/g, ' ').trim()
      };
    });
    const chapters = ATLAS.chapters.map(function (chapter) {
      return { id: chapter.id, frame: chapter.frame };
    });
    const frames = Array.prototype.slice.call(document.querySelectorAll('.frame')).map(function (el) {
      return { id: el.getAttribute('data-chapter-frame'), rect: rect(el) };
    });
    return {
      canvas: ATLAS.canvas,
      chapters: chapters,
      frames: frames,
      nodes: nodes,
      labels: labels
    };
  });
}

async function run(browser) {
  console.log('scenario static layout / caption collisions');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await openAtlas(page);
  const snapshot = await layoutSnapshot(page);

  await ok('canvas and chapter frames keep the widened Stormy/checkpoint bounds', async function () {
    assert(snapshot.canvas.width === EXPECTED.canvas.width && snapshot.canvas.height === EXPECTED.canvas.height,
      'canvas changed to ' + snapshot.canvas.width + '×' + snapshot.canvas.height);
    Object.keys(EXPECTED.frames).forEach(function (id) {
      const chapter = frameOf(snapshot.chapters, id);
      assert(chapter, 'missing chapter ' + id);
      sameBox(chapter.frame, EXPECTED.frames[id], 'chapter ' + id);
    });
    const home = EXPECTED.frames.home;
    const stormy = EXPECTED.frames.stormy;
    const kara = EXPECTED.frames.kara;
    assert(stormy.x - (home.x + home.w) >= 24, 'A New Home / Stormy Night gap shrank below 24px');
    assert(kara.x - (stormy.x + stormy.w) >= 40, 'Stormy Night / Kara gap shrank below 40px');
    assert(stormy.w >= 1200, 'Stormy Night lost its multi-lane width: ' + stormy.w);
    assert(kara.w >= 1000, 'Kara checkpoint region lost its widened bounds: ' + kara.w);
  });

  await ok('all 56 node boxes keep the expected static world geometry', async function () {
    const actual = {};
    snapshot.nodes.forEach(function (node) { actual[node.id] = node.layout; });
    assert(snapshot.nodes.length === 56, 'expected 56 node boxes, got ' + snapshot.nodes.length);
    Object.keys(EXPECTED.nodes).forEach(function (id) {
      assert(actual[id], 'missing node ' + id);
      sameBox(actual[id], EXPECTED.nodes[id], 'node ' + id);
    });
  });

  await ok('A New Home main sequence runs left to right with side clues below', async function () {
    const ids = ['a_welcome', 'a_todd', 'a_clean1', 'a_ask', 'a_go', 'a_clean2', 'a_room', 'a_talk', 'a_key', 'a_box'];
    const byId = Object.fromEntries(snapshot.nodes.map(function (node) { return [node.id, node.layout]; }));
    const rowY = byId[ids[0]].y;
    ids.forEach(function (id, index) {
      assert(byId[id].y === rowY, id + ' left the main row');
      if (index > 0) assert(byId[id].x > byId[ids[index - 1]].x, id + ' is not to the right of ' + ids[index - 1]);
    });
    assert(byId.a_gun_seen.y > byId.a_clean2.y, 'nightstand clue is not below the upstairs cleaning step');
    assert(byId.a_window_open.y > byId.a_room.y, 'window action is not below Alice’s room cleaning step');
  });

  await ok('first-floor events stay in the A New Home side lane', async function () {
    const ids = ['a_read_android_power', 'a_read_connecting_dots', 'a_wash_dishes', 'a_take_laundry_backyard',
      'a_rewash_clothes', 'a_find_red_ice', 'a_enrage_todd', 'a_watch_todd_tv', 'a_block_todd_view', 'a_activate_vacuum', 'a_take_out_trash'];
    const byId = Object.fromEntries(snapshot.nodes.map(function (node) { return [node.id, node.layout]; }));
    const clean = byId.a_clean1;
    ids.forEach(function (id) {
      assert(byId[id], 'missing first-floor event ' + id);
      assert(byId[id].x > clean.x, id + ' must branch to the right of CLEAN FIRST FLOOR');
      assert(byId[id].y !== clean.y, id + ' must not sit on the mandatory main row');
      assert(byId[id].x + byId[id].w <= EXPECTED.frames.home.x + EXPECTED.frames.home.w,
        id + ' leaves the A New Home frame');
      assert(byId[id].y >= EXPECTED.frames.home.y && byId[id].y + byId[id].h <= EXPECTED.frames.home.y + EXPECTED.frames.home.h,
        id + ' leaves the A New Home frame vertically');
    });
    assert(byId.a_read_android_power.x === 620 && byId.a_read_connecting_dots.x === 810,
      'the magazine readings should use the two upper activity columns');
    assert(byId.a_enrage_todd.x > byId.a_find_red_ice.x && byId.a_block_todd_view.x > byId.a_watch_todd_tv.x,
      'known local first-floor sequences must read left to right');
  });

  await ok('Stormy and checkpoint nodes keep clear row and column gutters', async function () {
    ['stormy', 'kara'].forEach(function (chapter) {
      const nodes = snapshot.nodes.filter(function (n) { return n.chapter === chapter; });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i].layout, b = nodes[j].layout;
          const verticalOverlap = a.y < b.y + b.h && b.y < a.y + a.h;
          const horizontalOverlap = a.x < b.x + b.w && b.x < a.x + a.w;
          if (verticalOverlap) {
            const gap = a.x < b.x ? b.x - (a.x + a.w) : a.x - (b.x + b.w);
            assert(gap >= 60, chapter + ' row gap between ' + nodes[i].id + ' and ' + nodes[j].id + ' is only ' + gap + 'px');
          }
          if (horizontalOverlap) {
            const gap = a.y < b.y ? b.y - (a.y + a.h) : a.y - (b.y + b.h);
            // The added top-row order sits just above the existing gun lane.
            // Exact box-intersection checks below still forbid any collision.
            const pair = [nodes[i].id, nodes[j].id];
            const entryAdjacency = chapter === 'stormy' &&
              pair.some(function (id) { return ['s_todd_orders_stay', 's_alice_runs_upstairs', 's_deviant', 's_fatal_todd_kills'].includes(id); });
            assert(gap >= (entryAdjacency ? 0 : 50), chapter + ' vertical gutter between ' + nodes[i].id + ' and ' + nodes[j].id + ' is only ' + gap + 'px');
          }
        }
      }
    });
  });

  await ok('node boxes and full in-box text do not overflow', async function () {
    const clipped = snapshot.nodes.filter(function (node) { return node.overflow; });
    assert(clipped.length === 0, 'clipped node text: ' + clipped.map(function (n) { return n.id; }).join(', '));
    for (let i = 0; i < snapshot.nodes.length; i++) {
      for (let j = i + 1; j < snapshot.nodes.length; j++) {
        assert(!overlaps(snapshot.nodes[i].rect, snapshot.nodes[j].rect),
          'node boxes overlap: ' + snapshot.nodes[i].id + ' / ' + snapshot.nodes[j].id);
      }
    }
  });

  await ok('Stormy and checkpoint captions avoid nodes and each other', async function () {
    const regions = [EXPECTED.frames.stormy, EXPECTED.frames.kara];
    const crowded = snapshot.labels.filter(function (label) {
      return label.anchor.x != null && regions.some(function (frame) {
        return label.anchor.x >= frame.x && label.anchor.x <= frame.x + frame.w &&
          label.anchor.y >= frame.y && label.anchor.y <= frame.y + frame.h;
      });
    });
    assert(crowded.length === 20, 'expected 20 captions in Stormy/Kara, got ' + crowded.length);

    const collisions = [];
    crowded.forEach(function (label) {
      snapshot.nodes.forEach(function (node) {
        if (overlaps(label.rect, node.rect)) collisions.push(label.id + ' / node ' + node.id);
      });
    });
    assert(collisions.length === 0, 'caption/node overlaps: ' + collisions.join(', '));

    const labelCollisions = [];
    for (let i = 0; i < snapshot.labels.length; i++) {
      for (let j = i + 1; j < snapshot.labels.length; j++) {
        if (overlaps(snapshot.labels[i].rect, snapshot.labels[j].rect)) {
          labelCollisions.push(snapshot.labels[i].id + ' / ' + snapshot.labels[j].id);
        }
      }
    }
    assert(labelCollisions.length === 0, 'caption/caption overlaps: ' + labelCollisions.join(', '));
  });

  await ok('all captions avoid nodes and stay near their paths', async function () {
    const collisions = [];
    snapshot.labels.forEach(function (label) {
      snapshot.nodes.forEach(function (node) {
        if (!overlaps(label.rect, node.rect)) return;
        collisions.push([label.index, node.id]);
      });
    });
    assert(collisions.length === 0,
      'caption/node overlaps: ' + collisions.map(function (pair) { return pair[0] + ' / ' + pair[1]; }).join(', '));

    const far = snapshot.labels.filter(function (label) { return label.pathDistance > 80; });
    assert(far.length === 0,
      'captions moved more than 80px from their real connector: ' +
      far.map(function (label) { return label.id + ' (' + Math.round(label.pathDistance) + 'px)'; }).join(', '));
  });

  await ok('chapter focus keeps each region readable at the 1440x900 viewport', async function () {
    const scales = {};
    for (const id of ['home', 'stormy', 'kara']) {
      await page.locator('[data-chapter="' + id + '"]').click();
      await waitFrames(page);
      scales[id] = await page.evaluate(function () {
        const world = document.getElementById('world');
        return new DOMMatrixReadOnly(getComputedStyle(world).transform).a;
      });
      assert(scales[id] >= 0.65,
        id + ' chapter focus fell to ' + Math.round(scales[id] * 100) + '%');
    }
    await page.locator('[data-chapter="all"]').click();
    await waitFrames(page);
  });

  await ok('no page errors in the layout suite', async function () {
    assert(errors.length === 0, errors.join(' | '));
  });

  await page.close();
}

(async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    await run(browser);
  } finally {
    await browser.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.error('layout suite crashed: ' + (err && err.stack || err));
  process.exit(1);
});
