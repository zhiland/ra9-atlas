/* PoC4 — shared atlas behaviour core.
   Pure, DOM-free state transitions shared by all three poc4-*.html entries,
   the synthetic benchmark entry, and unit-tested by tests/atlas-core.test.js.
   Loaded as a classic script after atlas-data.js; in Node the tests evaluate
   this file in a function scope.

   State shape: { consented, chapter, selected, edge, trail, query }
     consented — false until the spoiler overlay is accepted (persisted by the page).
     chapter   — 'all' or a chapter id; camera preset only, never hides the map.
     selected  — node id with details open, or null.
     edge      — index into data.edges for a focused cross-chapter connector, or null.
                 Links may name the edge by array index (?edge=N) or stable id.
     trail     — most-recent-first selection history (ids), max 8, deduped.
     query     — current search text.

   There is one stable spatial chart at every camera scale. Zoom and pan change
   only the camera transform; no LOD threshold swaps or hides content. A focused
   chapter always stays on the same map; it must not fall back to a separate
   whole-story card/report surface. */

var ATLAS_CORE = (function () {
  'use strict';

  var MAX_TRAIL = 8;
  var MIN_SCALE = 0.02;

  function clone(s) {
    return {
      consented: s.consented,
      chapter: s.chapter,
      selected: s.selected,
      edge: s.edge == null ? null : s.edge,
      trail: s.trail.slice(),
      query: s.query
    };
  }

  function findNode(data, id) {
    for (var i = 0; i < data.nodes.length; i++) {
      if (data.nodes[i].id === id) return data.nodes[i];
    }
    return null;
  }

  function findChapter(data, id) {
    for (var i = 0; i < data.chapters.length; i++) {
      if (data.chapters[i].id === id) return data.chapters[i];
    }
    return null;
  }

  function validEdgeIndex(data, index) {
    var i = Number(index);
    return isFinite(i) && i % 1 === 0 && i >= 0 && i < data.edges.length ? i : null;
  }

  /* Links accept either the legacy array index or the stable edge id. State
     keeps the index so all existing rendering, order and ?edge=N output stay
     unchanged. */
  function resolveEdgeIndex(data, value) {
    var i = validEdgeIndex(data, value);
    if (i != null) return i;
    var id = String(value);
    for (var j = 0; j < data.edges.length; j++) {
      if (data.edges[j].id === id) return j;
    }
    return null;
  }

  var api = {
    MAX_TRAIL: MAX_TRAIL,
    MIN_SCALE: MIN_SCALE,

    createState: function () {
      return { consented: false, chapter: 'all', selected: null, edge: null, trail: [], query: '' };
    },

    consent: function (state) {
      var s = clone(state);
      s.consented = true;
      return s;
    },

    revokeConsent: function (state) {
      var s = clone(state);
      s.consented = false;
      return s;
    },

    /* Clears the selection, edge focus and search, returns the camera to the
       whole atlas. Trail history and consent are intentionally retained. */
    reset: function (state) {
      var s = clone(state);
      s.chapter = 'all';
      s.selected = null;
      s.edge = null;
      s.query = '';
      return s;
    },

    jumpChapter: function (state, chapterId, data) {
      if (chapterId !== 'all' && !findChapter(data, chapterId)) {
        throw new Error('unknown chapter: ' + chapterId);
      }
      var s = clone(state);
      s.chapter = chapterId;
      s.edge = null;
      return s;
    },

    /* Opens details for a node and pushes it onto the history trail. */
    selectNode: function (state, id, data) {
      var node = findNode(data, id);
      if (!node) throw new Error('unknown node: ' + id);
      var s = clone(state);
      s.selected = id;
      s.edge = null;
      s.chapter = node.chapter;
      s.trail = s.trail.filter(function (t) { return t !== id; });
      s.trail.unshift(id);
      if (s.trail.length > MAX_TRAIL) s.trail.length = MAX_TRAIL;
      return s;
    },

    /* Focuses one actual cross-chapter edge. The later endpoint is selected so
       the details panel can show the edge's label, note and evidence sources.
       No aggregate edge is created: callers pass the real edge index. */
    focusEdge: function (state, index, data) {
      var i = resolveEdgeIndex(data, index);
      if (i == null) throw new Error('unknown edge: ' + index);
      var edge = data.edges[i];
      var s = api.selectNode(state, edge.to, data);
      s.edge = i;
      return s;
    },

    /* Both detail-close paths (close button, Escape) reduce to this. */
    closeDetails: function (state) {
      var s = clone(state);
      s.selected = null;
      s.edge = null;
      return s;
    },

    setQuery: function (state, query) {
      var s = clone(state);
      s.query = String(query == null ? '' : query);
      return s;
    },

    trailFor: function (state, data) {
      var out = [];
      for (var i = 0; i < state.trail.length; i++) {
        var node = findNode(data, state.trail[i]);
        if (!node) continue;
        var chapter = findChapter(data, node.chapter);
        out.push({ id: node.id, label: node.label, chapter: node.chapter, chapterName: chapter ? chapter.name : node.chapter });
      }
      return out;
    },

    hashFor: function (state) {
      var h = '#' + state.chapter + (state.selected ? '/' + state.selected : '');
      if (state.selected && state.edge != null) h += '?edge=' + state.edge;
      return h;
    },

    /* Parses '#chapter[/node][?edge=N|stable-id]'; wrote hashes keep ?edge=N
       for compatibility. Unknown parts degrade to safe defaults. */
    applyHash: function (state, hash, data) {
      var s = clone(state);
      var raw = String(hash == null ? '' : hash).replace(/^#/, '');
      try { raw = decodeURIComponent(raw); } catch (e) { /* keep raw */ }
      if (!raw) return s;
      var edgeIndex = null;
      var edgeAt = raw.indexOf('?edge=');
      if (edgeAt !== -1) {
        edgeIndex = resolveEdgeIndex(data, raw.slice(edgeAt + 6));
        raw = raw.slice(0, edgeAt);
      }
      var parts = raw.split('/');
      var chapterId = parts[0] || 'all';
      var nodeId = parts[1] || null;
      var node = nodeId ? findNode(data, nodeId) : null;
      if (node) {
        s = api.selectNode(s, node.id, data);
        if (edgeIndex != null && data.edges[edgeIndex].to === node.id) s.edge = edgeIndex;
        return s;
      }
      if (chapterId === 'all' || findChapter(data, chapterId)) {
        s.chapter = chapterId;
        s.selected = null;
        s.edge = null;
      }
      return s;
    },

    /* Same visible target? Used to avoid reapplying a self-inflicted hashchange. */
    sameTarget: function (a, b) {
      return a.chapter === b.chapter && a.selected === b.selected && a.edge === b.edge;
    },

    /* Deterministic bounds fit used by both chapter focus and full-map fit.
       The returned transform keeps box inside [pad, padTop] .. [w-pad, h-pad].
       No minimum-scale clamp is applied here, so narrow mobile fits cannot clip. */
    fitBounds: function (viewport, box, pad, padTop) {
      var p = pad == null ? 0 : pad;
      var pt = padTop == null ? p : padTop;
      var availW = Math.max(1, viewport.width - p * 2);
      var availH = Math.max(1, viewport.height - p - pt);
      var scale = Math.min(availW / box.w, availH / box.h);
      if (!isFinite(scale) || scale <= 0) scale = MIN_SCALE;
      scale = Math.min(scale, 1.5);
      return {
        scale: scale,
        tx: p + (availW - box.w * scale) / 2 - box.x * scale,
        ty: pt + (availH - box.h * scale) / 2 - box.y * scale
      };
    },

    /* Groups only actual edges that cross a chapter boundary. */
    crossChapterLinks: function (data) {
      var chapterOf = {};
      var chapterIndex = {};
      data.nodes.forEach(function (n) { chapterOf[n.id] = n.chapter; });
      data.chapters.forEach(function (c, i) { chapterIndex[c.id] = i; });
      var groups = {};
      var order = [];
      data.edges.forEach(function (edge, index) {
        var fromChapter = chapterOf[edge.from];
        var toChapter = chapterOf[edge.to];
        if (!fromChapter || !toChapter || fromChapter === toChapter) return;
        var key = fromChapter + '>' + toChapter;
        if (!groups[key]) {
          groups[key] = { key: key, from: fromChapter, to: toChapter, edges: [] };
          order.push(key);
        }
        groups[key].edges.push({ index: index, edge: edge });
      });
      order.sort(function (a, b) {
        var ga = groups[a], gb = groups[b];
        var af = chapterIndex[ga.from], bf = chapterIndex[gb.from];
        if (af !== bf) return af - bf;
        return chapterIndex[ga.to] - chapterIndex[gb.to];
      });
      return order.map(function (key) { return groups[key]; });
    }
  };

  return api;
})();
