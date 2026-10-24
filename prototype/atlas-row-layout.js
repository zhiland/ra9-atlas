/* Shared geometry and contract checks for explicit source row groups.
 * Legacy binary nodes keep their original option anchors and DOM layout. */
var ATLAS_ROW_LAYOUT = (function () {
  'use strict';
  var HEADER = 24, BORDER = 1, MIN_ROW = 32;
  function errors(node, version) {
    var out = [], n = node || {};
    if (n.rowGroup != null && typeof n.rowGroup !== 'boolean') out.push('rowGroup must be a boolean');
    if (n.rowGroup === true && (version !== '1.1' || n.kind !== 'choice')) out.push('rowGroup requires contract 1.1 and choice kind');
    if (n.kind !== 'choice') return out;
    var options = Array.isArray(n.options) ? n.options : [];
    var valid = Array.isArray(n.options) && Array.from(options).every(function (o) { return typeof o === 'string' && o.trim(); }) && new Set(options).size === options.length;
    if (n.rowGroup === true && version === '1.1') {
      if (!['x','y','w'].every(function (k) { return Number.isFinite(n[k]); }) || n.w <= 2 * BORDER) out.push('row group must have finite coordinates and positive inner width');
      if (!valid || options.length < 2) out.push('row group must list at least 2 unique non-empty string option labels');
      if (!Number.isFinite(n.h) || n.h < HEADER + 2 * BORDER + options.length * MIN_ROW) out.push('row group height must fit its header and option rows');
    } else if (!valid || options.length !== 2) out.push('choice must list exactly 2 unique non-empty string option labels');
    return out;
  }
  function layout(node) {
    if (node.rowGroup !== true) return null;
    if (errors(node, '1.1').length || !['x','y','w','h'].every(function (k) { return Number.isFinite(node[k]); }) || node.w <= 2 * BORDER) throw new RangeError('Invalid row-group geometry');
    var height = (node.h - HEADER - 2 * BORDER) / node.options.length;
    return { headerHeight: HEADER, rows: node.options.map(function (_, i) {
      return { index: i, x: node.x + BORDER, y: node.y + BORDER + HEADER + i * height, w: node.w - 2 * BORDER, h: height };
    }) };
  }
  function anchorY(node, index) {
    if (!Array.isArray(node.options) || !Number.isInteger(index) || index < 0 || index >= node.options.length) throw new RangeError('Invalid option index');
    if (node.rowGroup !== true) return node.y + (index + 0.5) * node.h / node.options.length;
    var row = layout(node).rows[index];
    return row.y + row.h / 2;
  }
  function routePoints(from, to, edge) {
    if (from.rowGroup !== true || edge.fromOption == null) return null;
    var sy = anchorY(from, edge.fromOption), ty = to.y + to.h / 2;
    var points = edge.points;
    if (points == null) {
      var sx, tx, lane;
      if (to.x >= from.x + from.w) {
        sx = from.x + from.w; tx = to.x; lane = (sx + tx) / 2;
      } else if (to.x + to.w <= from.x) {
        sx = from.x; tx = to.x + to.w; lane = (sx + tx) / 2;
      } else {
        var left = Math.min(from.x, to.x) - 24;
        var right = Math.max(from.x + from.w, to.x + to.w) + 24;
        lane = edge.via != null ? edge.via : left >= 0 ? left : right;
        if (lane <= Math.min(from.x, to.x)) { sx = from.x; tx = to.x; }
        else if (lane >= Math.max(from.x + from.w, to.x + to.w)) { sx = from.x + from.w; tx = to.x + to.w; }
        else throw new RangeError('row-group via must use an outside corridor');
      }
      if (edge.via != null) lane = edge.via;
      points = [[sx, sy], [lane, sy], [lane, ty], [tx, ty]];
    }
    if (!Array.isArray(points) || points.length < 2 || points.some(function (p) {
      return !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite);
    })) throw new RangeError('row-group path must contain finite coordinate pairs');
    if (Math.abs(points[0][1] - sy) > 0.01) throw new RangeError('authored start must match its source row center');
    function onBorder(p, n) {
      return ((p[0] === n.x || p[0] === n.x + n.w) && p[1] >= n.y && p[1] <= n.y + n.h) ||
        ((p[1] === n.y || p[1] === n.y + n.h) && p[0] >= n.x && p[0] <= n.x + n.w);
    }
    if (!onBorder(points[0], from) || !onBorder(points[points.length - 1], to)) throw new RangeError('row-group path must use endpoint borders');
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1], b = points[i];
      if (a[0] !== b[0] && a[1] !== b[1]) throw new RangeError('row-group path must be orthogonal');
      [from, to].forEach(function (n) {
        var inset = 1e-6;
        var crosses = a[0] === b[0]
          ? a[0] > n.x + inset && a[0] < n.x + n.w - inset && Math.max(a[1], b[1]) > n.y + inset && Math.min(a[1], b[1]) < n.y + n.h - inset
          : a[1] > n.y + inset && a[1] < n.y + n.h - inset && Math.max(a[0], b[0]) > n.x + inset && Math.min(a[0], b[0]) < n.x + n.w - inset;
        if (crosses) throw new RangeError('row-group path crosses an endpoint interior');
      });
    }
    return points;
  }
  return { errors: errors, layout: layout, anchorY: anchorY, routePoints: routePoints };
})();
if (typeof module === 'object' && module.exports) module.exports = ATLAS_ROW_LAYOUT;
