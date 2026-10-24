'use strict';
const assert = require('node:assert/strict');
const R = require('../prototype/atlas-row-layout');
const { validateAtlas } = require('../prototype/validate-atlas-data');
const atlas = require('../data/atlas.source.json').atlas;
const group = options => ({id:'synthetic',kind:'choice',rowGroup:true,x:10,y:20,w:320,h:186,options:options||['A','B','C','D']});
let count=0;
function test(name,run){run();count++;console.log(`ok ${name}`);}
function candidate(){const a=structuredClone(atlas);a.meta.contractVersion='1.1';Object.assign(a.nodes[0],{kind:'choice',rowGroup:true,options:['A','B','C','D'],h:180});return a;}
function errors(a){return validateAtlas(a).checks.flatMap(c=>c.errors).join('\n');}
test('legacy option anchors preserve every existing binary row exactly',()=>{
 for(const n of atlas.nodes.filter(n=>n.kind==='choice'&&!n.rowGroup))for(let i=0;i<n.options.length;i++)assert.equal(R.anchorY(n,i),n.y+(i+.5)*n.h/n.options.length);
 assert.equal(R.layout(atlas.nodes[0]),null);
});
test('three and four rows divide the inner box below a fixed heading',()=>{
 for(const options of [['A','B','C'],['A','B','C','D']]){
  const n=group(options),g=R.layout(n);assert.equal(g.headerHeight,24);assert.equal(g.rows.length,options.length);
  assert.equal(g.rows[0].y,n.y+25);assert.ok(Math.abs(g.rows.at(-1).y+g.rows.at(-1).h-(n.y+n.h-1))<1e-9);
  for(const row of g.rows){assert.equal(row.w,n.w-2);assert.equal(R.anchorY(n,row.index),row.y+row.h/2);}
 }
});
test('invalid option indices cannot create guessed row anchors',()=>{
 for(const i of [-1,1.5,4,'2'])assert.throws(()=>R.anchorY(group(),i),RangeError);
});
test('production1.1 validates and legacy binary shape remains supported in1.0',()=>{
 assert.equal(errors(atlas),'');for(const n of atlas.nodes.filter(n=>n.kind==='choice'&&!n.rowGroup))assert.deepEqual(R.errors(n,'1.0'),[]);
});
test('explicit 1.1 group fixture passes the whole atlas validator',()=>{assert.equal(errors(candidate()),'');});
test('binary 1.0 and unflagged legacy choices cannot silently become multi-row',()=>{
 let a=candidate();a.meta.contractVersion='1.0';assert.match(errors(a),/rowGroup requires contract 1.1/);
 a=candidate();delete a.nodes[0].rowGroup;assert.match(errors(a),/exactly 2/);
});
test('rowGroup flag belongs only to valid choice groups in supported versions',()=>{
 for(const change of [n=>{n.kind='action';},n=>{n.rowGroup='yes';}]){const a=candidate();change(a.nodes[0]);assert.match(errors(a),/rowGroup/);}
 const a=candidate();a.meta.contractVersion='9.0';assert.match(errors(a),/contractVersion/);
});
test('duplicate, blank, non-string and sparse rows fail shape checks',()=>{
 const sparse=['A','B'];sparse.length=3;
 for(const options of [[],['A'],['A','B','A'],['A',' ','C'],['A',3,'C'],sparse])assert.ok(R.errors(group(options),'1.1').length);
});
test('row geometry rejects undersized heights and invalid inner bounds',()=>{
 for(const change of [n=>{n.h=80;},n=>{n.w=0;},n=>{n.x=NaN;}]){const n=group();change(n);assert.ok(R.errors(n,'1.1').length);assert.throws(()=>R.layout(n),RangeError);}
});
test('whole atlas row option bounds preserve zero and the last valid row',()=>{
 const a=candidate();const edge=a.edges[0];edge.fromOption=3;assert.equal(errors(a),'');
 edge.fromOption=0;assert.equal(errors(a),'');edge.fromOption=4;assert.match(errors(a),/invalid fromOption/);
});
test('authored paths cannot point at a different row while claiming an option index',()=>{
 const a=candidate(),n=a.nodes[0],e=a.edges[0];e.fromOption=3;
 const y=R.anchorY(n,3);e.points=[[220,y],[230,y],[230,292],[240,292]];assert.equal(errors(a),'');
 e.points=[[220,260],[230,260],[230,292],[240,292]];assert.match(errors(a),/authored start must match its source row center/);
});
test('overlapping columns use an outside corridor above and below',()=>{
 const a=group();
 for(const y of [-200,300]){
  const b={x:50,y,w:170,h:84};
  const points=R.routePoints(a,b,{fromOption:2});
  assert.equal(points[0][1],R.anchorY(a,2));
  assert.equal(points[1][0],Math.max(a.x+a.w,b.x+b.w)+24);
 }
 const b={x:125,y:-200,w:170,h:84};a.x=50;
 assert.equal(R.routePoints(a,b,{fromOption:1})[1][0],26);
 assert.equal(R.routePoints(a,b,{fromOption:1,via:0})[1][0],0);
 assert.throws(()=>R.routePoints(a,b,{fromOption:1,via:172.5}),/outside corridor/);
});
test('separated columns use their gap and preserve legacy routing',()=>{
 const a=group();
 for(const x of [-400,500]){
  const b={x,y:300,w:170,h:84};const points=R.routePoints(a,b,{fromOption:0});
  assert.equal(points[1][0],x<0?(a.x+x+b.w)/2:(a.x+a.w+x)/2);
  assert.throws(()=>R.routePoints(a,b,{fromOption:0,via:NaN}),/finite/);
 }
 assert.equal(R.routePoints({...a,rowGroup:false},{},{fromOption:0}),null);
 assert.equal(R.routePoints(a,{},{}),null);
});
test('authored row paths cannot hide inside an endpoint or use malformed points',()=>{
 const a=group(),b={x:500,y:300,w:170,h:84},y=R.anchorY(a,0);
 for(const points of [[[330,y],[200,y],[200,342],[500,342]],[[330,y],[400,y],[400,342],[600,342],[500,342]]])
  assert.throws(()=>R.routePoints(a,b,{fromOption:0,points}),/endpoint interior/);
 for(const points of [[],[[330,y],[NaN,342]],[[330,y],[500,342]]])
  assert.throws(()=>R.routePoints(a,b,{fromOption:0,points}),RangeError);
});
console.log(`${count} runtime row-group tests passed`);
