/* PoC4 — shared atlas renderer and interaction.
   Standalone classic script. Renders ATLAS data on one pannable/zoomable world
   canvas. Chapter regions, actual connectors, event boxes, node labels and
   real edge labels are all world-space children of that one surface. Zoom and
   pan change only the camera transform: labels are never swapped, hidden by
   scale, inversely scaled, or reflowed into a screen-space overlay. Text at a
   whole-map fit is naturally small and may be clipped by the viewport; panning
   and fit reveal the same complete chart.

   Chapter focus fits the real region on the same canvas. No aggregate causal
   edge or grouped pseudo-path is invented. */

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
  var lastTrigger = null;
  var resizeQueued = false;
  var CONSENT_KEY = 'ra9-atlas.consent.v1';

  var STATUS_LABEL = {
    ocr: 'Screenshot transcription · structure only',
    guide: 'Guide-reported · secondary sources',
    user: 'User-provided claim · page wording matches inspected guides',
    unresolved: 'Unresolved · hypothesis only',
    mixed: 'Mixed secondary evidence · see details',
    synthetic: 'Synthetic fixture · not evidence'
  };
  var KIND_LABEL = { action: 'Action', flag: 'State flag', choice: 'Choice', outcome: 'Outcome', stage: 'Stage container' };
  var EDGE_LABEL = { traced: 'traced', conditional: 'reported condition', prerequisite: 'prerequisite gate', hypothesis: 'unresolved hypothesis', uncertain: 'uncertain chart connector', withdrawn: 'withdrawn claim' };
  var SOURCE_LABEL = {
    steam: 'Steam chapter flowcharts (screenshot reference)',
    powerpyxHome: 'PowerPyx · A New Home',
    powerpyxStormy: 'PowerPyx · Stormy Night',
    gamerGuidesStormy: 'Gamer Guides · Stormy Night',
    gamefaqsStormy: 'GameFAQs · Stormy Night',
    gamefaqs: 'GameFAQs · A New Home',
    transcript: 'Fandom transcript · A New Home',
    powerpyxKara: 'PowerPyx · Battle for Detroit — Kara',
    fandomBattle: 'Fandom · Battle for Detroit',
    neoseekerKara: 'Neoseeker · Battle for Detroit — Kara',
    gamerGuides: 'Gamer Guides · Battle for Detroit — Kara',
    powerpyxHostage: 'PowerPyx · The Hostage / Opening',
    powerpyxPublicEnemy: 'PowerPyx · Public Enemy',
    gamefaqsPublicEnemy: 'GameFAQs/Mogg · Public Enemy'
  };

  var nodeChapter = {};
  D.nodes.forEach(function (n) { nodeChapter[n.id] = n.chapter; });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- evidence wording (never claims gameplay verification) ---------- */
  function edgeSources(e) {
    return (e.src || []).slice();
  }

  function edgeEvidence(e) {
    var a = byId[e.from], b = byId[e.to];
    var sources = edgeSources(e);
    if (e.kind === 'withdrawn') {
      return {
        cls: 'withdrawn',
        status: 'Withdrawn claim · historical record, not an active connector',
        unknown: 'This claim was withdrawn during source review. It is kept only as history with its original endpoints: it is not an active connector on the map, and it never was verified in game.',
        sources: sources
      };
    }
    if ((a && a.status === 'synthetic') || (b && b.status === 'synthetic')) {
      return {
        cls: 'synthetic',
        status: 'Synthetic fixture · not evidence',
        unknown: 'Everything about this connector is generated for the benchmark.',
        sources: sources
      };
    }
    if (e.kind === 'hypothesis') {
      return {
        cls: 'unresolved',
        status: 'UNRESOLVED hypothesis · not a confirmed causal link',
        unknown: 'Unknown: whether this state, a photo, or another action carries the later check. No in-game verification.',
        sources: sources
      };
    }
    if (e.kind === 'conditional') {
      return {
        cls: 'conditional',
        status: 'Reported condition · single-source or disputed',
        unknown: 'The condition is not verified in game and may be incomplete.',
        sources: sources
      };
    }
    if (e.kind === 'uncertain') {
      return {
        cls: 'uncertain',
        status: 'Uncertain chart connector · route or source not confidently traced',
        unknown: 'This connector is visible in the screenshot but its route, source or branch row is ambiguous. Structure only; no in-game verification.',
        sources: sources
      };
    }
    if (e.kind === 'prerequisite') {
      return {
        cls: 'prerequisite',
        status: 'Reported prerequisite · guide-supported',
        unknown: 'The exact access check is not verified in game.',
        sources: sources
      };
    }
    return {
      cls: 'traced',
      status: 'Traced connection · secondary or screenshot source',
      unknown: 'Structure only; this transition is not verified in game.',
      sources: sources
    };
  }

  function sourceSummary(keys) {
    if (!keys || !keys.length) return 'No connector-specific source link recorded.';
    var labels = keys.slice(0, 3).map(function (key) { return SOURCE_LABEL[key] || key; });
    return 'Sources: ' + labels.join(', ') + (keys.length > 3 ? ' +' + (keys.length - 3) : '');
  }

  function edgeSourceLinks(keys) {
    return (keys || []).map(function (key) {
      var url = D.refs[key];
      if (!url) return '';
      return '<a class="src-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
        esc(SOURCE_LABEL[key] || key) + ' ↗</a>';
    }).join('');
  }

  /* ---------- spoiler consent (remembered in this browser) ---------- */
  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY) === '1'; } catch (e) { return false; }
  }

  function writeConsent(value) {
    try {
      if (value) localStorage.setItem(CONSENT_KEY, '1');
      else localStorage.removeItem(CONSENT_KEY);
    } catch (e) { /* file:// or privacy settings may block storage; memory still works */ }
  }

  function coverHtml() {
    return '<div class="cover" id="spoiler-overlay" role="dialog" aria-modal="true" aria-labelledby="spoiler-title">' +
      '<div class="cover-box">' +
      '<div class="eyebrow">ra9-atlas · PoC4 · selected multi-chapter slice</div>' +
      '<h1 id="spoiler-title">Full spoilers ahead</h1>' +
      '<p>This map reveals choices and outcomes from <em>Detroit: Become Human</em>, including late-game Todd and Kara branches and a saved-cop meeting in Public Enemy.</p>' +
      '<p>Five selected chapter regions are shown: <strong>A New Home</strong>, <strong>Stormy Night</strong>, <strong>Battle for Detroit — Kara</strong>, <strong>The Hostage</strong> and one bounded <strong>Public Enemy</strong> meeting node. They are guide-based and screenshot-transcribed only; no transition is verified in game. Game version and platform are unknown.</p>' +
      '<button class="primary" id="consent">Reveal atlas map</button>' +
      '</div></div>';
  }

  function bindConsent() {
    var button = document.getElementById('consent');
    if (!button) return;
    button.onclick = function () {
      state = C.consent(state);
      writeConsent(true);
      applySpoilerLock(false);
      var all = document.querySelector('[data-chapter="all"]');
      if (all) all.focus();
    };
  }

  function applySpoilerLock(locked) {
    var shell = document.getElementById('atlas-shell');
    var cover = document.getElementById('spoiler-overlay');
    if (locked) {
      if (!cover && shell) {
        app.insertAdjacentHTML('beforeend', coverHtml());
        bindConsent();
      }
      if (shell) {
        shell.setAttribute('inert', '');
        shell.setAttribute('aria-hidden', 'true');
      }
      var button = document.getElementById('consent');
      if (button) button.focus();
    } else {
      if (cover) cover.remove();
      if (shell) {
        shell.removeAttribute('inert');
        shell.removeAttribute('aria-hidden');
      }
    }
  }

  /* ---------- orthogonal routing (mirrored by prototype/validate-atlas-data.js) ---------- */
  function pathFor(e) {
    if (e.points) return e.points.map(function (point, index) {
      return (index ? 'L ' : 'M ') + point[0] + ' ' + point[1];
    }).join(' ');
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
    D.edges.forEach(function (e) {
      if (!C.isActiveEdge(e)) return;
      if (e.from === id || e.to === id) { set[e.from] = 1; set[e.to] = 1; }
    });
    return set;
  }

  /* ---------- shell ---------- */
  function renderShell() {
    if (!hashApplied && location.hash) state = C.applyHash(state, location.hash, D);
    hashApplied = true;

    app.innerHTML =
      '<div class="app" id="atlas-shell">' +
        '<header class="top">' +
          '<div class="brand"><strong>' + esc(D.meta.title) + '</strong><span>' + esc(D.meta.poc) + ' · selected slice · not in-game verified</span></div>' +
          '<nav class="chapters" aria-label="Atlas regions">' +
            '<button class="chapter" data-chapter="all" aria-pressed="false">Whole atlas<small>' + D.chapters.length + ' chapters</small></button>' +
            D.chapters.map(function (c) {
              return '<button class="chapter" data-chapter="' + c.id + '" aria-pressed="false">' + esc(c.name) + '<small>' + esc(c.code) + '</small></button>';
            }).join('') +
          '</nav>' +
          '<div class="tools">' +
            '<div class="search"><input id="q" type="search" placeholder="Search labels…" aria-label="Search labels" autocomplete="off" aria-controls="results" aria-expanded="false"><div class="results" id="results" role="listbox" hidden></div></div>' +
            '<button class="tool" id="fit" title="Fit the whole story or the focused chapter">Fit</button>' +
            '<button class="tool" id="reset" title="Clear selection, search and return to the whole atlas">Reset</button>' +
            '<button class="tool" id="consent-reset" title="Show the spoiler warning again" aria-label="Show the spoiler warning again">Spoiler</button>' +
          '</div>' +
        '</header>' +
        '<div class="trailbar"><span class="trail-label">History</span><div class="trail" id="trail"></div></div>' +
        '<div class="workspace">' +
          '<main class="canvas-wrap" id="canvas" aria-label="Whole-story spatial map with chapter regions, events, node labels, edge labels and actual connectors">' +
            '<div class="world" id="world">' +
              '<div id="frames"></div>' +
              '<svg id="edges"><defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs></svg>' +
              '<div id="edge-labels"></div>' +
              '<div id="nodes"></div>' +
              '<svg id="markers"></svg>' +
            '</div>' +
            '<div class="legend" aria-label="Legend">' +
              '<div class="row"><i></i>traced connector</div>' +
              '<div class="row"><i class="dashdot"></i>reported condition</div>' +
              '<div class="row"><i class="dashed"></i>unresolved hypothesis</div>' +
              '<div class="row"><i class="uncertain"></i>uncertain chart connector</div>' +
              '<div class="row"><i class="gate-line"></i>prerequisite gate</div>' +
              '<div class="row"><span class="glyph">?</span>uncertain or unresolved marker</div>' +
            '</div>' +
            '<div class="status" id="status"></div>' +
            '<div class="zoom"><button class="tool" id="minus" aria-label="Zoom out">−</button><span id="zoomLabel"></span><button class="tool" id="plus" aria-label="Zoom in">+</button></div>' +
          '</main>' +
          '<aside class="details" id="details" hidden aria-label="Node details"></aside>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('[data-chapter]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-chapter');
        lastTrigger = b;
        commit(C.jumpChapter(state, id, D), { fit: true, hash: true });
        b.focus();
      };
    });
    document.getElementById('fit').onclick = fitCurrent;
    document.getElementById('reset').onclick = function () {
      state = C.reset(state);
      var q = document.getElementById('q'); if (q) q.value = '';
      closeResults();
      commit(state, { fit: true, hash: true });
      var all = document.querySelector('[data-chapter="all"]');
      if (all) all.focus();
    };
    document.getElementById('consent-reset').onclick = function () {
      writeConsent(false);
      state = C.revokeConsent(state);
      applySpoilerLock(true);
    };
    document.getElementById('minus').onclick = function () { zoomAt(0.82); };
    document.getElementById('plus').onclick = function () { zoomAt(1.22); };
    document.getElementById('q').oninput = function (ev) {
      state = C.setQuery(state, ev.target.value);
      renderResults();
    };
    document.getElementById('q').onkeydown = function (ev) {
      if (ev.key === 'Escape') {
        if (!document.getElementById('results').hidden) {
          closeResults();
          ev.preventDefault();
        }
        return;
      }
      if (ev.key === 'ArrowDown' && !document.getElementById('results').hidden) {
        var first = document.querySelector('#results button');
        if (first) { first.focus(); ev.preventDefault(); }
      }
    };
    setupCanvas();
    renderGraph();
    fitCurrent();
    if (state.selected && byId[state.selected]) centerOn(byId[state.selected]);
    applySpoilerLock(!state.consented);
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
    if (!world) return;
    world.style.width = D.canvas.width + 'px';
    world.style.height = D.canvas.height + 'px';

    document.getElementById('frames').innerHTML = D.chapters.map(function (c) {
      return '<section class="frame" data-chapter-frame="' + c.id + '" aria-label="' + esc(c.name) + ' region" style="left:' + c.frame.x + 'px;top:' + c.frame.y +
        'px;width:' + c.frame.w + 'px;height:' + c.frame.h + 'px">' +
        '<button class="frame-title" data-frame-label="' + c.id + '" data-region="' + c.id + '">' + esc(c.name) + '</button>' +
        '</section>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-frame-label]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute('data-frame-label');
        lastTrigger = b;
        commit(C.jumpChapter(state, id, D), { fit: true, hash: true });
      };
    });

    var svg = document.getElementById('edges');
    svg.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    svg.setAttribute('width', D.canvas.width);
    svg.setAttribute('height', D.canvas.height);

    var focus = state.selected ? neighbours(state.selected) : null;
    var paths = [], labelQueue = [], badgeQueue = [];
    D.edges.forEach(function (e, i) {
      if (!C.isActiveEdge(e)) return;
      var d = pathFor(e);
      var edgeFocused = state.edge === i;
      var active = edgeFocused || (state.selected && (e.from === state.selected || e.to === state.selected));
      var dim = focus && !active;
      var cross = nodeChapter[e.from] !== nodeChapter[e.to];
      paths.push('<path class="edge ' + e.kind + (cross ? ' cross' : '') + (active ? ' active' : '') + (edgeFocused ? ' focused' : '') + (dim ? ' dimmed' : '') +
        '" id="edge-' + i + '" data-edge="' + i + '"' + (e.id ? ' data-edge-id="' + esc(e.id) + '"' : '') +
        ' marker-end="url(#arrowhead)" d="' + d + '"></path>');
      if (e.label) labelQueue.push({ e: e, i: i, dim: dim });
      if (e.kind === 'hypothesis' || e.kind === 'uncertain') badgeQueue.push({ e: e, i: i, dim: dim });
    });
    svg.innerHTML = '<defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs>' + paths.join('');

    var labelHtml = labelQueue.map(function (L) {
      var pos = L.e.labelAt || pointAt(svg.querySelector('#edge-' + L.i), 0.5);
      return '<button class="edge-label ' + L.e.kind + (L.dim ? ' dimmed' : '') + '" data-edge-label="' + L.i + '"' +
        (L.e.id ? ' data-edge-id="' + esc(L.e.id) + '"' : '') +
        ' style="left:' + pos.x + 'px;top:' + pos.y + 'px" aria-label="Open actual connector from ' +
        esc(byId[L.e.from].label) + ' to ' + esc(byId[L.e.to].label) + '">' + esc(L.e.label) + '</button>';
    });
    document.getElementById('edge-labels').innerHTML = labelHtml.join('');
    Array.prototype.forEach.call(document.querySelectorAll('.edge-label[data-edge-label]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        focusEdgeFromMap(Number(b.getAttribute('data-edge-label')), b);
      };
    });

    var mk = document.getElementById('markers');
    mk.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    mk.setAttribute('width', D.canvas.width);
    mk.setAttribute('height', D.canvas.height);
    mk.innerHTML = badgeQueue.map(function (B) {
      var shape = '<circle class="badge-ring" r="8"></circle><text class="badge-text" text-anchor="middle" dy="3.5">?</text>';
      return '<g class="badge ' + B.e.kind + (B.dim ? ' dimmed' : '') + '" data-badge-edge="' + esc(B.e.id) + '">' + shape + '</g>';
    }).join('');
    var badgeNodes = mk.querySelectorAll('g');
    badgeQueue.forEach(function (B, idx) {
      var pos = B.e.labelAt || pointAt(svg.querySelector('#edge-' + B.i), 0.5);
      var dy = B.e.label ? -22 : 0;
      badgeNodes[idx].setAttribute('transform', 'translate(' + pos.x + ',' + (pos.y + dy) + ')');
    });

    document.getElementById('nodes').innerHTML = D.nodes.map(function (n) {
      var classes = ['node', n.kind];
      if (n.chapter === 'hostage') classes.push('hostage');
      if (n.kind === 'choice' && n.h <= 70) classes.push('compact');
      if (state.selected === n.id) classes.push('selected');
      var shownLabel = n.heading || n.label;
      var inner = '<span class="node-label" data-node-label="' + esc(n.id) + '">' + esc(shownLabel) + '</span>';
      if (n.kind === 'choice') {
        inner += n.options.map(function (o, i) {
          return '<span class="opt"><span class="from-option">option ' + (i + 1) + '</span>' + esc(o) + '</span>';
        }).join('');
      } else {
        inner += n.sub ? '<span class="sub">' + esc(n.sub) + '</span>' : '';
      }
      var aria = esc(n.label) + ' — ' + KIND_LABEL[n.kind] + ' — ' + (STATUS_LABEL[n.status] || 'status unknown');
      return '<button class="' + classes.join(' ') + '" data-node="' + n.id + '" data-kind="' + n.kind + '" style="left:' + n.x + 'px;top:' + n.y +
        'px;width:' + n.w + 'px;height:' + n.h + 'px" aria-label="' + aria + '">' + inner + '</button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-node]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute('data-node');
        lastTrigger = b;
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });

    var c = D.meta.counts;
    /* Withdrawn claims stay in the total edge count for their array indices,
       so the connector count counts only active connectors; the withdrawn
       records get their own number when the data reports one. */
    var connectorCount = c.activeEdges != null ? c.activeEdges : c.edges;
    document.getElementById('status').innerHTML =
      'Selected slice · ' + c.chapters + ' chapters · ' + c.nodes + ' nodes · ' + connectorCount +
      ' connectors' + (c.withdrawnEdges != null ? ' · ' + c.withdrawnEdges + ' withdrawn' : '') +
      ' · ' + c.crossChapterEdges + ' cross-chapter · not in-game verified';

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

  function focusEdgeFromMap(index, trigger) {
    lastTrigger = trigger;
    state = C.focusEdge(state, index, D);
    renderGraph();
    centerOn(byId[state.selected]);
    setHash();
    var close = document.getElementById('details-close');
    if (close) close.focus();
  }

  /* ---------- details ---------- */
  function renderDetails() {
    var el = document.getElementById('details');
    if (!state.selected) { el.hidden = true; el.innerHTML = ''; return; }
    var n = byId[state.selected];
    var d = D.detail[n.id] || {};
    var chapter = chapters[n.chapter];
    el.hidden = false;
    el.setAttribute('aria-label', 'Details for ' + n.label);

    var related = [];
    D.edges.forEach(function (e, i) {
      if (!C.isActiveEdge(e)) return;
      if (e.from === n.id || e.to === n.id) related.push({ edge: e, index: i });
    });
    var rows = related.map(function (item) {
      var e = item.edge;
      var outgoing = e.from === n.id;
      var other = byId[outgoing ? e.to : e.from];
      var dir = outgoing ? '→' : '←';
      var opt = outgoing && e.fromOption != null && n.options ? esc(n.options[e.fromOption]) + ' · ' : '';
      var label = e.label ? ' — ' + esc(e.label) : '';
      return '<button data-goto="' + other.id + '" data-edge="' + item.index + '"' +
        (state.edge === item.index ? ' class="focused"' : '') + '><span class="dir">' + dir + '</span>' + opt + esc(other.label) + label +
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

    var focused = state.edge != null ? D.edges[state.edge] : null;
    var edgeBlock = '';
    if (focused && focused.kind === 'withdrawn' && byId[focused.from] && byId[focused.to]) {
      /* Reached only through a legacy permalink that names the withdrawn
         edge index or id: the claim is shown with its original endpoints,
         its historical status, and the active replacements that superseded
         it. It never appears as a map connector. */
      var rev = edgeEvidence(focused);
      var replacements = (focused.replacedBy || []).map(function (replId) {
        var ri = C.resolveEdgeIndex(D, replId);
        if (ri == null) return '';
        var r = D.edges[ri];
        if (!C.isActiveEdge(r)) return '';
        var rOther = byId[r.to];
        if (!rOther) return '';
        return '<button data-open-edge="' + ri + '"' +
          (state.edge === ri ? ' class="focused"' : '') +
          '><span class="dir">' + (r.from === focused.to ? '←' : '→') + '</span>' +
          esc(rOther.label) + (r.label ? ' — ' + esc(r.label) : '') +
          '<span class="kind">' + esc(EDGE_LABEL[r.kind]) + '</span></button>';
      }).join('');
      edgeBlock = '<h3>Withdrawn claim (historical)</h3>' +
        '<div class="edge-evidence" data-edge-evidence="' + state.edge + '" data-evidence="' + rev.cls + '">' +
        '<p><strong>' + esc(byId[focused.from].label) + ' → ' + esc(byId[focused.to].label) + '</strong></p>' +
        '<p><span class="chip ' + rev.cls + '">' + esc(EDGE_LABEL[focused.kind]) + '</span> ' + esc(rev.status) + '</p>' +
        '<p class="note">' + esc(rev.unknown) + '</p>' +
        (focused.label ? '<p class="note tiny">Connector label: ' + esc(focused.label) + '</p>' : '') +
        (focused.note ? '<p class="note tiny">Evidence note: ' + esc(focused.note) + '</p>' : '') +
        (replacements ? '<p class="tiny muted">Withdrawn in favour of these active connectors:</p>' +
          '<div class="rowlist">' + replacements + '</div>' : '') +
        '<p class="tiny muted">' + esc(sourceSummary(rev.sources)) + '</p>' +
        edgeSourceLinks(rev.sources) +
        '</div>';
    } else if (focused && byId[focused.from] && byId[focused.to]) {
      var ev = edgeEvidence(focused);
      edgeBlock = '<h3>' + (nodeChapter[focused.from] !== nodeChapter[focused.to]
        ? 'Focused cross-chapter connector' : 'Focused connector') + '</h3>' +
        '<div class="edge-evidence" data-edge-evidence="' + state.edge + '" data-evidence="' + ev.cls + '">' +
        '<p><strong>' + esc(byId[focused.from].label) + ' → ' + esc(byId[focused.to].label) + '</strong></p>' +
        '<p><span class="chip ' + ev.cls + '">' + esc(EDGE_LABEL[focused.kind]) + '</span> ' + esc(ev.status) + '</p>' +
        '<p class="note">' + esc(ev.unknown) + '</p>' +
        (focused.label ? '<p class="note tiny">Connector label: ' + esc(focused.label) + '</p>' : '') +
        (focused.note ? '<p class="note tiny">Evidence note: ' + esc(focused.note) + '</p>' : '') +
        '<p class="tiny muted">' + esc(sourceSummary(ev.sources)) + '</p>' +
        edgeSourceLinks(ev.sources) +
        '</div>';
    }

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
      edgeBlock +
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
        lastTrigger = b;
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });
    /* Existing edge-focus path reused for replacement connectors: opening one
       jumps by its original ATLAS array index and selects its actual to node. */
    Array.prototype.forEach.call(el.querySelectorAll('[data-open-edge]'), function (b) {
      b.onclick = function () {
        focusEdgeFromMap(Number(b.getAttribute('data-open-edge')), b);
      };
    });
  }

  function closeWithFocus() {
    var last = state.selected;
    var triggerEdgeLabel = lastTrigger ? lastTrigger.getAttribute('data-edge-label') : null;
    state = C.closeDetails(state);
    renderGraph();
    var target = lastTrigger;
    var usable = target && target.isConnected && target.offsetParent !== null && !target.closest('[hidden]');
    if (usable) { target.focus(); return; }
    /* The world is rebuilt on close. Restore focus to the replacement real
       node or actual-edge label so Escape/X never leave focus on detached DOM. */
    requestAnimationFrame(function () {
      var replacement = null;
      if (triggerEdgeLabel != null) {
        replacement = document.querySelector('.edge-label[data-edge-label="' + triggerEdgeLabel + '"]');
      }
      if (!replacement && last) replacement = document.querySelector('[data-node="' + last + '"]');
      if (replacement && replacement.offsetParent !== null) replacement.focus();
    });
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
        lastTrigger = b;
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });
  }

  /* ---------- search ---------- */
  function renderResults() {
    var el = document.getElementById('results');
    var input = document.getElementById('q');
    var q = state.query.trim().toLowerCase();
    if (!q) { closeResults(); return; }
    var chapterHits = D.chapters.filter(function (c) {
      return (c.name + ' ' + c.code).toLowerCase().indexOf(q) !== -1;
    });
    var hits = D.nodes.filter(function (n) {
      return (n.label + ' ' + (n.options || []).join(' ')).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 12);
    var html = chapterHits.map(function (c) {
      return '<button data-hit-chapter="' + c.id + '" role="option">Chapter: ' + esc(c.name) +
        '<span class="r-kind">' + esc(c.code) + '</span></button>';
    }).concat(hits.map(function (n) {
      var chapter = chapters[n.chapter];
      return '<button data-hit="' + n.id + '" role="option">' + esc(n.label) +
        '<span class="r-kind">' + esc(chapter ? chapter.name : n.chapter) + '</span></button>';
    }));
    el.hidden = false;
    el.innerHTML = html.length ? html.join('') : '<button disabled class="muted">No matching label</button>';
    if (input) input.setAttribute('aria-expanded', 'true');
    Array.prototype.forEach.call(el.querySelectorAll('[data-hit]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-hit');
        clearSearch();
        lastTrigger = b;
        commit(C.selectNode(C.setQuery(state, ''), id, D), { center: id, hash: true });
      };
    });
    Array.prototype.forEach.call(el.querySelectorAll('[data-hit-chapter]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-hit-chapter');
        clearSearch();
        lastTrigger = b;
        commit(C.jumpChapter(C.setQuery(state, ''), id, D), { fit: true, hash: true });
      };
    });
    el.onkeydown = function (ev) {
      var buttons = Array.prototype.slice.call(el.querySelectorAll('button:not([disabled])'));
      var at = buttons.indexOf(document.activeElement);
      if (ev.key === 'Escape') {
        closeResults();
        if (input) input.focus();
        ev.preventDefault();
      } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        if (!buttons.length) return;
        var next = ev.key === 'ArrowDown' ? (at + 1 + buttons.length) % buttons.length : (at - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
        ev.preventDefault();
      }
    };
  }

  function clearSearch() {
    var q = document.getElementById('q');
    if (q) q.value = '';
    state = C.setQuery(state, '');
    closeResults();
  }

  function closeResults() {
    var el = document.getElementById('results');
    var input = document.getElementById('q');
    if (el) { el.hidden = true; el.innerHTML = ''; }
    if (input) input.setAttribute('aria-expanded', 'false');
  }

  /* ---------- camera ---------- */
  function updateTransform() {
    var w = document.getElementById('world');
    if (!w) return;
    w.style.transform = 'translate(' + cam.tx + 'px,' + cam.ty + 'px) scale(' + cam.scale + ')';
    var zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) zoomLabel.textContent = Math.round(cam.scale * 100) + '%';
  }

  function fitCurrent() {
    var c = document.getElementById('canvas');
    if (!c || !c.clientWidth || !c.clientHeight) return;
    var box, pad, padTop;
    if (state.chapter === 'all') {
      box = { x: 0, y: 0, w: D.canvas.width, h: D.canvas.height };
      pad = c.clientWidth < 600 ? 28 : 80;
      padTop = c.clientWidth < 600 ? 28 : 80;
    } else {
      box = chapters[state.chapter].frame;
      pad = 56;
      padTop = 110;
    }
    var fitted = C.fitBounds({ width: c.clientWidth, height: c.clientHeight }, box, pad, padTop);
    cam.scale = fitted.scale;
    cam.tx = fitted.tx;
    cam.ty = fitted.ty;
    updateTransform();
  }

  function centerOn(n) {
    var c = document.getElementById('canvas');
    if (!c) return;
    cam.scale = Math.max(cam.scale, 0.85);
    cam.scale = Math.min(cam.scale, 2.4);
    cam.tx = c.clientWidth / 2 - (n.x + n.w / 2) * cam.scale;
    cam.ty = c.clientHeight / 2 - (n.y + n.h / 2) * cam.scale;
    updateTransform();
  }

  function zoomAt(factor, px, py) {
    var c = document.getElementById('canvas');
    if (!c) return;
    if (px == null) px = c.clientWidth / 2;
    if (py == null) py = c.clientHeight / 2;
    var next = Math.max(C.MIN_SCALE, Math.min(2.4, cam.scale * factor));
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
      if (e.target.closest('button, a, input')) return;
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
    var typing = e.target.matches && e.target.matches('input,textarea,select,[contenteditable]');
    if (e.key === 'Escape') {
      var res = document.getElementById('results');
      if (res && !res.hidden) {
        closeResults();
        var q = document.getElementById('q');
        if (q) q.focus();
        return;
      }
      if (state.selected) closeWithFocus();
      return;
    }
    if (typing) return;
    if (e.key === '/') {
      var q2 = document.getElementById('q');
      if (q2) { q2.focus(); e.preventDefault(); }
      return;
    }
    if (e.key === '+' || e.key === '=') zoomAt(1.2);
    if (e.key === '-') zoomAt(0.82);
    if (e.key === '0') fitCurrent();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var list = state.chapter === 'all' ? D.nodes : D.nodes.filter(function (n) { return n.chapter === state.chapter; });
      var idx = list.findIndex(function (n) { return n.id === state.selected; });
      var next = list[(idx + (e.key === 'ArrowRight' ? 1 : list.length - 1) + list.length) % list.length];
      lastTrigger = null;
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
      if (state.selected && byId[state.selected]) centerOn(byId[state.selected]);
    }
  });

  window.addEventListener('resize', function () {
    if (!state.consented || resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(function () {
      resizeQueued = false;
      fitCurrent();
    });
  });

  if (readConsent()) state = C.consent(state);
  renderShell();
})();
