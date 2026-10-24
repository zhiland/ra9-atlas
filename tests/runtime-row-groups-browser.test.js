'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const fallback=path.join(os.tmpdir(),'opencode','pw-browsers');if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&fs.existsSync(fallback))process.env.PLAYWRIGHT_BROWSERS_PATH=fallback;
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),real=require('../data/atlas.source.json').atlas;
const R=require('../prototype/atlas-row-layout');
let count=0;
function data(options){const a=structuredClone(real);a.meta.contractVersion='1.1';Object.assign(a.nodes[0],{label:'Synthetic source row group',kind:'choice',rowGroup:true,x:50,y:400,w:320,h:210,options});a.edges[0].fromOption=0;return a;}
(async()=>{let browser,server;try{
 server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,body)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body);});
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await chromium.launch();
 for(const variant of ['editorial','amber','darkcyan'])for(const viewport of [{width:1440,height:900},{width:390,height:845}]){
  const options=viewport.width===390?['MELANCHOLIC','HOPEFUL','INTIMATE','<b>NOT HTML</b>']:['THE REPUBLIC BY PLATO','TRAGEDIES OF WILLIAM SHAKESPEARE','ODES BY JOHN KEATS'];
  const fixture=data(options),node=fixture.nodes[0],page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/atlas-data.js',route=>route.fulfill({contentType:'text/javascript',body:'var ATLAS = '+JSON.stringify(fixture)+';'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/prototype/poc4-${variant}.html`);await page.locator('#consent').click();
  await page.locator('[data-chapter="home"]').click();
  const group=page.locator('[data-node="a_welcome"]');assert.equal(await group.locator('[data-row-index]').count(),options.length);
  assert.match(await group.getAttribute('aria-label'),/Source row group/);
  for(let i=0;i<options.length;i++){
   await page.evaluate(index=>{ATLAS.edges[0].fromOption=index;ATLAS.nodes[1].x=index===1?125:240;document.querySelector('[data-node="a_welcome"]').click();},i);
   const measured=await page.evaluate(index=>{
    const n=document.querySelector('[data-node="a_welcome"]'),row=n.querySelector('[data-row-index="'+index+'"]'),nr=n.getBoundingClientRect(),rr=row.getBoundingClientRect();
    const scale=new DOMMatrixReadOnly(getComputedStyle(document.getElementById('world')).transform).a;
    const range=document.createRange();range.selectNodeContents(row);const tr=range.getBoundingClientRect();
    const edge=document.querySelector('path[data-edge-id="e_home_welcome_todd"]'),a=ATLAS.nodes[0],b=ATLAS.nodes[1];
    const inside=(point,box)=>point.x>box.x+.01&&point.x<box.x+box.w-.01&&point.y>box.y+.01&&point.y<box.y+box.h-.01;
    let hidden=false;for(let length=1;length<edge.getTotalLength();length+=3){const point=edge.getPointAtLength(length);if(inside(point,a)||inside(point,b)){hidden=true;break;}}
    return {hidden,anchor:edge.getPointAtLength(0).y,rowY:400+(rr.top+rr.height/2-nr.top)/scale,text:row.textContent,contained:tr.left>=rr.left-1&&tr.right<=rr.right+1&&tr.top>=rr.top-1&&tr.bottom<=rr.bottom+1};
   },i);
   assert.equal(measured.hidden,false,'row path passes through an endpoint interior');
   assert.ok(Math.abs(measured.anchor-R.anchorY(node,i))<.01,'SVG anchor differs from module');
   assert.ok(Math.abs(measured.rowY-measured.anchor)<.1,'SVG anchor misses rendered row center');assert.equal(measured.text,options[i]);assert.ok(measured.contained,'full row text leaves its row');
  }
  await page.evaluate(()=>{delete ATLAS.edges[0].fromOption;document.querySelector('[data-node="a_welcome"]').click();});
  assert.equal(await page.locator('path[data-edge-id="e_home_welcome_todd"]').evaluate(p=>p.getPointAtLength(0).y),505,'common exit must use whole group midpoint');
  await page.locator('#q').fill(options.at(-1));await page.locator('#results [data-hit="a_welcome"]').click();
  await page.locator('#details').waitFor({state:'visible'});assert.match(await page.locator('#details').innerText(),/Source rows shown/i);
  assert.deepEqual(await page.locator('#details .opt-list li').allTextContents(),options);assert.equal(await page.locator('#details .opt-list b').count(),0);
  await page.evaluate(()=>{ATLAS.edges[0].fromOption=ATLAS.nodes[0].options.length-1;location.hash='#home/a_todd?edge=0';});
  await page.locator('#details [data-edge-evidence="0"]').waitFor({state:'visible'});assert.equal(await page.locator('path.edge.focused[data-edge-id="e_home_welcome_todd"]').count(),1);
  assert.equal(await page.locator('[data-node]').count(),123);assert.deepEqual(errors,[]);
  console.log(`ok ${variant} ${viewport.width}px: rows, anchors, common exit, search, evidence and escaping`);count++;await page.close();
 }
 console.log(`${count} runtime row-group browser tests passed`);
}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}})().catch(e=>{console.error(e);process.exitCode=1;});
