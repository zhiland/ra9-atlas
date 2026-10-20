/* PoC4 — shared atlas renderer and interaction.
   Standalone classic script. Renders ATLAS data on one pannable/zoomable world
   canvas. Chapter regions, actual connectors and event boxes stay on that same
   surface at every level of detail. A screen-legible annotation layer is
   inverse-scaled inside the world, so chapter names, event labels and actual
   cross-chapter labels remain readable without replacing the map with cards.

   Progressive disclosure:
     overview  — the whole-story spatial map: chapter regions and labels,
                 meaningful event labels from the data, and actual
                 cross-chapter connectors.
     structure — chapter/intermediate event map: event labels for the real
                 sample; labelled region/branch summaries for dense graphs.
     detail    — close scale: full event text inside boxes and connector labels.
   Zoom/pan changes the level automatically. Chapter focus fits the real region
   on the same canvas.

   No aggregate causal edge is invented. Dense summaries count real nodes and
   connectors grouped by their actual chapter; labels name actual nodes. */

(function () {
  'use strict';

  var C = ATLAS_CORE, D = ATLAS;
  var byId = {}, chapters = {}, chapterIndex = {};
  D.nodes.forEach(function (n) { byId[n.id] = n; });
  D.chapters.forEach(function (c, i) { chapters[c.id] = c; chapterIndex[c.id] = i; });

  var state = C.createState();
  var hashApplied = false;
  var cam = { scale: 1, tx: 0, ty: 0 };
  var app = document.getElementById('app');
  var lastTrigger = null;
  var focusedGroup = null;
  var lastLod = null;
  var resizeQueued = false;
  var labelQueued = false;
  var labelScale = null;
  var CONSENT_KEY = 'ra9-atlas.consent.v1';
  var DENSE_NODE_THRESHOLD = 120;
  var IS_DENSE = D.nodes.length > DENSE_NODE_THRESHOLD;
  /* Below this camera scale a chapter's node boxes are too small for readable
     in-box text; use compact labelled event chips and representative events. */
  var MAP_LABEL_MIN_SCALE = 0.5;
  /* Narrow screens should show readable in-box event labels and pan the same
     map rather than squeezing the whole graph into unreadable boxes. */
  var MIN_MOBILE_FOCUS_SCALE = 0.65;

  var STATUS_LABEL = {
    ocr: 'Screenshot transcription · structure only',
    guide: 'Guide-reported · secondary sources',
    user: 'User-provided claim · page wording matches inspected guides',
    unresolved: 'Unresolved · hypothesis only',
    mixed: 'Mixed secondary evidence · see details',
    synthetic: 'Synthetic fixture · not evidence'
  };
  var KIND_LABEL = { action: 'Action', flag: 'State flag', choice: 'Choice', outcome: 'Outcome' };
  var EDGE_LABEL = { traced: 'traced', conditional: 'reported condition', prerequisite: 'prerequisite gate', hypothesis: 'unresolved hypothesis' };
  var LOD_LABEL = { overview: 'story map', structure: 'event map', detail: 'close map' };
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

  /* Static data summaries, computed once. Degrees are observed from the real
     edge list; dense summaries never add an edge or a causal claim. */
  var CHAPTER_STATS = {};
  D.chapters.forEach(function (c) {
    CHAPTER_STATS[c.id] = {
      nodes: 0, internalEdges: 0, crossEdges: 0, branches: 0, joins: 0,
      entries: 0, terminals: 0, branchNodes: [], joinNodes: [], entryNodes: [],
      terminalNodes: [], crossNodes: {}
    };
  });
  var nodeChapter = {};
  D.nodes.forEach(function (n) {
    nodeChapter[n.id] = n.chapter;
    if (CHAPTER_STATS[n.chapter]) CHAPTER_STATS[n.chapter].nodes++;
  });
  var ALL_IN = {}, ALL_OUT = {}, INTERNAL_IN = {}, INTERNAL_OUT = {};
  D.nodes.forEach(function (n) { ALL_IN[n.id] = 0; ALL_OUT[n.id] = 0; INTERNAL_IN[n.id] = 0; INTERNAL_OUT[n.id] = 0; });
  D.edges.forEach(function (e) {
    var a = nodeChapter[e.from], b = nodeChapter[e.to];
    if (!a || !b) return;
    ALL_OUT[e.from] = (ALL_OUT[e.from] || 0) + 1;
    ALL_IN[e.to] = (ALL_IN[e.to] || 0) + 1;
    if (a === b) {
      if (CHAPTER_STATS[a]) {
        CHAPTER_STATS[a].internalEdges++;
        INTERNAL_OUT[e.from] = (INTERNAL_OUT[e.from] || 0) + 1;
        INTERNAL_IN[e.to] = (INTERNAL_IN[e.to] || 0) + 1;
      }
    } else {
      if (CHAPTER_STATS[a]) {
        CHAPTER_STATS[a].crossEdges++;
        CHAPTER_STATS[a].crossNodes[e.from] = true;
      }
      if (CHAPTER_STATS[b]) {
        CHAPTER_STATS[b].crossEdges++;
        CHAPTER_STATS[b].crossNodes[e.to] = true;
      }
    }
  });
  D.nodes.forEach(function (n) {
    var m = CHAPTER_STATS[n.chapter];
    if (!m) return;
    if ((INTERNAL_OUT[n.id] || 0) > 1) { m.branches++; m.branchNodes.push(n); }
    if ((INTERNAL_IN[n.id] || 0) > 1) { m.joins++; m.joinNodes.push(n); }
    if ((INTERNAL_IN[n.id] || 0) === 0) { m.entries++; m.entryNodes.push(n); }
    if ((INTERNAL_OUT[n.id] || 0) === 0) { m.terminals++; m.terminalNodes.push(n); }
  });
  Object.keys(CHAPTER_STATS).forEach(function (id) {
    var m = CHAPTER_STATS[id];
    m.branchNodes.sort(function (a, b) { return (ALL_OUT[b.id] || 0) - (ALL_OUT[a.id] || 0); });
    m.joinNodes.sort(function (a, b) { return (ALL_IN[b.id] || 0) - (ALL_IN[a.id] || 0); });
  });
  var CROSS_EDGES = [];
  D.edges.forEach(function (edge, index) {
    if (nodeChapter[edge.from] !== nodeChapter[edge.to]) CROSS_EDGES.push({ index: index, edge: edge });
  });

  /* Dense maps have hundreds of real cross-region connectors. Label one
     representative actual edge per chapter pair, and state the real count and
     kinds in that group. The paths themselves all remain mounted and visible;
     this prevents 150 connector labels from covering the regions. */
  var DENSE_CROSS_GROUPS = [];
  if (IS_DENSE) {
    var denseCrossByPair = {};
    CROSS_EDGES.forEach(function (item) {
      var a = nodeChapter[item.edge.from], b = nodeChapter[item.edge.to];
      var key = a + '>' + b;
      var group = denseCrossByPair[key];
      if (!group) {
        group = denseCrossByPair[key] = {
          from: a, to: b, count: 0, kinds: {}, representative: item.index, edge: item.edge, members: []
        };
      }
      group.count++;
      group.members.push(item.index);
      group.kinds[item.edge.kind] = (group.kinds[item.edge.kind] || 0) + 1;
    });
    DENSE_CROSS_GROUPS = Object.keys(denseCrossByPair).map(function (key) {
      return denseCrossByPair[key];
    }).sort(function (a, b) { return b.count - a.count || a.representative - b.representative; });
  }

  function denseCrossSummary(group) {
    var kinds = Object.keys(group.kinds).sort().map(function (kind) {
      return group.kinds[kind] + ' ' + (EDGE_LABEL[kind] || kind);
    });
    return group.count + ' actual · ' + kinds.join(', ');
  }

  function denseCrossMapText(group) {
    return group.count + ' cross-chapter connectors';
  }

  function denseCrossSummaryCompact(group) {
    var kinds = Object.keys(group.kinds).sort(function (a, b) {
      return group.kinds[b] - group.kinds[a];
    });
    var label = EDGE_LABEL[kinds[0]] || kinds[0];
    return group.count + ' actual · ' + label + (kinds.length > 1 ? ' + ' + (kinds.length - 1) + ' kinds' : '');
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- evidence wording (never claims gameplay verification) ---------- */
  function sourcesFor(node) {
    var detail = node ? (D.detail[node.id] || {}) : {};
    return (detail.src || (node && node.src) || []).slice();
  }

  function edgeSources(e) {
    return (e.src || []).slice();
  }

  function edgeEvidence(e) {
    var a = byId[e.from], b = byId[e.to];
    var sources = edgeSources(e);
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
      '<p>This map reveals choices and outcomes from <em>Detroit: Become Human</em>, including a late-game Todd and Kara branch.</p>' +
      '<p>Three selected chapter regions are shown: <strong>A New Home</strong>, <strong>Stormy Night</strong> and <strong>Battle for Detroit — Kara</strong>. They are guide-based and screenshot-transcribed only; no transition is verified in game. Game version and platform are unknown.</p>' +
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
          '<main class="canvas-wrap" id="canvas" data-lod="overview" aria-label="Whole-story spatial map with chapter regions, events and actual connectors">' +
            '<div class="world" id="world">' +
              '<div id="frames"></div>' +
              '<svg id="edges"><defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs></svg>' +
              '<svg id="aggregate-edges" aria-hidden="true"></svg>' +
              '<svg id="node-dots" aria-hidden="true"></svg>' +
              '<div id="labels"></div>' +
              '<div id="nodes"></div>' +
              '<svg id="markers"></svg>' +
              '<svg id="label-leaders" aria-hidden="true"></svg>' +
              '<div id="map-labels"></div>' +
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
            '<span class="sr-only" id="lodStatus" aria-live="polite"></span>' +
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
    focusedGroup = null;
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
        'px;width:' + c.frame.w + 'px;height:' + c.frame.h + 'px"></section>';
    }).join('');

    var svg = document.getElementById('edges');
    svg.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    svg.setAttribute('width', D.canvas.width);
    svg.setAttribute('height', D.canvas.height);
    var aggregateSvg = document.getElementById('aggregate-edges');
    aggregateSvg.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    aggregateSvg.setAttribute('width', D.canvas.width);
    aggregateSvg.setAttribute('height', D.canvas.height);

    var focus = state.selected ? neighbours(state.selected) : null;
    var paths = [], labelQueue = [], badgeQueue = [];
    D.edges.forEach(function (e, i) {
      var d = pathFor(e);
      var edgeFocused = state.edge === i;
      var active = edgeFocused || (state.selected && (e.from === state.selected || e.to === state.selected));
      var dim = focus && !active;
      var cross = nodeChapter[e.from] !== nodeChapter[e.to];
      paths.push('<path class="edge ' + e.kind + (cross ? ' cross' : '') + (active ? ' active' : '') + (edgeFocused ? ' focused' : '') + (dim ? ' dimmed' : '') +
        '" id="edge-' + i + '" data-edge="' + i + '" marker-end="url(#arrowhead)" d="' + d + '"></path>');
      if (e.label) labelQueue.push({ e: e, i: i, dim: dim });
      if (e.kind === 'hypothesis') badgeQueue.push({ e: e, i: i, dim: dim });
    });
    svg.innerHTML = '<defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs>' + paths.join('');

    var labelHtml = labelQueue.map(function (L) {
      var pos = L.e.labelAt || pointAt(svg.querySelector('#edge-' + L.i), 0.5);
      return '<div class="edge-label ' + L.e.kind + (L.dim ? ' dimmed' : '') + '" data-edge-label="' + L.i + '" style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
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

    var leaders = document.getElementById('label-leaders');
    leaders.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
    leaders.setAttribute('width', D.canvas.width);
    leaders.setAttribute('height', D.canvas.height);

    document.getElementById('nodes').innerHTML = D.nodes.map(function (n) {
      var classes = ['node', n.kind];
      if (state.selected === n.id) classes.push('selected');
      var inner;
      var shortLabel = '<span class="short">' + esc(n.short || n.label) + '</span>';
      if (n.kind === 'choice') {
        inner = shortLabel + n.options.map(function (o, i) {
          return '<span class="opt"><span class="from-option">option ' + (i + 1) + '</span>' + esc(o) + '</span>';
        }).join('');
      } else {
        inner = '<span class="k">' + KIND_LABEL[n.kind] + '</span>' + shortLabel +
          '<span class="label">' + esc(n.label) + '</span>' +
          (n.sub ? '<span class="sub">' + esc(n.sub) + '</span>' : '');
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
    document.getElementById('status').innerHTML =
      'Selected slice · ' + c.chapters + ' chapters · ' + c.nodes + ' events · ' + c.edges +
      ' connectors · ' + c.crossChapterEdges + ' cross-chapter · not in-game verified';

    document.querySelectorAll('[data-chapter]').forEach(function (b) {
      var on = b.getAttribute('data-chapter') === state.chapter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    renderTrail();
    renderDetails();
    updateTransform();
    scheduleMapLabels();
  }

  function pointAt(path, t) {
    var len = path.getTotalLength();
    return path.getPointAtLength(len * t);
  }

  /* ---------- map label annotation layer ---------- */
  function frameScreenRect(frame) {
    return {
      left: cam.tx + frame.x * cam.scale,
      top: cam.ty + frame.y * cam.scale,
      width: frame.w * cam.scale,
      height: frame.h * cam.scale,
      right: cam.tx + (frame.x + frame.w) * cam.scale,
      bottom: cam.ty + (frame.y + frame.h) * cam.scale
    };
  }

  function nodeScreenRect(n) {
    return {
      left: cam.tx + n.x * cam.scale,
      top: cam.ty + n.y * cam.scale,
      width: n.w * cam.scale,
      height: n.h * cam.scale,
      right: cam.tx + (n.x + n.w) * cam.scale,
      bottom: cam.ty + (n.y + n.h) * cam.scale
    };
  }

  function worldToScreen(x, y) {
    return { x: cam.tx + x * cam.scale, y: cam.ty + y * cam.scale };
  }

  function intersects(a, b) {
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  function insideCanvas(r, width, height, margin) {
    var m = margin == null ? 3 : margin;
    return r.left >= m && r.top >= m && r.right <= width - m && r.bottom <= height - m;
  }

  function overlapArea(r, others, pad) {
    var p = pad == null ? 2 : pad;
    var area = 0;
    for (var i = 0; i < others.length; i++) {
      var o = others[i];
      var w = Math.min(r.right, o.right + p) - Math.max(r.left, o.left - p);
      var h = Math.min(r.bottom, o.bottom + p) - Math.max(r.top, o.top - p);
      if (w > 0 && h > 0) area += w * h;
    }
    return area;
  }

  function uniqueNodes(list) {
    var seen = {}, out = [];
    list.forEach(function (n) {
      if (n && !seen[n.id]) { seen[n.id] = 1; out.push(n); }
    });
    return out;
  }

  function nodesOfChapter(chapterId) {
    return D.nodes.filter(function (n) { return n.chapter === chapterId; });
  }

  /* Overview labels favour the nodes that carry the story's actual shape:
     cross-chapter endpoints, choices/flags, reported joins, then entries and
     outcomes. This is a presentation subset, not a claim that other nodes are
     absent. */
  function overviewKeyNodes(chapterId, limit) {
    var m = CHAPTER_STATS[chapterId];
    if (!m) return [];
    var chapterNodes = nodesOfChapter(chapterId);
    var cross = chapterNodes.filter(function (n) { return m.crossNodes[n.id]; });
    var marked = chapterNodes.filter(function (n) { return n.kind === 'choice' || n.kind === 'flag'; });
    var joins = chapterNodes.filter(function (n) { return (ALL_IN[n.id] || 0) > 1; });
    var branches = chapterNodes.filter(function (n) { return (ALL_OUT[n.id] || 0) > 1; });
    return uniqueNodes(cross.concat(marked, joins, branches, m.entryNodes, m.terminalNodes)).slice(0, limit);
  }

  function structureKeyNodes(chapterId, limit) {
    var m = CHAPTER_STATS[chapterId];
    if (!m) return [];
    var chapterNodes = nodesOfChapter(chapterId);
    var cross = chapterNodes.filter(function (n) { return m.crossNodes[n.id]; });
    var branches = chapterNodes.filter(function (n) { return (ALL_OUT[n.id] || 0) > 1; });
    var joins = chapterNodes.filter(function (n) { return (ALL_IN[n.id] || 0) > 1; });
    var marked = chapterNodes.filter(function (n) { return n.kind === 'choice' || n.kind === 'flag'; });
    return uniqueNodes(cross.concat(branches, joins, marked, m.entryNodes, m.terminalNodes)).slice(0, limit);
  }

  function eventLabelText(n, compact) {
    if (compact) return n.short || n.label;
    return n.label;
  }

  function regionStatsText(chapterId, compact) {
    var m = CHAPTER_STATS[chapterId];
    if (!m) return '';
    if (compact) return m.nodes + ' events';
    return m.nodes + ' events · ' + (m.internalEdges + m.crossEdges) + ' connectors';
  }

  function scheduleMapLabels() {
    if (labelQueued) return;
    labelQueued = true;
    requestAnimationFrame(function () {
      labelQueued = false;
      renderMapLabels();
    });
  }

  function makeSpec(type, html, attrs, extra) {
    var spec = { type: type, html: html, attrs: attrs || {}, priority: 0 };
    if (extra) Object.keys(extra).forEach(function (k) { spec[k] = extra[k]; });
    return spec;
  }

  function attrString(attrs) {
    return Object.keys(attrs).map(function (k) {
      return ' ' + k + '="' + esc(attrs[k]) + '"';
    }).join('');
  }

  function renderMapLabels() {
    var host = document.getElementById('map-labels');
    var canvas = document.getElementById('canvas');
    var leaders = document.getElementById('label-leaders');
    if (!host || !canvas) return;
    var width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;

    var lod = C.lodFor(cam.scale, state.chapter);
    var compact = width < 600;
    var specs = [];
    var aggregatePathParts = [];
    var visibleFrames = D.chapters.filter(function (c) {
      return intersects(frameScreenRect(c.frame), { left: 0, top: 0, right: width, bottom: height });
    });
    var compactRegion = width < 600;

    visibleFrames.forEach(function (chapter) {
      var stats = regionStatsText(chapter.id, compactRegion && IS_DENSE);
      specs.push(makeSpec('region',
        '<strong>' + esc(chapter.name) + '</strong>' + ((!compactRegion || IS_DENSE) ? '<span>' + esc(stats) + '</span>' : ''),
        {
          'class': 'map-label region-label',
          'data-region': chapter.id,
          'data-full-label': chapter.name,
          'aria-label': 'Open ' + chapter.name + ' chapter'
        },
        { chapter: chapter.id }));
    });

    /* Event marks and readable labels belong to the map at every scale. The
       real 18-node sample keeps every event box labeled at desktop overview and
       chapter fit. Dense fixtures disclose named representatives until zoom. */
    var dotParts = [];
    var compactEvents = IS_DENSE || (state.chapter === 'all' && cam.scale < MAP_LABEL_MIN_SCALE);
    D.chapters.forEach(function (chapter) {
      if (state.chapter !== 'all' && state.chapter !== chapter.id) return;
      var candidates;
      if (IS_DENSE && lod !== 'detail') {
        candidates = lod === 'overview'
          ? overviewKeyNodes(chapter.id, compact ? 1 : 2)
          : structureKeyNodes(chapter.id, 4);
      } else if (!IS_DENSE && state.chapter === 'all' && cam.scale < MAP_LABEL_MIN_SCALE) {
        candidates = overviewKeyNodes(chapter.id, compact ? 1 : 2);
      } else {
        candidates = nodesOfChapter(chapter.id);
      }
      candidates.forEach(function (node) {
        var shortText = eventLabelText(node, compactEvents);
        var mode = compactEvents ? 'compact' : 'in-box';
        specs.push(makeSpec('event', esc(shortText), {
          'class': 'map-label event-label event-box' + (compactEvents ? ' compact' : '') + (state.selected === node.id ? ' selected' : ''),
          'data-event-node': node.id,
          'data-label-mode': mode,
          'data-full-label': node.label,
          'aria-label': 'Open ' + node.label + ' event'
        }, {
          node: node,
          overlay: compactEvents ? 'compact' : 'in-box',
          priority: 1
        }));
        if (compactEvents) {
          dotParts.push('<circle data-node-dot="' + esc(node.id) + '" cx="' + (node.x + node.w / 2) + '" cy="' + (node.y + node.h / 2) + '" r="5"></circle>');
        }
      });
    });
    var dots = document.getElementById('node-dots');
    if (dots) {
      dots.setAttribute('viewBox', '0 0 ' + D.canvas.width + ' ' + D.canvas.height);
      dots.setAttribute('width', D.canvas.width);
      dots.setAttribute('height', D.canvas.height);
      dots.innerHTML = dotParts.join('');
    }

    if (IS_DENSE) {
      visibleFrames.forEach(function (chapter) {
        var m = CHAPTER_STATS[chapter.id];
        if (!m) return;
        /* On a narrow story map the compact chapter label already carries the
           event count. The full count strip returns at chapter fit, where there
           is room for a real region summary. */
        if (compactRegion && lod === 'overview') return;
        var summary = m.branches + ' branches · ' + m.joins + ' joins · ' +
          m.entries + ' entries · ' + m.terminals + ' exits · ' +
          m.nodes + ' events · ' + (m.internalEdges + m.crossEdges) + ' connectors';
        specs.push(makeSpec('region-summary', esc(summary), {
          'class': 'map-label region-summary',
          'data-region-summary': chapter.id,
          'data-full-label': summary
        }, { chapter: chapter.id }));

        if (lod === 'structure' && (state.chapter === 'all' || state.chapter === chapter.id) && m.branchNodes.length) {
          var branches = m.branchNodes.slice(0, 2).map(function (n) {
            return n.label + ' (' + (ALL_OUT[n.id] || 0) + ' paths)';
          });
          var branchText = 'Branch points: ' + branches.join(' · ') +
            (m.branches > branches.length ? ' · ' + m.branches + ' total' : '');
          specs.push(makeSpec('branch-summary', esc(branchText), {
            'class': 'map-label branch-summary',
            'data-branch-summary': chapter.id,
            'data-full-label': branchText
          }, { chapter: chapter.id }));
        }
      });
    }

    if (lod === 'overview' || lod === 'structure') {
      if (IS_DENSE) {
        var denseGroups = DENSE_CROSS_GROUPS.filter(function (group) {
          return state.chapter === 'all' || group.from === state.chapter || group.to === state.chapter;
        });
        if (compact) denseGroups = denseGroups.slice(0, 3);
        var parallelGroups = {};
        denseGroups.forEach(function (group) {
          var fromChapter = chapters[group.from], toChapter = chapters[group.to];
          if (!fromChapter || !toChapter) return;
          var fromFrame = fromChapter.frame, toFrame = toChapter.frame;
          var fromScreen = frameScreenRect(fromFrame), toScreen = frameScreenRect(toFrame);
          if (!intersects(fromScreen, { left: 0, top: 0, right: width, bottom: height }) ||
              !intersects(toScreen, { left: 0, top: 0, right: width, bottom: height })) return;
          var a = { x: fromFrame.x + fromFrame.w / 2, y: fromFrame.y + fromFrame.h / 2 };
          var b = { x: toFrame.x + toFrame.w / 2, y: toFrame.y + toFrame.h / 2 };
          var dx = b.x - a.x, dy = b.y - a.y;
          var length = Math.sqrt(dx * dx + dy * dy) || 1;
          var ux = dx / length, uy = dy / length;
          var startT = Math.min((fromFrame.w / 2) / Math.max(Math.abs(ux), 0.0001), (fromFrame.h / 2) / Math.max(Math.abs(uy), 0.0001));
          var endT = Math.min((toFrame.w / 2) / Math.max(Math.abs(ux), 0.0001), (toFrame.h / 2) / Math.max(Math.abs(uy), 0.0001));
          var start = { x: a.x + ux * startT, y: a.y + uy * startT };
          var end = { x: b.x - ux * endT, y: b.y - uy * endT };
          var pair = [group.from, group.to].sort().join('>');
          var laneIndex = parallelGroups[pair] || 0;
          parallelGroups[pair] = laneIndex + 1;
          var direction = group.from < group.to ? 1 : -1;
          var lane = laneIndex ? direction * (12 + laneIndex * 8) : 0;
          var px = -uy * lane, py = ux * lane;
          var c1 = { x: start.x + (end.x - start.x) / 3 + px, y: start.y + (end.y - start.y) / 3 + py };
          var c2 = { x: start.x + 2 * (end.x - start.x) / 3 + px, y: start.y + 2 * (end.y - start.y) / 3 + py };
          var pathD = 'M ' + start.x + ' ' + start.y + ' C ' + c1.x + ' ' + c1.y + ' ' + c2.x + ' ' + c2.y + ' ' + end.x + ' ' + end.y;
          var t = 0.5, mt = 1 - t;
          var middle = {
            x: mt * mt * mt * start.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * end.x,
            y: mt * mt * mt * start.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * end.y
          };
          var groupKey = group.from + '>' + group.to;
          aggregatePathParts.push('<path class="aggregate-edge" data-cross-group="' + esc(groupKey) +
            '" data-from-region="' + esc(group.from) + '" data-to-region="' + esc(group.to) +
            '" data-member-count="' + group.count + '" data-start-x="' + start.x + '" data-start-y="' + start.y +
            '" data-end-x="' + end.x + '" data-end-y="' + end.y + '" d="' + pathD + '"></path>');
          var e = group.edge;
          var pos = middle;
          var screen = worldToScreen(pos.x, pos.y);
          if (screen.x < -40 || screen.x > width + 40 || screen.y < -20 || screen.y > height + 20) return;
          var summary = denseCrossMapText(group);
          var fromName = chapters[group.from] ? chapters[group.from].name : group.from;
          var toName = chapters[group.to] ? chapters[group.to].name : group.to;
          specs.push(makeSpec('cross', esc(summary), {
            'class': 'map-label cross-label aggregate ' + e.kind,
            'data-edge': String(group.representative),
            'data-cross-group': group.from + '>' + group.to,
            'data-full-label': group.count + ' actual cross-chapter connectors from ' + fromName + ' to ' + toName + ' · ' + denseCrossSummary(group),
            'title': group.count + ' actual cross-chapter connectors · ' + denseCrossSummary(group) + ' · open the group to inspect every connector',
            'aria-label': 'Inspect all ' + group.count + ' cross-chapter connectors from ' + fromName + ' to ' + toName + '; ' + denseCrossSummary(group)
          }, {
            anchor: screen,
            edgeIndex: group.representative,
            priority: 2
          }));
        });
      } else {
        CROSS_EDGES.forEach(function (item) {
          var e = item.edge;
          var pos = e.labelAt || pointAt(document.querySelector('#edge-' + item.index), 0.5);
          var screen = worldToScreen(pos.x, pos.y);
          if (screen.x < -40 || screen.x > width + 40 || screen.y < -20 || screen.y > height + 20) return;
          var kind = e.kind === 'hypothesis' ? 'UNRESOLVED hypothesis' : (e.kind === 'prerequisite' ? 'prerequisite gate' : EDGE_LABEL[e.kind] || e.kind);
          specs.push(makeSpec('cross', esc(kind), {
            'class': 'map-label cross-label ' + e.kind,
            'data-edge': String(item.index),
            'data-full-label': e.label || kind,
            'aria-label': 'Open actual ' + (EDGE_LABEL[e.kind] || e.kind) + ' connector from ' + byId[e.from].label + ' to ' + byId[e.to].label
          }, {
            anchor: screen,
            edgeIndex: item.index,
            priority: 2
          }));
        });
      }
    }

    var aggregateSvg = document.getElementById('aggregate-edges');
    if (aggregateSvg) aggregateSvg.innerHTML = aggregatePathParts.join('');

    var inv = 1 / cam.scale;
    host.style.setProperty('--inv', String(inv));
    host.innerHTML = '';
    specs.forEach(function (spec, i) {
      var tag = spec.type === 'region' || spec.type === 'event' || spec.type === 'cross' ? 'button' : 'div';
      spec.attrs['data-label-index'] = String(i);
      var html = '<' + tag + attrString(spec.attrs) + '>' + spec.html + '</' + tag + '>';
      host.insertAdjacentHTML('beforeend', html);
    });

    var els = Array.prototype.slice.call(host.querySelectorAll('[data-label-index]'));
    var sizes = els.map(function (el) { return { w: el.offsetWidth, h: el.offsetHeight }; });
    var occupied = [];

    function placeBox(spec, el, size, desired, reserve, pad) {
      var r = {
        left: desired.left,
        top: desired.top,
        right: desired.left + size.w,
        bottom: desired.top + size.h,
        width: size.w,
        height: size.h
      };
      if (reserve) occupied.push(r);
      el.style.left = ((r.left - cam.tx) / cam.scale) + 'px';
      el.style.top = ((r.top - cam.ty) / cam.scale) + 'px';
      return r;
    }

    /* Region headings and their summaries are not floating callouts: keep each
       one near its frame, but step it down until it clears the labels already
       placed. If the viewport is genuinely too small, hide it rather than
       stacking unreadable text over another region. */
    function placeReserved(el, size, desired, maxSteps) {
      var steps = maxSteps == null ? 7 : maxSteps;
      var baseLeft = Math.max(4, Math.min(width - size.w - 4, desired.left));
      var baseTop = Math.max(4, Math.min(height - size.h - 4, desired.top));
      for (var k = 0; k <= steps; k++) {
        var tops = [baseTop + k * (size.h + 4), baseTop - k * (size.h + 4)];
        for (var t = 0; t < tops.length; t++) {
          var cand = { left: baseLeft, top: tops[t] };
          var rect = {
            left: cand.left, top: cand.top, right: cand.left + size.w,
            bottom: cand.top + size.h, width: size.w, height: size.h
          };
          if (insideCanvas(rect, width, height, 4) && overlapArea(rect, occupied, 2) === 0) {
            return placeBox(null, el, size, cand, true);
          }
        }
      }
      el.style.display = 'none';
      return null;
    }

    var regionRects = {};
    var leaderParts = [];
    specs.forEach(function (spec, i) {
      if (spec.type !== 'region' && spec.type !== 'region-summary' && spec.type !== 'branch-summary') return;
      var el = els[i], size = sizes[i];
      if (spec.type === 'region') {
        var fr = frameScreenRect(chapters[spec.chapter].frame);
        el.style.maxWidth = (width < 600
          ? Math.max(60, fr.width - 4)
          : Math.max(112, Math.min(340, fr.width - 10))) + 'px';
        size = { w: el.offsetWidth, h: el.offsetHeight };
        var rect = placeReserved(el, size, { left: fr.left + 7, top: fr.top + 6 });
        if (rect) regionRects[spec.chapter] = rect;
      }
    });

    /* Region summaries sit under their region heading, then branch summaries
       under those. Both are anchored to the real frame, not a report column. */
    var regionExtra = {};
    specs.forEach(function (spec, i) {
      if (spec.type !== 'region-summary') return;
      var el = els[i], size = sizes[i];
      var anchor = regionRects[spec.chapter];
      if (!anchor) { el.style.display = 'none'; return; }
      el.style.maxWidth = Math.max(150, Math.min(360, frameScreenRect(chapters[spec.chapter].frame).width - 10)) + 'px';
      size = { w: el.offsetWidth, h: el.offsetHeight };
      var rect = placeReserved(el, size, { left: anchor.left, top: anchor.bottom + 4 });
      if (rect) regionExtra[spec.chapter] = rect;
    });
    specs.forEach(function (spec, i) {
      if (spec.type !== 'branch-summary') return;
      var el = els[i], size = sizes[i];
      var anchor = regionExtra[spec.chapter] || regionRects[spec.chapter];
      if (!anchor) { el.style.display = 'none'; return; }
      el.style.maxWidth = Math.max(150, Math.min(360, frameScreenRect(chapters[spec.chapter].frame).width - 10)) + 'px';
      size = { w: el.offsetWidth, h: el.offsetHeight };
      placeReserved(el, size, { left: anchor.left, top: anchor.bottom + 4 });
    });

    /* Event labels are the event boxes now: for sparse chapter/intermediate
       views each overlay is sized over the real node footprint and contains its
       wrapped short label. At whole-story scale (and for dense data) the
       overlay is a compact labelled chip; unlabeled node rectangles stay
       hidden rather than appearing as anonymous boxes. */
    function placeEventBox(spec, i) {
      var el = els[i], size = sizes[i];
      var nr = nodeScreenRect(spec.node);
      var maxW = Math.max(90, Math.min(220, width - 12));
      el.style.maxWidth = maxW + 'px';
      el.style.width = 'auto';
      el.style.minHeight = '';
      var naturalW = el.offsetWidth;
      var boxW = spec.overlay === 'in-box'
        ? Math.max(nr.width, Math.min(maxW, naturalW + 2))
        : Math.min(190, Math.max(84, naturalW + 2));
      el.style.width = Math.round(boxW) + 'px';
      var naturalH = el.offsetHeight;
      var boxH = spec.overlay === 'in-box' ? Math.max(nr.height, naturalH) : naturalH;
      if (boxH > naturalH) el.style.minHeight = Math.round(boxH) + 'px';
      size = { w: el.offsetWidth, h: el.offsetHeight };

      var centered = {
        left: nr.left + nr.width / 2 - size.w / 2,
        top: nr.top + nr.height / 2 - size.h / 2
      };
      if (spec.overlay === 'in-box') {
        var left = nr.left + nr.width / 2 - size.w / 2;
        var top = nr.top + nr.height / 2 - size.h / 2;
        if (left < 4 || top < 4 || left + size.w > width - 4 || top + size.h > height - 4) {
          el.style.display = 'none';
          return;
        }
        placeBox(spec, el, size, { left: left, top: top }, true);
        return;
      }

      var anchor = { x: nr.left + nr.width / 2, y: nr.top + nr.height / 2 };
      var candidates = [centered];
      for (var lane = 1; lane <= 4; lane++) {
        candidates.push({ left: centered.left, top: centered.top - lane * (size.h + 5) });
        candidates.push({ left: centered.left, top: centered.top + lane * (size.h + 5) });
      }
      candidates.push({ left: centered.left + size.w + 6, top: centered.top });
      candidates.push({ left: centered.left - size.w - 6, top: centered.top });
      var chosen = null;
      for (var c = 0; c < candidates.length; c++) {
        var cand = candidates[c];
        var rect = {
          left: Math.max(4, Math.min(width - size.w - 4, cand.left)),
          top: Math.max(4, Math.min(height - size.h - 4, cand.top)),
          right: 0, bottom: 0, width: size.w, height: size.h
        };
        rect.right = rect.left + size.w;
        rect.bottom = rect.top + size.h;
        if (overlapArea(rect, occupied, 3) === 0) { chosen = rect; break; }
      }
      if (!chosen) {
        var fallback = candidates[0];
        chosen = {
          left: Math.max(4, Math.min(width - size.w - 4, fallback.left)),
          top: Math.max(4, Math.min(height - size.h - 4, fallback.top)),
          right: 0, bottom: 0, width: size.w, height: size.h
        };
        chosen.right = chosen.left + size.w;
        chosen.bottom = chosen.top + size.h;
      }
      occupied.push(chosen);
      el.style.left = ((chosen.left - cam.tx) / cam.scale) + 'px';
      el.style.top = ((chosen.top - cam.ty) / cam.scale) + 'px';
      var dx = chosen.left + chosen.width / 2 - anchor.x;
      var dy = chosen.top + chosen.height / 2 - anchor.y;
      var anchorDistance = Math.sqrt(dx * dx + dy * dy);
      el.setAttribute('data-anchor-distance', String(Math.round(anchorDistance)));
      if (anchorDistance > 10) {
        el.setAttribute('data-has-leader', 'true');
        leaderParts.push('M ' + ((anchor.x - cam.tx) / cam.scale) + ' ' + ((anchor.y - cam.ty) / cam.scale) +
          ' L ' + ((chosen.left + chosen.width / 2 - cam.tx) / cam.scale) + ' ' + ((chosen.top + chosen.height / 2 - cam.ty) / cam.scale));
      }
    }

    specs.forEach(function (spec, i) {
      if (spec.type === 'event') placeEventBox(spec, i);
    });

    function placeFloating(spec, i) {
      var el = els[i], size = sizes[i];
      var anchor, candidates = [];
      if (spec.type === 'cross') {
        anchor = spec.anchor;
        for (var lane = 0; lane < 6; lane++) {
          var cy = 5 + lane * (size.h + 4);
          candidates.push({ left: anchor.x - size.w / 2, top: anchor.y - size.h - cy });
          candidates.push({ left: anchor.x - size.w / 2, top: anchor.y + cy });
        }
        candidates.push({ left: anchor.x + 6, top: anchor.y - size.h / 2 });
        candidates.push({ left: anchor.x - size.w - 6, top: anchor.y - size.h / 2 });
      } else {
        var nr = nodeScreenRect(spec.node);
        anchor = { x: nr.left + nr.width / 2, y: nr.top + nr.height / 2 };
        for (var lane2 = 0; lane2 < 9; lane2++) {
          var offset = 4 + lane2 * (size.h + 3);
          candidates.push({ left: nr.left + nr.width / 2 - size.w / 2, top: nr.top - size.h - offset });
          candidates.push({ left: nr.left + nr.width / 2 - size.w / 2, top: nr.bottom + offset });
        }
        candidates.push({ left: nr.right + 5, top: nr.top + nr.height / 2 - size.h / 2 });
        candidates.push({ left: nr.left - size.w - 5, top: nr.top + nr.height / 2 - size.h / 2 });
      }

      var chosen = null, bestOverlap = Infinity, bestOutside = Infinity;
      for (var c = 0; c < candidates.length; c++) {
        var cand = candidates[c];
        var rect = { left: cand.left, top: cand.top, right: cand.left + size.w, bottom: cand.top + size.h, width: size.w, height: size.h };
        var outside = !insideCanvas(rect, width, height, 4);
        var overlap = outside ? Infinity : overlapArea(rect, occupied, 2);
        if (!outside && overlap === 0) { chosen = rect; break; }
        if (outside && outside < bestOutside) { bestOutside = outside; }
        if (!outside && overlap < bestOverlap) { bestOverlap = overlap; chosen = rect; }
      }
      if (!chosen) {
        var fallback = candidates[0];
        chosen = { left: fallback.left, top: fallback.top, right: fallback.left + size.w, bottom: fallback.top + size.h, width: size.w, height: size.h };
        if (!insideCanvas(chosen, width, height, 4)) {
          chosen.left = Math.max(4, Math.min(width - size.w - 4, chosen.left));
          chosen.top = Math.max(4, Math.min(height - size.h - 4, chosen.top));
          chosen.right = chosen.left + size.w;
          chosen.bottom = chosen.top + size.h;
        }
      }
      occupied.push(chosen);
      el.style.left = ((chosen.left - cam.tx) / cam.scale) + 'px';
      el.style.top = ((chosen.top - cam.ty) / cam.scale) + 'px';

      if (spec.type === 'event') {
        var nr2 = nodeScreenRect(spec.node);
        var sx = nr2.left + nr2.width / 2, sy = nr2.top + nr2.height / 2;
        var lx = chosen.left + chosen.width / 2, ly;
        if (chosen.bottom <= nr2.top) ly = chosen.bottom;
        else if (chosen.top >= nr2.bottom) ly = chosen.top;
        else if (chosen.left >= nr2.right) { lx = chosen.left; ly = chosen.top + chosen.height / 2; }
        else { lx = chosen.right; ly = chosen.top + chosen.height / 2; }
        var anchorDistance = Math.sqrt(Math.pow(lx - sx, 2) + Math.pow(ly - sy, 2));
        el.setAttribute('data-anchor-distance', String(Math.round(anchorDistance)));
        if (anchorDistance > 10) {
          el.setAttribute('data-has-leader', 'true');
        }
        if (anchorDistance > 24) {
          leaderParts.push('M ' + ((sx - cam.tx) / cam.scale) + ' ' + ((sy - cam.ty) / cam.scale) +
            ' L ' + ((lx - cam.tx) / cam.scale) + ' ' + ((ly - cam.ty) / cam.scale));
        }
      }
    }

    specs.forEach(function (spec, i) {
      if (spec.type === 'cross') placeFloating(spec, i);
    });

    if (leaders) {
      leaders.innerHTML = leaderParts.map(function (d) {
        return '<path class="label-leader" vector-effect="non-scaling-stroke" d="' + d + '"></path>';
      }).join('');
    }

    Array.prototype.forEach.call(host.querySelectorAll('[data-region]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute('data-region');
        lastTrigger = b;
        commit(C.jumpChapter(state, id, D), { fit: true, hash: true });
        var chapterButton = document.querySelector('[data-chapter="' + id + '"]');
        if (chapterButton) chapterButton.focus();
      };
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-event-node]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute('data-event-node');
        lastTrigger = b;
        commit(C.selectNode(state, id, D), { center: id, hash: true });
      };
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-edge]'), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var groupKey = b.getAttribute('data-cross-group');
        if (groupKey) {
          focusCrossGroupFromMap(groupKey, b);
          return;
        }
        var index = Number(b.getAttribute('data-edge'));
        if (!isFinite(index)) return;
        focusEdgeFromMap(index, b);
      };
    });
  }

  function focusEdgeFromMap(index, trigger) {
    lastTrigger = trigger;
    focusedGroup = null;
    state = C.focusEdge(state, index, D);
    renderGraph();
    centerOn(byId[state.selected]);
    setHash();
    var close = document.getElementById('details-close');
    if (close) close.focus();
  }

  function focusCrossGroupFromMap(groupKey, trigger) {
    var group = DENSE_CROSS_GROUPS.filter(function (g) { return g.from + '>' + g.to === groupKey; })[0];
    if (!group) return;
    lastTrigger = trigger;
    focusedGroup = groupKey;
    state = C.closeDetails(state);
    renderGraph();
    renderGroupDetails(group);
    var close = document.getElementById('details-close');
    if (close) close.focus();
  }

  /* Dense map labels aggregate several real connectors. Opening one must expose
     every member edge, not just the representative, with its own evidence and
     uncertainty. The panel never turns the aggregate into a causal claim. */
  function renderGroupDetails(group) {
    var el = document.getElementById('details');
    var fromName = chapters[group.from] ? chapters[group.from].name : group.from;
    var toName = chapters[group.to] ? chapters[group.to].name : group.to;
    var kindCounts = Object.keys(group.kinds).sort(function (a, b) {
      return group.kinds[b] - group.kinds[a];
    }).map(function (kind) {
      return group.kinds[kind] + ' ' + (EDGE_LABEL[kind] || kind);
    });
    var rows = group.members.map(function (index) {
      var e = D.edges[index];
      var ev = edgeEvidence(e);
      var from = byId[e.from], to = byId[e.to];
      var sourceText = sourceSummary(ev.sources);
      return '<div class="group-edge" data-edge-evidence="' + index + '" data-evidence="' + ev.cls + '">' +
        '<p><strong>' + esc(from ? from.label : e.from) + ' → ' + esc(to ? to.label : e.to) + '</strong>' +
        '<span class="chip ' + ev.cls + '">' + esc(EDGE_LABEL[e.kind]) + '</span></p>' +
        '<p class="note tiny">' + esc(ev.status) + '</p>' +
        '<p class="note tiny">' + esc(ev.unknown) + '</p>' +
        (e.label ? '<p class="note tiny">Connector label: ' + esc(e.label) + '</p>' : '') +
        '<p class="tiny muted">' + esc(sourceText) + '</p>' +
        edgeSourceLinks(ev.sources) +
        '<button class="group-open" data-group-edge="' + index + '">Inspect connector ' + index + '</button>' +
        '</div>';
    }).join('');

    el.hidden = false;
    el.setAttribute('aria-label', 'Group of ' + group.count + ' cross-chapter connectors');
    el.innerHTML =
      '<button class="close" id="details-close" aria-label="Close details">×</button>' +
      '<div class="eyebrow">Connector group · ' + esc(fromName) + ' → ' + esc(toName) + '</div>' +
      '<h2>' + group.count + ' cross-chapter connectors</h2>' +
      '<span class="chip synthetic">Aggregate label · not evidence</span>' +
      '<p>This map label groups ' + group.count + ' actual connectors. It does not assert a combined causal link; each connector keeps its own status, source and unknown below.</p>' +
      '<p class="tiny muted">Kind counts: ' + esc(kindCounts.join(' · ')) + '</p>' +
      '<h3>Every connector in this group</h3>' +
      '<div class="group-list">' + rows + '</div>' +
      '<h3>Evidence</h3>' +
      '<p class="tiny muted">Synthetic benchmark fixture generated for scale testing. Counts and topology are real to the fixture; they are not game evidence.</p>';

    document.getElementById('details-close').onclick = closeWithFocus;
    Array.prototype.forEach.call(el.querySelectorAll('[data-group-edge]'), function (b) {
      b.onclick = function () {
        focusEdgeFromMap(Number(b.getAttribute('data-group-edge')), b);
      };
    });
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
    if (focused && byId[focused.from] && byId[focused.to]) {
      var ev = edgeEvidence(focused);
      edgeBlock = '<h3>Focused cross-chapter connector</h3>' +
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
  }

  function closeWithFocus() {
    if (focusedGroup) {
      var groupKey = focusedGroup;
      focusedGroup = null;
      renderGraph();
      var groupTarget = lastTrigger;
      if (!groupTarget || !groupTarget.isConnected) {
        groupTarget = document.querySelector('[data-cross-group="' + groupKey + '"]');
      }
      if (groupTarget) groupTarget.focus();
      return;
    }
    var last = state.selected;
    state = C.closeDetails(state);
    renderGraph();
    var target = lastTrigger;
    var usable = target && target.isConnected && target.offsetParent !== null && !target.closest('[hidden]');
    if (usable && !target.hasAttribute('data-event-node')) { target.focus(); return; }
    /* Map labels are rebuilt on the next frame after camera changes. Focus the
       replacement button after that render so Escape/X do not focus a node
       that is immediately detached from the DOM. */
    requestAnimationFrame(function () {
      var eventButton = last && document.querySelector('[data-event-node="' + last + '"]');
      var nodeButton = last && document.querySelector('[data-node="' + last + '"]');
      var replacement = eventButton && eventButton.offsetParent !== null ? eventButton : nodeButton;
      if (replacement) replacement.focus();
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
    var scaleChanged = labelScale == null || Math.abs(cam.scale - labelScale) > 1e-6;
    labelScale = cam.scale;
    updateLod();
    if (scaleChanged) scheduleMapLabels();
  }

  function updateLod() {
    var c = document.getElementById('canvas');
    if (!c) return;
    var lod = C.lodFor(cam.scale, state.chapter);
    c.setAttribute('data-lod', lod);
    c.setAttribute('data-density', IS_DENSE ? 'dense' : 'sparse');
    var nodeLabels = IS_DENSE ? (lod === 'detail' ? 'detail' : 'compact') :
      (lod === 'detail' ? 'detail' : (state.chapter === 'all' && cam.scale < MAP_LABEL_MIN_SCALE ? 'compact' : 'in-box'));
    c.setAttribute('data-node-labels', nodeLabels);
    c.setAttribute('data-node-text', !IS_DENSE && lod !== 'detail' && cam.scale >= 0.55 ? 'on' : 'off');
    var zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) zoomLabel.textContent = Math.round(cam.scale * 100) + '% · ' + LOD_LABEL[lod];
    var lodStatus = document.getElementById('lodStatus');
    if (lodStatus) lodStatus.textContent = 'Level of detail: ' + LOD_LABEL[lod] + '.';
    if (lod !== lastLod) lastLod = lod;
  }

  function fitCurrent() {
    var c = document.getElementById('canvas');
    if (!c || !c.clientWidth || !c.clientHeight) return;
    var box, pad, padTop;
    if (state.chapter === 'all') {
      box = { x: 0, y: 0, w: D.canvas.width, h: D.canvas.height };
      /* Leave headroom so one desktop zoom step still keeps the whole graph
         in view; the intermediate state must have the same complete map. */
      pad = c.clientWidth < 600 ? 28 : 80;
      padTop = c.clientWidth < 600 ? 28 : 80;
    } else {
      box = chapters[state.chapter].frame;
      pad = 56;
      padTop = 110;
    }
    var fitted = C.fitBounds({ width: c.clientWidth, height: c.clientHeight }, box, pad, padTop);
    if (state.chapter !== 'all' && c.clientWidth < 600 && fitted.scale < MIN_MOBILE_FOCUS_SCALE) {
      fitted.scale = MIN_MOBILE_FOCUS_SCALE;
      fitted.tx = c.clientWidth / 2 - (box.x + box.w / 2) * fitted.scale;
      fitted.ty = c.clientHeight / 2 - (box.y + box.h / 2) * fitted.scale;
    }
    cam.scale = fitted.scale;
    cam.tx = fitted.tx;
    cam.ty = fitted.ty;
    updateTransform();
    scheduleMapLabels();
  }

  function centerOn(n) {
    var c = document.getElementById('canvas');
    if (!c) return;
    cam.scale = Math.max(cam.scale, 0.85);
    cam.scale = Math.min(cam.scale, 2.4);
    cam.tx = c.clientWidth / 2 - (n.x + n.w / 2) * cam.scale;
    cam.ty = c.clientHeight / 2 - (n.y + n.h / 2) * cam.scale;
    updateTransform();
    scheduleMapLabels();
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
      if (state.selected || focusedGroup) closeWithFocus();
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
