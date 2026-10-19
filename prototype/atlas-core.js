/* PoC4 — shared atlas behaviour core.
   Pure, DOM-free state transitions shared by all three poc4-*.html entries and
   unit-tested by tests/atlas-core.test.js. Loaded as a classic script after
   atlas-data.js; in Node the tests evaluate this file in a function scope.

   State shape: { consented, chapter, selected, trail, query }
     consented — false until the spoiler overlay is accepted.
     chapter   — 'all' or a chapter id; camera preset only, never hides the map.
     selected  — node id with details open, or null.
     trail     — most-recent-first selection history (ids), max 8, deduped.
     query     — current search text. */

var ATLAS_CORE = (function () {
  'use strict';

  var MAX_TRAIL = 8;

  function clone(s) {
    return { consented: s.consented, chapter: s.chapter, selected: s.selected, trail: s.trail.slice(), query: s.query };
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

  var api = {
    MAX_TRAIL: MAX_TRAIL,

    createState: function () {
      return { consented: false, chapter: 'all', selected: null, trail: [], query: '' };
    },

    consent: function (state) {
      var s = clone(state);
      s.consented = true;
      return s;
    },

    /* Clears the selection and search, returns the camera to the whole atlas.
       Trail history and consent are intentionally retained. */
    reset: function (state) {
      var s = clone(state);
      s.chapter = 'all';
      s.selected = null;
      s.query = '';
      return s;
    },

    jumpChapter: function (state, chapterId, data) {
      if (chapterId !== 'all' && !findChapter(data, chapterId)) {
        throw new Error('unknown chapter: ' + chapterId);
      }
      var s = clone(state);
      s.chapter = chapterId;
      return s;
    },

    /* Opens details for a node and pushes it onto the history trail. */
    selectNode: function (state, id, data) {
      var node = findNode(data, id);
      if (!node) throw new Error('unknown node: ' + id);
      var s = clone(state);
      s.selected = id;
      s.chapter = node.chapter;
      s.trail = s.trail.filter(function (t) { return t !== id; });
      s.trail.unshift(id);
      if (s.trail.length > MAX_TRAIL) s.trail.length = MAX_TRAIL;
      return s;
    },

    /* Both detail-close paths (close button, Escape) reduce to this. */
    closeDetails: function (state) {
      var s = clone(state);
      s.selected = null;
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
      return '#' + state.chapter + (state.selected ? '/' + state.selected : '');
    },

    /* Parses '#chapter[/node]'; unknown parts degrade to safe defaults. */
    applyHash: function (state, hash, data) {
      var s = clone(state);
      var raw = String(hash == null ? '' : hash).replace(/^#/, '');
      try { raw = decodeURIComponent(raw); } catch (e) { /* keep raw */ }
      if (!raw) return s;
      var parts = raw.split('/');
      var chapterId = parts[0] || 'all';
      var nodeId = parts[1] || null;
      var node = nodeId ? findNode(data, nodeId) : null;
      if (node) {
        s = api.selectNode(s, node.id, data);
        return s;
      }
      if (chapterId === 'all' || findChapter(data, chapterId)) {
        s.chapter = chapterId;
        s.selected = null;
      }
      return s;
    },

    /* Same visible target? Used to avoid reapplying a self-inflicted hashchange. */
    sameTarget: function (a, b) {
      return a.chapter === b.chapter && a.selected === b.selected;
    }
  };

  return api;
})();
