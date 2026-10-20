#!/usr/bin/env node
/* PoC4 — browser functional checks for the three atlas entry points.
   Run: npm run test:browser   (requires the playwright devDependency)
   If PLAYWRIGHT_BROWSERS_PATH is unset, the harness reuses the browsers
   folder under the OS temp dir when it exists; otherwise Playwright's own
   default lookup applies.

   What this suite does and does not prove: it serves the static pages from
   localhost and drives them in headless Chromium. It exercises consent and remembered
   consent, the continuous story map, the three LOD steps, fit bounds,
   chapter focus, actual cross-chapter navigation, both detail-close paths,
   history, search keyboard handling, hash round-trips and text contrast in
   all three palettes, plus a scoped 390x844 mobile-emulation layout,
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

async function getLod(page) {
  return page.locator('#canvas').getAttribute('data-lod');
}

async function zoomUntil(page, wanted, maxClicks) {
  const limit = maxClicks || 24;
  for (let i = 0; i <= limit; i++) {
    if (await getLod(page) === wanted) return i;
    if (i === limit) break;
    await page.locator('#plus').click();
    await waitFrames(page);
  }
  const scale = await page.evaluate(function () {
    const world = document.getElementById('world');
    return world ? new DOMMatrixReadOnly(getComputedStyle(world).transform).a : null;
  });
  throw new Error('LOD ' + wanted + ' not reached; camera scale ' + scale);
}

async function selectionStyles(page) {
  return page.evaluate(function () {
    const node = document.querySelector('[data-node="k_meet"]');
    const label = node ? node.querySelector('.label') : null;
    const style = function (el) { return el ? getComputedStyle(el).visibility : 'missing'; };
    const c = document.getElementById('canvas').getBoundingClientRect();
    function mapLabels(selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) {
        const s = getComputedStyle(el);
        if (s.visibility !== 'visible' || s.display === 'none') return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).map(function (el) {
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-event-node') || el.getAttribute('data-region') || el.getAttribute('data-edge'),
          text: el.textContent.replace(/\s+/g, ' ').trim(),
          font: parseFloat(getComputedStyle(el).fontSize),
          intersectsCanvas: r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom
        };
      });
    }
    const eventLabels = mapLabels('#map-labels .event-label');
    return {
      lod: document.getElementById('canvas').getAttribute('data-lod'),
      nodesLayer: style(document.getElementById('nodes')),
      labelsLayer: style(document.getElementById('labels')),
      node: style(node),
      nodeLabel: style(label),
      eventLabels: eventLabels,
      regionLabels: mapLabels('#map-labels .region-label'),
      crossLabels: mapLabels('#map-labels .cross-label'),
      overviewSurface: document.querySelectorAll('#overview, .overview-card, .overview-link').length,
      zoom: document.getElementById('zoomLabel') ? document.getElementById('zoomLabel').textContent : ''
    };
  });
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

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
    assert(state.nodes === 38, '38 nodes should be rendered behind the cover, got ' + state.nodes);
    assert(state.edges === 42, '42 connectors should be rendered behind the cover, got ' + state.edges);
    assert(state.lod === 'overview', 'the covered map should start at the story map LOD, got ' + state.lod);
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
    assert(status.indexOf('3 chapters · 38 events · 42 connectors') !== -1, 'status line counts: ' + status);
    assert(status.indexOf('not in-game verified') !== -1, 'status line must keep the not-verified qualifier');
    assert(status.indexOf('version/platform unknown') === -1 && status.length <= 180,
      'primary status must stay a concise slice summary, got: ' + status);
    assert(await getLod(page) === 'overview', 'whole-atlas fit should open on the story map');
    const zoom = await textOf(page, '#zoomLabel');
    assert(/story map/.test(zoom), 'zoom label should name the story map LOD: ' + zoom);
    assert(await page.locator('#overview').count() === 0, 'the card/report overview surface must stay removed');
    assert(await page.locator('.frame').count() === 3, 'three chapter frames must stay mounted');
    assert(await page.locator('[data-node]').count() === 38, '38 event nodes must stay mounted');
    assert(await page.locator('path.edge').count() === 42, '42 connectors must stay mounted');
    assert(await page.locator('#map-labels .region-label').count() === 3, 'three chapter map labels expected');
    assert(await page.locator('#map-labels .cross-label').count() === 4, 'four actual cross labels expected');
  });

  await ok('opening map keeps chapter names legible and cross labels point only at actual cross-chapter edges', async function () {
    const m = await page.evaluate(function () {
      const canvas = document.getElementById('canvas');
      const cr = canvas.getBoundingClientRect();
      const chapterOf = {};
      ATLAS.nodes.forEach(function (n) { chapterOf[n.id] = n.chapter; });
      const expected = [];
      ATLAS.edges.forEach(function (edge, index) {
        if (chapterOf[edge.from] !== chapterOf[edge.to]) {
          expected.push({ index: index, kind: edge.kind, from: edge.from, to: edge.to });
        }
      });
      function labels(selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.visibility === 'visible' && s.display !== 'none' && r.width > 0 && r.height > 0;
        }).map(function (el) {
          const r = el.getBoundingClientRect();
          const name = el.querySelector('strong');
          return {
            id: el.getAttribute('data-region') || el.getAttribute('data-edge'),
            text: el.textContent.replace(/\s+/g, ' ').trim(),
            aria: el.getAttribute('aria-label'),
            font: parseFloat(getComputedStyle(name || el).fontSize),
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom
          };
        });
      }
      return {
        canvas: { left: cr.left, top: cr.top, right: cr.right, bottom: cr.bottom },
        regions: labels('#map-labels .region-label'),
        cross: labels('#map-labels .cross-label'),
        expected: expected
      };
    });

    assert(m.regions.length === 3, 'three chapter map labels expected, got ' + m.regions.length);
    m.regions.forEach(function (region) {
      assert(/A New Home|Stormy Night|Battle for Detroit/.test(region.text), region.id + ' map label does not name its chapter: ' + region.text);
      assert(region.font >= 14, region.id + ' chapter name font ' + region.font + 'px is too small');
      assert(region.left >= m.canvas.left - 1 && region.right <= m.canvas.right + 1 &&
        region.top >= m.canvas.top - 1 && region.bottom <= m.canvas.bottom + 1,
        region.id + ' chapter map label is outside the canvas');
      assert(region.aria && /Open /.test(region.aria), region.id + ' chapter map label has no accessible open label');
    });

    assert(m.cross.length === m.expected.length,
      'cross labels ' + m.cross.length + ' do not match actual cross-chapter edges ' + m.expected.length);
    m.cross.forEach(function (label) {
      const actual = m.expected.filter(function (e) { return e.index === Number(label.id); })[0];
      assert(actual, 'cross label does not point at an actual edge index: ' + label.id);
      if (actual.kind === 'hypothesis') {
        assert(/UNRESOLVED hypothesis/.test(label.text), 'hypothesis cross label must say UNRESOLVED hypothesis: ' + label.text);
      } else if (actual.kind === 'prerequisite') {
        assert(/prerequisite gate/.test(label.text), 'gate cross label must say prerequisite gate: ' + label.text);
      }
    });
    m.expected.forEach(function (actual) {
      assert(m.cross.some(function (label) { return Number(label.id) === actual.index; }),
        'actual cross-chapter edge ' + actual.index + ' has no map label');
    });
    assert(await page.locator('#overview-connectors, .overview-link, .overview-card').count() === 0,
      'no aggregate or card/report cross-chapter rows may be invented');
  });

  await ok('zoom keeps one map and hands readable labels to close event text', async function () {
    const overview = await selectionStyles(page);
    assert(overview.lod === 'overview', 'should start in the story map');
    assert(overview.nodesLayer === 'visible' && overview.node === 'visible', 'event boxes must stay on the story map');
    assert(overview.labelsLayer === 'hidden' && overview.nodeLabel === 'hidden', 'in-box event text must stay hidden at story map scale');
    assert(overview.regionLabels.length === 3, 'story map should label all three chapters');
    assert(overview.eventLabels.length >= 6, 'story map should show meaningful event labels, got ' + overview.eventLabels.length);
    assert(overview.crossLabels.length === 4, 'story map should show the four actual cross-chapter labels');
    assert(/story map/.test(overview.zoom), 'zoom label should name the story map: ' + overview.zoom);
    assert(overview.overviewSurface === 0, 'no card/report surface may replace the map');

    await zoomUntil(page, 'structure');
    const structure = await selectionStyles(page);
    assert(structure.nodesLayer === 'visible' && structure.node === 'visible', 'event boxes should stay at structure LOD');
    assert(structure.labelsLayer === 'hidden' && structure.nodeLabel === 'hidden', 'in-box event text should remain hidden at structure LOD');
    assert(structure.eventLabels.length >= 6, 'structure LOD should label the real events, got ' + structure.eventLabels.length);
    assert(structure.eventLabels.every(function (l) { return l.font >= 11; }), 'structure event label text is too small');
    assert(structure.regionLabels.length === 3, 'structure LOD must keep the chapter labels on the same map');
    assert(/event map/.test(structure.zoom), 'zoom label should name the event map: ' + structure.zoom);

    await zoomUntil(page, 'detail');
    const detail = await selectionStyles(page);
    assert(detail.labelsLayer === 'visible' && detail.nodeLabel === 'visible', 'event labels should appear at detail LOD');
    assert(detail.regionLabels.length === 3, 'detail LOD must keep the chapter labels on the same map');
    assert(/close map/.test(detail.zoom), 'zoom label should name the close map: ' + detail.zoom);

    await resetAtlas(page);
    assert(await getLod(page) === 'overview', 'reset should return to the story map after zooming in');
  });

  await ok('whole-map and chapter fits stay inside the desktop canvas', async function () {
    await resetAtlas(page);
    const all = await fitSnapshot(page);
    assert(all.lod === 'overview', 'reset should return to the story map');
    assert(all.frames.length === 3, 'three frames expected');
    all.frames.forEach(function (frame) {
      assert(fullyInside(frame.rect, all.canvas), frame.id + ' frame is clipped by the whole-map fit');
    });
    assert(all.canvas.left >= 0 && all.canvas.right <= 1441, 'canvas itself leaves the viewport');
    assert(!all.horizontalOverflow, 'whole-map fit introduced horizontal overflow');

    await openChapter(page, 'home');
    const home = await fitSnapshot(page);
    assert(home.lod === 'structure', 'a focused chapter should stay at the event map LOD');
    assert(await page.locator('[data-chapter="home"]').getAttribute('aria-pressed') === 'true', 'home chapter is not active');
    const homeFrame = home.frames.filter(function (f) { return f.id === 'home'; })[0];
    assert(homeFrame && fullyInside(homeFrame.rect, home.canvas), 'focused home chapter is clipped by the canvas');
    assert(home.nodeCount === 38 && home.edgeCount === 42, 'chapter focus must keep the whole graph mounted');
    assert(!home.horizontalOverflow, 'chapter focus introduced horizontal overflow');

    await page.locator('[data-chapter="kara"]').click();
    await waitFrames(page);
    const kara = await fitSnapshot(page);
    const karaFrame = kara.frames.filter(function (f) { return f.id === 'kara'; })[0];
    assert(karaFrame && fullyInside(karaFrame.rect, kara.canvas), 'focused Kara chapter is clipped by the canvas');
    await page.locator('[data-chapter="all"]').click();
    await waitFrames(page);
    assert(await getLod(page) === 'overview', 'whole atlas should return to the story map');
  });

  await ok('Meet Todd keeps its two separate prerequisite gates', async function () {
    await openChapter(page, 'kara');
    await page.locator('[data-event-node="k_meet"]').click();
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
    await page.locator('[data-event-node="a_box"]').click();
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

  await ok('the two successful non-gun escapes stay separate and Todd links stay inferred', async function () {
    await openChapter(page, 'stormy');
    for (const id of ['s_front_backyard_escape', 's_window_reach_bus']) {
      await page.locator('[data-event-node="' + id + '"]').click();
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

    await page.locator('[data-event-node="s_window_open"]').click();
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
    await page.locator('#map-labels .cross-label.hypothesis[data-edge="' + hypothesis.index + '"]').click();
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
    await page.locator('#map-labels .cross-label.prerequisite').first().click();
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
    await page.locator('[data-event-node="a_talk"]').click();
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

    await page.locator('[data-event-node="a_talk"]').click();
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
          eventMode: document.querySelector('[data-event-node="a_talk"]') && getComputedStyle(document.querySelector('[data-event-node="a_talk"]')).display,
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
    await page.locator('[data-event-node="k_goodbye"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    await resetAtlas(page);
    await openChapter(page, 'stormy');
    await page.locator('[data-event-node="s_alive"]').click();
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
    await page.locator('[data-event-node="k_terminal"]').click();
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
        '.region-label', '.region-label span', '.event-label', '.cross-label',
        '.node .label', '.node .k', '.edge-label.prerequisite',
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
    assert(locked.nodes === 38, 'map content must stay mounted beneath the re-locked overlay');
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
    assert(remembered.lod === 'overview', 'remembered revisit should open on the story map');
  });

  await ok('hash round-trips restore a node and an edge-focused deep link after consent', async function () {
    const fresh = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
    const freshEdge = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
  console.log('scenario mobile-390 (production CSS, viewport emulation only)');
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const pageErrors = [];
  page.on('pageerror', function (e) { pageErrors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  const url = baseUrl + '/prototype/poc4-editorial.html';
  await page.goto(url + '#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  const beforeConsent = await page.evaluate(function () {
    const canvas = document.getElementById('canvas').getBoundingClientRect();
    return {
      overlay: !!document.getElementById('spoiler-overlay'),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      nodes: document.querySelectorAll('[data-node]').length
    };
  });
  assert(beforeConsent.overlay, 'mobile cover missing');
  assert(beforeConsent.canvasWidth > 0 && beforeConsent.canvasHeight > 0, 'map must have layout beneath the mobile cover');
  assert(beforeConsent.nodes === 38, 'map content must be mounted beneath the mobile cover');
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await page.locator('#world').waitFor({ state: 'visible' });
  await waitFrames(page);

  await ok('390x844 keeps the whole-story map and its labels inside the viewport', async function () {
    const layout = await page.evaluate(function () {
      const canvas = document.getElementById('canvas').getBoundingClientRect();
      const workspace = document.querySelector('.workspace').getBoundingClientRect();
      const wrap = document.querySelector('.canvas-wrap').getBoundingClientRect();
      function labels(selector) {
        return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.visibility === 'visible' && s.display !== 'none' && r.width > 0 && r.height > 0;
        }).map(function (el) {
          const r = el.getBoundingClientRect();
          const name = el.querySelector('strong');
          return {
            id: el.getAttribute('data-region') || el.getAttribute('data-event-node') || el.getAttribute('data-edge'),
            text: el.textContent.replace(/\s+/g, ' ').trim(),
            font: parseFloat(getComputedStyle(name || el).fontSize),
            inside: r.left >= canvas.left - 1 && r.right <= canvas.right + 1 &&
              r.top >= canvas.top - 1 && r.bottom <= canvas.bottom + 1,
            intersects: r.right > canvas.left && r.left < canvas.right && r.bottom > canvas.top && r.top < canvas.bottom
          };
        });
      }
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        canvas: { left: canvas.left, top: canvas.top, width: canvas.width, height: canvas.height },
        workspace: { width: workspace.width, height: workspace.height },
        wrap: { width: wrap.width, height: wrap.height },
        scrollWidth: document.documentElement.scrollWidth,
        lod: document.getElementById('canvas').getAttribute('data-lod'),
        density: document.getElementById('canvas').getAttribute('data-density'),
        canvasTouchAction: getComputedStyle(document.getElementById('canvas')).touchAction,
        regionLabels: labels('#map-labels .region-label'),
        eventLabels: labels('#map-labels .event-label'),
        actualEventIds: ATLAS.nodes.map(function (n) { return n.id; }),
        crossLabels: labels('#map-labels .cross-label'),
        overviewSurface: document.querySelectorAll('#overview, .overview-card, .overview-link').length
      };
    });
    assert(Math.abs(layout.canvas.width - layout.innerWidth) <= 1,
      'canvas width ' + layout.canvas.width + ' should match viewport ' + layout.innerWidth + ' within 1px');
    assert(layout.canvas.height > 0, 'canvas height must be > 0, got ' + layout.canvas.height);
    assert(layout.workspace.width <= layout.innerWidth + 1,
      'workspace width ' + layout.workspace.width + ' exceeds viewport ' + layout.innerWidth);
    assert(layout.scrollWidth <= layout.innerWidth + 1,
      'document horizontally overflows: ' + layout.scrollWidth + ' > ' + layout.innerWidth);
    assert(layout.wrap.height > 0, 'canvas wrapper height must be > 0');
    assert(layout.lod === 'overview', 'mobile opening should be the whole-story map');
    assert(layout.density === 'sparse', 'real sample should be marked sparse');
    assert(layout.overviewSurface === 0, 'mobile opening must not be a card/report surface');
    assert(layout.regionLabels.length === 3, 'mobile story map needs three chapter labels');
    layout.regionLabels.forEach(function (label) {
      assert(label.font >= 14, label.id + ' mobile chapter label font ' + label.font + 'px is too small');
      assert(label.inside, label.id + ' mobile chapter label is outside the canvas');
    });
    assert(layout.eventLabels.length >= 3, 'mobile story map needs named events in its visible regions, got ' + layout.eventLabels.length);
    layout.eventLabels.forEach(function (label) {
      assert(label.font >= 11, label.id + ' mobile event label font ' + label.font + 'px is too small');
      assert(label.intersects, label.id + ' mobile event label is outside the canvas');
      assert(layout.actualEventIds.indexOf(label.id) !== -1 && label.text.length > 0,
        label.id + ' mobile marker must name a real event, not an anonymous box');
    });
    assert(layout.crossLabels.length === 4, 'all four actual cross-chapter labels should be available on mobile');
    assert(layout.canvasTouchAction === 'none', 'mobile map should own pan/zoom gestures, got ' + layout.canvasTouchAction);

    const drag = await page.evaluate(function () {
      const canvas = document.getElementById('canvas');
      const r = canvas.getBoundingClientRect();
      let point = null;
      for (let y = r.top + 20; y < r.bottom - 20 && !point; y += 12) {
        for (let x = r.left + 20; x < r.right - 20; x += 12) {
          const el = document.elementFromPoint(x, y);
          if (el && el.closest('#canvas') && !el.closest('button, a, input, .legend, .status, .zoom, #map-labels')) {
            point = { x: x, y: y };
            break;
          }
        }
      }
      const world = document.getElementById('world');
      return {
        point: point,
        transform: world.style.transform,
        draggingBefore: canvas.classList.contains('dragging')
      };
    });
    assert(drag.point, 'could not find a non-control point on the mobile map');
    await page.mouse.move(drag.point.x, drag.point.y);
    await page.mouse.down();
    await page.mouse.move(drag.point.x + 45, drag.point.y - 35, { steps: 6 });
    await page.mouse.up();
    await waitFrames(page);
    const afterDrag = await page.evaluate(function () {
      const world = document.getElementById('world');
      const canvas = document.getElementById('canvas');
      return { transform: world.style.transform, dragging: canvas.classList.contains('dragging') };
    });
    assert(!drag.draggingBefore && !afterDrag.dragging, 'map must not stay in camera-drag state');
    assert(afterDrag.transform !== drag.transform, 'mobile map drag did not pan the same canvas');
  });

  await ok('390x844 whole-map and chapter fits do not clip', async function () {
    await page.locator('#fit').click();
    await waitFrames(page);
    const all = await fitSnapshot(page);
    assert(all.lod === 'overview', 'mobile fit check should start at the story map');
    all.frames.forEach(function (frame) {
      assert(fullyInside(frame.rect, all.canvas), frame.id + ' mobile whole-map frame is clipped');
    });
    const fullLabels = await page.evaluate(function () {
      const c = document.getElementById('canvas').getBoundingClientRect();
      return Array.prototype.slice.call(document.querySelectorAll('#map-labels .region-label')).map(function (el) {
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-region'),
          inside: r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1
        };
      });
    });
    assert(fullLabels.length === 3 && fullLabels.every(function (l) { return l.inside; }),
      'mobile whole-map chapter labels must all stay inside the canvas');
    assert(!all.horizontalOverflow, 'mobile whole-map fit introduced horizontal overflow');

    await page.locator('[data-chapter="home"]').click();
    await waitFrames(page);
    const focused = await fitSnapshot(page);
    assert(focused.lod === 'structure', 'mobile chapter focus should show the event map');
    assert(await page.locator('[data-chapter="home"]').getAttribute('aria-pressed') === 'true', 'chapter focus did not become active');
    const home = focused.frames.filter(function (f) { return f.id === 'home'; })[0];
    assert(home && fullyInside(home.rect, focused.canvas), 'mobile focused chapter is clipped by the canvas');
    assert(focused.nodeCount === 38 && focused.edgeCount === 42, 'mobile chapter focus must keep the graph mounted');
    const homeLabels = await page.evaluate(function () {
      return Array.prototype.slice.call(document.querySelectorAll('#map-labels .event-label')).map(function (el) {
        return el.getAttribute('data-event-node');
      });
    });
    assert(homeLabels.length >= 8, 'mobile chapter fit should show readable event labels, got ' + homeLabels.length);
    assert(!focused.horizontalOverflow, 'mobile chapter focus introduced horizontal overflow');
  });

  await ok('390x844 detail selection remains reachable and contained', async function () {
    await page.locator('#q').fill('meet');
    const hit = page.locator('#results [data-hit="k_meet"]');
    assert(await hit.count() === 1, 'mobile search should find Meet Todd');
    await hit.click();
    await page.locator('#details').waitFor({ state: 'visible' });
    assert(await page.locator('#details-close').isVisible(), 'details close control is not reachable');
    const details = await page.evaluate(function () {
      const r = document.getElementById('details').getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        width: r.width,
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        canvasVisible: document.getElementById('canvas').getBoundingClientRect().width > 0,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(details.left >= -1 && details.right <= details.innerWidth + 1,
      'details panel exceeds the viewport: ' + details.left + '..' + details.right);
    assert(details.width > 0, 'details panel has no width');
    assert(details.scrollWidth <= details.innerWidth + 1, 'details selection introduced horizontal overflow');
    assert(details.canvasVisible, 'map must stay laid out behind the mobile details panel');
    assert(details.text.indexOf('Meet Todd') !== -1, 'mobile details did not open the selected node');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
    assert(pageErrors.length === 0, pageErrors.join(' | '));
  });

  await page.close();
}

(async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    for (const variant of VARIANTS) await runVariant(browser, variant);
    await runMobileRegression(browser);
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
