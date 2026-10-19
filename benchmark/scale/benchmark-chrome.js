/* Benchmark-only copy. The production renderer hard-codes PoC4 spoiler cover
   text and a three-chapter label. This script replaces only those presentation
   strings so the isolated page identifies itself as synthetic; it does not
   touch graph rendering, interaction, data, or CSS. */
(function () {
  'use strict';

  function patchCover() {
    var cover = document.querySelector('.cover');
    if (!cover || cover.getAttribute('data-synthetic-patched') === 'true') return;

    var eyebrow = cover.querySelector('.eyebrow');
    var heading = cover.querySelector('h1');
    var paragraphs = cover.querySelectorAll('p');
    var button = cover.querySelector('#consent');

    if (eyebrow) eyebrow.textContent = 'Synthetic benchmark · graph-scale spike';
    if (heading) heading.textContent = 'Synthetic atlas fixture';
    if (paragraphs[0]) {
      paragraphs[0].textContent = '1,000 generated nodes and 1,650 generated connectors across five neutral regions. This page measures the current custom SVG/DOM renderer.';
    }
    if (paragraphs[1]) {
      paragraphs[1].textContent = 'Synthetic data only. Not game content, not evidence, and not a claim about gameplay or any real workflow.';
    }
    if (button) button.textContent = 'Reveal synthetic map';

    cover.setAttribute('data-synthetic-patched', 'true');
  }

  function patchRegionCount() {
    var small = document.querySelector('.chapter[data-chapter="all"] small');
    var desired = '5 synthetic regions';
    if (small && small.textContent !== desired) small.textContent = desired;
  }

  function patch() {
    patchCover();
    patchRegionCount();
  }

  var app = document.getElementById('app');
  if (!app) return;
  new MutationObserver(patch).observe(app, { childList: true, subtree: true });
  patch();
})();
