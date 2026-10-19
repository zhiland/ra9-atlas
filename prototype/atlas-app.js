/* PoC4 — shared atlas renderer and interaction.
   Standalone classic script. Renders ATLAS data on a pannable/zoomable world
   canvas; the three chapter regions always stay on one surface, so
   cross-chapter links and prerequisite gates are visible before navigation.
   The details panel never replaces the map; both close paths (button, Escape)
   reduce to ATLAS_CORE.closeDetails. */

(function () {
  'use strict';

  var C = ATLAS_CORE, D = ATLAS;
  var byId = {}, chapters = {};
  D.nodes.forEach(function (n) { byId[n.id] = n; });
  D.chapters.forEach(function (c) { chapters[c.id] = c; });

  var state = C.createState();
  var hashApplied = false;
  var cam = { scale: 1, tx: 0, ty: 0 };
  var app = document.getElementById('app');

  var STATUS_LABEL = {
    ocr: 'Screenshot transcription · structure only',
    guide: 'Guide-reported · secondary sources',
    user: 'User-provided claim · page wording matches inspected guides',
    unresolved: 'Unresolved · hypothesis only',
    mixed: 'Mixed secondary evidence · see details'
  };
  var KIND_LABEL = { action: 'Action', flag: 'State flag', choice: 'Choice', outcome: 'Outcome' };
  var EDGE_LABEL = { traced: 'traced', conditional: 'reported condition', prerequisite: 'prerequisite gate', hypothesis: 'unresolved hypothesis' };
  var SOURCE_LABEL = {
    steam: 'Steam chapter flowcharts (screenshot reference)',
    powerpyxHome: 'PowerPyx · A New Home',
    gamefaqs: 'GameFAQs · A New Home',
    transcript: 'Fandom transcript · A New Home',
    powerpyxKara: 'PowerPyx · Battle for Detroit — Kara',
    fandomBattle: 'Fandom · Battle for Detroit',
    neoseekerKara: 'Neoseeker · Battle for Detroit — Kara',
    gamerGuides: 'Gamer Guides · Battle for Detroit — Kara'
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- orthogonal routing (mirrored by prototype/validate-atlas-data.js) ---------- */
  function pathFor(e) {
    var a = byId[e.from], b = byId[e.to];
    var fromY = e.fromOption == null ? a.y + a.h / 2 :
      a.y + (e.fromOption + 0.5) * a.h / a.options.length;
    var sameCol = Math.abs((a.x + a.w / 2) - (b.x + b.w / 2)) < 26;
    if (sameCol) {
      var cx = a.x + a.w / 2, dx = b.x + b.w / 2;
      return b.y > a.y
        ? 'M ' + cx + ' ' + (a.y + a.h) + ' V ' + b.y + ' H ' + dx
        : 'M ' + cx + ' ' + a.y + ' V ' + (b.y + b.h) + ' H ' + dx;
    }
    if (b.x >= a.x + a.w) {
      var sx = a.x + a.w, sy = fromY, tx = b.x, ty = b.y + b.h / 2;
      var mx = e.via != null ? e.via : (sx + tx) / 2;
      return 'M ' + sx + ' ' + sy + ' H ' + mx + ' V ' + ty + ' H ' + tx;
    }
    var bsx = a.x, bsy = fromY, btx = b.x + b.w, bty = b.y + b.h / 2;
    var bmx = e.via != null ? e.via : (bsx + btx) / 2;
    return 'M ' + bsx + ' ' + bsy + ' H ' + bmx + ' V ' + bty + ' H ' + btx;
  }

  function neighbours(id) {
    var set = {};
    D.edges.forEach(function (e) { if (e.from === id || e.to === id) { set[e.from] = 1; set[e.to] = 1; } });
    return set;
  }

  /* ---------- shell ---------- */
  function renderShell() {
    if (!state.consented) {
      app.innerHTML =
        '<div class="cover"><div class="cover-box">' +
        '<div class="eyebrow">ra9-atlas · PoC4 · selected multi-chapter slice</div>' +
        '<h1>Full spoilers ahead</h1>' +
        '<p>This map reveals choices and outcomes from <em>Detroit: Become Human</em>, including a late-game Todd and Kara branch.</p>' +
        '<p>Three selected chapter regions are shown: <strong>A New Home</strong>, <strong>Stormy Night</strong> and <strong>Battle for Detroit — Kara</strong>. They are guide-based and screenshot-transcribed only; no transition is verified in game. Game version and platform are unknown.</p>' +
        '<button class="primary" id="consent">Reveal atlas map</button>' +
        '</div></div>';
      document.getElementById('consent').onclick = function () {
        state = C.consent(state);
        renderShell();
      };
      return;
    }

    if (!hashApplied && location.hash) state = C.applyHash(state, location.hash, D);
    hashApplied = true;

    app.innerHTML =
      '<div class="app">' +
        '<header class="top">' +
          '<div class="brand"><strong>' + esc(D.meta.title) + '</strong><span>' + esc(D.meta.poc) + ' · selected slice · not in-game verified</span></div>' +
          '<nav class="chapters" aria-label="Atlas regions">' +
            '<button class="chapter" data-chapter="all" aria-pressed="false">Whole atlas<small>3 chapters</small></button>' +
            D.chapters.map(function (c) {
              return '<button class="chapter" data-chapter="' + c.id + '" aria-pressed="false">' + esc(c.name) + '<small>' + esc(c.code) + '</small></button>';
            }).join('') +
          '</nav>' +
          '<div class="tools">' +
            '<div class="search"><input id="q" type="search" placeholder="Search labels…" aria-label="Search labels" autocomplete="off"><div class="results" id="results" hidden></div></div>' +
            '<button class="tool" id="fit" title="Fit the current view">Fit</button>' +
            '<button class="tool" id="reset" title="Clear selection, search and return to the whole atlas">Reset</button>' +
          '</div>' +
        '</header>' +
        '<div class="trailbar"><span class="trail-label">History</span><div class="trail" id="trail"></div></div>' +
        '<div class="workspace">' +
          '<main class="canvas-wrap" id="canvas" aria-label="Multi-chapter branch map">' +
            '<div class="world" id="world">' +
              '<div id="frames"></div>' +
              '<svg id="edges"><defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs></svg>' +
              '<div id="labels"></div>' +
              '<div id="nodes"></div>' +
              '<svg id="markers"></svg>' +
            '</div>' +
            '<div class="legend" aria-label="Legend">' +
              '<div class="row"><i></i>traced connector</div>' +
              '<div class="row"><i class="dashdot"></i>reported condition</div>' +
              '<div class="row"><i class="dashed"></i>unresolved hypothesis</div>' +
              '<div class="row"><i class="gate-line"></i>prerequisite gate</div>' +
              '<div class="row"><span class="glyph">?</span>unresolved hypothesis marker</div>' +
            '</div>' +
            '<div class="status" id="status"></div>' +
            '<div class="zoom"><button class="tool" id="minus" aria-label="Zoom out">−</button><span id="zoomLabel"></span><button class="tool" id="plus" aria-label="Zoom in">+</button></div>' +
          '</main>' +
          '<aside class="details" id="details" hidden aria-label="Node details"></aside>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('[data-chapter]').forEach(function (b) {
      b.onclick = function () {
        commit(C.jumpChapter(state, b.getAttribute('data-chapter'), D), { fit: true, hash: true });
      };
    });
    document.getElementById('fit').onclick = fitCurrent;
    document.getElementById('reset').onclick = function () {
      state = C.reset(state);
      var q = document.getElementById('q'); if (q) q.value = '';
      closeResults();
      commit(state, { fit: true, hash: true });
    };
    document.getElementById('minus').onclick = function () { zoomAt(0.82); };
    document.getElementById('plus').onclick = function () { zoomAt(1.22); };
    document.getElementById('q').oninput = function (ev) {
      state = C.setQuery(state, ev.target.value);
      renderResults();
    };
    setupCanvas();
    renderGraph();
    fitCurrent();
  }

  function commit(next, opts) {
    opts = opts || {};
    state = next;
    renderGraph();
    if (opts.fit) fitCurrent();
    if (opts.center && byId[opts.center]) centerOn(byId[opts.center]);
    if (opts.hash) setHash();
  }

  function setHash() {
    var h = C.hashFor(state);
    if (location.hash !== h) location.hash = h;
  }

  /* ---------- graph ---------- */
  function renderGraph() {
    var world = document.getElementById('world');
    world.style.width = D.canvas.width + 'px';
    world.style.height = D.canvas.height + 'px';

    document.getElementById('frames').innerHTML = D.chapters.map(function (c) {
      return '<section class="frame" aria-label="' + esc(c.name) + ' region" style="left:' + c.frame.x + 'px;top:' + c.frame.y +
        'px;width:' + c.frame.w + 'px;height:' + c.frame.h + 'px"><div class="frame-title"><strong>' + esc(c.name) + '</strong><span>' +
        esc(c.code) + ' — ' + esc(c.desc) + '</span></div></section>';
    }).join('');

    var svg = document.getElementById('edges');
    svg.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    svg.setAttribute('width', D.canvas.width);
    svg.setAttribute('height', D.canvas.height);

    var focus = state.selected ? neighbours(state.selected) : null;
    var paths = [], labelQueue = [], badgeQueue = [];
    D.edges.forEach(function (e, i) {
      var d = pathFor(e);
      var active = state.selected && (e.from === state.selected || e.to === state.selected);
      var dim = focus && !active;
      paths.push('<path class="edge ' + e.kind + (active ? ' active' : '') + (dim ? ' dimmed' : '') + '" id="edge-' + i + '" marker-end="url(#arrowhead)" d="' + d + '"></path>');
      if (e.label) labelQueue.push({ e: e, i: i, dim: dim });
      if (e.kind === 'hypothesis') badgeQueue.push({ e: e, i: i, dim: dim });
    });
    svg.innerHTML = '<defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs>' + paths.join('');

    var labelHtml = labelQueue.map(function (L) {
      var pos = L.e.labelAt || pointAt(svg.querySelector('#edge-' + L.i), 0.5);
      return '<div class="edge-label ' + L.e.kind + (L.dim ? ' dimmed' : '') + '" style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
        esc(L.e.label) + '</div>';
    });
    document.getElementById('labels').innerHTML = labelHtml.join('');

    var mk = document.getElementById('markers');
    mk.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    mk.setAttribute('width', D.canvas.width);
    mk.setAttribute('height', D.canvas.height);
    mk.innerHTML = badgeQueue.map(function (B) {
      var shape = '<circle class="badge-ring" r="8"></circle><text class="badge-text" text-anchor="middle" dy="3.5">?</text>';
      return '<g class="' + (B.dim ? 'dimmed' : '') + '">' + shape + '</g>';
    }).join('');
    var badgeNodes = mk.querySelectorAll('g');
    badgeQueue.forEach(function (B, idx) {
      var pos = B.e.labelAt || pointAt(svg.querySelector('#edge-' + B.i), 0.5);
      var dy = B.e.label ? -22 : 0;
      badgeNodes[idx].setAttribute('transform', 'translate(' + pos.x + ',' + (pos.y + dy) + ')');
    });

    document.getElementById('nodes').innerHTML = D.nodes.map(function (n) {
      var classes = ['node', n.kind];
      if (state.selected === n.id) classes.push('selected');
      var inner;
      if (n.kind === 'choice') {
        inner = n.options.map(function (o, i) {
          return '<span class="opt"><span class="from-option">option ' + (i + 1) + '</span>' + esc(o) + '</span>';
        }).join('');
      } else {
        inner = '<span class="k">' + KIND_LABEL[n.kind] + '</span><span class="label">' + esc(n.label) + '</span>' +
          (n.sub ? '<span class="sub">' + esc(n.sub) + '</span>' : '');
      }
      var aria = esc(n.label) + ' — ' + KIND_LABEL[n.kind] + ' — ' + (STATUS_LABEL[n.status] || 'status unknown');
      return '<button class="' + classes.join(' ') + '" data-node="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y +
        'px;width:' + n.w + 'px;height:' + n.h + 'px" aria-label="' + aria + '">' + inner + '</button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-node]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute('data-node');
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });

    var c = D.meta.counts;
    document.getElementById('status').innerHTML =
      c.chapters + ' chapters · ' + c.nodes + ' boxes · ' + c.edges + ' connectors (' + c.prerequisiteEdges +
      ' prerequisite gates · ' + c.conditionalEdges + ' reported condition · ' + c.hypothesisEdges +
      ' unresolved hypothesis) · version/platform unknown · ' + esc(D.meta.disclaimer);

    document.querySelectorAll('[data-chapter]').forEach(function (b) {
      var on = b.getAttribute('data-chapter') === state.chapter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    renderTrail();
    renderDetails();
    updateTransform();
  }

  function pointAt(path, t) {
    var len = path.getTotalLength();
    return path.getPointAtLength(len * t);
  }

  /* ---------- details ---------- */
  function renderDetails() {
    var el = document.getElementById('details');
    if (!state.selected) { el.hidden = true; el.innerHTML = ''; return; }
    var n = byId[state.selected];
    var d = D.detail[n.id] || {};
    var chapter = chapters[n.chapter];
    el.hidden = false;

    var related = D.edges.filter(function (e) { return e.from === n.id || e.to === n.id; });
    var rows = related.map(function (e) {
      var outgoing = e.from === n.id;
      var other = byId[outgoing ? e.to : e.from];
      var dir = outgoing ? '→' : '←';
      var opt = outgoing && e.fromOption != null && n.options ? esc(n.options[e.fromOption]) + ' · ' : '';
      var label = e.label ? ' — ' + esc(e.label) : '';
      return '<button data-goto="' + other.id + '"><span class="dir">' + dir + '</span>' + opt + esc(other.label) + label +
        '<span class="kind">' + EDGE_LABEL[e.kind] + '</span></button>';
    }).join('');

    var optBlock = n.kind === 'choice'
      ? '<h3>Choice options reported</h3><ul class="opt-list">' + n.options.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>'
      : '';

    var sourceKeys = (d.src || n.src || []);
    var srcBlock = sourceKeys.map(function (key) {
      var url = D.refs[key];
      if (!url) return '';
      return '<a class="src-link" href="' + url + '" target="_blank" rel="noopener noreferrer">' + esc(SOURCE_LABEL[key] || key) + ' ↗</a>';
    }).join('');

    var crossBlock = '';
    if (d.cross) {
      var target = byId[d.cross.node];
      var targetChapter = chapters[d.cross.chapter];
      if (target) {
        crossBlock = '<h3>Cross-chapter</h3><p class="tiny muted">' + esc(targetChapter ? targetChapter.name : d.cross.chapter) +
          ' · not a confirmed causal link beyond what the connector already states.</p>' +
          '<button class="goto" data-goto="' + target.id + '">' + esc(d.cross.label || ('Open ' + target.label)) + ' →</button>';
      }
    }

    el.innerHTML =
      '<button class="close" id="details-close" aria-label="Close details">×</button>' +
      '<div class="eyebrow">' + esc(chapter ? chapter.name : n.chapter) + ' · ' + esc(KIND_LABEL[n.kind]) + '</div>' +
      '<h2>' + esc(n.label) + '</h2>' +
      '<span class="chip ' + n.status + '">' + esc(d.status || STATUS_LABEL[n.status] || 'status unknown') + '</span>' +
      '<p>' + esc(d.summary || n.note || 'A node in this selected slice. Structure comes from the cited reference; no in-game verification.') + '</p>' +
      optBlock +
      (d.unknown ? '<h3>Still unknown</h3><p class="note">' + esc(d.unknown) + '</p>' : '') +
      (n.note && d.summary ? '<h3>Note</h3><p class="note tiny">' + esc(n.note) + '</p>' : '') +
      '<h3>Connectors (' + related.length + ')</h3>' +
      '<div class="rowlist">' + (rows || '<p class="muted tiny">No connector in this slice.</p>') + '</div>' +
      crossBlock +
      '<h3>Evidence</h3>' +
      '<p class="tiny muted">Secondary guides and one screenshot transcription only. Version/platform unknown. No transition is in-game verified.</p>' +
      (srcBlock || '<p class="tiny muted">No source link recorded.</p>');

    document.getElementById('details-close').onclick = closeWithFocus;
    Array.prototype.forEach.call(el.querySelectorAll('[data-goto]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-goto');
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });
  }

  function closeWithFocus() {
    var last = state.selected;
    state = C.closeDetails(state);
    renderGraph();
    var b = last && document.querySelector('[data-node="' + last + '"]');
    if (b) b.focus();
  }

  /* ---------- history trail ---------- */
  function renderTrail() {
    var el = document.getElementById('trail');
    var items = C.trailFor(state, D);
    if (!items.length) {
      el.innerHTML = '<span class="empty">No node visited yet — click a box or jump to a chapter.</span>';
      return;
    }
    el.innerHTML = items.map(function (t) {
      return '<button data-trail="' + t.id + '" title="' + esc(t.chapterName + ' · ' + t.label) + '">' + esc(t.label) +
        '<small>' + esc(t.chapterName) + '</small></button>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('[data-trail]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-trail');
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });
  }

  /* ---------- search ---------- */
  function renderResults() {
    var el = document.getElementById('results');
    var q = state.query.trim().toLowerCase();
    if (!q) { closeResults(); return; }
    var hits = D.nodes.filter(function (n) {
      return (n.label + ' ' + (n.options || []).join(' ')).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 12);
    el.hidden = false;
    el.innerHTML = hits.length ? hits.map(function (n) {
      var chapter = chapters[n.chapter];
      return '<button data-hit="' + n.id + '">' + esc(n.label) + '<span class="r-kind">' + esc(chapter ? chapter.name : n.chapter) + '</span></button>';
    }).join('') : '<button disabled class="muted">No matching label</button>';
    Array.prototype.forEach.call(el.querySelectorAll('[data-hit]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-hit');
        var q2 = document.getElementById('q');
        q2.value = '';
        state = C.setQuery(state, '');
        closeResults();
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });
  }

  function closeResults() {
    var el = document.getElementById('results');
    if (el) { el.hidden = true; el.innerHTML = ''; }
  }

  /* ---------- camera ---------- */
  function updateTransform() {
    var w = document.getElementById('world');
    if (!w) return;
    w.style.transform = 'translate(' + cam.tx + 'px,' + cam.ty + 'px) scale(' + cam.scale + ')';
    document.getElementById('zoomLabel').textContent = Math.round(cam.scale * 100) + '%';
  }

  /* padTop is separate so a focused chapter frame clears the legend overlay. */
  function fitBox(box, pad, padTop) {
    var c = document.getElementById('canvas');
    if (!c) return;
    if (padTop == null) padTop = pad;
    cam.scale = Math.max(0.12, Math.min(1.15, (c.clientWidth - pad * 2) / box.w, (c.clientHeight - pad - padTop) / box.h));
    cam.tx = (c.clientWidth - box.w * cam.scale) / 2 - box.x * cam.scale;
    cam.ty = padTop + (c.clientHeight - padTop - box.h * cam.scale) / 2 - box.y * cam.scale;
    updateTransform();
  }

  function fitCurrent() {
    if (state.chapter === 'all') fitBox({ x: 0, y: 0, w: D.canvas.width, h: D.canvas.height }, 40);
    else fitBox(chapters[state.chapter].frame, 70, 170);
  }

  function centerOn(n) {
    var c = document.getElementById('canvas');
    cam.scale = Math.max(cam.scale, 0.85);
    cam.tx = c.clientWidth / 2 - (n.x + n.w / 2) * cam.scale;
    cam.ty = c.clientHeight / 2 - (n.y + n.h / 2) * cam.scale;
    updateTransform();
  }

  function zoomAt(factor, px, py) {
    var c = document.getElementById('canvas');
    if (px == null) px = c.clientWidth / 2;
    if (py == null) py = c.clientHeight / 2;
    var next = Math.max(0.12, Math.min(2.4, cam.scale * factor));
    cam.tx = px - (px - cam.tx) * (next / cam.scale);
    cam.ty = py - (py - cam.ty) * (next / cam.scale);
    cam.scale = next;
    updateTransform();
  }

  /* ---------- input ---------- */
  function setupCanvas() {
    var c = document.getElementById('canvas');
    var drag = null;
    c.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      drag = { x: e.clientX, y: e.clientY, tx: cam.tx, ty: cam.ty };
      c.setPointerCapture(e.pointerId);
      c.classList.add('dragging');
    });
    c.addEventListener('pointermove', function (e) {
      if (!drag) return;
      cam.tx = drag.tx + e.clientX - drag.x;
      cam.ty = drag.ty + e.clientY - drag.y;
      updateTransform();
    });
    c.addEventListener('pointerup', function () { drag = null; c.classList.remove('dragging'); });
    c.addEventListener('pointercancel', function () { drag = null; c.classList.remove('dragging'); });
    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = c.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
  }

  window.addEventListener('keydown', function (e) {
    if (!state.consented) return;
    var typing = e.target.matches && e.target.matches('input,textarea,[contenteditable]');
    if (e.key === 'Escape') {
      var res = document.getElementById('results');
      if (res && !res.hidden) { closeResults(); return; }
      if (state.selected) closeWithFocus();
      return;
    }
    if (typing) return;
    if (e.key === '+' || e.key === '=') zoomAt(1.2);
    if (e.key === '-') zoomAt(0.82);
    if (e.key === '0') fitCurrent();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var list = state.chapter === 'all' ? D.nodes : D.nodes.filter(function (n) { return n.chapter === state.chapter; });
      var idx = list.findIndex(function (n) { return n.id === state.selected; });
      var next = list[(idx + (e.key === 'ArrowRight' ? 1 : list.length - 1) + list.length) % list.length];
      commit(C.selectNode(state, next.id, D), { center: next.id, hash: true });
    }
  });

  window.addEventListener('hashchange', function () {
    if (!state.consented) return;
    var next = C.applyHash(state, location.hash, D);
    if (!C.sameTarget(next, state)) {
      state = next;
      renderGraph();
      fitCurrent();
    }
  });

  window.addEventListener('resize', function () { if (state.consented) fitCurrent(); });

  renderShell();
})();
