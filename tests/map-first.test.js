#!/usr/bin/env node
/* Stable map smoke checks for the real sample at desktop and mobile viewport sizes.
 * Run: npm run test:map. Mobile is Chromium viewport emulation only.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  const fallback = path.join(os.tmpdir(), 'opencode', 'pw-browsers');
  if (fs.existsSync(fallback)) process.env.PLAYWRIGHT_BROWSERS_PATH = fallback;
}
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' };
let passed = 0, failed = 0;
function assert(value, message) { if (!value) throw new Error(message || 'assertion failed'); }
async function check(name, fn) { try { await fn(); passed++; console.log('  ok    ' + name); } catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); } }
function serve() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const relative = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).replace(/^\//, '');
      const file = path.resolve(root, relative);
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
      fs.readFile(file, (err, body) => {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' }); res.end(body);
      });
    });
    server.on('error', reject); server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
async function settle(page) { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function open(page, url) { await page.goto(url); await page.locator('#consent').click(); await page.locator('#spoiler-overlay').waitFor({ state:'detached' }); await settle(page); }
async function snapshot(page) {
  return page.evaluate(() => {
    const w=document.getElementById('world'), m=new DOMMatrixReadOnly(getComputedStyle(w).transform);
    const nodes=Array.from(document.querySelectorAll('[data-node]')).map(n=>({id:n.getAttribute('data-node'),text:n.querySelector('[data-node-label]')?.textContent.trim(),box:[n.style.left,n.style.top,n.style.width,n.style.height],label:n.contains(n.querySelector('[data-node-label]'))}));
    const edges=Array.from(document.querySelectorAll('path.edge')).map(e=>[e.getAttribute('data-edge-id')||e.getAttribute('data-edge'),e.getAttribute('d')]);
    const frames=Array.from(document.querySelectorAll('.frame')).map(f=>{const r=f.getBoundingClientRect(),c=document.getElementById('canvas').getBoundingClientRect();return{id:f.getAttribute('data-chapter-frame'),label:f.querySelector('[data-frame-label]')?.textContent.trim(),inside:r.left>=c.left-1&&r.right<=c.right+1&&r.top>=c.top-1&&r.bottom<=c.bottom+1};});
    return {scale:m.a,nodes,edges,frames,lod:document.getElementById('canvas').getAttribute('data-lod'),zoom:document.getElementById('zoomLabel').textContent.trim()};
  });
}
(async function main() {
  let server, browser;
  try {
    server=await serve(); browser=await chromium.launch({headless:true});
    const base='http://127.0.0.1:'+server.address().port+'/prototype/poc4-editorial.html#';
    const desktop=await browser.newPage({viewport:{width:1440,height:900}}); await open(desktop,base);
    await check('desktop fit opens the complete labeled spatial graph',async()=>{
      const s=await snapshot(desktop);
      assert(s.nodes.length===128&&s.nodes.every(n=>n.text&&n.label),'expected all 128 named events in their own boxes');
      assert(s.edges.length===111,'expected all 111 actual connectors');
      assert(s.frames.length===7&&s.frames.every(f=>f.label&&f.inside),'all seven chapter regions and names must fit');
      assert(s.lod===null&&/^\d+%$/.test(s.zoom),'camera has no semantic LOD state');
    });
    await check('zoom changes camera scale without changing world graph',async()=>{
      const before=await snapshot(desktop); await desktop.locator('#plus').click(); await desktop.locator('#plus').click(); await settle(desktop); const after=await snapshot(desktop);
      assert(after.scale>before.scale,'zoom control did not change scale');
      assert(JSON.stringify(after.nodes)===JSON.stringify(before.nodes),'node IDs, labels, or world boxes changed');
      assert(JSON.stringify(after.edges)===JSON.stringify(before.edges),'real edge paths changed');
      assert(after.frames.map(f=>f.label).join('|')===before.frames.map(f=>f.label).join('|'),'chapter names changed');
    });
    await check('chapter focus fits a real region and keeps every edge available',async()=>{
      await desktop.locator('[data-chapter="stormy"]').click(); await settle(desktop); const s=await snapshot(desktop);
      assert(s.frames.find(f=>f.id==='stormy')?.inside,'Stormy Night frame is outside the viewport after focus');
      assert(s.nodes.length===128&&s.edges.length===111,'chapter focus hid map content');
      assert(await desktop.locator('[data-chapter="stormy"]').getAttribute('aria-pressed')==='true','chapter button state did not update');
      await desktop.locator('[data-chapter="all"]').click(); await settle(desktop); await desktop.locator('#fit').click(); await settle(desktop);
      const fit=await snapshot(desktop); assert(fit.frames.every(f=>f.inside),'Fit did not restore all chapter bounds');
    });
    const mobile=await browser.newPage({viewport:{width:390,height:844}}); await open(mobile,base);
    await check('390px viewport retains the same graph and usable chapter focus',async()=>{
      const s=await snapshot(mobile); const width=await mobile.locator('#canvas').evaluate(e=>e.clientWidth);
      assert(Math.abs(width-390)<=1,'mobile canvas width does not match viewport');
      assert(s.nodes.length===128&&s.nodes.every(n=>n.text&&n.label),'mobile fit changed the real node inventory');
      assert(s.edges.length===111,'mobile fit changed the real edge inventory');
      await mobile.locator('[data-chapter="kara"]').click(); await settle(mobile); const focused=await snapshot(mobile);
      assert(focused.frames.find(f=>f.id==='kara')?.inside,'Kara chapter fit falls outside the viewport');
      assert(focused.nodes.length===128&&focused.edges.length===111,'mobile chapter focus hid real graph elements');
      await mobile.locator('[data-chapter="hostage"]').click(); await settle(mobile); const hostage=await snapshot(mobile);
      assert(hostage.frames.find(f=>f.id==='hostage')?.inside,'Hostage chapter fit falls outside the viewport');
      assert(hostage.nodes.length===128&&hostage.edges.length===111,'Hostage focus hid real graph elements');
      assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile document has horizontal overflow');
    });
    await desktop.close(); await mobile.close();
  } catch (e) { failed++; console.error('map-first suite crashed: '+e.stack); }
  finally { if(browser) await browser.close(); if(server) await new Promise(r=>server.close(r)); }
  console.log('\n'+passed+' passed, '+failed+' failed'); process.exit(failed?1:0);
})();
