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
  return { errors: errors, layout: layout, anchorY: anchorY };
})();
if (typeof module === 'object' && module.exports) module.exports = ATLAS_ROW_LAYOUT;
