#!/usr/bin/env node
/* Stable-zoom regression for the shared atlas renderer.
 *
 * Run: node tests/stable-zoom.test.js   (npm run test:stable-zoom)
 *
 * The map is one world at every camera scale. This suite pins the rejected
 * dynamic-LOD behaviour by sampling whole-map fit, far zoom-out, intermediate
 * zoom and close zoom:
 *   - node ids, actual edge ids, node labels and real edge labels never change;
 *   - every node label stays inside its own real node box;
 *   - labels and connectors keep the same world-space geometry while only the
 *     camera matrix changes;
 *   - no summary chips, aggregate paths, anonymous dots or event-label overlay
 *     are mounted;
 *   - the 1,000-node synthetic fixture keeps all 1,000 generated nodes/labels
 *     and all 1,650 generated edge paths in the same world at every scale.
 *
 * Viewport clipping is allowed. The suite does not require labels to be
 * readable at distant zoom. Mobile checks elsewhere are viewport emulation.
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

async function openAtlas(page, file) {
  await page.goto(baseUrl + '/' + file + '#');
  await page.locator('#consent').waitFor({ state: 'visible' });
  await page.locator('#consent').click();
  await page.locator('#spoiler-overlay').waitFor({ state: 'detached' });
  await page.locator('#world').waitFor({ state: 'visible' });
  await waitFrames(page);
}

async function resetAtlas(page) {
  await page.locator('#reset').click();
  await page.locator('#details').waitFor({ state: 'hidden' });
  await waitFrames(page);
}

async function camera(page) {
  return page.evaluate(function () {
    const world = document.getElementById('world');
    const m = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    return { scale: m.a, tx: m.e, ty: m.f };
  });
}

async function clickZoom(page, selector, times) {
  for (let i = 0; i < times; i++) {
    await page.locator(selector).click();
    await waitFrames(page);
  }
}

async function snapshot(page) {
  return page.evaluate(function () {
    function text(value) {
      return (value || '').replace(/\s+/g, ' ').trim();
    }
    function visible(el) {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.visibility !== 'visible' || s.display === 'none' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    function rendered(el) {
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.visibility === 'visible' && s.display !== 'none' && Number(s.opacity) !== 0;
    }
    function edgeKey(edge, index) {
      return edge.id || ('index-' + index);
    }
    const world = document.getElementById('world');
    const canvas = document.getElementById('canvas');
    const matrix = new DOMMatrixReadOnly(getComputedStyle(world).transform);
    const wr = world.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    function worldRect(el) {
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
    function styleBox(el) {
      return { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
    }

    const nodes = Array.prototype.slice.call(document.querySelectorAll('[data-node]')).map(function (el) {
      const id = el.getAttribute('data-node');
      const label = el.querySelector('[data-node-label]');
      return {
        id: id,
        labelId: label ? label.getAttribute('data-node-label') : null,
        labelText: text(label ? label.textContent : ''),
        labelMounted: !!label,
        labelInsideNode: !!label && el.contains(label),
        labelVisible: visible(label),
        style: styleBox(el),
        nodeWorld: worldRect(el),
        labelWorld: label ? worldRect(label) : null
      };
    });

    const edges = Array.prototype.slice.call(document.querySelectorAll('path.edge')).map(function (el) {
      const index = Number(el.getAttribute('data-edge'));
      return {
        index: index,
        edgeId: el.getAttribute('data-edge-id') || ('index-' + index),
        pathId: el.id,
        d: el.getAttribute('d'),
        visible: rendered(el)
      };
    });

    const edgeLabels = Array.prototype.slice.call(document.querySelectorAll('.edge-label')).map(function (el) {
      const index = Number(el.getAttribute('data-edge-label'));
      return {
        index: index,
        edgeId: el.getAttribute('data-edge-id') || ('index-' + index),
        text: text(el.textContent),
        visible: visible(el),
        style: styleBox(el),
        labelWorld: worldRect(el)
      };
    });

    const frames = Array.prototype.slice.call(document.querySelectorAll('.frame')).map(function (el) {
      const title = el.querySelector('[data-frame-label]');
      return {
        id: el.getAttribute('data-chapter-frame'),
        titleId: title ? title.getAttribute('data-frame-label') : null,
        titleText: text(title ? title.textContent : ''),
        titleMounted: !!title,
        titleInsideFrame: !!title && el.contains(title),
        titleVisible: visible(title),
        frameWorld: worldRect(el),
        titleWorld: title ? worldRect(title) : null
      };
    });

    const choiceOptions = Array.prototype.slice.call(document.querySelectorAll('.node.choice')).reduce(function (all, node) {
      return all.concat(Array.prototype.slice.call(node.querySelectorAll('.opt')).map(function (el, index) {
        const label = Array.prototype.slice.call(el.childNodes).filter(function (child) {
          return child.nodeType === 3;
        }).map(function (child) { return child.nodeValue; }).join('');
        return { nodeId: node.getAttribute('data-node'), index: index, text: text(label), visible: visible(el) };
      }));
    }, []);

    const expected = {
      nodeLabels: ATLAS.nodes.map(function (n) { return { id: n.id, text: text(n.heading || n.label) }; }),
      choiceOptions: ATLAS.nodes.filter(function (n) { return n.kind === 'choice'; }).reduce(function (all, n) {
        return all.concat(n.options.map(function (option, index) {
          return { nodeId: n.id, index: index, text: text(option) };
        }));
      }, []),
      edgeLabels: ATLAS.edges.map(function (e, index) {
        return e.label ? { index: index, id: edgeKey(e, index), text: text(e.label) } : null;
      }).filter(Boolean),
      frames: ATLAS.chapters.map(function (c) { return { id: c.id, text: text(c.name) }; })
    };

    return {
      scale: matrix.a,
      tx: matrix.e,
      ty: matrix.f,
      transform: world.style.transform,
      canvas: { left: cr.left, top: cr.top, right: cr.right, bottom: cr.bottom, width: cr.width, height: cr.height },
      zoomLabel: document.getElementById('zoomLabel') ? text(document.getElementById('zoomLabel').textContent) : '',
      nodes: nodes,
      choiceOptions: choiceOptions,
      edges: edges,
      edgeLabels: edgeLabels,
      frames: frames,
      expected: expected,
      forbidden: {
        eventLabelOverlay: document.querySelectorAll('#map-labels .event-label, #map-labels [data-event-node], [data-label-mode]').length,
        mapLabelLayer: document.querySelectorAll('#map-labels').length,
        summaries: document.querySelectorAll('.region-summary, .branch-summary, [data-region-summary], [data-branch-summary]').length,
        aggregatePaths: document.querySelectorAll('#aggregate-edges path, .aggregate-edge, [data-cross-group]').length,
        nodeDots: document.querySelectorAll('#node-dots circle, [data-node-dot]').length,
        overlayChips: document.querySelectorAll('.overview-card, .overview-link, .chip.aggregate').length
      }
    };
  });
}

function indexBy(list, key) {
  const out = {};
  list.forEach(function (item) { out[item[key]] = item; });
  return out;
}

function assertSameKeys(a, b, label) {
  const left = Object.keys(a).sort();
  const right = Object.keys(b).sort();
  assert(JSON.stringify(left) === JSON.stringify(right),
    label + ' ids changed: ' + left.length + ' vs ' + right.length +
    (left.length !== right.length ? '' : ' (' + left.filter(function (k) { return right.indexOf(k) === -1; }).join(', ') + ')'));
}

function assertInventoryStable(snapshots, expected) {
  const expectedNodeLabels = indexBy(expected.nodeLabels, 'id');
  const expectedChoiceOptions = {};
  expected.choiceOptions.forEach(function (item) { expectedChoiceOptions[item.nodeId + ':' + item.index] = item; });
  const expectedEdgeLabels = {};
  expected.edgeLabels.forEach(function (item) { expectedEdgeLabels[item.id] = item; });
  const expectedFrames = indexBy(expected.frames, 'id');
  const first = snapshots[0];

  snapshots.forEach(function (s, i) {
    const at = 'scale ' + s.scale + ' (sample ' + i + ')';
    const nodes = indexBy(s.nodes, 'id');
    const edges = {};
    s.edges.forEach(function (e) { edges[e.edgeId] = e; });
    const labels = {};
    s.nodes.forEach(function (n) { if (n.labelId) labels[n.labelId] = n; });
    const edgeLabels = {};
    s.edgeLabels.forEach(function (l) { if (l.edgeId) edgeLabels[l.edgeId] = l; });
    const frames = indexBy(s.frames, 'id');

    assert(s.nodes.length === Object.keys(expectedNodeLabels).length,
      at + ': node count ' + s.nodes.length + ' differs from fixture ' + Object.keys(expectedNodeLabels).length);
    assert(Object.keys(nodes).length === Object.keys(expectedNodeLabels).length,
      at + ': duplicate or missing node ids (' + Object.keys(nodes).length + ')');
    assert(Object.keys(labels).length === Object.keys(expectedNodeLabels).length,
      at + ': expected one mounted node label per node, got ' + Object.keys(labels).length);
    const choiceOptions = {};
    s.choiceOptions.forEach(function (item) { choiceOptions[item.nodeId + ':' + item.index] = item; });
    assert(Object.keys(choiceOptions).length === Object.keys(expectedChoiceOptions).length,
      at + ': choice option rows changed to ' + Object.keys(choiceOptions).length +
      ' from ' + Object.keys(expectedChoiceOptions).length);
    Object.keys(expectedChoiceOptions).forEach(function (key) {
      assert(choiceOptions[key] && choiceOptions[key].text === expectedChoiceOptions[key].text,
        at + ': choice option text changed for ' + key);
      assert(choiceOptions[key].visible, at + ': choice option ' + key + ' is hidden by zoom state');
    });
    assert(Object.keys(edges).length === first.edges.length,
      at + ': edge path count changed to ' + Object.keys(edges).length + ' from ' + first.edges.length);
    assert(Object.keys(edgeLabels).length === Object.keys(expectedEdgeLabels).length,
      at + ': expected ' + Object.keys(expectedEdgeLabels).length + ' real edge labels, got ' + Object.keys(edgeLabels).length);
    assert(s.frames.length === Object.keys(expectedFrames).length,
      at + ': chapter frame count changed to ' + s.frames.length);

    Object.keys(expectedNodeLabels).forEach(function (id) {
      const node = nodes[id];
      const label = labels[id];
      assert(node, at + ': missing node ' + id);
      assert(label, at + ': missing node label for ' + id);
      assert(label.labelText === expectedNodeLabels[id].text,
        at + ': node label text changed for ' + id + ': "' + label.labelText + '"');
      assert(label.labelInsideNode, at + ': node label ' + id + ' is not inside its node box');
      assert(label.labelVisible && node.labelVisible, at + ': node label ' + id + ' is hidden by zoom state');
    });

    Object.keys(expectedEdgeLabels).forEach(function (id) {
      const edge = edges[id];
      const label = edgeLabels[id];
      assert(edge, at + ': missing actual edge path ' + id);
      assert(label, at + ': missing edge label for actual edge ' + id);
      assert(label.text === expectedEdgeLabels[id].text,
        at + ': edge label text changed for ' + id + ': "' + label.text + '"');
      assert(label.visible && edge.visible, at + ': edge or edge label ' + id + ' is hidden by zoom state');
    });

    Object.keys(expectedFrames).forEach(function (id) {
      const frame = frames[id];
      assert(frame, at + ': missing chapter frame ' + id);
      assert(frame.titleMounted && frame.titleInsideFrame, at + ': chapter name for ' + id + ' is not inside its frame');
      assert(frame.titleText === expectedFrames[id].text,
        at + ': chapter frame name changed for ' + id + ': "' + frame.titleText + '"');
      assert(frame.titleVisible, at + ': chapter name for ' + id + ' is hidden by zoom state');
      const t = frame.titleWorld, f = frame.frameWorld;
      assert(t.left >= f.left - 1 && t.right <= f.right + 1 && t.top >= f.top - 1 && t.bottom <= f.bottom + 1,
        at + ': chapter name ' + id + ' falls outside its frame in world coordinates');
    });

    Object.keys(s.forbidden).forEach(function (key) {
      assert(s.forbidden[key] === 0, at + ': forbidden map overlay "' + key + '" created (' + s.forbidden[key] + ')');
    });
    assert(!/story map|event map|close map|level of detail/i.test(s.zoomLabel),
      at + ': zoom label still exposes retired LOD wording: ' + s.zoomLabel);
  });
}

function assertWorldGeometryStable(snapshots) {
  const first = snapshots[0];
  const firstNodes = indexBy(first.nodes, 'id');
  const firstEdges = {};
  first.edges.forEach(function (e) { firstEdges[e.edgeId] = e; });
  const firstLabels = {};
  first.edgeLabels.forEach(function (l) { firstLabels[l.edgeId] = l; });

  snapshots.slice(1).forEach(function (s, index) {
    const at = 'scale ' + s.scale + ' (comparison ' + (index + 1) + ')';
    s.nodes.forEach(function (node) {
      const before = firstNodes[node.id];
      assert(JSON.stringify(node.style) === JSON.stringify(before.style),
        at + ': node ' + node.id + ' moved in world coordinates');
      assert(node.labelWorld && before.labelWorld, at + ': node label ' + node.id + ' has no world geometry');
      ['left', 'top', 'width', 'height'].forEach(function (key) {
        assert(Math.abs(node.labelWorld[key] - before.labelWorld[key]) <= 0.75,
          at + ': node label ' + node.id + ' changed world ' + key + ' (' +
          before.labelWorld[key] + ' -> ' + node.labelWorld[key] + ')');
      });
      const n = node.nodeWorld;
      const l = node.labelWorld;
      assert(l.left >= n.left - 1 && l.right <= n.right + 1 && l.top >= n.top - 1 && l.bottom <= n.bottom + 1,
        at + ': node label ' + node.id + ' left its node box in world coordinates');
    });
    s.edges.forEach(function (edge) {
      assert(edge.d === firstEdges[edge.edgeId].d,
        at + ': actual edge ' + edge.edgeId + ' path geometry changed in world coordinates');
    });
    s.edgeLabels.forEach(function (label) {
      const before = firstLabels[label.edgeId];
      assert(JSON.stringify(label.style) === JSON.stringify(before.style),
        at + ': edge label ' + label.edgeId + ' moved in world coordinates');
      ['left', 'top', 'width', 'height'].forEach(function (key) {
        assert(Math.abs(label.labelWorld[key] - before.labelWorld[key]) <= 0.75,
          at + ': edge label ' + label.edgeId + ' changed world ' + key + ' (' +
          before.labelWorld[key] + ' -> ' + label.labelWorld[key] + ')');
      });
    });
  });
}

async function findDragPoint(page) {
  return page.evaluate(function () {
    const canvas = document.getElementById('canvas');
    const r = canvas.getBoundingClientRect();
    for (let y = r.top + 24; y < r.bottom - 24; y += 16) {
      for (let x = r.left + 24; x < r.right - 24; x += 16) {
        const el = document.elementFromPoint(x, y);
        if (!el || !canvas.contains(el)) continue;
        if (el.closest('button, a, input, .legend, .status, .zoom')) continue;
        return { x: x, y: y };
      }
    }
    return null;
  });
}

async function runRealDataset(browser) {
  console.log('scenario real-123 stable zoom');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await openAtlas(page, 'prototype/poc4-editorial.html');

  let snapshots = [];

  await ok('far, fit, intermediate and close zoom keep the same nodes, edges and labels', async function () {
    const fit = await snapshot(page);
    let close = fit;
    let closeSteps = 0;
    while (close.scale < 1 && closeSteps < 10) {
      await clickZoom(page, '#plus', 1);
      close = await snapshot(page);
      closeSteps += 1;
    }

    await resetAtlas(page);
    await clickZoom(page, '#plus', 2);
    const intermediate = await snapshot(page);

    await resetAtlas(page);
    await clickZoom(page, '#minus', 2);
    const far = await snapshot(page);
    snapshots = [fit, far, intermediate, close];

    assert(fit.scale > far.scale, 'far sample is not farther out than whole-map fit: ' + far.scale + ' vs ' + fit.scale);
    assert(intermediate.scale > fit.scale && intermediate.scale < close.scale,
      'samples must bracket intermediate/close zoom: fit ' + fit.scale + ', middle ' + intermediate.scale + ', close ' + close.scale);
    assert(close.scale >= 1, 'close sample should be at least 100%, got ' + close.scale);
    assert(far.zoomLabel === Math.round(far.scale * 100) + '%' ||
      far.zoomLabel === Math.round(far.scale * 100) + '% ', 'zoom label should be the camera percentage only: ' + far.zoomLabel);

    assertInventoryStable(snapshots, fit.expected);
    assertInventoryStable([fit], fit.expected);

    assert(fit.expected.nodeLabels.length === 123, 'fixture should keep 123 node labels');
    assert(fit.expected.edgeLabels.length > 0, 'fixture should contain real edge labels');
    assert(fit.expected.frames.length === 7, 'fixture should keep seven chapter frames');
  });

  await ok('node labels stay inside their boxes and only the world camera matrix changes', async function () {
    assertWorldGeometryStable(snapshots);
    const scales = snapshots.map(function (s) { return s.scale; });
    assert(new Set(scales).size === scales.length, 'sampled scales should all differ: ' + scales.join(', '));
    snapshots.forEach(function (s) {
      assert(s.nodes.length === 123 && s.edges.length === 104,
        'scale ' + s.scale + ' changed mounted graph inventory');
      assert(s.nodes.every(function (n) { return n.labelInsideNode; }),
        'scale ' + s.scale + ' has a node label outside its box');
    });
  });

  await ok('short Hostage actions contain two-line labels with a wide fallback font', async function () {
    const style = await page.addStyleTag({ content: '.node.hostage.action { font-family: monospace; }' });
    try {
      await waitFrames(page);
      const result = await page.evaluate(function () {
        return Array.from(document.querySelectorAll('.node.hostage.action')).map(function (node) {
          const box = node.getBoundingClientRect();
          const el = node.querySelector('.node-label');
          const label = el.getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          const sub = node.querySelector('.sub');
          return { id: node.dataset.node,
            inside: label.top >= box.top - .1 && label.bottom <= box.bottom + .1 && text.left >= box.left - .1 && text.right <= box.right + .1,
            stacked: !sub || sub.getBoundingClientRect().top >= label.bottom - .1 };

        });
      });
      assert(result.length > 0, 'fixture must contain short Hostage actions');
      result.forEach(function (node) { assert(node.inside, node.id + ': fallback label leaves node'); assert(node.stacked, node.id + ': sublabel must stay below title'); });
    } finally { await style.evaluate(function (el) { el.remove(); }); }
  });

  await ok('pan changes translation only and fit restores the whole stable chart', async function () {
    await resetAtlas(page);
    const before = await snapshot(page);
    const point = await findDragPoint(page);
    assert(point, 'could not find a blank map point to pan');
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 90, point.y - 55, { steps: 8 });
    await page.mouse.up();
    await waitFrames(page);
    const panned = await camera(page);
    assert(Math.abs(panned.scale - before.scale) < 1e-6,
      'pan changed camera scale: ' + before.scale + ' -> ' + panned.scale);
    assert(Math.abs(panned.tx - before.tx) > 1 || Math.abs(panned.ty - before.ty) > 1,
      'pan did not move the camera translation');
    const afterPan = await snapshot(page);
    assertInventoryStable([before, afterPan], before.expected);
    assertWorldGeometryStable([before, afterPan]);

    await page.locator('#fit').click();
    await waitFrames(page);
    const fitted = await snapshot(page);
    assert(Math.abs(fitted.scale - before.scale) < 1e-6,
      'Fit did not restore whole-map scale: ' + fitted.scale + ' vs ' + before.scale);
    fitted.frames.forEach(function (frame) {
      const f = frame.frameWorld;
      const left = f.left * fitted.scale + fitted.tx;
      const top = f.top * fitted.scale + fitted.ty;
      const right = f.right * fitted.scale + fitted.tx;
      const bottom = f.bottom * fitted.scale + fitted.ty;
      assert(left >= -1 && top >= -1 && right <= fitted.canvas.width + 1 && bottom <= fitted.canvas.height + 1,
        'Fit left chapter ' + frame.id + ' outside the canvas');
    });
    assertInventoryStable([fitted], fitted.expected);
  });

  await ok('edge labels remain attached to their real edge and still open evidence', async function () {
    await resetAtlas(page);
    const target = await page.evaluate(function () {
      for (let i = 0; i < ATLAS.edges.length; i++) {
        if (ATLAS.edges[i].kind === 'hypothesis') return { index: i, id: ATLAS.edges[i].id, to: ATLAS.edges[i].to };
      }
      return null;
    });
    assert(target, 'fixture hypothesis edge missing');
    const label = page.locator('.edge-label[data-edge-label="' + target.index + '"]');
    assert(await label.count() === 1, 'actual edge label is missing');
    assert(await label.getAttribute('data-edge-id') === target.id, 'edge label lost its actual edge id');
    await label.click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const details = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      const path = document.querySelector('path.edge.focused');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        pathId: path ? path.id : null,
        pathEdgeId: path ? path.getAttribute('data-edge-id') : null,
        hash: location.hash,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(details.edge === target.index, 'edge label did not open its actual edge index');
    assert(details.evidence === 'unresolved', 'edge evidence class was lost');
    assert(details.pathId === 'edge-' + target.index && details.pathEdgeId === target.id,
      'the actual connector path was not focused');
    assert(details.hash.indexOf('?edge=' + target.index) !== -1, 'edge deep link was lost: ' + details.hash);
    assert(/UNRESOLVED hypothesis/.test(details.text) && /not a confirmed causal link/.test(details.text),
      'evidence inspector lost its uncertainty wording');
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('no page errors in the stable-zoom suite', async function () {
    assert(errors.length === 0, errors.join(' | '));
  });

  await page.close();
}

async function runDense(browser) {
  console.log('scenario synthetic-1000 stable zoom');
  const generator = require('../benchmark/scale/generate-fixture');
  generator.writeFixture(path.join(root, 'benchmark', 'scale', 'generated', 'atlas-1000-data.js'));

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await openAtlas(page, 'benchmark/scale/atlas-1000.html');

  await ok('all 1,000 generated nodes/labels and 1,650 edge paths stay in one world at far, fit, mid and close', async function () {
    const fit = await snapshot(page);
    await clickZoom(page, '#plus', 4);
    const close = await snapshot(page);

    await resetAtlas(page);
    await clickZoom(page, '#plus', 2);
    const middle = await snapshot(page);

    await resetAtlas(page);
    await clickZoom(page, '#minus', 2);
    const far = await snapshot(page);
    const snapshots = [fit, far, middle, close];

    assert(fit.nodes.length === 1000, 'dense fixture should mount 1,000 nodes, got ' + fit.nodes.length);
    assert(fit.edges.length === 1650, 'dense fixture should mount 1,650 actual edge paths, got ' + fit.edges.length);
    assert(fit.edgeLabels.length === fit.expected.edgeLabels.length,
      'dense fixture should mount every generated edge label, got ' + fit.edgeLabels.length +
      ' of ' + fit.expected.edgeLabels.length);
    assert(fit.frames.length === 5, 'dense fixture should keep five chapter frames, got ' + fit.frames.length);
    assertInventoryStable(snapshots, fit.expected);
    assertWorldGeometryStable(snapshots);

    snapshots.forEach(function (s) {
      assert(s.nodes.length === 1000 && s.edges.length === 1650 && s.edgeLabels.length === s.expected.edgeLabels.length,
        'scale ' + s.scale + ' changed dense mounted inventory');
      assert(s.nodes.every(function (n) { return n.labelMounted && n.labelInsideNode; }),
        'scale ' + s.scale + ' has a generated node label outside its node');
    });
  });

  await ok('generated node text and every choice option fit inside their world-space boxes', async function () {
    const result = await page.evaluate(function () {
      const clipped = [];
      document.querySelectorAll('[data-node]').forEach(function (el) {
        const box = el.getBoundingClientRect();
        let overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
        el.querySelectorAll('.node-label, .opt').forEach(function (child) {
          const r = child.getBoundingClientRect();
          if (r.left < box.left - 1 || r.right > box.right + 1 ||
              r.top < box.top - 1 || r.bottom > box.bottom + 1) overflow = true;
        });
        if (overflow) clipped.push(el.getAttribute('data-node'));
      });
      const choices = Array.prototype.slice.call(document.querySelectorAll('[data-node]'))
        .filter(function (el) { return el.classList.contains('choice'); })
        .map(function (el) {
          return {
            id: el.getAttribute('data-node'),
            title: el.querySelector('.node-label').textContent.trim(),
            options: Array.prototype.slice.call(el.querySelectorAll('.opt')).map(function (option) {
              return Array.prototype.slice.call(option.childNodes)
                .filter(function (child) { return child.nodeType === Node.TEXT_NODE; })
                .map(function (child) { return child.textContent; }).join('').replace(/\s+/g, ' ').trim();
            })
          };
        });
      return { clipped: clipped, choices: choices };
    });
    assert(result.clipped.length === 0,
      'generated text is clipped inside node boxes: ' + result.clipped.join(', '));
    const expected = generator.generate().atlas.nodes.filter(function (node) { return node.kind === 'choice'; });
    assert(result.choices.length === expected.length, 'choice boxes are missing');
    expected.forEach(function (node, index) {
      const actual = result.choices.find(function (choice) { return choice.id === node.id; });
      assert(actual && actual.title === node.label, node.id + ': choice title was clipped or changed');
      assert(JSON.stringify(actual.options) === JSON.stringify(node.options),
        node.id + ': choice options were clipped, hidden or changed');
    });
  });

  await ok('dense map has no grouped pseudo-paths, summaries, dots or event overlay', async function () {
    const s = await snapshot(page);
    Object.keys(s.forbidden).forEach(function (key) {
      assert(s.forbidden[key] === 0, 'dense map created forbidden "' + key + '": ' + s.forbidden[key]);
    });
    assert(await page.locator('#aggregate-edges').count() === 0, 'aggregate edge layer still exists');
    assert(await page.locator('#node-dots').count() === 0, 'anonymous node dot layer still exists');
    assert(await page.locator('#map-labels').count() === 0, 'separate event-label overlay still exists');
  });

  await ok('dense real connector labels still open actual edge evidence and deep links', async function () {
    await resetAtlas(page);
    const target = await page.evaluate(function () {
      const canvas = document.getElementById('canvas').getBoundingClientRect();
      for (let i = 0; i < ATLAS.edges.length; i++) {
        if (ATLAS.edges[i].kind !== 'hypothesis' || !ATLAS.edges[i].label) continue;
        const el = document.querySelector('.edge-label[data-edge-label="' + i + '"]');
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.right > canvas.left && r.left < canvas.right && r.bottom > canvas.top && r.top < canvas.bottom) {
          return { index: i, id: ATLAS.edges[i].id, to: ATLAS.edges[i].to };
        }
      }
      return null;
    });
    assert(target, 'dense hypothesis edge with a label missing');
    await page.locator('.edge-label[data-edge-label="' + target.index + '"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const details = await page.evaluate(function () {
      const block = document.querySelector('#details [data-edge-evidence]');
      return {
        edge: block ? Number(block.getAttribute('data-edge-evidence')) : null,
        evidence: block ? block.getAttribute('data-evidence') : null,
        hash: location.hash,
        text: document.getElementById('details').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert(details.edge === target.index, 'dense edge label did not open its actual edge');
    assert(details.evidence === 'synthetic', 'dense edge lost its generated evidence class');
    assert(details.hash.indexOf('?edge=' + target.index) !== -1, 'dense edge deep link was lost');
    assert(/Synthetic fixture/.test(details.text), 'dense evidence should name its synthetic status');
    await page.keyboard.press('Escape');
    await page.locator('#details').waitFor({ state: 'hidden' });
  });

  await ok('no page errors in the dense stable-zoom suite', async function () {
    assert(errors.length === 0, errors.join(' | '));
  });

  await page.close();
}

(async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    await runRealDataset(browser);
    await runDense(browser);
  } finally {
    await browser.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.error('stable-zoom suite crashed: ' + (err && err.stack || err));
  process.exit(1);
});
