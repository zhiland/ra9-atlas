#!/usr/bin/env node
/* PoC4 — browser functional checks for the three atlas entry points.
   Run: npm run test:browser   (requires the playwright devDependency)
   If PLAYWRIGHT_BROWSERS_PATH is unset, the harness reuses the browsers
   folder under the OS temp dir when it exists; otherwise Playwright's own
   default lookup applies.

   What this suite does and does not prove: it serves the static pages from
   localhost and drives them in headless Chromium. It exercises consent and remembered
   consent, the continuous story map, the stable world across camera scales, fit bounds,
   chapter focus, actual cross-chapter navigation, both detail-close paths,
   history, search keyboard handling, hash round-trips and text contrast in
   all three palettes, plus a scoped 390x845 mobile-emulation layout,
   scrolling and interaction regression. It does NOT verify any Detroit:
   Become Human gameplay, a physical phone, Safari/iOS, or touch gestures on
   real hardware. */
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
let baseUrl = '';

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
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
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
const VARIANTS = [
  { id: 'editorial', file: 'poc4-editorial.html', palette: 'neutral gray default' },
  { id: 'amber', file: 'poc4-amber.html', palette: 'warm amber neutral' },
  { id: 'darkcyan', file: 'poc4-darkcyan.html', palette: 'dark cyan' }
];

let passed = 0;
let failed = 0;

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

async function textOf(page, selector) {
  const t = await page.locator(selector).first().textContent();
  return (t || '').replace(/\s+/g, ' ').trim();
}

async function waitFrames(page) {
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  });
}

/* Clears selection, edge focus and search and refits the whole atlas, so each
   check starts from a known camera. History and consent are kept by design. */
async function resetAtlas(page) {
  await page.locator('#reset').click();
  await page.locator('#details').waitFor({ state: 'hidden' });
  await waitFrames(page);
}

async function openChapter(page, id) {
  await resetAtlas(page);
  await page.locator('[data-chapter="' + id + '"]').click();
  await waitFrames(page);
}

/* Reads the current world transform and each chapter frame in canvas
   coordinates. The same measurement covers every LOD because one world stays
   mounted. */
async function fitSnapshot(page) {
  return page.evaluate(function () {
    function rect(r) {
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }
    const canvas = document.getElementById('canvas');
    const world = document.getElementById('world');
    const cr = canvas.getBoundingClientRect();
    const matrix = world ? new DOMMatrixReadOnly(getComputedStyle(world).transform) : null;
    return {
      lod: canvas.getAttribute('data-lod'),
      canvas: rect(cr),
      scale: matrix ? matrix.a : null,
      transform: world ? world.style.transform : null,
      frames: Array.prototype.slice.call(document.querySelectorAll('.frame')).map(function (frame) {
        return {
          id: frame.getAttribute('data-chapter-frame'),
          rect: rect(frame.getBoundingClientRect())
        };
      }),
      nodeCount: document.querySelectorAll('[data-node]').length,
      edgeCount: document.querySelectorAll('path.edge').length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
}

function fullyInside(rect, canvas, tolerance) {
  const tol = tolerance == null ? 2 : tolerance;
  return rect.left >= canvas.left - tol && rect.right <= canvas.right + tol &&
    rect.top >= canvas.top - tol && rect.bottom <= canvas.bottom + tol;
}

async function runVariant(browser, variant) {
  console.log('scenario ' + variant.id + ' (' + variant.palette + ')');
  const pageErrors = [];
  const track = function (p) {
    p.on('pageerror', function (e) { pageErrors.push('pageerror: ' + e.message); });
    p.on('console', function (m) { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  };

  const page = await browser.newPage({ viewport: { width: 1450, height: 900 } });
  track(page);
  const url = baseUrl + '/prototype/' + variant.file;
  await page.goto(url + '#');

  await ok('loads on the spoiler cover with the map rendered beneath it', async function () {
    await page.locator('#consent').waitFor({ state: 'visible' });
    const state = await page.evaluate(function () {
      const shell = document.getElementById('atlas-shell');
      const world = document.getElementById('world');
      const canvas = document.getElementById('canvas');
      const overlay = document.getElementById('spoiler-overlay');
      const wr = world ? world.getBoundingClientRect() : null;
      const cr = canvas ? canvas.getBoundingClientRect() : null;
      return {
        variant: document.documentElement.getAttribute('data-variant'),
        overlayVisible: !!overlay && getComputedStyle(overlay).display !== 'none',
        overlayZ: overlay ? Number(getComputedStyle(overlay).zIndex) : 0,
        shellInert: !!(shell && shell.hasAttribute('inert')),
        shellAriaHidden: shell ? shell.getAttribute('aria-hidden') : null,
        focused: document.activeElement ? document.activeElement.id : null,
        world: wr ? { width: wr.width, height: wr.height } : null,
        canvas: cr ? { width: cr.width, height: cr.height } : null,
        nodes: document.querySelectorAll('[data-node]').length,
        edges: document.querySelectorAll('path.edge').length,
        lod: canvas ? canvas.getAttribute('data-lod') : null
      };
    });
    assert(state.variant === variant.id, 'palette variant attribute missing');
    assert(state.overlayVisible, 'spoiler overlay is not visible');
    assert(state.overlayZ >= 40, 'overlay must sit above the map, z-index ' + state.overlayZ);
    assert(state.shellInert && state.shellAriaHidden === 'true', 'map shell must be inert and aria-hidden under the cover');
    assert(state.focused === 'consent', 'consent should receive focus, was ' + state.focused);
    assert(state.world && state.world.width > 0 && state.world.height > 0, 'map world must be rendered but covered');
    assert(state.canvas && state.canvas.width > 0 && state.canvas.height > 0, 'canvas must have layout under the cover');
    assert(state.nodes === 114, '114 nodes should be rendered behind the cover, got ' + state.nodes);
    assert(state.edges === 99, '99 connectors should be rendered behind the cover, got ' + state.edges);
    assert(state.lod === null, 'the map must not carry a semantic LOD attribute');
  });

  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await page.locator('#world').waitFor({ state: 'visible' });
  await waitFrames(page);

  await ok('consent reveals the continuous whole-story map', async function () {
    assert(await page.locator('#canvas').isVisible(), 'canvas not visible after consent');
    assert(await page.locator('#details').isHidden(), 'details should start hidden');
    assert(await page.locator('#trail').isVisible(), 'history trail not visible');
    assert(!(await page.locator('#atlas-shell').getAttribute('inert')), 'shell stayed inert after consent');
    const status = await textOf(page, '#status');
    assert(status.indexOf('6 chapters · 114 nodes · 99 connectors') !== -1, 'status line counts: ' + status);
    assert(status.indexOf('not in-game verified') !== -1, 'status line must keep the not-verified qualifier');
    assert(status.indexOf('version/platform unknown') === -1 && status.length <= 180,
      'primary status must stay a concise slice summary, got: ' + status);
    assert(/^\d+%$/.test(await textOf(page, '#zoomLabel')), 'zoom label should report camera scale only');
    const zoom = await textOf(page, '#zoomLabel');
    assert(/^\d+%$/.test(zoom), 'zoom label should report camera scale only: ' + zoom);
    assert(await page.locator('#overview').count() === 0, 'the card/report overview surface must stay removed');
    assert(await page.locator('.frame').count() === 6, 'six chapter frames must stay mounted');
    assert(await page.locator('[data-node]').count() === 114, '114 nodes must stay mounted');
    assert(await page.locator('path.edge').count() === 99, '99 connectors must stay mounted');
    assert(await page.locator('[data-frame-label]').count() === 6, 'six chapter names must remain on the map');
    assert(await page.locator('[data-node-label]').count() === 114, 'every event box must keep its label');
    const chapterNav = await page.evaluate(function () {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        items: Array.from(document.querySelectorAll('[data-chapter]')).map(function (button) {
          const rect = button.getBoundingClientRect();
          return { id: button.getAttribute('data-chapter'), text: button.textContent.trim(), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        })
      };
    });
    assert(chapterNav.items.length === 7, 'whole-atlas plus six chapter choices must stay available');
    assert(chapterNav.items.every(function (item) {
      return item.text && item.left >= 0 && item.right <= chapterNav.width + 1 && item.top >= 0 && item.bottom <= chapterNav.height + 1;
    }), 'every chapter choice must be fully visible at the desktop viewport');
  });

  await ok('map names and labels stay attached to real chapters, nodes and cross-chapter edges', async function () {
    const result = await page.evaluate(function () {
      const frames = Array.from(document.querySelectorAll('.frame')).map(function (frame) {
        const title = frame.querySelector('[data-frame-label]');
        return { id: frame.getAttribute('data-chapter-frame'), title: title && title.textContent.trim(), contained: !!title && frame.contains(title) };
      });
      const labels = Array.from(document.querySelectorAll('[data-node-label]')).map(function (label) {
        const node = label.closest('[data-node]');
        return { id: label.getAttribute('data-node-label'), text: label.textContent.trim(), contained: !!node && node.contains(label) };
      });
      const chapterOf = Object.fromEntries(ATLAS.nodes.map(function (node) { return [node.id, node.chapter]; }));
      const actualCross = ATLAS.edges.map(function (edge, index) {
        return chapterOf[edge.from] !== chapterOf[edge.to] ? index : null;
      }).filter(function (index) { return index !== null; });
      const labelled = Array.from(document.querySelectorAll('.edge-label')).map(function (el) { return Number(el.getAttribute('data-edge-label')); });
      return { frames: frames, labels: labels, actualCross: actualCross, labelled: labelled };
    });
    assert(result.frames.length === 6 && result.frames.every(function (f) { return f.contained && f.title; }), 'chapter names must stay inside all real frames');
    assert(result.labels.length === 114 && result.labels.every(function (n) { return n.contained && n.text; }), 'all 114 real nodes must retain their full in-box labels');
    result.actualCross.forEach(function (index) { assert(result.labelled.indexOf(index) !== -1 || !ATLAS.edges[index].label, 'labelled cross-chapter edge ' + index + ' disappeared'); });
    assert(await page.locator('#overview-connectors, .overview-link, .overview-card').count() === 0, 'no pseudo-map or report surface may replace the graph');
  });

  await ok('zoom changes only the camera while keeping all real map content in place', async function () {
    const capture = function () { return page.evaluate(function () {
      const world = document.getElementById('world');
      const scale = new DOMMatrixReadOnly(getComputedStyle(world).transform).a;
      function rect(el) { const r = el.getBoundingClientRect(); const w = world.getBoundingClientRect(); return [(r.left-w.left)/scale,(r.top-w.top)/scale,r.width/scale,r.height/scale].map(function(v){return Math.round(v*10)/10;}); }
      return {
        scale: scale,
        nodes: Array.from(document.querySelectorAll('[data-node]')).map(function (n) { return { id:n.getAttribute('data-node'), text:n.querySelector('[data-node-label]').textContent.trim(), box:rect(n), label:rect(n.querySelector('[data-node-label]')) }; }),
        edges: Array.from(document.querySelectorAll('path.edge')).map(function (e) { return [e.getAttribute('data-edge'),e.getAttribute('d')]; }),
        crossLabels: Array.from(document.querySelectorAll('.edge-label')).map(function (e) { return [e.getAttribute('data-edge-label'),e.textContent.trim(),e.style.left,e.style.top]; })
      };
    }); };
    const before = await capture();
    await page.locator('#plus').click(); await page.locator('#plus').click(); await waitFrames(page);
    const after = await capture();
    assert(after.scale > before.scale, 'zoom control did not change the camera scale');
    assert(JSON.stringify(after.nodes) === JSON.stringify(before.nodes), 'node boxes or in-box labels changed with zoom');
    assert(JSON.stringify(after.edges) === JSON.stringify(before.edges), 'real connectors changed with zoom');
    assert(JSON.stringify(after.crossLabels) === JSON.stringify(before.crossLabels), 'real connector labels changed with zoom');
    assert(/^\d+%$/.test(await textOf(page, '#zoomLabel')), 'scale indicator should not expose a semantic zoom level');
    assert(await page.locator('#map-labels, #aggregate-edges, #node-dots').count() === 0, 'overlay or summary layers remain mounted');
    await resetAtlas(page);
  });

  await ok('whole-map and chapter fits stay inside the desktop canvas', async function () {
    await resetAtlas(page);
    const all = await fitSnapshot(page);
    assert(all.lod === null, 'whole-map fit must not set a semantic zoom level');
    assert(all.frames.length === 6, 'six frames expected');
    all.frames.forEach(function (frame) {
      assert(fullyInside(frame.rect, all.canvas), frame.id + ' frame is clipped by the whole-map fit');
    });
    assert(all.canvas.left >= 0 && all.canvas.right <= 1451, 'canvas itself leaves the viewport');
    assert(!all.horizontalOverflow, 'whole-map fit introduced horizontal overflow');

    await openChapter(page, 'home');
    const home = await fitSnapshot(page);
    assert(home.lod === null, 'chapter focus must not set a semantic zoom level');
    assert(await page.locator('[data-chapter="home"]').getAttribute('aria-pressed') === 'true', 'home chapter is not active');
    const homeFrame = home.frames.filter(function (f) { return f.id === 'home'; })[0];
    assert(homeFrame && fullyInside(homeFrame.rect, home.canvas), 'focused home chapter is clipped by the canvas');
    assert(home.nodeCount === 114 && home.edgeCount === 99, 'chapter focus must keep the whole graph mounted');
    assert(!home.horizontalOverflow, 'chapter focus introduced horizontal overflow');

    await page.locator('[data-chapter="kara"]').click();
    await waitFrames(page);
    const kara = await fitSnapshot(page);
    const karaFrame = kara.frames.filter(function (f) { return f.id === 'kara'; })[0];
    assert(karaFrame && fullyInside(karaFrame.rect, kara.canvas), 'focused Kara chapter is clipped by the canvas');

    await openChapter(page, 'hostage');
    const hostage = await fitSnapshot(page);
    const hostageFrame = hostage.frames.filter(function (f) { return f.id === 'hostage'; })[0];
    assert(hostageFrame && fullyInside(hostageFrame.rect, hostage.canvas), 'focused Hostage chapter is clipped by the canvas');
    assert(hostage.nodeCount === 114 && hostage.edgeCount === 99, 'Hostage focus must keep the whole graph mounted');
    const hostageInside = await page.evaluate(function () {
      const c = document.getElementById('canvas').getBoundingClientRect();
      const nodes = Array.from(document.querySelectorAll('[data-node]')).filter(function (node) {
        return ATLAS.nodes.filter(function (n) { return n.id === node.getAttribute('data-node'); })[0].chapter === 'hostage';
      });
      return {
        count: nodes.length,
        inside: nodes.every(function (node) {
          const r = node.getBoundingClientRect();
          return r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
        })
      };
    });
    assert(hostageInside.count === 33 && hostageInside.inside, 'Hostage focus must fit all 33 chart boxes');
    await page.locator('[data-chapter="all"]').click();
    await waitFrames(page);
    assert(await page.locator('#canvas').getAttribute('data-lod') === null, 'reset must not restore a semantic zoom level');
  });

  await ok('Shades preserves its partial chart, unknown origins, source detail and appended edge link', async function () {
    await openChapter(page, 'shades-of-color');
    const shape = await fitSnapshot(page);
    const frame = shape.frames.find(function (f) { return f.id === 'shades-of-color'; });
    assert(frame && fullyInside(frame.rect, shape.canvas), 'Shades chapter frame must fit');
    assert(await page.locator('[data-node^="sc_"]').count() === 12, 'all twelve Shades nodes must stay mounted');
    assert(await page.locator('path.edge[data-edge-id^="e_sc_"]').count() === 5, 'only five reviewed Shades connectors');
    await page.locator('#q').fill('WATCH PREACHER');
    await page.locator('#results [data-hit="sc_preacher"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const detail = (await textOf(page, '#details')).toLowerCase();
    assert(detail.includes('origin') && detail.includes('unknown'), 'detached-origin uncertainty must be visible');
    assert(await page.locator('#details a[href*="2162781882"]').count() > 0, 'Steam source link must be present');
    await page.locator('#details-close').click();
    await page.locator('#q').fill('');
    await page.evaluate(function () { location.hash = '#shades-of-color/sc_store?edge=96'; });
    await page.waitForFunction(function () { return !!document.querySelector('path.edge.focused[data-edge-id="e_sc_park_store"]'); });
    assert(await page.locator('#details [data-edge-evidence="96"]').count() === 1, 'appended numeric permalink must open its actual edge');
    const invented = await page.evaluate(function () { return ATLAS.edges.some(function (e) { return e.from === 'sc_protesters' && e.to === 'sc_bus'; }); });
    assert(!invented, 'do not invent a protesters-to-bus connector');
    await page.locator('#details-close').click();
    await resetAtlas(page);
  });

  await ok('Meet Todd keeps its two separate prerequisite gates', async function () {
    await openChapter(page, 'kara');
    await page.locator('[data-node="k_meet"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(d.indexOf('Meet Todd') !== -1, 'details heading missing');
    assert(await page.locator('#details .rowlist [data-goto="k_terminal"]').count() === 1, 'terminal connector row missing');
    assert(await page.locator('#details .rowlist [data-goto="s_alive"]').count() === 1, 'survival connector row missing');
    const kinds = await page.locator('#details .rowlist .kind').allTextContents();
    assert(kinds.filter(function (k) { return /prerequisite/i.test(k); }).length === 2, 'two gate kinds expected, got: ' + kinds.join(' | '));
    assert(d.indexOf('Todd not killed in Stormy Night') !== -1, 'survival gate wording missing');
    assert(d.indexOf('bus terminal') !== -1, 'terminal gate wording missing');
    assert(await page.locator('#canvas').isVisible(), 'map must stay visible while details are open');
    assert(await page.locator('[data-node="a_talk"]').isVisible(), 'event nodes must stay reachable while details are open');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('Alice box keeps a dashed unresolved hypothesis and opens the real later node', async function () {
    await openChapter(page, 'home');
    await page.locator('[data-node="a_box"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(/open alice/i.test(d), 'box heading missing: ' + d.slice(0, 80));
    assert(d.indexOf('unresolved hypothesis') !== -1, 'hypothesis kind must be named');
    assert(await page.locator('#details .rowlist [data-goto="k_dialogue"]').count() === 1, 'hypothesis connector row missing');
    assert(await page.locator('#details .goto[data-goto="k_dialogue"]').count() === 1, 'cross-chapter jump button missing');
    assert(await page.locator('#details [data-goto="k_meet"]').count() === 0, 'box must not link to the meeting as a gate');
    const dashed = await page.evaluate(function () {
      const p = document.querySelector('path.edge.hypothesis');
      return !!p && getComputedStyle(p).strokeDasharray !== 'none';
    });
    assert(dashed, 'hypothesis connector must stay dashed');

    await page.locator('#details .goto[data-goto="k_dialogue"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const after = await textOf(page, '#details');
    assert(after.indexOf('Todd dialogue') !== -1, 'dialogue details did not open');
    assert(await page.locator('[data-chapter="kara"]').getAttribute('aria-pressed') === 'true', 'chapter must follow the node');
    assert(await page.locator('#canvas').isVisible(), 'map stays visible through the cross-chapter jump');
    const centered = await page.evaluate(function () {
      const c = document.getElementById('canvas').getBoundingClientRect();
      const b = document.querySelector('[data-node="k_dialogue"]').getBoundingClientRect();
      return b.right > c.left && b.left < c.right && b.bottom > c.top && b.top < c.bottom;
    });
    assert(centered, 'the opened node should be brought into view');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('The Hostage chart keeps five uncertain claims, the primary-image reading, a dead end and the saved-cop carry', async function () {
    await openChapter(page, 'hostage');
    assert(await page.locator('[data-chapter="hostage"]').getAttribute('aria-pressed') === 'true', 'Hostage chapter is not active');
    assert(await page.locator('.node.hostage.stage').count() === 3, 'three Hostage stage containers must stay visually distinct');
    const chartBoxes = await page.evaluate(function () {
      const nodes = Array.from(document.querySelectorAll('[data-node]')).filter(function (node) {
        return ATLAS.nodes.filter(function (n) { return n.id === node.getAttribute('data-node'); })[0].chapter === 'hostage';
      });
      const source = ATLAS.nodes.filter(function (n) { return n.chapter === 'hostage'; });
      const labels = source.reduce(function (out, node) {
        return out.concat(node.kind === 'choice' ? node.options : [node.label]);
      }, []);
      return {
        boxes: nodes.length,
        labels: labels,
        missing: labels.filter(function (label) {
          return !nodes.some(function (node) { return node.textContent.indexOf(label) !== -1; });
        })
      };
    });
    assert(chartBoxes.boxes === 33, 'all 33 Hostage chart boxes must render');
    assert(chartBoxes.labels.length === 40 && chartBoxes.missing.length === 0,
      'all 40 Hostage chart labels must stay visible: ' + chartBoxes.missing.join(', '));

    const uncertain = await page.evaluate(function () {
      const paths = Array.from(document.querySelectorAll('path.edge.uncertain')).map(function (path) {
        return {
          id: path.getAttribute('data-edge-id'),
          dash: getComputedStyle(path).strokeDasharray
        };
      });
      const badges = Array.from(document.querySelectorAll('.badge.uncertain')).map(function (badge) {
        return { id: badge.getAttribute('data-badge-edge'), text: badge.textContent.trim() };
      });
      const chart = ATLAS.edges.filter(function (edge) {
        return edge.kind === 'uncertain' && edge.id.indexOf('e_hostage_') === 0;
      }).map(function (edge) { return edge.id; });
      return { paths: paths, badges: badges, chart: chart };
    });
    assert(uncertain.chart.length === 5, 'fixture should keep 5 uncertain Hostage edge claims');
    assert(uncertain.paths.length === 5, 'five uncertain Hostage paths must render, got ' + uncertain.paths.length);
    assert(uncertain.paths.every(function (path) { return uncertain.chart.includes(path.id) && path.dash !== 'none'; }),
      'every uncertain Hostage connector must stay dashed');
    assert(uncertain.badges.length === 5 && uncertain.badges.every(function (badge) { return badge.text === '?'; }),
      'five question-mark badges must stay attached to the uncertain claims');

    const readings = await page.evaluate(function () {
      return ['e_hostage_approach_fail', 'e_hostage_cold_approach_fail', 'e_hostage_fail_jumps'].map(function (id) {
        const edge = ATLAS.edges.find(function (item) { return item.id === id; });
        const path = document.querySelector('[data-edge-id="' + id + '"]');
        return { id: id, fromOption: edge.fromOption == null ? null : edge.fromOption, kind: edge.kind,
          rendered: !!path, pathClass: path && path.getAttribute('class') };
      });
    });
    assert(readings.map(function (item) { return [item.fromOption, item.kind, item.rendered]; }).toString() ===
      '0,uncertain,true,1,uncertain,true,,traced,true',
      'option split and selected FAIL→Jumps route must stay visible: ' + JSON.stringify(readings));

    await page.locator('[data-node="get_close"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const deadEnd = await textOf(page, '#details');
    assert(deadEnd.indexOf('GET CLOSE ENOUGH') !== -1, 'GET CLOSE ENOUGH details did not open');
    const getCloseOut = await page.evaluate(function () {
      return Array.from(document.querySelectorAll('#details .rowlist [data-edge]')).filter(function (row) {
        return ATLAS.edges[Number(row.getAttribute('data-edge'))].from === 'get_close';
      }).length;
    });
    assert(getCloseOut === 0, 'GET CLOSE ENOUGH must keep no outgoing connector');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="wounded_cop"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const cop = await textOf(page, '#details');
    assert(cop.indexOf('SAVE WOUNDED COP') !== -1, 'wounded-cop choices must remain visible');
    assert(cop.indexOf('LEAVE WOUNDED COP') !== -1, 'the leave row must remain visible without a consequence');
    assert(await page.locator('#details .rowlist [data-goto="pe_meet_cop"]').count() === 1,
      'SAVE WOUNDED COP must carry exactly one cross-chapter row');
    const gateKind = await page.locator('#details .rowlist [data-goto="pe_meet_cop"] .kind').textContent();
    assert(/prerequisite/i.test(gateKind || ''), 'saved-cop carry must render as a prerequisite, got ' + gateKind);
    assert(await page.locator('#details .rowlist [data-goto="pe_meet_cop"]').textContent().then(function (t) {
      return /SAVE WOUNDED COP/.test(t);
    }), 'the cross-chapter row must name the SAVE option');
    await page.locator('#details .rowlist [data-goto="pe_meet_cop"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const meet = await textOf(page, '#details');
    assert(meet.indexOf('Meet Cop From Hostage Situation') !== -1, 'Public Enemy meeting did not open');
    assert(await page.locator('[data-chapter="public-enemy"]').getAttribute('aria-pressed') === 'true',
      'the chapter must follow the saved-cop carry');
    const meetOut = await page.evaluate(function () {
      return Array.from(document.querySelectorAll('#details .rowlist [data-edge]')).filter(function (row) {
        return ATLAS.edges[Number(row.getAttribute('data-edge'))].from === 'pe_meet_cop';
      }).length;
    });
    assert(meetOut === 0, 'the bounded Public Enemy node must have no outgoing consequence');
    assert(meet.indexOf('Matching guides are not independent verification') !== -1,
      'the meeting must keep its evidence limit');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await openChapter(page, 'hostage');
    await page.locator('.edge-label[data-edge-id="e_hostage_save_cop_public_enemy"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const evidence = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        hash: location.hash
      };
    });
    assert(evidence.edge !== null && evidence.evidence === 'prerequisite', 'saved-cop edge evidence block missing');
    assert(evidence.hash.indexOf('#public-enemy/pe_meet_cop?edge=') === 0,
      'saved-cop edge hash should open the bounded meeting node, got ' + evidence.hash);
    assert(await page.locator('#details .edge-evidence a[href*="powerpyx.com"]').count() >= 1,
      'saved-cop evidence must link the supporting guide');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
    await resetAtlas(page);
  });

  await ok('the two successful non-gun escapes stay separate and Todd links stay inferred', async function () {
    await openChapter(page, 'stormy');
    for (const id of ['s_front_backyard_escape', 's_window_reach_bus']) {
      await page.locator('[data-node="' + id + '"]').click();
      await page.locator('#details').waitFor({ state: 'visible' });
      const d = await textOf(page, '#details');
      assert(d.indexOf('do not state Todd’s later state') !== -1 || d.indexOf("do not state Todd's later state") !== -1,
        id + ' must keep the missing Todd-state evidence');
      assert(/dashed link to Todd not killed is an inference/i.test(d), id + ' must label the Todd link as an inference');
      assert(await page.locator('#details .rowlist [data-goto="s_alive"]').count() === 1,
        id + ' should have exactly one inferred connector to s_alive');
      const kind = await page.locator('#details .rowlist [data-goto="s_alive"] .kind').textContent();
      assert(/unresolved hypothesis/i.test(kind || ''), id + ' Todd link must be an unresolved hypothesis, got ' + kind);
      assert(await page.locator('#details .rowlist [data-goto="k_terminal"], #details .rowlist [data-goto="k_meet"]').count() === 0,
        id + ' must not bypass the separate terminal or meeting gates');
      await page.locator('#details-close').click();
      await page.locator('#details').waitFor({ state: 'hidden' });
    }

    await page.locator('[data-chapter="stormy"]').click();
    await waitFrames(page);
    await page.locator('[data-node="s_window_open"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const windowDetails = await textOf(page, '#details');
    assert(windowDetails.indexOf('route available') !== -1 && windowDetails.indexOf('successful branch') !== -1,
      'window availability and successful branch must stay distinct');
    assert(await page.locator('#details .rowlist [data-goto="s_window_go_out"]').count() === 1,
      'window route must lead to the go-out step');
    const windowKind = await page.locator('#details .rowlist [data-goto="s_window_go_out"] .kind').textContent();
    assert(/prerequisite/i.test(windowKind || ''), 'the window opening should gate the exit as a prerequisite, got ' + windowKind);
    assert(await page.locator('#details .rowlist [data-goto="k_terminal"], #details .rowlist [data-goto="k_meet"]').count() === 0,
      'the window opening must not claim a direct escape outcome');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('Stormy entry keeps the source order and distinct response branches in the rendered map', async function () {
    await openChapter(page, 'stormy');
    await page.locator('[data-node="s_todd_orders_stay"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    let d = await textOf(page, '#details');
    assert(d.indexOf('Todd orders Kara to stay still') !== -1, 'Todd order event missing');
    assert(await page.locator('#details .rowlist [data-goto="s_alice_runs_upstairs"]').count() === 1,
      'Todd order must lead to Alice running upstairs');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="s_alice_runs_upstairs"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    assert(await page.locator('#details .rowlist [data-goto="s_fatal_todd_kills"]').count() === 1,
      'stay-still response should reach the distinct fatal outcome');
    assert(await page.locator('#details .rowlist [data-goto="s_deviant"]').count() === 1,
      'Alice-upstairs event should also offer becoming deviant');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="s_alice_runs_upstairs"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    assert(await page.locator('#details .rowlist [data-goto="s_fatal_todd_kills"]').count() === 1, 'stay-still response should reach fatal outcome');
    assert(await page.locator('#details .rowlist [data-goto="s_deviant"]').count() === 1, 'deviant response should remain separate');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="s_fatal_todd_kills"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    d = await textOf(page, '#details');
    assert(d.indexOf('Todd kills Alice and Kara') !== -1, 'fatal outcome heading missing');
    assert(/fatal/i.test(d), 'fatal outcome details should state that it is fatal');
    assert(await page.locator('#details .rowlist [data-goto="s_alive"], #details .rowlist [data-goto="s_dead"], #details .rowlist [data-goto="k_meet"], #details .rowlist [data-goto="k_terminal"]').count() === 0,
      'fatal outcome must not connect to Todd states or later meeting nodes');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="s_deviant"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    assert(await page.locator('#details .rowlist [data-goto="s_go_upstairs"]').count() === 1,
      'deviant response should offer going upstairs');
    assert(await page.locator('#details .rowlist [data-goto="s_reason_todd"]').count() === 1,
      'deviant response should offer Reason with Todd');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="s_go_upstairs"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    assert(await page.locator('#details .rowlist [data-goto="s_reach_alice"]').count() === 1,
      'go-upstairs should join the existing Reach Alice route');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await page.locator('[data-node="s_reason_todd"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    assert(await page.locator('#details .rowlist [data-goto="s_todd_upstairs_first"]').count() === 1,
      'Reason with Todd should end at Todd reaching Alice first');
    assert(await page.locator('#details .rowlist [data-goto="s_alive"], #details .rowlist [data-goto="s_dead"]').count() === 0,
      'Reason with Todd must not claim a Todd fate');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    const separation = await page.evaluate(function () {
      const edgeIds = new Set(ATLAS.edges.map(function (e) { return e.id; }));
      return {
        fatalOut: ATLAS.edges.filter(function (e) { return e.from === 's_fatal_todd_kills'; }).length,
        deviantOut: ATLAS.edges.filter(function (e) { return e.from === 's_deviant'; }).map(function (e) { return e.to; }).sort(),
        mountedEdges: document.querySelectorAll('path.edge').length,
        entryEdges: ['e_stormy_todd_orders_alice_upstairs', 'e_stormy_alice_upstairs_stay_still',
          'e_stormy_alice_upstairs_deviant', 'e_stormy_deviant_go_upstairs',
          'e_stormy_go_upstairs_reach_alice', 'e_stormy_deviant_reason', 'e_stormy_reason_knocked']
          .filter(function (id) { return edgeIds.has(id); }).length
      };
    });
    assert(separation.fatalOut === 0, 'the fatal outcome must remain terminal on the map');
    assert(separation.mountedEdges === 99 && separation.entryEdges === 7,
      'all entry connectors must stay mounted with the map');
    assert(JSON.stringify(separation.deviantOut) === JSON.stringify(['s_go_upstairs', 's_reason_todd']),
      'deviant response connectors changed: ' + separation.deviantOut.join(','));
  });

  await ok('withdrawn legacy links show history and open each active replacement without drawing false arrows', async function () {
    for (const index of [2, 6]) {
      const record = await page.evaluate(function (i) {
        const edge = ATLAS.edges[i];
        return { to: edge.to, replacements: edge.replacedBy.map(function (id) {
          const replacementIndex = ATLAS.edges.findIndex(function (e) { return e.id === id; });
          return { index: replacementIndex, to: ATLAS.edges[replacementIndex].to };
        }) };
      }, index);
      for (const replacement of record.replacements) {
        await resetAtlas(page);
        await page.evaluate(function (hash) { location.hash = hash; }, '#home/' + record.to + '?edge=' + index);
        await page.locator('#details [data-evidence="withdrawn"]').waitFor({ state: 'visible' });
        const historical = await textOf(page, '#details');
        assert(historical.includes('Withdrawn claim') && historical.includes('not an active connector'),
          'old link must identify a withdrawn historical claim');
        assert(await page.locator('path.edge[data-edge="2"], path.edge[data-edge="6"]').count() === 0,
          'withdrawn claims must have no SVG arrow');
        assert(await page.locator('#details .rowlist [data-edge="' + index + '"]').count() === 0,
          'withdrawn history must not be an ordinary node connection');
        await page.locator('#details [data-open-edge="' + replacement.index + '"]').click();
        await page.locator('#details [data-edge-evidence="' + replacement.index + '"]').waitFor({ state: 'visible' });
        assert((await textOf(page, '#details')).includes('Focused connector') &&
          !(await textOf(page, '#details')).includes('Focused cross-chapter connector'),
          'local replacements must not be classified as cross-chapter connectors');
        assert((await page.evaluate(function () { return location.hash; })) ===
          '#home/' + replacement.to + '?edge=' + replacement.index, 'replacement permalink must identify its real record');
        assert(await page.locator('path.edge.focused[data-edge="' + replacement.index + '"]').count() === 1,
          'replacement must focus its real map path');
      }
    }
  });

  await ok('map cross-label opens the actual edge with evidence and a permalink', async function () {
    await resetAtlas(page);
    const hypothesis = await page.evaluate(function () {
      for (let i = 0; i < ATLAS.edges.length; i++) {
        const e = ATLAS.edges[i];
        if (e.kind === 'hypothesis' && e.from === 'a_box') return { index: i, from: e.from, to: e.to, label: e.label || '' };
      }
      return null;
    });
    assert(hypothesis, 'fixture hypothesis edge missing');
    await page.locator('.edge-label.hypothesis[data-edge-label="' + hypothesis.index + '"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(d.indexOf('Todd dialogue') !== -1, 'crosslink should open the actual later endpoint');
    assert(d.indexOf('Focused cross-chapter connector') !== -1, 'focused connector evidence block missing');
    assert(d.indexOf('UNRESOLVED hypothesis') !== -1, 'focused connector must keep UNRESOLVED status');
    assert(d.indexOf('not a confirmed causal link') !== -1, 'focused connector must not claim a confirmed causal link');
    assert(d.indexOf('Unknown:') !== -1, 'focused connector must state what remains unknown');
    assert(d.indexOf('Neoseeker') !== -1, 'connector-specific source must be named');
    assert(await page.locator('#details .edge-evidence a[href*="neoseeker"]').count() === 1,
      'connector-specific source must link to the supporting guide');
    if (hypothesis.label) assert(d.indexOf(hypothesis.label) !== -1, 'actual connector label missing from details');
    const focused = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      const path = document.querySelector('path.edge.focused');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        hash: location.hash,
        pathId: path ? path.id : null,
        pressed: document.querySelector('[data-chapter="kara"]').getAttribute('aria-pressed')
      };
    });
    assert(focused.edge === hypothesis.index, 'details did not target the actual edge index');
    assert(focused.evidence === 'unresolved', 'details lost the unresolved evidence class');
    assert(focused.hash === '#kara/' + hypothesis.to + '?edge=' + hypothesis.index,
      'crosslink hash should preserve chapter, node and edge, got ' + focused.hash);
    assert(focused.pathId === 'edge-' + hypothesis.index, 'the actual edge path is not focused');
    assert(focused.pressed === 'true', 'crosslink should focus the target chapter');
    const inCanvas = await page.evaluate(function (id) {
      const c = document.getElementById('canvas').getBoundingClientRect();
      const b = document.querySelector('[data-node="' + id + '"]').getBoundingClientRect();
      return b.right > c.left && b.left < c.right && b.bottom > c.top && b.top < c.bottom;
    }, hypothesis.to);
    assert(inCanvas, 'crosslink target should be brought into view');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });

    await resetAtlas(page);
    await page.locator('.edge-label.prerequisite').first().click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const gate = await textOf(page, '#details');
    assert(gate.indexOf('Meet Todd') !== -1, 'gate crosslink should open Meet Todd');
    assert(gate.indexOf('Reported prerequisite') !== -1, 'gate crosslink must keep Reported prerequisite status');
    assert(gate.indexOf('exact access check is not verified') !== -1, 'gate crosslink must state the unknown');
    const gateState = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        hash: location.hash
      };
    });
    assert(gateState.edge !== null && gateState.evidence === 'prerequisite', 'gate evidence block missing');
    assert(gateState.hash === '#kara/k_meet?edge=' + gateState.edge, 'gate hash lost its edge suffix');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('close button and Escape reduce to the same state and restore focus', async function () {
    await openChapter(page, 'home');
    await page.locator('[data-node="a_talk"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const hashBefore = await page.evaluate(function () { return location.hash; });
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
    await page.waitForFunction(function () {
      const active = document.activeElement;
      return active && (active.getAttribute('data-event-node') === 'a_talk' || active.getAttribute('data-node') === 'a_talk');
    }, null, { timeout: 1500 });
    const afterButton = {
      hash: await page.evaluate(function () { return location.hash; }),
      focused: await page.evaluate(function () { return document.activeElement && (document.activeElement.getAttribute('data-event-node') || document.activeElement.getAttribute('data-node')); })
    };
    assert(afterButton.focused === 'a_talk', 'focus should return to the event map button, was ' + afterButton.focused);

    await page.locator('[data-node="a_talk"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.locator('#details').waitFor({ state: 'hidden' });
    await page.waitForFunction(function () {
      const active = document.activeElement;
      return active && (active.getAttribute('data-event-node') === 'a_talk' || active.getAttribute('data-node') === 'a_talk');
    }, null, { timeout: 1500 });
    const afterEscape = {
      hash: await page.evaluate(function () { return location.hash; }),
      focused: await page.evaluate(function () {
        const a = document.activeElement;
        return {
          id: a && (a.getAttribute('data-event-node') || a.getAttribute('data-node')),
          tag: a && a.tagName,
          className: a && a.className,
          eventMode: document.querySelector('[data-node="a_talk"]') && getComputedStyle(document.querySelector('[data-node="a_talk"]')).display,
          nodeMode: document.querySelector('[data-node="a_talk"]') && getComputedStyle(document.querySelector('[data-node="a_talk"]')).visibility
        };
      })
    };
    assert(afterEscape.focused.id === 'a_talk', 'Escape should return focus to the event map button: ' + JSON.stringify(afterEscape.focused));
    assert(afterButton.hash === afterEscape.hash, 'close paths must leave the same hash: ' + afterButton.hash + ' vs ' + afterEscape.hash);
    assert(hashBefore === afterButton.hash, 'closing details should not rewrite the selected hash');
  });

  await ok('history trail records visits and reopens them', async function () {
    await openChapter(page, 'kara');
    await page.locator('[data-node="k_goodbye"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    await resetAtlas(page);
    await openChapter(page, 'stormy');
    await page.locator('[data-node="s_alive"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const items = page.locator('#trail [data-trail]');
    assert(await items.count() >= 2, 'trail should hold the recent visits');
    assert(await items.first().getAttribute('data-trail') === 's_alive', 'newest visit must be first');
    assert(await items.nth(1).getAttribute('data-trail') === 'k_goodbye', 'second-newest visit should be k_goodbye');
    assert(await page.locator('#trail').isVisible(), 'history stays visible during navigation');
    await items.nth(1).click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(d.indexOf('Alice says goodbye') !== -1, 'trail click did not reopen the earlier node');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('search is reachable from the keyboard and Escape closes results first', async function () {
    await resetAtlas(page);
    await page.keyboard.press('/');
    assert(await page.evaluate(function () { return document.activeElement && document.activeElement.id; }) === 'q',
      '/ should focus the search input');
    await page.locator('#q').fill('soldiers');
    const results = page.locator('#results [data-hit]');
    assert(await results.count() >= 1, 'search returned no hits');
    await page.keyboard.press('Escape');
    assert(await page.locator('#results').isHidden(), 'first Escape should close search results');
    assert(await page.locator('#details').isHidden(), 'Escape on results must not open or close details when none are open');
    assert(await page.evaluate(function () { return document.activeElement && document.activeElement.id; }) === 'q',
      'Escape should return focus to the search input');

    await page.locator('#q').fill('soldier');
    await page.keyboard.press('ArrowDown');
    const focusedHit = await page.evaluate(function () { return document.activeElement && document.activeElement.getAttribute('data-hit'); });
    assert(focusedHit === 'k_away', 'ArrowDown should focus the first matching result, got ' + focusedHit);
    await page.keyboard.press('Enter');
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(d.indexOf('Todd sends soldiers away') !== -1, 'keyboard result did not open its node');
    assert(await page.locator('[data-chapter="kara"]').getAttribute('aria-pressed') === 'true', 'search should follow the node chapter');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('palette keeps text contrast at or above 4.5:1', async function () {
    await openChapter(page, 'kara');
    await page.locator('[data-node="k_terminal"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const samples = await page.evaluate(function () {
      function parse(c) {
        const m = (c || '').match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      }
      function lum(c) {
        const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
      }
      function contrast(fg, bg) {
        const a = lum(fg), b = lum(bg);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }
      function bgOf(el) {
        let e = el;
        while (e) {
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c && c.a === 1) return c;
          e = e.parentElement;
        }
        return { r: 0, g: 0, b: 0, a: 1 };
      }
      const sels = [
        '.frame-title', '.node-label', '.node .sub', '.edge-label.prerequisite',
        '.status', '.details h2', '.details p', '.details .tiny', '.brand span',
        '.chapter', '.chapter small', '.trail button', '.zoom span', '.legend'
      ];
      return sels.map(function (s) {
        const el = document.querySelector(s);
        if (!el) return { sel: s, missing: true };
        return { sel: s, ratio: Math.round(contrast(parse(getComputedStyle(el).color), bgOf(el)) * 100) / 100 };
      });
    });
    samples.forEach(function (s) {
      assert(!s.missing, 'sample ' + s.sel + ' not found');
      assert(s.ratio >= 4.5, 'contrast ' + s.ratio + ':1 below 4.5 for ' + s.sel);
    });
    console.log('          contrast: ' + samples.map(function (s) { return s.sel + ' ' + s.ratio; }).join(', '));
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('spoiler reset re-locks the map and remembered consent survives a reload', async function () {
    await resetAtlas(page);
    await page.locator('#consent-reset').click();
    await page.locator('#spoiler-overlay').waitFor({ state: 'visible' });
    const locked = await page.evaluate(function () {
      const shell = document.getElementById('atlas-shell');
      const overlay = document.getElementById('spoiler-overlay');
      const canvas = document.getElementById('canvas').getBoundingClientRect();
      const world = document.getElementById('world');
      return {
        inert: shell.hasAttribute('inert'),
        hidden: shell.getAttribute('aria-hidden'),
        focus: document.activeElement ? document.activeElement.id : null,
        overlayZ: Number(getComputedStyle(overlay).zIndex),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        worldVisible: !!world && world.getBoundingClientRect().width > 0,
        nodes: document.querySelectorAll('[data-node]').length,
        detailsHidden: document.getElementById('details').hidden,
        stored: localStorage.getItem('ra9-atlas.consent.v1')
      };
    });
    assert(locked.inert && locked.hidden === 'true', 're-locked shell must be inert and aria-hidden');
    assert(locked.focus === 'consent', 're-lock should focus the consent button');
    assert(locked.overlayZ >= 40, 're-locked overlay must cover the map');
    assert(locked.canvasWidth > 0 && locked.canvasHeight > 0 && locked.worldVisible, 'map must stay visible beneath the re-locked overlay');
    assert(locked.nodes === 114, 'map content must stay mounted beneath the re-locked overlay');
    assert(locked.detailsHidden, 're-lock should happen from a closed-details state');
    assert(locked.stored === null, 'reset should clear the stored consent key');

    await page.locator('#consent').click();
    await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
    await page.locator('#world').waitFor({ state: 'visible' });
    await page.reload({ waitUntil: 'load' });
    await page.locator('#world').waitFor({ state: 'visible' });
    await waitFrames(page);
    const remembered = await page.evaluate(function () {
      return {
        overlay: !!document.getElementById('spoiler-overlay'),
        consentButton: !!document.getElementById('consent'),
        stored: localStorage.getItem('ra9-atlas.consent.v1'),
        canvas: document.getElementById('canvas').getBoundingClientRect(),
        lod: document.getElementById('canvas').getAttribute('data-lod')
      };
    });
    assert(!remembered.overlay && !remembered.consentButton, 'remembered consent should skip the cover after reload');
    assert(remembered.stored === '1', 'consent should persist in localStorage');
    assert(remembered.canvas.width > 0 && remembered.canvas.height > 0, 'remembered revisit still needs a usable canvas');
    assert(remembered.lod === null, 'remembered revisit should have no semantic zoom state');
  });

  await ok('hash round-trips restore a node and an edge-focused deep link after consent', async function () {
    const fresh = await browser.newPage({ viewport: { width: 1450, height: 900 } });
    track(fresh);
    await fresh.goto(url + '#kara/k_check');
    await fresh.locator('#consent').click();
    await fresh.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(fresh, '#details');
    assert(d.indexOf('Security check') !== -1, 'deep link did not restore k_check');
    assert(await fresh.locator('[data-chapter="kara"]').getAttribute('aria-pressed') === 'true', 'deep link did not restore chapter');
    await fresh.close();

    const hypothesis = await page.evaluate(function () {
      for (let i = 0; i < ATLAS.edges.length; i++) {
        if (ATLAS.edges[i].kind === 'hypothesis') return { index: i, to: ATLAS.edges[i].to };
      }
      return null;
    });
    assert(hypothesis, 'fixture hypothesis edge missing');
    const freshEdge = await browser.newPage({ viewport: { width: 1450, height: 900 } });
    track(freshEdge);
    await freshEdge.goto(url + '#kara/' + hypothesis.to + '?edge=' + hypothesis.index);
    await freshEdge.locator('#consent').click();
    await freshEdge.locator('#details').waitFor({ state: 'visible' });
    const edgeState = await freshEdge.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(edgeState.edge === hypothesis.index, 'edge deep link lost the focused edge');
    assert(edgeState.evidence === 'unresolved', 'edge deep link lost the unresolved evidence class');
    assert(edgeState.text.indexOf('not a confirmed causal link') !== -1, 'edge deep link must keep the uncertainty wording');
    await freshEdge.close();
  });

  await ok('no page errors in this palette', async function () {
    assert(pageErrors.length === 0, pageErrors.join(' | '));
  });

  await page.close();
}

/* Scoped regression for the <=900px responsive layout: the production
   stylesheet used to give the canvas zero height and let .workspace exceed the
   viewport at 390px. This version covers the continuous story map, mobile map
   labels, dragging the same canvas, and whole-map/chapter fit. Chromium
   viewport emulation, not a physical phone or a real touch-gesture check. */
async function runMobileRegression(browser) {
  console.log('scenario mobile-390 stable map');
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 845 } });
  page.on('pageerror', function (e) { pageErrors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  await page.goto(baseUrl + '/prototype/poc4-editorial.html#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  await ok('mobile spoiler cover keeps the real map underneath', async function () {
    assert(await page.locator('[data-node]').count() === 114, 'real nodes must be mounted beneath the cover');
    assert(await page.locator('path.edge').count() === 99, 'real edges must be mounted beneath the cover');
    assert(await page.locator('#spoiler-overlay').isVisible(), 'spoiler cover should be visible');
  });
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await waitFrames(page);

  await ok('390x845 fit keeps one stable graph and avoids page overflow', async function () {
    const m = await page.evaluate(function () {
      const canvas = document.getElementById('canvas').getBoundingClientRect();
      const world = document.getElementById('world');
      const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
      return {
        width: canvas.width,
        viewport: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        nodes: document.querySelectorAll('[data-node]').length,
        labels: document.querySelectorAll('[data-node-label]').length,
        edges: document.querySelectorAll('path.edge').length,
        frames: Array.from(document.querySelectorAll('.frame')).map(function (f) {
          const r=f.getBoundingClientRect(); return { inside:r.left>=canvas.left-1&&r.right<=canvas.right+1&&r.top>=canvas.top-1&&r.bottom<=canvas.bottom+1 };
        }),
        scale: matrix.a
      };
    });
    assert(Math.abs(m.width-m.viewport)<=1, 'canvas width does not fit the mobile viewport');
    assert(!m.overflow, 'mobile page has horizontal overflow');
    assert(m.nodes===114&&m.labels===114&&m.edges===99, 'mobile viewport changed graph inventory');
    assert(m.frames.every(function(f){return f.inside;}), 'whole-map Fit should contain all chapter regions');
    assert(m.scale>0&&m.scale<1, 'mobile fit should scale the same world map');
  });

  await ok('mobile chapter focus and pan preserve the same world-space graph', async function () {
    const before = await page.evaluate(function () { const w=document.getElementById('world'); const m=new DOMMatrixReadOnly(getComputedStyle(w).transform); return {a:m.a,e:m.e,f:m.f}; });
    await page.locator('[data-chapter="home"]').click();
    await waitFrames(page);
    const focused = await page.evaluate(function () {
      const canvas=document.getElementById('canvas').getBoundingClientRect();
      const frame=document.querySelector('[data-chapter-frame="home"]').getBoundingClientRect();
      const world=document.getElementById('world'); const m=new DOMMatrixReadOnly(getComputedStyle(world).transform);
      return { pressed:document.querySelector('[data-chapter="home"]').getAttribute('aria-pressed'), inside:frame.left>=canvas.left-1&&frame.right<=canvas.right+1&&frame.top>=canvas.top-1&&frame.bottom<=canvas.bottom+1, nodes:document.querySelectorAll('[data-node]').length, labels:document.querySelectorAll('[data-node-label]').length, edges:document.querySelectorAll('path.edge').length, camera:{a:m.a,e:m.e,f:m.f}, text:Array.from(document.querySelectorAll('[data-node-label]')).map(function(x){return x.textContent.trim();}) };
    });
    assert(focused.pressed==='true'&&focused.inside, 'mobile chapter focus did not fit its real frame');
    assert(focused.nodes===114&&focused.labels===114&&focused.edges===99, 'chapter focus swapped or hid real graph content');
    assert(focused.text.every(Boolean), 'chapter focus has an anonymous event label');
    const point=await page.evaluate(function(){const c=document.getElementById('canvas'),r=c.getBoundingClientRect();for(let y=r.top+25;y<r.bottom-25;y+=12){for(let x=r.left+25;x<r.right-25;x+=12){const el=document.elementFromPoint(x,y);if(el&&c.contains(el)&&!el.closest('button,a,input,.legend,.status,.zoom'))return{x:x,y:y};}}return null;});
    assert(point,'no clear map point for mobile pan');
    await page.mouse.move(point.x,point.y); await page.mouse.down();
    await page.mouse.move(point.x+45,point.y-35,{steps:5}); await page.mouse.up(); await waitFrames(page);
    const after=await page.evaluate(function(){const m=new DOMMatrixReadOnly(getComputedStyle(document.getElementById('world')).transform);return {a:m.a,e:m.e,f:m.f};});
    assert(Math.abs(after.a-focused.camera.a)<1e-6, 'pan changed camera scale');
    assert(Math.abs(after.e-focused.camera.e)>1||Math.abs(after.f-focused.camera.f)>1, 'pan did not move the world');
    assert(before.a>0, 'initial mobile camera was invalid');
  });

  await ok('mobile Shades focus and search retain partial-chart evidence and the map', async function () {
    await openChapter(page, 'shades-of-color');
    await page.locator('#q').fill('PROTESTERS');
    await page.locator('#results [data-hit="sc_protesters"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const detail = (await textOf(page, '#details')).toLowerCase();
    assert(detail.includes('origin') && detail.includes('unknown'), 'mobile details must expose unknown origins');
    assert(await page.locator('#details a[href*="powerpyx.com"]').count() > 0, 'guide claim needs its PowerPyx citation');
    assert(await page.locator('[data-node]').count() === 114, 'mobile details must preserve the whole map');
    await page.locator('#details-close').click();
    await page.locator('#q').fill('');
    await page.evaluate(function () { location.hash = '#shades-of-color/sc_store?edge=96'; });
    await page.waitForFunction(function () { return !!document.querySelector('path.edge.focused[data-edge-id="e_sc_park_store"]'); });
    assert(await page.locator('#details [data-edge-evidence="96"]').count() === 1, 'mobile appended permalink must open its actual edge');
    assert(await page.locator('[data-node]').count() === 114, 'mobile appended permalink must preserve the map');
    await page.locator('#details-close').click();
    await resetAtlas(page);
  });

  await ok('mobile search opens usable details and preserves the map', async function () {
    await page.locator('#q').fill('meet');
    const hit=page.locator('#results [data-hit="k_meet"]');
    assert(await hit.count()===1, 'search should find Meet Todd');
    await hit.click(); await page.locator('#details').waitFor({state:'visible'});
    assert(await page.locator('#details-close').isVisible(), 'details close control is not visible');
    assert((await textOf(page,'#details')).includes('Meet Todd'), 'wrong event details opened');
    assert((await page.locator('[data-node]').count())===114, 'map must stay mounted behind details');
    const r=await page.locator('#details').boundingBox();
    assert(r&&r.x>=-1&&r.x+r.width<=390+1, 'details panel extends beyond the mobile viewport');
    await page.keyboard.press('Escape'); await page.locator('#details').waitFor({state:'hidden'});
    assert(pageErrors.length===0,pageErrors.join(' | '));
  });
  await ok('mobile legacy permalink exposes a usable withdrawal notice and replacement', async function () {
    await page.evaluate(function () { location.hash = '#home/a_ask?edge=2'; });
    await page.locator('#details [data-evidence="withdrawn"]').waitFor({ state: 'visible' });
    const panel = await page.locator('#details').boundingBox();
    assert(panel && panel.x >= -1 && panel.x + panel.width <= 391, 'withdrawal details overflow the mobile viewport');
    assert(await page.locator('#details [data-open-edge]').count() === 2, 'both replacement steps must be available');
    await page.locator('#details [data-open-edge="93"]').click();
    await page.locator('#details [data-edge-evidence="93"]').waitFor({ state: 'visible' });
    assert((await page.evaluate(function () { return location.hash; })) === '#home/a_take_out_trash?edge=93',
      'mobile replacement must open the real trash connector');
    assert(await page.locator('path.edge').count() === 99, 'history navigation must preserve the active graph');
    assert(pageErrors.length === 0, pageErrors.join(' | '));
  });
  await page.close();
}

// Hold real hash events so a quick close always precedes the queued URL event.
async function runHashCloseRegression(browser) {
  console.log('scenario delayed hash event after closing details');
  const page = await browser.newPage({ viewport: { width: 390, height: 845 } });
  await page.addInitScript(function () {
    const add = window.addEventListener.bind(window);
    window.__ra9DeferredHashes = [];
    window.addEventListener = function (type, listener, options) {
      if (type === 'hashchange') add(type, function (event) {
        window.__ra9DeferredHashes.push(function () { listener.call(window, event); });
      }, options);
      else add(type, listener, options);
    };
    window.__ra9FlushHashes = function () {
      window.__ra9DeferredHashes.splice(0).forEach(function (deliver) { deliver(); });
    };
  });
  await page.goto(baseUrl + '/prototype/poc4-editorial.html');
  await page.locator('#consent').click();
  await page.locator('#q').fill('meet');
  await page.locator('#results [data-hit="k_meet"]').click();
  await page.waitForFunction(function () { return window.__ra9DeferredHashes.length > 0; });
  await ok('queued self-written hash cannot reopen details after Escape', async function () {
    await page.keyboard.press('Escape');
    assert(await page.locator('#details').isHidden(), 'Escape must close details before URL delivery');
    const hash = await page.evaluate(function () { return location.hash; });
    await page.evaluate(function () { window.__ra9FlushHashes(); });
    assert(await page.locator('#details').isHidden(), 'queued hash reopened the closed details');
    assert(await page.evaluate(function () { return location.hash; }) === hash, 'close must preserve the selected permalink');
  });
  await ok('external hash navigation and browser Back still restore actual edge and node targets', async function () {
    await page.evaluate(function () { location.hash = '#shades-of-color/sc_store?edge=96'; });
    await page.waitForFunction(function () { return window.__ra9DeferredHashes.length > 0; });
    await page.evaluate(function () { window.__ra9FlushHashes(); });
    assert(await page.locator('#details [data-edge-evidence="96"]').count() === 1, 'external edge navigation must still work');
    await page.goBack();
    await page.waitForFunction(function () { return window.__ra9DeferredHashes.length > 0; });
    await page.evaluate(function () { window.__ra9FlushHashes(); });
    assert((await textOf(page, '#details')).includes('Meet Todd'), 'Back must restore the prior node');
  });
  await page.close();
}

(async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    if (!process.argv.includes('--hash-close-only')) {
      for (const variant of VARIANTS) await runVariant(browser, variant);
      await runMobileRegression(browser);
    }
    await runHashCloseRegression(browser);
  } finally {
    await browser.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.error('browser suite crashed: ' + (err && err.stack || err));
  process.exit(1);
});
