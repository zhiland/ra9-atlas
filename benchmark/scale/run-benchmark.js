#!/usr/bin/env node
/* Playwright benchmark for the current SVG/DOM atlas renderer at 1,000 nodes.
 *
 * Run: npm run bench:scale
 *
 * What it does:
 * - generates the deterministic synthetic fixture (seed 20261019),
 * - serves the public repository over an ordinary local HTTP server,
 * - launches desktop Chromium at 1440x900 and a mobile viewport profile at
 *   390x844 (deviceScaleFactor 1, touch enabled; emulation only),
 * - loads the production stylesheet unchanged in both profiles, including the
 *   synthetic banner's height in the mobile layout,
 * - performs one unmeasured warmup, then five measured repetitions per profile,
 * - samples requestAnimationFrame intervals during pan and zoom,
 * - records consent-click-to-rendered timing, search, chapter focus,
 *   selection-to-details, camera/label/layout metrics, DOM/SVG counts, errors,
 *   and asset sizes,
 * - writes out/results.json and a small set of screenshots under out/.
 *
 * It does not call external services. It does not modify production pages.
 * Mobile numbers are viewport emulation, not a physical-phone result.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const zlib = require('zlib');

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  const fallback = path.join(os.tmpdir(), 'opencode', 'pw-browsers');
  if (fs.existsSync(fallback)) process.env.PLAYWRIGHT_BROWSERS_PATH = fallback;
}

const { chromium } = require('playwright');
const generator = require('./generate-fixture');

const ROOT = path.resolve(__dirname, '..', '..');
const SCALE_DIR = __dirname;
const OUT_DIR = path.join(SCALE_DIR, 'out');
const GENERATED_DIR = path.join(SCALE_DIR, 'generated');
const GENERATED_FIXTURE = path.join(GENERATED_DIR, 'atlas-1000-data.js');
const ENTRY_PATH = '/benchmark/scale/atlas-1000.html';
const WARMUPS = 1;
const REPS = 5;
const SAMPLE_LABEL_COUNT = 20;

const PROFILES = [
  {
    id: 'desktop',
    label: 'Desktop Chromium',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  },
  {
    id: 'mobile',
    label: 'Mobile viewport emulation (diagnostic only; desktop Chromium at 390x844, not a phone)',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  }
];

function profileUrl(baseURL) {
  return baseURL + ENTRY_PATH;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort(function (a, b) { return a - b; });
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = values.slice().sort(function (a, b) { return a - b; });
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

function stats(values) {
  const clean = values.filter(function (v) { return typeof v === 'number' && isFinite(v); });
  if (!clean.length) return { count: 0, min: null, median: null, p95: null, max: null, mean: null };
  return {
    count: clean.length,
    min: round(clean.reduce(function (a, b) { return Math.min(a, b); }, Infinity)),
    median: round(median(clean)),
    p95: round(percentile(clean, 0.95)),
    max: round(Math.max.apply(null, clean)),
    mean: round(clean.reduce(function (a, b) { return a + b; }, 0) / clean.length)
  };
}

function round(v) {
  return Math.round(v * 100) / 100;
}

function flatten(arrays) {
  return arrays.reduce(function (out, a) { return out.concat(a || []); }, []);
}

function startServer() {
  return new Promise(function (resolve, reject) {
    const server = http.createServer(function (req, res) {
      const url = new URL(req.url, 'http://127.0.0.1');
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch (e) {
        res.writeHead(400); res.end('bad path'); return;
      }
      if (pathname === '/') pathname = ENTRY_PATH;
      if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const relative = pathname.replace(/^\/+/, '');
      const filePath = path.resolve(ROOT, relative);
      if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
        res.writeHead(403); res.end('outside repository'); return;
      }
      fs.readFile(filePath, function (err, data) {
        if (err) {
          res.writeHead(err.code === 'ENOENT' ? 404 : 500);
          res.end(err.code === 'ENOENT' ? 'not found' : 'read error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
          'Content-Length': data.length,
          'Cache-Control': 'no-store'
        });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', function () {
      resolve(server);
    });
  });
}

function assetSize(relativePath) {
  const full = path.join(ROOT, relativePath);
  const buf = fs.readFileSync(full);
  return {
    path: relativePath,
    rawBytes: buf.length,
    gzipBytes: zlib.gzipSync(buf, { level: 9 }).length
  };
}

function installPageHelpers() {
  window.__frameRecorder = {
    current: null,
    start: function () {
      // The first callback seeds the clock instead of producing an interval,
      // so a frame timestamp that predates the start call cannot go negative.
      const rec = { active: true, last: null, intervals: [] };
      window.__frameRecorder.current = rec;
      function tick(t) {
        if (!rec.active) return;
        if (rec.last === null) {
          // Seed from the first callback; never emit a pre-start interval.
          rec.last = t;
        } else {
          const delta = t - rec.last;
          if (delta >= 0) rec.intervals.push(delta);
          rec.last = t;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    },
    stop: function () {
      const rec = window.__frameRecorder.current;
      if (!rec) return [];
      rec.active = false;
      return rec.intervals.slice();
    }
  };
}

async function measureConsent(page) {
  return page.evaluate(function () {
    return new Promise(function (resolve) {
      const button = document.getElementById('consent');
      const coverHeading = document.querySelector('.cover h1');
      const banner = document.getElementById('benchmark-banner');
      const before = {
        coverHeading: coverHeading ? coverHeading.textContent.trim() : null,
        bannerText: banner ? banner.textContent.replace(/\s+/g, ' ').trim() : null
      };
      if (!button) { resolve({ error: 'consent button missing', before: before }); return; }
      const t0 = performance.now();
      try { button.click(); } catch (err) { resolve({ error: String(err), before: before }); return; }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          resolve({
            ms: performance.now() - t0,
            before: before,
            coverGone: !document.querySelector('.cover'),
            worldPresent: !!document.getElementById('world'),
            nodeCount: document.querySelectorAll('[data-node]').length,
            edgeCount: document.querySelectorAll('path.edge').length,
            detailsHidden: document.getElementById('details') ? document.getElementById('details').hidden : null,
            title: document.querySelector('.brand strong') ? document.querySelector('.brand strong').textContent : null,
            subtitle: document.querySelector('.brand span') ? document.querySelector('.brand span').textContent : null
          });
        });
      });
    });
  });
}

async function measureView(page) {
  return page.evaluate(function () {
    function round(v) { return Math.round(v * 100) / 100; }
    function median(values) {
      if (!values.length) return null;
      const sorted = values.slice().sort(function (a, b) { return a - b; });
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    const world = document.getElementById('world');
    const canvas = document.getElementById('canvas');
    if (!world || !canvas) return { error: 'map not rendered' };
    const cr = canvas.getBoundingClientRect();
    const lod = canvas.getAttribute('data-lod');
    let scale = 1;
    let tx = 0;
    let ty = 0;
    const transform = getComputedStyle(world).transform;
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      scale = matrix.a;
      tx = matrix.e;
      ty = matrix.f;
    }
    const nodeEls = Array.prototype.slice.call(document.querySelectorAll('[data-node]'));
    const labelEls = Array.prototype.slice.call(document.querySelectorAll('.node .label, .node .opt'));
    function intersects(r) {
      return r.right > cr.left && r.left < cr.right && r.bottom > cr.top && r.top < cr.bottom;
    }
    function fullyInside(r) {
      return r.left >= cr.left - 1 && r.right <= cr.right + 1 && r.top >= cr.top - 1 && r.bottom <= cr.bottom + 1;
    }
    function rendered(el) {
      const s = getComputedStyle(el);
      return s.visibility === 'visible' && s.display !== 'none';
    }
    const visibleNodes = nodeEls.filter(function (el) { return intersects(el.getBoundingClientRect()); });
    const fullyVisibleNodes = nodeEls.filter(function (el) { return fullyInside(el.getBoundingClientRect()); });
    const renderedNodes = visibleNodes.filter(rendered);
    const visibleLabels = labelEls.filter(function (el) {
      if (!el.textContent || !el.textContent.trim()) return false;
      return intersects(el.getBoundingClientRect());
    });
    const renderedLabels = visibleLabels.filter(rendered);
    const fontSizes = labelEls.map(function (el) { return parseFloat(getComputedStyle(el).fontSize); }).filter(isFinite);
    const effective = fontSizes.map(function (v) { return v * scale; });
    const labelHeights = labelEls.map(function (el) { return el.getBoundingClientRect().height; }).filter(isFinite);
    const clippedNodes = nodeEls.filter(function (el) {
      return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    });
    const overviewEl = document.getElementById('overview');
    const overviewVisible = !!overviewEl && !overviewEl.hidden && rendered(overviewEl);
    const cardEls = overviewEl ? Array.prototype.slice.call(overviewEl.querySelectorAll('[data-overview-chapter]')) : [];
    const cardNames = cardEls.map(function (el) {
      const name = el.querySelector('.ov-name');
      return name ? name.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    const cardFonts = cardEls.map(function (el) {
      const name = el.querySelector('.ov-name');
      return name ? parseFloat(getComputedStyle(name).fontSize) : NaN;
    }).filter(isFinite);
    const cardRects = cardEls.map(function (el) { return el.getBoundingClientRect(); });
    const overviewLinks = overviewEl ? Array.prototype.slice.call(overviewEl.querySelectorAll('.overview-link')) : [];
    const overviewLinkData = overviewLinks.map(function (el) {
      return {
        edge: el.hasAttribute('data-edge') ? Number(el.getAttribute('data-edge')) : null,
        evidence: el.getAttribute('data-evidence'),
        aggregate: el.classList.contains('aggregate'),
        fromChapter: el.getAttribute('data-from-chapter') || null,
        toChapter: el.getAttribute('data-to-chapter') || null,
        text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 240)
      };
    });
    const activeChapter = document.querySelector('.chapter.active');
    const focusedChapter = activeChapter ? activeChapter.getAttribute('data-chapter') : null;
    const frameEls = Array.prototype.slice.call(document.querySelectorAll('.frame'));
    const frameRects = frameEls.map(function (el) {
      return { id: el.getAttribute('data-chapter-frame'), rect: el.getBoundingClientRect() };
    });
    const framesIntersecting = frameRects.filter(function (f) { return intersects(f.rect); }).length;
    const framesFullyInside = frameRects.filter(function (f) { return fullyInside(f.rect); }).length;
    const focusedFrame = focusedChapter && focusedChapter !== 'all'
      ? frameRects.filter(function (f) { return f.id === focusedChapter; })[0]
      : null;
    function box(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100
      };
    }
    return {
      layout: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
        },
        banner: box('#benchmark-banner'),
        workspace: box('.workspace'),
        canvasWrap: box('.canvas-wrap'),
        canvas: box('#canvas')
      },
      camera: {
        scale: Math.round(scale * 10000) / 10000,
        tx: Math.round(tx * 100) / 100,
        ty: Math.round(ty * 100) / 100,
        lod: lod,
        zoomLabel: document.getElementById('zoomLabel') ? document.getElementById('zoomLabel').textContent : null
      },
      canvas: {
        left: Math.round(cr.left * 100) / 100,
        top: Math.round(cr.top * 100) / 100,
        width: Math.round(cr.width * 100) / 100,
        height: Math.round(cr.height * 100) / 100,
        usable: cr.width > 0 && cr.height > 0
      },
      counts: {
        allElements: document.querySelectorAll('*').length,
        nodeButtons: nodeEls.length,
        edgePaths: document.querySelectorAll('path.edge').length,
        svgPaths: document.querySelectorAll('svg path').length,
        edgeLabels: document.querySelectorAll('.edge-label').length,
        frames: document.querySelectorAll('.frame').length,
        chapters: document.querySelectorAll('[data-chapter]').length - 1,
        overviewCards: cardEls.length,
        overviewLinks: overviewLinks.length,
        overviewConnectors: document.querySelectorAll('#overview-connectors path.overview-connector').length
      },
      nodes: {
        mounted: nodeEls.length,
        visible: visibleNodes.length,
        fullyVisible: fullyVisibleNodes.length,
        renderedVisible: renderedNodes.length,
        layoutClipped: clippedNodes.length,
        layoutClippedRatio: Math.round((clippedNodes.length / Math.max(1, nodeEls.length)) * 10000) / 10000,
        clippedSamples: clippedNodes.slice(0, 20).map(function (el) {
          const node = el.getAttribute('data-node');
          return { id: node, label: el.querySelector('.label') ? el.querySelector('.label').textContent : '' };
        })
      },
      labels: {
        total: labelEls.length,
        visible: visibleLabels.length,
        renderedVisible: renderedLabels.length,
        cssFontMin: fontSizes.length ? round(Math.min.apply(null, fontSizes)) : null,
        cssFontMedian: fontSizes.length ? round(median(fontSizes)) : null,
        cssFontMax: fontSizes.length ? round(Math.max.apply(null, fontSizes)) : null,
        effectiveFontMin: effective.length ? round(Math.min.apply(null, effective)) : null,
        effectiveFontMedian: effective.length ? round(median(effective)) : null,
        effectiveFontMax: effective.length ? round(Math.max.apply(null, effective)) : null,
        effectiveAtLeast11: effective.filter(function (v) { return v >= 11; }).length,
        renderedHeightMedian: labelHeights.length ? round(median(labelHeights)) : null
      },
      overview: {
        visible: overviewVisible,
        clientHeight: overviewEl ? overviewEl.clientHeight : null,
        scrollHeight: overviewEl ? overviewEl.scrollHeight : null,
        scrollWidth: overviewEl ? overviewEl.scrollWidth : null,
        scrollable: !!overviewEl && overviewEl.scrollHeight > overviewEl.clientHeight + 1,
        cardCount: cardEls.length,
        cardsIntersectingCanvas: cardRects.filter(function (r) { return intersects(r); }).length,
        cardNames: cardNames,
        cardFontMin: cardFonts.length ? round(Math.min.apply(null, cardFonts)) : null,
        cardFontMedian: cardFonts.length ? round(median(cardFonts)) : null,
        links: overviewLinkData,
        aggregateRows: overviewLinkData.filter(function (l) { return l.aggregate; }).length
      },
      fit: {
        frameCount: frameRects.length,
        framesIntersectingCanvas: framesIntersecting,
        framesFullyInsideCanvas: framesFullyInside,
        allFramesInside: frameRects.length > 0 && framesFullyInside === frameRects.length,
        focusedChapter: focusedChapter,
        focusedFrameInside: focusedFrame ? fullyInside(focusedFrame.rect) : null
      },
      statusText: document.getElementById('status') ? document.getElementById('status').textContent.replace(/\s+/g, ' ').trim() : null
    };
  });
}

async function measureSearch(page, query) {
  return page.evaluate(function (q) {
    return new Promise(function (resolve) {
      const input = document.getElementById('q');
      if (!input) { resolve({ error: 'search input missing' }); return; }
      const t0 = performance.now();
      input.value = q;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          const results = document.getElementById('results');
          const hits = Array.prototype.slice.call(document.querySelectorAll('#results [data-hit]')).map(function (b) {
            return { id: b.getAttribute('data-hit'), text: b.textContent.replace(/\s+/g, ' ').trim() };
          });
          resolve({
            ms: performance.now() - t0,
            query: q,
            hidden: results ? results.hidden : null,
            hitCount: hits.length,
            hits: hits
          });
        });
      });
    });
  }, query);
}

async function resetAtlas(page) {
  await page.locator('#reset').click();
  await page.waitForFunction(function () {
    const details = document.getElementById('details');
    const input = document.getElementById('q');
    return details && details.hidden && input && input.value === '';
  });
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  });
}

async function zoomUntilLod(page, wanted, maxClicks) {
  const limit = maxClicks || 24;
  for (let i = 0; i <= limit; i++) {
    const lod = await page.locator('#canvas').getAttribute('data-lod');
    if (lod === wanted) return i;
    if (i === limit) break;
    await page.locator('#plus').click();
    await page.evaluate(function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () { requestAnimationFrame(resolve); });
      });
    });
  }
  throw new Error('LOD ' + wanted + ' was not reached');
}

/* Diagnostic only: the overview is a scroll container, not a camera pan
   surface. This records whether content can scroll and restores scrollTop. */
async function measureOverviewScroll(page) {
  return page.evaluate(function () {
    const overview = document.getElementById('overview');
    if (!overview) return { error: 'overview missing' };
    const start = {
      clientHeight: overview.clientHeight,
      scrollHeight: overview.scrollHeight,
      scrollWidth: overview.scrollWidth,
      scrollTop: overview.scrollTop
    };
    overview.scrollTop = overview.scrollHeight;
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          const reached = overview.scrollTop;
          overview.scrollTop = 0;
          resolve({
            clientHeight: start.clientHeight,
            scrollHeight: start.scrollHeight,
            scrollWidth: start.scrollWidth,
            scrollable: start.scrollHeight > start.clientHeight + 1,
            maxScrollTop: Math.max(0, start.scrollHeight - start.clientHeight),
            reachedScrollTop: Math.round(reached * 100) / 100
          });
        });
      });
    });
  });
}

async function measureChapterFocus(page, chapterId) {
  const result = await page.evaluate(function (id) {
    return new Promise(function (resolve) {
      const button = document.querySelector('[data-chapter="' + id + '"]');
      if (!button) { resolve({ error: 'chapter button missing: ' + id }); return; }
      const t0 = performance.now();
      button.click();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          resolve({
            ms: performance.now() - t0,
            pressed: button.getAttribute('aria-pressed'),
            active: button.classList.contains('active')
          });
        });
      });
    });
  }, chapterId);
  return { ...result, view: await measureView(page) };
}

async function measureSelection(page, nodeId) {
  const result = await page.evaluate(function (id) {
    return new Promise(function (resolve) {
      const button = document.querySelector('[data-node="' + id + '"]');
      if (!button) { resolve({ error: 'node button missing: ' + id }); return; }
      const t0 = performance.now();
      button.click();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          const details = document.getElementById('details');
          const rect = details ? details.getBoundingClientRect() : null;
          resolve({
            ms: performance.now() - t0,
            visible: !!details && !details.hidden && !!rect && rect.width > 0 && rect.height > 0,
            text: details ? details.textContent.replace(/\s+/g, ' ').trim().slice(0, 220) : '',
            gotoCount: details ? details.querySelectorAll('[data-goto]').length : 0,
            closePresent: !!(details && details.querySelector('#details-close'))
          });
        });
      });
    });
  }, nodeId);
  return { ...result, view: await measureView(page) };
}

async function zoomIn(page) {
  return page.evaluate(function () {
    return new Promise(function (resolve) {
      const button = document.getElementById('plus');
      const t0 = performance.now();
      button.click();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          const world = document.getElementById('world');
          const matrix = world ? new DOMMatrixReadOnly(getComputedStyle(world).transform) : { a: null };
          resolve({ ms: performance.now() - t0, scale: Math.round(matrix.a * 10000) / 10000 });
        });
      });
    });
  });
}

async function closeDetails(page) {
  await page.locator('#details-close').click();
  await page.locator('#details').waitFor({ state: 'hidden' });
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  });
}

async function measureZoomedLabels(page, chapterId, wanted) {
  return page.evaluate(function (args) {
    function round(v) { return Math.round(v * 100) / 100; }
    const canvas = document.getElementById('canvas');
    const cr = canvas.getBoundingClientRect();
    const world = document.getElementById('world');
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    const scale = matrix.a;
    const nodes = window.ATLAS.nodes.filter(function (n) { return n.chapter === args.chapterId; });
    const samples = [];
    for (let i = 0; i < nodes.length && samples.length < args.wanted; i++) {
      const node = nodes[i];
      const el = document.querySelector('[data-node="' + node.id + '"]');
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (!(r.right > cr.left && r.left < cr.right && r.bottom > cr.top && r.top < cr.bottom)) continue;
      const labelEl = el.querySelector('.label') || el.querySelector('.opt') || el;
      const cssFont = parseFloat(getComputedStyle(labelEl).fontSize);
      const effectiveFont = cssFont * scale;
      // Intrinsic clipping: the node's own content overflows its box, or its
      // label box sits outside the node box. This is independent of where the
      // node happens to sit relative to the viewport.
      const nodeBoxOverflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      const lr = labelEl.getBoundingClientRect();
      const labelOutsideNode = lr.left < r.left - 1 || lr.right > r.right + 1 || lr.top < r.top - 1 || lr.bottom > r.bottom + 1;
      const intrinsicClipped = nodeBoxOverflow || labelOutsideNode;
      // Boundary clipping: the label rect crosses the canvas viewport. This is
      // a camera/position effect, not label clipping inside the node.
      const nodeOutsideCanvas = r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1;
      const labelOutsideCanvas = lr.left < cr.left - 1 || lr.right > cr.right + 1 || lr.top < cr.top - 1 || lr.bottom > cr.bottom + 1;
      samples.push({
        id: node.id,
        label: node.label,
        labelLength: node.label.length,
        kind: node.kind,
        cssFont: round(cssFont),
        effectiveFont: round(effectiveFont),
        intrinsicClipped: intrinsicClipped,
        nodeBoxOverflow: nodeBoxOverflow,
        labelOutsideNode: labelOutsideNode,
        boundaryClipped: labelOutsideCanvas,
        nodeOutsideCanvas: nodeOutsideCanvas,
        scrollBox: [el.scrollWidth, el.clientWidth, el.scrollHeight, el.clientHeight],
        renderedLabel: [round(lr.width), round(lr.height)]
      });
    }
    const intrinsicClipped = samples.filter(function (s) { return s.intrinsicClipped; });
    const boundaryClipped = samples.filter(function (s) { return s.boundaryClipped; });
    const longSamples = samples.filter(function (s) { return s.labelLength > 30; });
    const longIntrinsicClipped = longSamples.filter(function (s) { return s.intrinsicClipped; });
    return {
      cameraScale: round(scale),
      chapterId: args.chapterId,
      sampleCount: samples.length,
      intrinsicClippedCount: intrinsicClipped.length,
      boundaryClippedCount: boundaryClipped.length,
      unclippedRatio: samples.length ? round((samples.length - intrinsicClipped.length) / samples.length) : null,
      boundaryUnclippedRatio: samples.length ? round((samples.length - boundaryClipped.length) / samples.length) : null,
      longSampleCount: longSamples.length,
      longIntrinsicClippedCount: longIntrinsicClipped.length,
      longBoundaryClippedCount: longSamples.filter(function (s) { return s.boundaryClipped; }).length,
      minCssFont: samples.length ? round(Math.min.apply(null, samples.map(function (s) { return s.cssFont; }))) : null,
      minEffectiveFont: samples.length ? round(Math.min.apply(null, samples.map(function (s) { return s.effectiveFont; }))) : null,
      representativeLongSamples: longSamples.map(function (s) {
        return { id: s.id, label: s.label, labelLength: s.labelLength, intrinsicClipped: s.intrinsicClipped, boundaryClipped: s.boundaryClipped };
      }),
      samples: samples
    };
  }, { chapterId: chapterId, wanted: wanted });
}

async function findDragPoint(page) {
  return page.evaluate(function () {
    function round(v) { return Math.round(v * 100) / 100; }
    const canvas = document.getElementById('canvas');
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    function usable(x, y) {
      if (x < r.left + 12 || x > r.right - 12 || y < r.top + 12 || y > r.bottom - 12) return false;
      const el = document.elementFromPoint(x, y);
      if (!el || !canvas.contains(el)) return false;
      if (el.closest('button')) return false;
      if (el.closest('.legend, .status, .zoom, .details')) return false;
      return true;
    }
    for (let radius = 0; radius < Math.min(r.width, r.height) / 2; radius += 10) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        if (usable(x, y)) return { x: round(x), y: round(y) };
      }
    }
    return { x: round(cx), y: round(cy) };
  });
}

async function measurePan(page, label) {
  const point = await findDragPoint(page);
  const viewBefore = await measureView(page);
  const maxAmp = Math.min(150, viewBefore.canvas.width * 0.22);
  await page.evaluate(function () { window.__frameRecorder.start(); });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  for (let i = 1; i <= 40; i++) {
    const angle = i / 5;
    const x = point.x + Math.sin(angle) * maxAmp;
    const y = point.y + Math.cos(angle * 0.65) * maxAmp * 0.45;
    await page.mouse.move(x, y);
    await page.waitForTimeout(9);
  }
  await page.mouse.up();
  await page.waitForTimeout(90);
  const frames = await page.evaluate(function () { return window.__frameRecorder.stop(); });
  const viewAfter = await measureView(page);
  return {
    label: label,
    point: point,
    frames: frames,
    frameStats: stats(frames),
    scaleBefore: viewBefore.camera.scale,
    scaleAfter: viewAfter.camera.scale
  };
}

async function measureZoom(page, label) {
  const point = await findDragPoint(page);
  // Exactly one full measureView per zoom sample; the post-zoom transform is
  // read directly instead of re-running the whole-canvas measurement.
  const viewBefore = await measureView(page);
  await page.evaluate(function () { window.__frameRecorder.start(); });
  await page.mouse.move(point.x, point.y);
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(9);
  }
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(9);
  }
  await page.waitForTimeout(90);
  const after = await page.evaluate(function () {
    const frames = window.__frameRecorder.stop();
    const world = document.getElementById('world');
    const matrix = world ? new DOMMatrixReadOnly(getComputedStyle(world).transform) : { a: null };
    return {
      frames: frames,
      scaleAfter: matrix.a == null ? null : Math.round(matrix.a * 10000) / 10000,
      zoomLabel: document.getElementById('zoomLabel') ? document.getElementById('zoomLabel').textContent : null
    };
  });
  return {
    label: label,
    point: point,
    frames: after.frames,
    frameStats: stats(after.frames),
    scaleBefore: viewBefore.camera.scale,
    scaleAfter: after.scaleAfter,
    zoomLabelAfter: after.zoomLabel
  };
}

function attachErrorTracking(page, baseURL) {
  const errors = { pageErrors: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
  page.on('pageerror', function (err) { errors.pageErrors.push(String(err && err.message || err)); });
  page.on('console', function (msg) {
    if (msg.type() === 'error') errors.consoleErrors.push(msg.text());
  });
  page.on('requestfailed', function (req) {
    if (req.url().startsWith(baseURL)) errors.requestFailures.push(req.url() + ' — ' + (req.failure() && req.failure().errorText));
  });
  page.on('response', function (res) {
    if (res.url().startsWith(baseURL) && res.status() >= 400) errors.httpErrors.push(res.url() + ' — HTTP ' + res.status());
  });
  return errors;
}

async function takeScreenshots(page, profileId, fixtureMeta) {
  const paths = {};
  await resetAtlas(page);
  paths.overview = path.join('benchmark', 'scale', 'out', profileId + '-overview.jpg');
  await page.screenshot({ path: path.join(ROOT, paths.overview), type: 'jpeg', quality: 80 });

  await measureChapterFocus(page, fixtureMeta.representative.chapterId);
  await measureSelection(page, fixtureMeta.representative.detailNodeId);
  await zoomIn(page);
  paths.detail = path.join('benchmark', 'scale', 'out', profileId + '-detail.jpg');
  await page.screenshot({ path: path.join(ROOT, paths.detail), type: 'jpeg', quality: 80 });
  return paths;
}

async function runMeasuredRep(browser, profile, baseURL, fixtureMeta, captureScreenshots) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    locale: 'en-US',
    colorScheme: 'light',
    reducedMotion: 'no-preference'
  });
  await context.addInitScript(installPageHelpers);
  const page = await context.newPage();
  const errors = attachErrorTracking(page, baseURL);
  await page.goto(profileUrl(baseURL), { waitUntil: 'load' });
  await page.locator('#consent').waitFor({ state: 'visible' });

  const banner = await page.locator('#benchmark-banner').isVisible();
  const consent = await measureConsent(page);
  await page.locator('#world').waitFor({ state: 'visible' });
  const overview = await measureView(page);
  const overviewScroll = await measureOverviewScroll(page);

  const search = await measureSearch(page, fixtureMeta.representative.searchQuery);
  await resetAtlas(page);

  const chapter = await measureChapterFocus(page, fixtureMeta.representative.chapterId);
  const selection = await measureSelection(page, fixtureMeta.representative.detailNodeId);
  const zoomInResult = await zoomIn(page);
  const detailView = await measureView(page);

  const panDetail = await measurePan(page, 'zoomed detail (details open)');
  await closeDetails(page);
  const labelSample = await measureZoomedLabels(page, fixtureMeta.representative.chapterId, SAMPLE_LABEL_COUNT);

  await resetAtlas(page);
  await zoomUntilLod(page, 'structure');
  const panStructure = await measurePan(page, 'whole atlas structure (one zoom step above overview)');
  await resetAtlas(page);
  const zoomOverview = await measureZoom(page, 'whole atlas overview');

  let screenshots = null;
  if (captureScreenshots) {
    screenshots = await takeScreenshots(page, profile.id, fixtureMeta);
  }

  const result = {
    consent: consent,
    bannerVisible: banner,
    overview: overview,
    overviewScroll: overviewScroll,
    search: search,
    chapterFocus: chapter,
    selection: selection,
    zoomIn: zoomInResult,
    detailView: detailView,
    panDetail: panDetail,
    labelSample: labelSample,
    panStructure: panStructure,
    zoomOverview: zoomOverview,
    screenshots: screenshots,
    errors: errors
  };
  await context.close();
  return result;
}

async function warmup(browser, profile, baseURL, fixtureMeta) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    locale: 'en-US',
    colorScheme: 'light'
  });
  await context.addInitScript(installPageHelpers);
  const page = await context.newPage();
  await page.goto(profileUrl(baseURL), { waitUntil: 'load' });
  await page.locator('#consent').click();
  await page.locator('#world').waitFor({ state: 'visible' });
  await measureChapterFocus(page, fixtureMeta.representative.chapterId);
  await measureSelection(page, fixtureMeta.representative.detailNodeId);
  await zoomIn(page);
  await closeDetails(page);
  await resetAtlas(page);
  await zoomUntilLod(page, 'structure');
  await measurePan(page, 'warmup');
  await resetAtlas(page);
  await measureZoom(page, 'warmup');
  await context.close();
}

function aggregateProfile(profile, reps) {
  const consentRuns = reps.map(function (r) { return r.consent.ms; });
  const searchRuns = reps.map(function (r) { return r.search.ms; });
  const chapterRuns = reps.map(function (r) { return r.chapterFocus.ms; });
  const selectionRuns = reps.map(function (r) { return r.selection.ms; });
  const zoomInRuns = reps.map(function (r) { return r.zoomIn.ms; });
  const panStructureFrames = flatten(reps.map(function (r) { return r.panStructure.frames; }));
  const panDetailFrames = flatten(reps.map(function (r) { return r.panDetail.frames; }));
  const zoomOverviewFrames = flatten(reps.map(function (r) { return r.zoomOverview.frames; }));
  const allErrors = reps.map(function (r) { return r.errors; });
  const labelSamples = reps.map(function (r) { return r.labelSample; });
  return {
    label: profile.label,
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    consentToRendered: { runs: consentRuns.map(round), stats: stats(consentRuns) },
    search: { runs: searchRuns.map(round), stats: stats(searchRuns) },
    chapterFocus: { runs: chapterRuns.map(round), stats: stats(chapterRuns) },
    selectionToDetails: { runs: selectionRuns.map(round), stats: stats(selectionRuns) },
    zoomIn: { runs: zoomInRuns.map(round), stats: stats(zoomInRuns) },
    panStructure: { frameStats: stats(panStructureFrames), perRep: reps.map(function (r) { return r.panStructure.frameStats; }) },
    panDetail: { frameStats: stats(panDetailFrames), perRep: reps.map(function (r) { return r.panDetail.frameStats; }) },
    zoomOverview: { frameStats: stats(zoomOverviewFrames), perRep: reps.map(function (r) { return r.zoomOverview.frameStats; }) },
    overviewScroll: reps[0].overviewScroll,
    overview: {
      lod: reps[0].overview.camera.lod,
      cameraScale: reps[0].overview.camera.scale,
      canvas: reps[0].overview.canvas,
      layout: reps[0].overview.layout,
      labels: reps[0].overview.labels,
      nodes: reps[0].overview.nodes,
      counts: reps[0].overview.counts,
      overview: reps[0].overview.overview,
      fit: reps[0].overview.fit
    },
    chapterFocusView: {
      lod: reps[0].chapterFocus.view.camera.lod,
      cameraScale: reps[0].chapterFocus.view.camera.scale,
      canvas: reps[0].chapterFocus.view.canvas,
      layout: reps[0].chapterFocus.view.layout,
      labels: reps[0].chapterFocus.view.labels,
      nodes: reps[0].chapterFocus.view.nodes,
      fit: reps[0].chapterFocus.view.fit
    },
    detailView: {
      lod: reps[0].detailView.camera.lod,
      cameraScale: reps[0].detailView.camera.scale,
      zoomLabel: reps[0].detailView.camera.zoomLabel,
      canvas: reps[0].detailView.canvas,
      layout: reps[0].detailView.layout,
      labels: reps[0].detailView.labels,
      nodes: reps[0].detailView.nodes,
      fit: reps[0].detailView.fit
    },
    labelSamples: labelSamples,
    screenshots: reps[0].screenshots,
    errors: allErrors
  };
}

function gateEvaluation(profileAgg, profileId, reps) {
  const consentRenderOk = profileAgg.consentToRendered.runs.length === REPS &&
    profileAgg.consentToRendered.runs.every(function (ms) { return ms <= 3000; });
  const panOk = profileAgg.panStructure.frameStats.count > 0 &&
    profileAgg.panStructure.frameStats.p95 <= 50 &&
    profileAgg.panStructure.frameStats.max <= 200;
  const panDetailOk = profileAgg.panDetail.frameStats.count > 0 &&
    profileAgg.panDetail.frameStats.p95 <= 50 &&
    profileAgg.panDetail.frameStats.max <= 200;
  const zoomOk = profileAgg.zoomOverview.frameStats.count > 0 &&
    profileAgg.zoomOverview.frameStats.p95 <= 50 &&
    profileAgg.zoomOverview.frameStats.max <= 200;
  const errorsOk = reps.every(function (r) {
    return r.errors.pageErrors.length === 0 && r.errors.consoleErrors.length === 0 &&
      r.errors.requestFailures.length === 0 && r.errors.httpErrors.length === 0;
  });
  const inventoryOk = reps.every(function (r) {
    return r.overview.counts.nodeButtons === 1000 &&
      r.overview.counts.edgePaths === 1650 &&
      r.overview.counts.chapters === 5;
  });
  const mapUsable = reps.every(function (r) {
    return r.overview.canvas.usable === true &&
      r.chapterFocus.view.canvas.usable === true &&
      r.detailView.canvas.usable === true;
  });
  const detailsOk = reps.every(function (r) {
    return r.selection.visible === true && r.selection.closePresent === true;
  });
  const labelsOk = profileAgg.labelSamples.every(function (s) {
    return s.sampleCount >= SAMPLE_LABEL_COUNT &&
      s.minCssFont >= 11 &&
      s.minEffectiveFont >= 11 &&
      s.unclippedRatio >= 0.9 &&
      s.cameraScale >= 1.0;
  });
  return {
    profile: profileId,
    diagnosticOnly: profileId === 'mobile',
    consentRender: consentRenderOk,
    panStructure: panOk,
    panDetail: panDetailOk,
    zoom: zoomOk,
    errors: errorsOk,
    inventory: inventoryOk,
    mapUsable: mapUsable,
    detailsAfterSelection: detailsOk,
    focusedZoomedLabels: labelsOk
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  generator.writeFixture(GENERATED_FIXTURE);
  const fixtureMeta = generator.generate().meta;

  const assets = [
    assetSize('benchmark/scale/generated/atlas-1000-data.js'),
    assetSize('prototype/atlas-app.js'),
    assetSize('prototype/atlas-core.js'),
    assetSize('prototype/atlas.css'),
    assetSize('benchmark/scale/atlas-1000.html'),
    assetSize('benchmark/scale/benchmark.css'),
    assetSize('benchmark/scale/benchmark-chrome.js')
  ];
  const appAssets = assets.filter(function (a) {
    return a.path === 'prototype/atlas-app.js' || a.path === 'prototype/atlas-core.js' ||
      a.path === 'prototype/atlas.css' || a.path === 'benchmark/scale/atlas-1000.html' ||
      a.path === 'benchmark/scale/generated/atlas-1000-data.js';
  });
  const assetTotal = appAssets.reduce(function (out, a) {
    out.rawBytes += a.rawBytes; out.gzipBytes += a.gzipBytes; return out;
  }, { rawBytes: 0, gzipBytes: 0 });

  const server = await startServer();
  const baseURL = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  const startedAt = new Date().toISOString();
  const results = {
    schemaVersion: 1,
    synthetic: true,
    generatedAt: startedAt,
    note: 'Synthetic fixture benchmark against the production stylesheet. Mobile is viewport emulation, not a physical device. No gameplay claim.',
    commands: {
      benchmark: 'npm run bench:scale',
      fixtureOnly: 'node benchmark/scale/generate-fixture.js',
      existingTests: 'npm test'
    },
    environment: {
      os: { platform: process.platform, arch: process.arch, release: os.release(), version: os.version() },
      node: process.version,
      playwright: require('playwright/package.json').version,
      browser: {
        name: browser.browserType().name(),
        version: browser.version(),
        userAgent: await (async function () {
          const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
          const page = await context.newPage();
          await page.goto(baseURL + ENTRY_PATH, { waitUntil: 'load' });
          const ua = await page.evaluate(function () {
            return {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              hardwareConcurrency: navigator.hardwareConcurrency,
              deviceMemory: navigator.deviceMemory || null
            };
          });
          await context.close();
          return ua;
        })()
      },
      profiles: PROFILES.map(function (p) {
        return {
          id: p.id,
          viewport: p.viewport,
          deviceScaleFactor: p.deviceScaleFactor,
          isMobile: p.isMobile,
          hasTouch: p.hasTouch
        };
      })
    },
    fixture: {
      seed: generator.SEED,
      generatedFile: 'benchmark/scale/generated/atlas-1000-data.js',
      topology: fixtureMeta.topology,
      counts: fixtureMeta.counts,
      labelStats: fixtureMeta.labelStats,
      representative: fixtureMeta.representative
    },
    assets: { files: assets, totalAppRawBytes: assetTotal.rawBytes, totalAppGzipBytes: assetTotal.gzipBytes },
    measurement: {
      warmupsPerProfile: WARMUPS,
      measuredRepsPerProfile: REPS,
      frameSampling: 'requestAnimationFrame inter-frame deltas during Playwright mouse drag and wheel input; the first callback seeds the clock and no negative interval is recorded',
      consentTiming: 'in-page performance.now() from the consent button click through the second animation frame after the cover is removed. The map is now built beneath the cover at page load so it stays visible under the spoiler overlay; this is overlay-dismissal timing, not initial graph construction. It is not navigation, network page-load, or cold-start timing.',
      labelSample: SAMPLE_LABEL_COUNT + ' visible nodes from the focused chapter after selection, details close, and one + zoom step',
      labelClipping: 'Intrinsic clipping is node scrollWidth/scrollHeight overflow or rendered label bounding box outside its own node. Label-box intersection with the canvas boundary is reported separately as boundary clipping and is not counted as intrinsic clipping.',
      overviewLod: 'At whole-atlas fit the renderer shows screen-space chapter cards (overview LOD), not the 1,000 event labels. Nodes, connectors and labels stay mounted and measurable; renderedVisible counts only elements whose computed visibility is actually visible.',
      overviewCrosslinks: 'Every overview crosslink row exposes the real data.edges index and evidence class. Aggregate rows, if any, are navigation-only and are reported separately; the synthetic fixture groups 150 cross-region edges into chapter pairs.',
      fitBounds: 'fit.framesFullyInsideCanvas checks all chapter frames against the canvas rect. For a focused chapter, focusedFrameInside checks the requested chapter separately because other chapters are allowed off-screen.',
      panTarget: 'After the overview becomes a scroll surface, the camera-pan timing sample runs at structure LOD (whole atlas, one zoom step above overview). The pan thresholds are unchanged; only the sampled interaction moved above the new overview layer.',
      mobileLayout: 'The mobile profile loads the production stylesheet at 390x844 with no layout override. The synthetic banner remains visible and its height is included in the measured canvas area.',
      layoutMeasurement: 'Actual #canvas getBoundingClientRect, .workspace, .canvas-wrap, banner, viewport, and document scroll dimensions are recorded for every overview/chapter/detail view.',
      physicalDeviceClaim: 'None. Mobile results are Chromium viewport emulation only.'
    },
    profiles: {}
  };

  fs.rmSync(path.join(OUT_DIR, 'mobile-unmodified-overview.jpg'), { force: true });

  try {
    for (const profile of PROFILES) {
      console.log('\n' + profile.id + ' — warmup', WARMUPS);
      for (let i = 0; i < WARMUPS; i++) await warmup(browser, profile, baseURL, fixtureMeta);
      console.log(profile.id + ' — measured repetitions', REPS);
      const reps = [];
      for (let i = 0; i < REPS; i++) {
        const rep = await runMeasuredRep(browser, profile, baseURL, fixtureMeta, i === 0);
        reps.push(rep);
        console.log(
          '  rep ' + (i + 1) + ': consent-render ' + round(rep.consent.ms) + 'ms, selection ' +
          round(rep.selection.ms) + 'ms, pan p95 ' + rep.panStructure.frameStats.p95 +
          'ms/' + rep.panStructure.frameStats.count + ', zoom p95 ' + rep.zoomOverview.frameStats.p95 +
          'ms/' + rep.zoomOverview.frameStats.count + ', overview ' + rep.overview.camera.lod +
          '/' + rep.overview.counts.overviewCards + ' cards, labels ' + rep.labelSample.unclippedRatio
        );
      }
      const agg = aggregateProfile(profile, reps);
      const gate = gateEvaluation(agg, profile.id, reps);
      agg.gates = gate;
      agg.rawReps = reps;
      results.profiles[profile.id] = agg;
    }

    results.gateEvaluation = {
      desktop: results.profiles.desktop.gates,
      mobileDiagnostic: results.profiles.mobile.gates,
      note: 'Mobile thresholds are diagnostic only and do not constitute a real-device pass.'
    };

    fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2) + '\n');

    console.log('\nGates:');
    ['desktop', 'mobile'].forEach(function (id) {
      const g = results.profiles[id].gates;
      console.log('  ' + id + ': ' + JSON.stringify(g));
    });
    console.log('\nWrote ' + path.relative(ROOT, path.join(OUT_DIR, 'results.json')));
    console.log('Screenshots: ' + ['desktop', 'mobile'].map(function (id) {
      const s = results.profiles[id].screenshots;
      return s ? s.overview + ', ' + s.detail : id + ': none';
    }).join('; '));
  } finally {
    await browser.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
}

main().catch(function (err) {
  console.error('scale benchmark crashed: ' + (err && err.stack || err));
  process.exit(1);
});
