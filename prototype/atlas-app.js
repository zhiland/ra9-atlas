/* PoC4 — shared atlas renderer and interaction.
   Standalone classic script. Renders ATLAS data on a pannable/zoomable world
   canvas plus a screen-space chapter overview. The three chapter regions always
   stay on one surface, so cross-chapter links and prerequisite gates are
   visible before navigation. The details panel never replaces the map; both
   close paths (button, Escape) reduce to ATLAS_CORE.closeDetails.

   Progressive disclosure:
     overview  — legible chapter cards, one per chapter, plus actual
                 cross-chapter connectors. Shown at whole-atlas fit.
     structure — event boxes without event text.
     detail    — event boxes and labels.
   Zoom/pan changes the level automatically. Chapter focus bypasses the
   chapter-card overview so a narrow mobile chapter fit is still an event view.

   The overview never invents an aggregate edge. Its rows and connectors are
   derived from actual data.edges entries and link to those indices; evidence
   text names the connector kind and what remains unknown. */

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
  var lastLod = null;
  var overviewDrawQueued = false;
  var overviewDetailKey = null;
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
  var KIND_LABEL = { action: 'Action', flag: 'State flag', choice: 'Choice', outcome: 'Outcome' };
  var EDGE_LABEL = { traced: 'traced', conditional: 'reported condition', prerequisite: 'prerequisite gate', hypothesis: 'unresolved hypothesis' };
  var LOD_LABEL = { overview: 'chapter overview', structure: 'event structure', detail: 'event labels' };
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

  /* Static data summaries, computed once. */
  var CHAPTER_STATS = {};
  D.chapters.forEach(function (c) { CHAPTER_STATS[c.id] = { nodes: 0, edges: 0, cross: 0 }; });
  var nodeChapter = {};
  D.nodes.forEach(function (n) {
    nodeChapter[n.id] = n.chapter;
    if (CHAPTER_STATS[n.chapter]) CHAPTER_STATS[n.chapter].nodes++;
  });
  D.edges.forEach(function (e) {
    var a = nodeChapter[e.from], b = nodeChapter[e.to];
    if (a && a === b && CHAPTER_STATS[a]) CHAPTER_STATS[a].edges++;
    if (a && b && a !== b) {
      if (CHAPTER_STATS[a]) CHAPTER_STATS[a].cross++;
      if (CHAPTER_STATS[b]) CHAPTER_STATS[b].cross++;
    }
  });
  var CROSS_GROUPS = C.crossChapterLinks(D);

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
          '<main class="canvas-wrap" id="canvas" data-lod="overview" aria-label="Whole-story chapter overview and event branch map">' +
            '<div class="world" id="world">' +
              '<div id="frames"></div>' +
              '<svg id="edges"><defs><marker id="arrowhead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs></svg>' +
              '<div id="labels"></div>' +
              '<div id="nodes"></div>' +
              '<svg id="markers"></svg>' +
            '</div>' +
            '<section class="overview" id="overview" aria-label="Whole-story chapter overview"></section>' +
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
      var edgeFocused = state.edge === i;
      var active = edgeFocused || (state.selected && (e.from === state.selected || e.to === state.selected));
      var dim = focus && !active;
      paths.push('<path class="edge ' + e.kind + (active ? ' active' : '') + (edgeFocused ? ' focused' : '') + (dim ? ' dimmed' : '') +
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
      c.chapters + ' chapters · ' + c.nodes + ' boxes · ' + c.edges + ' connectors (' + c.prerequisiteEdges +
      ' prerequisite gates · ' + c.conditionalEdges + ' reported condition · ' + c.hypothesisEdges +
      ' unresolved hypothesis) · version/platform unknown · ' + esc(D.meta.disclaimer);

    document.querySelectorAll('[data-chapter]').forEach(function (b) {
      var on = b.getAttribute('data-chapter') === state.chapter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    renderTrail();
    renderOverview();
    renderDetails();
    updateTransform();
  }

  function pointAt(path, t) {
    var len = path.getTotalLength();
    return path.getPointAtLength(len * t);
  }

  /* ---------- chapter overview / progressive disclosure ---------- */
  function renderOverview() {
    var el = document.getElementById('overview');
    if (!el) return;
    var totalCross = CROSS_GROUPS.reduce(function (n, g) { return n + g.edges.length; }, 0);
    var cards = D.chapters.map(function (chapter) {
      var st = CHAPTER_STATS[chapter.id] || { nodes: 0, edges: 0, cross: 0 };
      var groups = CROSS_GROUPS.filter(function (g) { return g.from === chapter.id || g.to === chapter.id; }).length;
      var label = chapter.name + '. ' + st.nodes + ' boxes, ' + st.edges + ' internal connectors, ' +
        groups + ' cross-chapter connector ' + (groups === 1 ? 'group' : 'groups') +
        '. Selected slice, not full chapter coverage.';
      return '<button class="overview-card" data-overview-chapter="' + chapter.id + '" aria-label="Open ' + esc(label) + '">' +
        '<span class="ov-code">' + esc(chapter.code) + '</span>' +
        '<strong class="ov-name">' + esc(chapter.name) + '</strong>' +
        '<span class="ov-meta">' + st.nodes + ' boxes · ' + st.edges + ' internal connectors · ' + groups +
        ' cross-chapter ' + (groups === 1 ? 'group' : 'groups') + '</span>' +
        '<span class="ov-note">Selected slice · not full chapter coverage</span>' +
        '</button>';
    }).join('');

    var links = CROSS_GROUPS.map(function (group) {
      if (group.edges.length === 1) {
        var item = group.edges[0], edge = item.edge, ev = edgeEvidence(edge);
        var label = edge.label || (byId[edge.from].label + ' → ' + byId[edge.to].label);
        return '<button class="overview-link ' + edge.kind + '" data-edge="' + item.index + '" data-from-chapter="' + group.from +
          '" data-to-chapter="' + group.to + '" data-evidence="' + ev.cls + '">' +
          '<span class="ov-link-top"><span class="link-kind ' + ev.cls + '">' + esc(EDGE_LABEL[edge.kind]) + '</span>' +
          '<span class="ov-pair">' + esc(chapters[group.from].name) + ' → ' + esc(chapters[group.to].name) + '</span></span>' +
          '<strong>' + esc(label) + '</strong>' +
          '<span class="ov-evidence">' + esc(ev.status) + '. ' + esc(ev.unknown) + '</span>' +
          '<span class="ov-sources">' + esc(sourceSummary(ev.sources)) + '</span>' +
          '</button>';
      }
      var counts = { traced: 0, conditional: 0, prerequisite: 0, hypothesis: 0 };
      group.edges.forEach(function (item) { counts[item.edge.kind] = (counts[item.edge.kind] || 0) + 1; });
      var parts = [];
      if (counts.traced) parts.push(counts.traced + ' traced');
      if (counts.conditional) parts.push(counts.conditional + ' reported condition');
      if (counts.prerequisite) parts.push(counts.prerequisite + ' prerequisite');
      if (counts.hypothesis) parts.push(counts.hypothesis + ' unresolved hypothesis');
      return '<button class="overview-link aggregate" data-overview-group="' + group.key + '">' +
        '<span class="ov-link-top"><span class="link-kind aggregate">' + group.edges.length + ' actual connectors</span>' +
        '<span class="ov-pair">' + esc(chapters[group.from].name) + ' → ' + esc(chapters[group.to].name) + '</span></span>' +
        '<strong>' + esc(parts.join(' · ')) + '</strong>' +
        '<span class="ov-evidence">Grouped for navigation only; this is not an aggregate causal relation.</span>' +
        '</button>';
    }).join('');

    var detail = '';
    if (overviewDetailKey) {
      var g = CROSS_GROUPS.filter(function (x) { return x.key === overviewDetailKey; })[0];
      if (g) {
        detail = '<div class="overview-edge-list" id="overview-edge-list"><h3>' + g.edges.length +
          ' actual source connectors</h3>' + g.edges.map(function (item) {
            var edge = item.edge, ev = edgeEvidence(edge);
            return '<button class="overview-edge ' + edge.kind + '" data-edge="' + item.index + '" data-evidence="' + ev.cls + '">' +
              '<span class="link-kind ' + ev.cls + '">' + esc(EDGE_LABEL[edge.kind]) + '</span> ' +
              '<strong>' + esc(byId[edge.from].label) + ' → ' + esc(byId[edge.to].label) + '</strong>' +
              '<span class="ov-evidence">' + esc(ev.status) + '</span></button>';
          }).join('') + '</div>';
      } else {
        overviewDetailKey = null;
      }
    }

    el.innerHTML =
      '<div class="overview-head">' +
        '<div><div class="eyebrow">Whole-story overview · chapter level</div>' +
        '<h1>' + D.chapters.length + ' chapters in this slice</h1></div>' +
        '<p class="overview-intro">Chapter labels stay readable at whole-story scale. Zoom in or open a chapter for event nodes, then event labels. Cross-chapter rows use actual connectors; grouped rows never assert aggregate causality. <strong>Not full-game coverage.</strong></p>' +
      '</div>' +
      '<svg class="overview-connectors" id="overview-connectors" aria-hidden="true"></svg>' +
      '<div class="overview-grid">' + cards + '</div>' +
      '<div class="overview-cross">' +
        '<div class="overview-cross-head"><h2>Cross-chapter connectors</h2>' +
        '<span class="tiny muted">' + totalCross + ' actual · evidence status shown · not in-game verified</span></div>' +
        (links || '<p class="tiny muted">No cross-chapter connector in this slice.</p>') +
        detail +
      '</div>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-overview-chapter]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-overview-chapter');
        lastTrigger = b;
        commit(C.jumpChapter(state, id, D), { fit: true, hash: true });
        var chapterButton = document.querySelector('[data-chapter="' + id + '"]');
        if (chapterButton) chapterButton.focus();
      };
    });
    Array.prototype.forEach.call(el.querySelectorAll('[data-edge]'), function (b) {
      b.onclick = function () {
        var index = Number(b.getAttribute('data-edge'));
        if (!isFinite(index)) return;
        focusEdgeFromOverview(index, b);
      };
    });
    Array.prototype.forEach.call(el.querySelectorAll('[data-overview-group]'), function (b) {
      b.onclick = function () {
        var key = b.getAttribute('data-overview-group');
        overviewDetailKey = overviewDetailKey === key ? null : key;
        renderOverview();
        var again = document.querySelector('[data-overview-group="' + key + '"]');
        if (again) again.focus();
      };
    });

    scheduleOverviewDraw();
  }

  function focusEdgeFromOverview(index, trigger) {
    lastTrigger = trigger;
    state = C.focusEdge(state, index, D);
    renderGraph();
    centerOn(byId[state.selected]);
    setHash();
    var close = document.getElementById('details-close');
    if (close) close.focus();
  }

  function scheduleOverviewDraw() {
    if (overviewDrawQueued) return;
    overviewDrawQueued = true;
    requestAnimationFrame(function () {
      overviewDrawQueued = false;
      drawOverviewConnectors();
    });
  }

  function shortKind(edge) {
    if (edge.kind === 'hypothesis') return 'UNRESOLVED';
    if (edge.kind === 'conditional') return 'condition';
    if (edge.kind === 'prerequisite') return 'prerequisite';
    return 'traced';
  }

  function drawOverviewConnectors() {
    var ov = document.getElementById('overview');
    var svg = document.getElementById('overview-connectors');
    var canvas = document.getElementById('canvas');
    if (!ov || !svg || ov.hidden || !canvas || canvas.getAttribute('data-lod') !== 'overview') return;
    var ovr = ov.getBoundingClientRect();
    var w = Math.max(1, Math.round(ovr.width)), h = Math.max(1, Math.round(ovr.height));
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);

    var cardRects = {};
    Array.prototype.forEach.call(ov.querySelectorAll('[data-overview-chapter]'), function (card) {
      var r = card.getBoundingClientRect();
      cardRects[card.getAttribute('data-overview-chapter')] = {
        left: r.left - ovr.left, top: r.top - ovr.top,
        right: r.right - ovr.left, bottom: r.bottom - ovr.top,
        width: r.width, height: r.height
      };
    });

    /* Keep the drawing honest and readable: only one card row and a small
       number of actual cross-chapter groups get connector lines. The textual
       rows below remain the complete, navigable representation otherwise. */
    var rows = {};
    Object.keys(cardRects).forEach(function (id) { rows[Math.round(cardRects[id].top)] = 1; });
    if (Object.keys(rows).length !== 1 || CROSS_GROUPS.length > 4) { svg.innerHTML = ''; return; }

    var svgParts = ['<defs><marker id="overview-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"></path></marker></defs>'];
    CROSS_GROUPS.forEach(function (group, groupIndex) {
      var a = cardRects[group.from], b = cardRects[group.to];
      if (!a || !b) return;
      var single = group.edges.length === 1;
      var cls = single ? group.edges[0].edge.kind : 'aggregate';
      var start = { x: a.left + a.width / 2, y: a.bottom };
      var end = { x: b.left + b.width / 2, y: b.bottom };
      var channelY = Math.max(a.bottom, b.bottom) + 16 + groupIndex * 14;
      var d = 'M ' + Math.round(start.x) + ' ' + Math.round(start.y) +
        ' V ' + Math.round(channelY) + ' H ' + Math.round(end.x) + ' V ' + Math.round(end.y);
      svgParts.push('<path class="overview-connector ' + cls + '" d="' + d + '"' + (single ? ' marker-end="url(#overview-arrow)"' : '') + '></path>');
      var label = single ? shortKind(group.edges[0].edge) : group.edges.length + ' actual';
      svgParts.push('<text class="overview-connector-label" x="' + Math.round((start.x + end.x) / 2) +
        '" y="' + Math.round(channelY - 4) + '" text-anchor="middle">' + esc(label) + '</text>');
    });
    svg.innerHTML = svgParts.join('');
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
    var last = state.selected;
    state = C.closeDetails(state);
    renderGraph();
    var target = lastTrigger;
    var usable = target && target.isConnected && target.offsetParent !== null && !target.closest('[hidden]');
    var b = usable ? target : (last && document.querySelector('[data-node="' + last + '"]'));
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
    updateLod();
  }

  function updateLod() {
    var c = document.getElementById('canvas');
    if (!c) return;
    var lod = C.lodFor(cam.scale, state.chapter);
    c.setAttribute('data-lod', lod);
    var ov = document.getElementById('overview');
    if (ov) ov.hidden = lod !== 'overview';
    var zoomLabel = document.getElementById('zoomLabel');
    if (zoomLabel) zoomLabel.textContent = Math.round(cam.scale * 100) + '% · ' + LOD_LABEL[lod];
    var lodStatus = document.getElementById('lodStatus');
    if (lodStatus) lodStatus.textContent = 'Level of detail: ' + LOD_LABEL[lod] + '.';
    if (lod !== lastLod) {
      lastLod = lod;
      if (lod === 'overview') scheduleOverviewDraw();
    }
  }

  function fitCurrent() {
    var c = document.getElementById('canvas');
    if (!c || !c.clientWidth || !c.clientHeight) return;
    var box, pad, padTop;
    if (state.chapter === 'all') {
      box = { x: 0, y: 0, w: D.canvas.width, h: D.canvas.height };
      pad = 28;
      padTop = 28;
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
    var ov = document.getElementById('overview');
    if (ov && state.chapter === 'all') ov.scrollTop = 0;
    if (lastLod === 'overview') scheduleOverviewDraw();
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
      /* The chapter overview is a scroll container, not a draggable camera.
         Let vertical touch scrolling work and do not capture the pointer. */
      if (c.getAttribute('data-lod') === 'overview') return;
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
      var q = document.getElementById('q');
      if (q) { q.focus(); e.preventDefault(); }
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
