#!/usr/bin/env node
/* Map-first regression for the PoC4 atlas and the synthetic 1,000-node entry.
 *
 * Run: node tests/map-first.test.js   (npm run test:map)
 *
 * This suite is deliberately stricter than a snapshot: it checks the visible
 * map states that were rejected in review.
 *   - the opening whole-story view is the spatial graph, not a card/report page;
 *   - chapter regions, chapter labels, meaningful event labels and actual
 *     cross-chapter connectors are visible at whole-story fit;
 *   - chapter fit and intermediate zoom keep readable event labels and branch
 *     structure for the real 29-node sample;
 *   - the same world canvas stays mounted across LOD changes;
 *   - the dense synthetic fixture uses labelled region/branch summaries derived
 *     from its real topology instead of only blank event rectangles;
 *   - map cross-labels open the actual edge, with evidence, at desktop and
 *     390x844 mobile viewport sizes.
 *
 * The suite serves the repository over an ordinary localhost HTTP server. It
 * never opens file:// URLs and never reads outside this repository. Mobile is
 * Chromium viewport emulation, not a physical device or real touch test.
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
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
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

function assertNoNodeBoxOverlap(map, scene) {
  const boxes = map.nodes.filter(function (node) { return node.visible; });
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].rect;
      const b = boxes[j].rect;
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      assert(overlapX <= 1 || overlapY <= 1,
        scene + ': event boxes ' + boxes[i].id + ' and ' + boxes[j].id + ' overlap (' + overlapX.toFixed(1) + 'x' + overlapY.toFixed(1) + 'px)');
    }
  }
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

async function resetAtlas(page) {
  await page.locator('#reset').click();
  await page.locator('#details').waitFor({ state: 'hidden' });
  await waitFrames(page);
}

async function getLod(page) {
  return page.locator('#canvas').getAttribute('data-lod');
}

async function cameraScale(page) {
  return page.evaluate(function () {
    const world = document.getElementById('world');
    return world ? new DOMMatrixReadOnly(getComputedStyle(world).transform).a : null;
  });
}

async function zoomUntil(page, wanted, maxClicks) {
  const limit = maxClicks || 24;
  for (let i = 0; i <= limit; i++) {
    if (await getLod(page) === wanted) return i;
    if (i === limit) break;
    await page.locator('#plus').click();
    await waitFrames(page);
  }
  throw new Error('LOD ' + wanted + ' not reached at scale ' + await cameraScale(page));
}

/* All visible map annotations, measured in viewport coordinates. The labels
   live inside the single world canvas and are inverse-scaled, so their
   computed font size is also their effective screen font size. */
async function mapSnapshot(page) {
  return page.evaluate(function () {
    function visible(el) {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.visibility !== 'visible' || s.display === 'none' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    function inside(r, c) {
      return r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
    }
    function intersects(r, c) {
      return r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom;
    }
    const canvas = document.getElementById('canvas');
    const world = document.getElementById('world');
    const cr = canvas.getBoundingClientRect();
    const chapterOf = {};
    ATLAS.nodes.forEach(function (n) { chapterOf[n.id] = n.chapter; });
    const cross = {};
    ATLAS.edges.forEach(function (e, i) {
      if (chapterOf[e.from] && chapterOf[e.to] && chapterOf[e.from] !== chapterOf[e.to]) cross[i] = true;
    });
    function labels(selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(visible).map(function (el) {
        const r = el.getBoundingClientRect();
        const nodeId = el.getAttribute('data-event-node');
        let anchored = null;
        if (nodeId) {
          const node = document.querySelector('[data-node="' + nodeId + '"]');
          if (node) {
            const nr = node.getBoundingClientRect();
            const cx = nr.left + nr.width / 2;
            const cy = nr.top + nr.height / 2;
            anchored = cx >= r.left - 1 && cx <= r.right + 1 && cy >= r.top - 1 && cy <= r.bottom + 1;
          }
        }
        return {
          id: nodeId || el.getAttribute('data-region') || el.getAttribute('data-edge') || el.getAttribute('data-cross-group'),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
          full: el.getAttribute('data-full-label') || '',
          font: parseFloat(getComputedStyle(el).fontSize),
          mode: el.getAttribute('data-label-mode') || '',
          anchorDistance: el.hasAttribute('data-anchor-distance') ? Number(el.getAttribute('data-anchor-distance')) : 0,
          hasLeader: el.getAttribute('data-has-leader') === 'true',
          anchored: anchored,
          insideCanvas: inside(r, cr),
          intersectsCanvas: intersects(r, cr),
          rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
        };
      });
    }
    const eventLabels = labels('#map-labels .event-label');
    const labelledIds = {};
    eventLabels.forEach(function (label) { labelledIds[label.id] = true; });
    return {
      lod: canvas.getAttribute('data-lod'),
      nodeLabelsMode: canvas.getAttribute('data-node-labels'),
      canvas: { left: cr.left, top: cr.top, right: cr.right, bottom: cr.bottom, width: cr.width, height: cr.height },
      worldPresent: !!world && visible(world),
      worldRect: world ? world.getBoundingClientRect() : null,
      frames: Array.prototype.slice.call(document.querySelectorAll('.frame')).map(function (el) {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute('data-chapter-frame'), visible: visible(el), rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } };
      }),
      nodes: Array.prototype.slice.call(document.querySelectorAll('[data-node]')).map(function (el) {
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-node'),
          visible: visible(el),
          insideCanvas: inside(r, cr),
          labelled: labelledIds[el.getAttribute('data-node')] === true,
          rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
        };
      }),
      eventLabels: eventLabels,
      nodeDots: document.querySelectorAll('#node-dots circle').length,
      edges: Array.prototype.slice.call(document.querySelectorAll('path.edge')).map(function (el) {
        const s = getComputedStyle(el);
        return {
          index: Number(el.getAttribute('data-edge')),
          visible: s.visibility === 'visible' && s.display !== 'none' && Number(s.opacity) !== 0,
          cross: cross[Number(el.getAttribute('data-edge'))] === true,
          stroke: s.stroke,
          strokeWidth: parseFloat(s.strokeWidth)
        };
      }),
      regionLabels: labels('#map-labels .region-label'),
      eventLabels: labels('#map-labels .event-label'),
      crossLabels: labels('#map-labels .cross-label'),
      regionSummaries: labels('#map-labels .region-summary'),
      branchSummaries: labels('#map-labels .branch-summary'),
      overviewSurface: (function () {
        const el = document.getElementById('overview');
        return { present: !!el, visible: visible(el), cards: document.querySelectorAll('.overview-card').length, links: document.querySelectorAll('.overview-link').length };
      })(),
      status: document.getElementById('status') ? document.getElementById('status').textContent.replace(/\s+/g, ' ').trim() : '',
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
}

async function runDesktop(browser) {
  console.log('scenario desktop map-first');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(baseUrl + '/prototype/poc4-editorial.html#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await waitFrames(page);

  await ok('whole-story fit opens on the spatial map, not a card/report surface', async function () {
    const m = await mapSnapshot(page);
    assert(m.lod === 'overview', 'whole-story fit should be the overview LOD, got ' + m.lod);
    assert(!m.overviewSurface.visible, 'the separate #overview surface is covering the map');
    assert(m.overviewSurface.cards === 0 && m.overviewSurface.links === 0,
      'card/report rows must not replace the map (cards ' + m.overviewSurface.cards + ', links ' + m.overviewSurface.links + ')');
    assert(m.worldPresent, 'world canvas is not visible at whole-story fit');
    assert(m.frames.length === 3 && m.frames.every(function (f) { return f.visible; }),
      'all three chapter regions must stay visible at whole-story fit');
    assert(m.nodes.length === 29 && m.nodes.every(function (n) { return n.visible && n.labelled; }),
      'whole-story fit must render all 29 actual events as labeled map boxes');
    assertNoNodeBoxOverlap(m, 'whole-map fit');
    assert(m.nodeLabelsMode === 'in-box', 'desktop whole-story fit should keep event labels inside boxes, got ' + m.nodeLabelsMode);
    assert(m.edges.length === 31 && m.edges.every(function (e) { return e.visible; }),
      'all 31 actual connectors must stay visible at whole-story fit');
  });

  await ok('whole-story fit shows legible chapter labels, meaningful event labels and actual cross-chapter connectors', async function () {
    const m = await mapSnapshot(page);
    assert(m.regionLabels.length === 3, 'three chapter region labels expected, got ' + m.regionLabels.length);
    const names = ['A New Home', 'Stormy Night', 'Battle for Detroit'];
    m.regionLabels.forEach(function (label) {
      assert(label.font >= 14, label.id + ' chapter label font ' + label.font + 'px is too small');
      assert(label.insideCanvas, label.id + ' chapter label is outside the canvas');
      assert(names.some(function (name) { return label.text.indexOf(name) !== -1; }),
        label.id + ' chapter label does not name the chapter: ' + label.text);
    });
    assert(m.eventLabels.length === 29, 'all 29 sparse events need meaningful labels at desktop whole-story fit, got ' + m.eventLabels.length);
    m.eventLabels.forEach(function (label) {
      assert(label.font >= 11, label.id + ' event label font ' + label.font + 'px is too small');
      assert(label.insideCanvas, label.id + ' event label is outside the canvas');
      assert(label.anchored || (label.hasLeader && label.anchorDistance <= 140),
        label.id + ' compact event label is not attached to its actual event anchor');
      assert(label.mode === 'in-box', label.id + ' whole-story label should sit inside its actual event box');
      assert(label.text.length > 0, label.id + ' event label is empty');
      assert(label.full.length > 0, label.id + ' event label has no full source label');
    });
    const crossPaths = m.edges.filter(function (e) { return e.cross; });
    assert(crossPaths.length === 4, 'four actual cross-chapter paths expected, got ' + crossPaths.length);
    crossPaths.forEach(function (e) {
      assert(e.visible && e.strokeWidth >= 1.4, 'cross-chapter path ' + e.index + ' is not visibly emphasised');
    });
    assert(m.crossLabels.length === 4, 'four actual cross-chapter map labels expected, got ' + m.crossLabels.length);
    const crossIndices = crossPaths.map(function (e) { return e.index; }).sort(function (a, b) { return a - b; });
    const labelIndices = m.crossLabels.map(function (l) { return Number(l.id); }).sort(function (a, b) { return a - b; });
    assert(JSON.stringify(crossIndices) === JSON.stringify(labelIndices),
      'cross labels must point at the actual cross-chapter edge indices');
    m.crossLabels.forEach(function (label) {
      assert(label.font >= 10.5, label.id + ' cross label font ' + label.font + 'px is too small');
      assert(/hypothesis|prerequisite/i.test(label.text), label.id + ' cross label must name its actual connector kind: ' + label.text);
    });
    assert(!m.horizontalOverflow, 'whole-story map overflowed horizontally');
  });

  await ok('full-map fit keeps every chapter region inside the canvas and the status concise', async function () {
    const m = await mapSnapshot(page);
    m.frames.forEach(function (f) {
      assert(f.rect.left >= m.canvas.left - 2 && f.rect.right <= m.canvas.right + 2 &&
        f.rect.top >= m.canvas.top - 2 && f.rect.bottom <= m.canvas.bottom + 2,
        f.id + ' frame is clipped by the full-map fit');
    });
    assert(/3 chapters/i.test(m.status) && /29 events/i.test(m.status) && /31 connectors/i.test(m.status),
      'status should concisely state the selected slice counts: ' + m.status);
    assert(m.status.length <= 180, 'primary status should stay concise, got ' + m.status.length + ' chars');
    assert(/not in-game verified|not verified/i.test(m.status), 'status must keep the not-verified qualifier: ' + m.status);
  });

  await ok('chapter fit shows readable event labels and preserves the real branch structure', async function () {
    await page.locator('[data-chapter="home"]').click();
    await waitFrames(page);
    const home = await mapSnapshot(page);
    assert(home.lod === 'structure' || home.lod === 'detail', 'chapter fit should show events, got ' + home.lod);
    assert(home.nodes.filter(function (n) { return n.id.indexOf('a_') === 0; }).every(function (n) { return n.visible && n.labelled; }),
      'chapter fit must show each home event as a labeled box');
    assert(home.frames.filter(function (f) { return f.id === 'home'; })[0].visible, 'focused home frame is not visible');
    assert(home.eventLabels.length === 12, 'home chapter fit should label all 12 sample events, got ' + home.eventLabels.length);
    assertNoNodeBoxOverlap(home, 'A New Home chapter fit');
    home.eventLabels.forEach(function (label) {
      assert(label.font >= 11, label.id + ' chapter-fit label font ' + label.font + 'px is too small');
      assert(label.insideCanvas, label.id + ' chapter-fit label is outside the canvas');
      assert(label.anchored, label.id + ' chapter-fit label is detached from its event box');
      assert(label.mode === 'in-box', label.id + ' chapter-fit label should sit in the event box');
      assert(label.text.length > 0, label.id + ' chapter-fit label is empty');
    });
    const homeNodeIds = ['a_welcome', 'a_todd', 'a_clean1', 'a_ask', 'a_go', 'a_clean2', 'a_room', 'a_talk', 'a_key', 'a_box'];
    const labelled = home.eventLabels.map(function (l) { return l.id; });
    homeNodeIds.forEach(function (id) {
      assert(labelled.indexOf(id) !== -1, 'home chapter fit is missing the label for ' + id);
    });

    await page.locator('[data-chapter="kara"]').click();
    await waitFrames(page);
    const kara = await mapSnapshot(page);
    assert(kara.lod === 'structure' || kara.lod === 'detail', 'Kara chapter fit should show events, got ' + kara.lod);
    assertNoNodeBoxOverlap(kara, 'Battle for Detroit chapter fit');
    const branchLabels = ['k_meet', 'k_dialogue', 'k_away', 'k_check'];
    const karaLabelled = kara.eventLabels.map(function (l) { return l.id; });
    branchLabels.forEach(function (id) {
      assert(karaLabelled.indexOf(id) !== -1, 'Kara chapter fit is missing the branch label for ' + id);
    });
    const visibleBranches = kara.edges.filter(function (e) { return e.visible && [11, 12, 13, 14].indexOf(e.index) !== -1; });
    assert(visibleBranches.length >= 4, 'Kara branch connectors must remain visible at chapter fit');

    await page.locator('[data-chapter="stormy"]').click();
    await waitFrames(page);
    const stormy = await mapSnapshot(page);
    assert(stormy.lod === 'structure' || stormy.lod === 'detail', 'Stormy Night chapter fit should show events, got ' + stormy.lod);
    assertNoNodeBoxOverlap(stormy, 'Stormy Night chapter fit');
    const stormyIds = ['s_alive', 's_dead', 's_take_gun', 's_gun_struggle', 's_kara_shoots_todd', 's_alice_shoots_todd', 's_gun_carried', 's_window_open'];
    const stormyLabels = stormy.eventLabels.map(function (label) { return label.id; });
    stormyIds.forEach(function (id) {
      assert(stormyLabels.indexOf(id) !== -1, 'Stormy Night chapter fit is missing the label for ' + id);
    });
  });

  await ok('intermediate zoom keeps one continuous map with readable event labels', async function () {
    await resetAtlas(page);
    assert(await getLod(page) === 'overview', 'reset should return to whole-story fit');
    await page.locator('#plus').click();
    await waitFrames(page);
    let lod = await getLod(page);
    let scale = await cameraScale(page);
    if (lod === 'overview') {
      await page.locator('#plus').click();
      await waitFrames(page);
      lod = await getLod(page);
      scale = await cameraScale(page);
    }
    assert(lod === 'structure', 'intermediate zoom should enter structure LOD, got ' + lod + ' at scale ' + scale);
    assert(scale > 0.5 && scale < 0.8, 'intermediate zoom sample should sit between overview and close scale, got ' + scale);
    const m = await mapSnapshot(page);
    assert(m.worldPresent && m.frames.length === 3 && m.frames.every(function (f) { return f.visible; }),
      'chapter regions must stay on the same spatial canvas at intermediate zoom');
    assert(m.nodes.length === 29, 'intermediate zoom must retain all actual event nodes');
    const fullyVisible = m.nodes.filter(function (n) { return n.insideCanvas; });
    assert(fullyVisible.length >= 8, 'intermediate zoom should show most events spatially, got ' + fullyVisible.length + ' fully visible');
    fullyVisible.forEach(function (n) {
      assert(n.labelled, 'fully visible event box ' + n.id + ' has no readable label');
    });
    assert(m.eventLabels.length >= fullyVisible.length, 'intermediate zoom must label each fully visible event box, got ' + m.eventLabels.length);
    m.eventLabels.forEach(function (label) {
      assert(label.font >= 11, label.id + ' intermediate label font ' + label.font + 'px is too small');
      assert(label.anchored, label.id + ' intermediate label is detached from its event box');
      assert(label.mode === 'in-box', label.id + ' intermediate label should sit in the event box');
    });
    assert(!m.overviewSurface.visible, 'intermediate zoom must not fall back to the report surface');
  });

  await ok('actual cross-chapter map label opens the real edge and evidence', async function () {
    await resetAtlas(page);
    const target = await page.evaluate(function () {
      const chapterOf = {};
      ATLAS.nodes.forEach(function (n) { chapterOf[n.id] = n.chapter; });
      for (let i = 0; i < ATLAS.edges.length; i++) {
        const e = ATLAS.edges[i];
        if (chapterOf[e.from] !== chapterOf[e.to] && e.kind === 'hypothesis') return { index: i, to: e.to };
      }
      return null;
    });
    assert(target, 'fixture hypothesis cross-edge missing');
    const label = page.locator('#map-labels .cross-label[data-edge="' + target.index + '"]');
    assert(await label.count() === 1, 'map cross-label for the actual edge is missing');
    await label.click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const focused = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        hash: location.hash,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(focused.edge === target.index, 'map label did not open the actual edge index');
    assert(focused.evidence === 'unresolved', 'map label lost the unresolved evidence class');
    assert(focused.hash === '#kara/' + target.to + '?edge=' + target.index, 'map label hash lost the edge target: ' + focused.hash);
    assert(/UNRESOLVED hypothesis/.test(focused.text) && /not a confirmed causal link/.test(focused.text),
      'details must retain the explicit uncertainty wording');
    assert(focused.text.length < 4000, 'evidence belongs in the inspector and should not become a report page');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('close-scale view keeps event text and still uses the same canvas', async function () {
    await resetAtlas(page);
    await zoomUntil(page, 'detail');
    const m = await mapSnapshot(page);
    assert(m.lod === 'detail', 'close scale should be detail LOD');
    assert(m.worldPresent && m.frames.length === 3 && m.frames.every(function (f) { return f.visible; }),
      'close-scale view must stay on the same spatial canvas');
    const internal = await page.evaluate(function () {
      const label = document.querySelector('[data-node="k_meet"] .label');
      const edgeLabel = document.querySelector('.edge-label');
      return {
        labelVisibility: label ? getComputedStyle(label).visibility : 'missing',
        edgeLabelVisibility: edgeLabel ? getComputedStyle(edgeLabel).visibility : 'missing',
        labelFont: label ? parseFloat(getComputedStyle(label).fontSize) : 0
      };
    });
    assert(internal.labelVisibility === 'visible', 'close-scale event text is hidden');
    assert(internal.edgeLabelVisibility === 'visible', 'close-scale connector label is hidden');
    assert(internal.labelFont >= 11, 'close-scale event text font is too small: ' + internal.labelFont);
  });

  assert(errors.length === 0, errors.join(' | '));
  await page.close();
}

async function runMobile(browser) {
  console.log('scenario mobile-390 map-first');
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(baseUrl + '/prototype/poc4-editorial.html#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await waitFrames(page);

  await ok('390x844 keeps the whole-story map, chapter labels and event labels in the viewport', async function () {
    const m = await mapSnapshot(page);
    assert(m.lod === 'overview', 'mobile opening should be whole-story fit');
    assert(!m.overviewSurface.visible && m.overviewSurface.cards === 0,
      'mobile opening must not be the card/report surface');
    assert(m.worldPresent && m.frames.length === 3 && m.frames.every(function (f) { return f.visible; }),
      'mobile whole-story map must keep all chapter regions visible');
    assert(m.regionLabels.length === 3, 'mobile whole-story map needs three chapter labels');
    m.regionLabels.forEach(function (label) {
      assert(label.font >= 14, label.id + ' mobile chapter label font ' + label.font + 'px is too small');
      assert(label.insideCanvas, label.id + ' mobile chapter label is outside the canvas');
    });
    assert(m.eventLabels.length >= 3, 'mobile whole-story map needs meaningful event labels, got ' + m.eventLabels.length);
    m.eventLabels.forEach(function (label) {
      assert(label.font >= 11, label.id + ' mobile event label font ' + label.font + 'px is too small');
      assert(label.insideCanvas, label.id + ' mobile event label is outside the canvas');
    });
    assert(m.crossLabels.length === 4, 'mobile whole-story map needs the four actual cross labels');
    assert(!m.horizontalOverflow, 'mobile map overflowed horizontally');
  });

  await ok('390x844 chapter fit shows readable event labels without leaving the map', async function () {
    await page.locator('[data-chapter="home"]').click();
    await waitFrames(page);
    const m = await mapSnapshot(page);
    assert(m.lod === 'structure' || m.lod === 'detail', 'mobile chapter fit should show events, got ' + m.lod);
    assert(m.nodes.length === 29, 'mobile chapter focus must retain all real event nodes');
    assert(m.nodeLabelsMode === 'in-box', 'mobile chapter focus should use readable in-box labels, got ' + m.nodeLabelsMode);
    assert(m.eventLabels.length === 12, 'mobile home chapter focus should label all 12 real events, got ' + m.eventLabels.length + ': ' + m.eventLabels.map(function (l) { return l.id; }).join(', '));
    m.eventLabels.forEach(function (label) {
      assert(label.font >= 11, label.id + ' mobile chapter-fit font ' + label.font + 'px is too small');
      assert(label.insideCanvas, label.id + ' mobile chapter-fit label is outside the canvas');
      assert(label.anchored || (label.hasLeader && label.anchorDistance <= 140),
        label.id + ' mobile chapter-fit label is detached from its event anchor');
      assert(label.mode === 'in-box', label.id + ' mobile chapter-fit label should sit in its event box');
    });
    const homeIds = ['a_welcome', 'a_todd', 'a_clean1', 'a_ask', 'a_go', 'a_clean2', 'a_room', 'a_talk', 'a_key', 'a_box'];
    const labelledHome = m.eventLabels.filter(function (l) { return homeIds.indexOf(l.id) !== -1; });
    assert(labelledHome.length === 10, 'mobile chapter focus should retain every home event, got ' + labelledHome.length);
    const homeFrame = m.frames.filter(function (f) { return f.id === 'home'; })[0];
    assert(homeFrame && homeFrame.rect.left >= m.canvas.left - 1 && homeFrame.rect.right <= m.canvas.right + 1,
      'mobile home chapter fit should keep the whole chapter region in view');
    assert(!m.horizontalOverflow, 'mobile chapter fit overflowed horizontally');
  });

  await ok('390x844 actual cross-link navigation remains usable', async function () {
    await resetAtlas(page);
    const target = await page.evaluate(function () {
      const chapterOf = {};
      ATLAS.nodes.forEach(function (n) { chapterOf[n.id] = n.chapter; });
      for (let i = 0; i < ATLAS.edges.length; i++) {
        const e = ATLAS.edges[i];
        if (chapterOf[e.from] !== chapterOf[e.to] && e.kind === 'prerequisite') return { index: i, to: e.to };
      }
      return null;
    });
    assert(target, 'fixture prerequisite cross-edge missing');
    await page.locator('#map-labels .cross-label[data-edge="' + target.index + '"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const panel = await page.evaluate(function () {
      const r = document.getElementById('details').getBoundingClientRect();
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        left: r.left,
        right: r.right,
        width: r.width,
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim(),
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    });
    assert(panel.edge === target.index, 'mobile cross-label did not open the actual edge');
    assert(panel.left >= -1 && panel.right <= panel.innerWidth + 1, 'mobile evidence panel leaves the viewport');
    assert(panel.scrollWidth <= panel.innerWidth + 1, 'mobile evidence panel introduced horizontal overflow');
    assert(/Reported prerequisite/.test(panel.text), 'mobile evidence panel lost the prerequisite status');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
    assert(errors.length === 0, errors.join(' | '));
  });

  await page.close();
}

async function runDense(browser) {
  console.log('scenario synthetic-1000 map-first summaries');
  const generator = require('../benchmark/scale/generate-fixture');
  generator.writeFixture(path.join(root, 'benchmark', 'scale', 'generated', 'atlas-1000-data.js'));

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(baseUrl + '/benchmark/scale/atlas-1000.html#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await waitFrames(page);

  await ok('synthetic 1,000-node whole-story fit uses real region summaries and actual labels', async function () {
    const m = await mapSnapshot(page);
    assert(m.lod === 'overview', 'synthetic whole-story fit should be overview LOD');
    assert(!m.overviewSurface.visible && m.overviewSurface.cards === 0, 'synthetic map must not fall back to cards');
    assert(m.regionLabels.length === 5, 'five synthetic region labels expected, got ' + m.regionLabels.length);
    m.regionLabels.forEach(function (label) {
      assert(label.font >= 14, label.id + ' synthetic region label font ' + label.font + 'px is too small');
      assert(/events/.test(label.text) && /connectors/.test(label.text),
        label.id + ' synthetic region label must summarise real counts: ' + label.text);
    });
    assert(m.regionSummaries.length >= 5, 'each synthetic region needs a real topology summary');
    m.regionSummaries.forEach(function (summary) {
      assert(/events/.test(summary.text) && /connectors/.test(summary.text),
        summary.id + ' region summary is not a real aggregate: ' + summary.text);
    });
    assert(m.eventLabels.length >= 3, 'dense overview still needs meaningful actual labels, got ' + m.eventLabels.length);
    m.eventLabels.forEach(function (label) {
      assert(label.full.length > 0 && label.font >= 11, label.id + ' synthetic key label is empty or too small');
      assert(label.anchored || (label.hasLeader && label.anchorDistance <= 140),
        label.id + ' synthetic key label is detached from its event anchor');
      assert(label.mode === 'compact', label.id + ' synthetic overview should use compact labelled events');
      assert(!/^(traced|reported condition|prerequisite gate|unresolved hypothesis)$/i.test(label.text),
        label.id + ' synthetic event label is connector text, not an event label: ' + label.text);
    });
    assert(m.nodes.length === 1000 && m.nodes.every(function (n) { return !n.visible; }),
      'dense overview must not show a field of anonymous event rectangles');
    const crossTotal = await page.evaluate(function () {
      const chapterOf = {};
      ATLAS.nodes.forEach(function (n) { chapterOf[n.id] = n.chapter; });
      return ATLAS.edges.filter(function (e) { return chapterOf[e.from] !== chapterOf[e.to]; }).length;
    });
    assert(crossTotal > 100, 'synthetic fixture should retain its many actual cross-region connectors');
    assert(m.crossLabels.length >= 3 && m.crossLabels.length <= 10,
      'dense overview must group real cross-region labels, got ' + m.crossLabels.length + ' for ' + crossTotal + ' actual connectors');
    m.crossLabels.forEach(function (label) {
      assert(/^\d+ cross-chapter connectors$/.test(label.text), label.id + ' dense cross label must plainly state its connector count: ' + label.text);
      assert(/\d+ actual cross-chapter connectors/.test(label.full),
        label.id + ' dense cross label full text lost its actual group count: ' + label.full);
      assert(/traced|prerequisite|reported condition|unresolved hypothesis/.test(label.full),
        label.id + ' dense cross label detail must retain its actual connector kinds: ' + label.full);
      assert(Number(label.id) >= 0 && Number(label.id) < 1650, label.id + ' dense cross label lost its actual edge index');
    });
    const aggregateConnections = await page.locator('#aggregate-edges .aggregate-edge').evaluateAll(function (paths) {
      const chapters = {};
      ATLAS.chapters.forEach(function (chapter) { chapters[chapter.id] = chapter; });
      const chapterOf = {};
      ATLAS.nodes.forEach(function (node) { chapterOf[node.id] = node.chapter; });
      return paths.map(function (path) {
        const from = path.getAttribute('data-from-region');
        const to = path.getAttribute('data-to-region');
        const a = chapters[from] && chapters[from].frame;
        const b = chapters[to] && chapters[to].frame;
        const sx = Number(path.getAttribute('data-start-x'));
        const sy = Number(path.getAttribute('data-start-y'));
        const ex = Number(path.getAttribute('data-end-x'));
        const ey = Number(path.getAttribute('data-end-y'));
        const onBoundary = function (frame, x, y) {
          const withinX = x >= frame.x - 1 && x <= frame.x + frame.w + 1;
          const withinY = y >= frame.y - 1 && y <= frame.y + frame.h + 1;
          return (withinX && (Math.abs(y - frame.y) <= 1 || Math.abs(y - (frame.y + frame.h)) <= 1)) ||
            (withinY && (Math.abs(x - frame.x) <= 1 || Math.abs(x - (frame.x + frame.w)) <= 1));
        };
        const actualCount = ATLAS.edges.filter(function (edge) {
          return chapterOf[edge.from] === from && chapterOf[edge.to] === to;
        }).length;
        const style = getComputedStyle(path);
        return {
          from: from, to: to,
          group: path.getAttribute('data-cross-group'),
          memberCount: Number(path.getAttribute('data-member-count')),
          actualCount: actualCount,
          startOnFrame: !!a && onBoundary(a, sx, sy),
          endOnFrame: !!b && onBoundary(b, ex, ey),
          visible: style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity) > 0 && parseFloat(style.strokeWidth) >= 2,
          computed: { visibility: style.visibility, display: style.display, opacity: style.opacity, stroke: style.stroke, strokeWidth: style.strokeWidth, rect: path.getBoundingClientRect().toJSON() }
        };
      });
    });
    assert(aggregateConnections.length === m.crossLabels.length && aggregateConnections.length >= 3,
      'dense overview must draw one visible region-to-region path for every displayed aggregate connector group');
    aggregateConnections.forEach(function (connection) {
      assert(connection.from && connection.to && connection.from !== connection.to,
        'aggregate connector must join two distinct real regions');
      assert(connection.startOnFrame && connection.endOnFrame,
        connection.group + ' aggregate connector must touch both real chapter-frame bounds');
      assert(connection.memberCount === connection.actualCount && connection.memberCount > 0,
        connection.group + ' aggregate path count must match its actual directed member edges');
      assert(connection.visible, connection.group + ' aggregate region connector path is hidden or too faint: ' + JSON.stringify(connection.computed));
    });
  });

  await ok('dense connector groups expose every member edge, source and unknown status', async function () {
    const label = page.locator('#map-labels .cross-label.aggregate').first();
    assert(await label.count() === 1, 'dense aggregate cross label is missing');
    const summary = (await label.textContent()).replace(/\s+/g, ' ').trim();
    const match = /^(\d+) cross-chapter connectors$/.exec(summary);
    assert(match, 'dense aggregate label is not a plain connector count: ' + summary);
    const groupCount = Number(match[1]);
    await label.click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const group = await page.evaluate(function () {
      const el = document.getElementById('details');
      const rows = Array.prototype.slice.call(el.querySelectorAll('.group-edge'));
      return {
        title: el.querySelector('h2') ? el.querySelector('h2').textContent.trim() : '',
        rows: rows.length,
        indexed: rows.every(function (row) {
          const index = row.getAttribute('data-edge-evidence');
          return index != null && row.getAttribute('data-evidence') && /^\d+$/.test(index);
        }),
        statuses: rows.every(function (row) {
          const text = row.textContent.replace(/\s+/g, ' ').trim();
          return /Synthetic fixture/i.test(text) && /Everything about this connector is generated/i.test(text) &&
            /No connector-specific source link recorded/i.test(text);
        }),
        firstEdge: rows.length ? Number(rows[0].getAttribute('data-edge-evidence')) : null,
        text: el.textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(group.title === groupCount + ' cross-chapter connectors', 'group inspector title lost the connector count: ' + group.title);
    assert(group.rows === groupCount, 'group inspector must list all ' + groupCount + ' actual members, got ' + group.rows);
    assert(group.indexed, 'group inspector member rows lost their actual edge indices/evidence classes');
    assert(group.statuses, 'group member rows must each retain status, unknown and source information');
    assert(/does not assert a combined causal link/i.test(group.text),
      'group inspector must explicitly avoid implying aggregate causality');
    const firstEdge = group.firstEdge;
    await page.locator('.group-edge .group-open').first().click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const focused = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        hash: location.hash,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(focused.edge === firstEdge, 'group member did not open its actual edge index');
    assert(focused.evidence === 'synthetic', 'group member lost its actual evidence class');
    assert(focused.hash.indexOf('?edge=' + firstEdge) !== -1, 'group member lost the real edge deep-link: ' + focused.hash);
    assert(/Focused cross-chapter connector/.test(focused.text), 'group member did not open the edge evidence inspector');
    await page.keyboard.press('Escape');
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('synthetic chapter fit shows labelled branch summaries, not only blank event rectangles', async function () {
    await page.locator('[data-chapter="harbor-office"]').click();
    await waitFrames(page);
    const m = await mapSnapshot(page);
    assert(m.lod === 'structure' || m.lod === 'detail', 'synthetic chapter fit should show structure');
    assert(m.nodes.length === 1000 && m.nodes.every(function (n) { return !n.visible; }),
      'dense chapter fit must not leave a field of anonymous event rectangles');
    const summaries = m.regionSummaries.concat(m.branchSummaries);
    assert(summaries.length >= 1, 'synthetic chapter fit needs a region/branch summary');
    const text = summaries.map(function (s) { return s.text; }).join(' ');
    assert(/branch/i.test(text), 'dense chapter summary must name branch points derived from topology: ' + text);
    assert(/events/i.test(text) && /connectors/i.test(text), 'dense chapter summary must use real counts: ' + text);
    assert(m.eventLabels.length >= 3, 'dense chapter fit needs key event labels, got ' + m.eventLabels.length);
    const internal = await page.evaluate(function () {
      const label = document.querySelector('[data-node] .label');
      return label ? getComputedStyle(label).visibility : 'missing';
    });
    assert(internal === 'hidden', 'dense structure LOD should use summaries, not tiny internal labels');
    assert(!m.horizontalOverflow, 'synthetic chapter fit overflowed horizontally');
  });

  assert(errors.length === 0, errors.join(' | '));
  await page.close();
}

(async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    await runDesktop(browser);
    await runMobile(browser);
    await runDense(browser);
  } finally {
    await browser.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.error('map-first suite crashed: ' + (err && err.stack || err));
  process.exit(1);
});
