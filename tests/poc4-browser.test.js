#!/usr/bin/env node
/* PoC4 — browser functional checks for the three atlas entry points.
   Run: npm run test:browser   (requires the playwright devDependency)
   If PLAYWRIGHT_BROWSERS_PATH is unset, the harness reuses the browsers
   folder under the OS temp dir when it exists; otherwise Playwright's own
   default lookup applies.

   What this suite does and does not prove: it drives the static pages in
   headless Chromium over file://. It exercises consent, chapter jumps,
   cross-chapter gates and hypotheses, both detail-close paths, history,
   hash round-trips and text contrast in all three palettes. It does NOT
   verify any Detroit: Become Human gameplay. */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  const fallback = path.join(os.tmpdir(), 'opencode', 'pw-browsers');
  if (fs.existsSync(fallback)) process.env.PLAYWRIGHT_BROWSERS_PATH = fallback;
}

const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const VARIANTS = [
  { id: 'editorial', file: 'poc4-editorial.html', palette: 'neutral gray default' },
  { id: 'amber', file: 'poc4-amber.html', palette: 'warm amber neutral' },
  { id: 'darkcyan', file: 'poc4-darkcyan.html', palette: 'dark cyan' }
];

let passed = 0;
let failed = 0;

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

async function textOf(page, selector) {
  const t = await page.locator(selector).first().textContent();
  return (t || '').replace(/\s+/g, ' ').trim();
}

/* Clears selection and search and refits the whole atlas, so each check
   starts from a known camera. History and consent are kept by design. */
async function resetAtlas(page) {
  await page.locator('#reset').click();
  await page.locator('#details').waitFor({ state: 'hidden' });
}

async function runVariant(browser, variant) {
  console.log('scenario ' + variant.id + ' (' + variant.palette + ')');
  const pageErrors = [];
  const track = function (p) {
    p.on('pageerror', function (e) { pageErrors.push('pageerror: ' + e.message); });
    p.on('console', function (m) { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  };

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page);
  const url = 'file://' + path.join(root, 'prototype', variant.file);
  await page.goto(url + '#');

  await ok('loads cleanly on the spoiler-consent cover', async function () {
    await page.locator('#consent').waitFor({ state: 'visible' });
    assert(await page.locator('#world').count() === 0, 'map must not render before consent');
    assert(await page.locator('html').getAttribute('data-variant') === variant.id, 'palette variant attribute missing');
  });

  await page.locator('#consent').click();
  await page.locator('#world').waitFor({ state: 'visible' });

  await ok('consent reveals the whole atlas surface', async function () {
    assert(await page.locator('#canvas').isVisible(), 'canvas not visible');
    assert(await page.locator('#details').isHidden(), 'details should start hidden');
    assert(await page.locator('#trail').isVisible(), 'history trail not visible');
    const status = await textOf(page, '#status');
    assert(status.indexOf('3 chapters · 18 boxes · 16 connectors') !== -1, 'status line counts: ' + status);
    assert(status.indexOf('version/platform unknown') !== -1, 'status line must state version/platform unknown');
  });

  await ok('all three chapter regions and every node render on one surface', async function () {
    assert(await page.locator('.frame').count() === 3, 'three chapter frames expected');
    assert(await page.locator('[data-node]').count() === 18, '18 nodes expected');
    assert(await page.locator('path.edge').count() === 16, '16 connectors expected');
  });

  await ok('cross-chapter gates and hypothesis labels are visible before any navigation', async function () {
    const gate = page.locator('.edge-label', { hasText: 'prerequisite: Todd not killed in Stormy Night' });
    const hypo = page.locator('.edge-label', { hasText: 'UNRESOLVED hypothesis' });
    assert(await gate.count() === 1, 'survival gate label missing');
    assert(await hypo.count() === 1, 'hypothesis label missing');
    const inCanvas = await page.evaluate(function (needle) {
      const labels = Array.prototype.slice.call(document.querySelectorAll('.edge-label'));
      const el = labels.find(function (l) { return (l.textContent || '').indexOf(needle) !== -1; });
      if (!el) return false;
      const c = document.getElementById('canvas').getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom;
    }, 'UNRESOLVED hypothesis');
    assert(inCanvas, 'hypothesis label must sit inside the visible canvas on the whole-atlas view');
    assert(await page.locator('.badge-ring').count() === 1, 'only the unresolved hypothesis should carry a question badge');
    assert(await page.locator('path.edge[marker-end="url(#arrowhead)"]').count() === 16, 'all orthogonal connectors should have arrowheads');
    assert(await page.locator('.badge-ring.gate').count() === 0, 'prerequisite connectors should not use diamond markers');
  });

  await ok('chapter jumps keep the same surface visible (camera preset only)', async function () {
    const before = await page.locator('#world').getAttribute('style');
    await page.locator('[data-chapter="home"]').click();
    assert(await page.locator('[data-chapter="home"]').getAttribute('aria-pressed') === 'true', 'home not marked active');
    assert(await page.locator('#world').isVisible() && await page.locator('#canvas').isVisible(), 'map must stay visible');
    assert(await page.locator('path.edge').count() === 16, 'connectors must not be removed when focusing a chapter');
    assert(await page.locator('.frame').count() === 3, 'other chapter regions must stay on the surface');
    const after = await page.locator('#world').getAttribute('style');
    assert(before !== after, 'camera should move on a chapter jump');
    const fits = await page.evaluate(function () {
      const c = document.getElementById('canvas').getBoundingClientRect();
      const frames = Array.prototype.slice.call(document.querySelectorAll('.frame'));
      const home = frames.find(function (f) { return /A New Home/.test(f.getAttribute('aria-label')); });
      const r = home.getBoundingClientRect();
      const tol = 3;
      return r.left >= c.left - tol && r.right <= c.right + tol && r.top >= c.top - tol && r.bottom <= c.bottom + tol;
    });
    assert(fits, 'focused chapter should fill the visible canvas');
    await page.locator('[data-chapter="kara"]').click();
    assert(await page.locator('.frame').count() === 3, 'regions stay mounted after the next jump');
    await page.locator('[data-chapter="all"]').click();
    assert(await page.locator('[data-chapter="all"]').getAttribute('aria-pressed') === 'true', 'whole atlas not restored');
  });

  await ok('Meet Todd shows its two separate prerequisite gates', async function () {
    await page.locator('[data-node="k_meet"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(d.indexOf('Meet Todd') !== -1, 'details heading missing');
    assert(await page.locator('#details .rowlist [data-goto="k_terminal"]').count() === 1, 'terminal connector row missing');
    assert(await page.locator('#details .rowlist [data-goto="s_alive"]').count() === 1, 'survival connector row missing');
    const kinds = await page.locator('#details .rowlist .kind').allTextContents();
    assert(kinds.filter(function (k) { return /prerequisite/i.test(k); }).length === 2, 'two gate kinds expected, got: ' + kinds.join(' | '));
    assert(d.indexOf('Todd not killed in Stormy Night') !== -1, 'survival gate wording missing');
    assert(d.indexOf('bus terminal') !== -1, 'terminal gate wording missing');
    assert(await page.locator('#canvas').isVisible(), 'map must stay visible while details are open');
    assert(await page.locator('[data-node="a_talk"]').isVisible(), 'nodes must stay reachable while details are open');
  });

  await ok('Alice box keeps a dashed unresolved hypothesis, not a gate', async function () {
    await resetAtlas(page);
    await page.locator('[data-node="a_box"]').click();
    const d = await textOf(page, '#details');
    assert(/open alice/i.test(d), 'box heading missing: ' + d.slice(0, 80));
    assert(d.indexOf('unresolved hypothesis') !== -1, 'hypothesis kind must be named');
    assert(await page.locator('#details .rowlist [data-goto="k_dialogue"]').count() === 1, 'hypothesis connector row missing');
    assert(await page.locator('#details .goto[data-goto="k_dialogue"]').count() === 1, 'cross-chapter jump button missing');
    assert(await page.locator('#details [data-goto="k_meet"]').count() === 0, 'box must not link to the meeting as a gate');
    const dashed = await page.evaluate(function () {
      const p = document.querySelector('path.edge.hypothesis');
      return !!p && getComputedStyle(p).strokeDasharray !== 'none';
    });
    assert(dashed, 'hypothesis connector must stay dashed');
  });

  await ok('cross-chapter jump from the box opens the reported dialogue node', async function () {
    await page.locator('#details .goto[data-goto="k_dialogue"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(page, '#details');
    assert(d.indexOf('Todd dialogue') !== -1, 'dialogue details did not open');
    assert(await page.locator('[data-chapter="kara"]').getAttribute('aria-pressed') === 'true', 'chapter must follow the node');
    assert(await page.locator('#canvas').isVisible(), 'map stays visible through the cross-chapter jump');
    const centered = await page.evaluate(function () {
      const c = document.getElementById('canvas').getBoundingClientRect();
      const b = document.querySelector('[data-node="k_dialogue"]').getBoundingClientRect();
      return b.right > c.left && b.left < c.right && b.bottom > c.top && b.top < c.bottom;
    });
    assert(centered, 'the opened node should be brought into view');
  });

  await ok('close button and Escape reduce to the same state and restore focus', async function () {
    await page.locator('#details-close').click();
    await page.locator('#details').waitFor({ state: 'hidden' });
    const afterButton = {
      hash: await page.evaluate(function () { return location.hash; }),
      focused: await page.evaluate(function () { return document.activeElement && document.activeElement.getAttribute('data-node'); })
    };
    assert(afterButton.focused === 'k_dialogue', 'focus should return to the node button, was ' + afterButton.focused);

    await page.locator('[data-node="k_dialogue"]').click();
    await page.locator('#details').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.locator('#details').waitFor({ state: 'hidden' });
    const afterEscape = {
      hash: await page.evaluate(function () { return location.hash; }),
      focused: await page.evaluate(function () { return document.activeElement && document.activeElement.getAttribute('data-node'); })
    };
    assert(afterEscape.focused === 'k_dialogue', 'Escape should return focus to the node button');
    assert(afterButton.hash === afterEscape.hash, 'close paths must leave the same hash: ' + afterButton.hash + ' vs ' + afterEscape.hash);
  });

  await ok('history trail records visits and reopens them', async function () {
    await resetAtlas(page);
    await page.locator('[data-node="k_goodbye"]').click();
    await resetAtlas(page);
    await page.locator('[data-node="s_alive"]').click();
    const items = page.locator('#trail [data-trail]');
    assert(await items.count() >= 2, 'trail should hold the recent visits');
    const first = await items.first().getAttribute('data-trail');
    assert(first === 's_alive', 'newest visit must be first, was ' + first);
    assert(await page.locator('#trail').isVisible(), 'history stays visible during navigation');
    await items.nth(1).click();
    const d = await textOf(page, '#details');
    assert(d.indexOf('Alice says goodbye') !== -1, 'trail click did not reopen the earlier node');
  });

  await ok('search finds labels and Escape closes the results first', async function () {
    await resetAtlas(page);
    await page.locator('[data-node="k_meet"]').click();
    await page.locator('#q').fill('soldiers');
    const results = page.locator('#results [data-hit]');
    assert(await results.count() >= 1, 'search returned no hits');
    await page.keyboard.press('Escape');
    assert(await page.locator('#results').isHidden(), 'first Escape should close search results');
    assert(await page.locator('#details').isVisible(), 'Escape on results must not close the open details');
    await page.locator('#details-close').click();
  });

  await ok('palette keeps text contrast at or above 4.5:1', async function () {
    await page.locator('[data-node="k_terminal"]').click();
    const samples = await page.evaluate(function () {
      function parse(c) {
        const m = (c || '').match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      }
      function lum(c) {
        const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
      }
      function contrast(fg, bg) {
        const a = lum(fg), b = lum(bg);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }
      function bgOf(el) {
        let e = el;
        while (e) {
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c && c.a === 1) return c;
          e = e.parentElement;
        }
        return { r: 0, g: 0, b: 0, a: 1 };
      }
      const sels = ['.node .label', '.node .k', '.node .sub', '.edge-label.prerequisite', '.status', '.details h2', '.details p', '.brand span', '.chapter', '.chapter small', '.trail button', '.zoom span'];
      return sels.map(function (s) {
        const el = document.querySelector(s);
        if (!el) return { sel: s, missing: true };
        return { sel: s, ratio: Math.round(contrast(parse(getComputedStyle(el).color), bgOf(el)) * 100) / 100 };
      });
    });
    samples.forEach(function (s) {
      assert(!s.missing, 'sample ' + s.sel + ' not found');
      assert(s.ratio >= 4.5, 'contrast ' + s.ratio + ':1 below 4.5 for ' + s.sel);
    });
    console.log('          contrast: ' + samples.map(function (s) { return s.sel + ' ' + s.ratio; }).join(', '));
    await page.locator('#details-close').click();
  });

  await ok('hash round-trip opens a deep link after consent', async function () {
    const fresh = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    track(fresh);
    await fresh.goto(url + '#kara/k_check');
    await fresh.locator('#consent').click();
    await fresh.locator('#details').waitFor({ state: 'visible' });
    const d = await textOf(fresh, '#details');
    assert(d.indexOf('Security check') !== -1, 'deep link did not restore k_check');
    assert(await fresh.locator('[data-chapter="kara"]').getAttribute('aria-pressed') === 'true', 'deep link did not restore chapter');
    await fresh.close();
  });

  await ok('no page errors in this palette', async function () {
    assert(pageErrors.length === 0, pageErrors.join(' | '));
  });

  await page.close();
}

(async function main() {
  const browser = await chromium.launch();
  try {
    for (const variant of VARIANTS) await runVariant(browser, variant);
  } finally {
    await browser.close();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.error('browser suite crashed: ' + (err && err.stack || err));
  process.exit(1);
});
