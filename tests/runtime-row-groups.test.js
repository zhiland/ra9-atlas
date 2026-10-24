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
 for(const n of atlas.nodes.filter(n=>n.kind==='choice'))for(let i=0;i<n.options.length;i++)assert.equal(R.anchorY(n,i),n.y+(i+.5)*n.h/n.options.length);
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
test('legacy metadata and explicit 1.1 both validate existing atlas data',()=>{
 assert.equal(errors(atlas),'');const a=structuredClone(atlas);a.meta.contractVersion='1.1';assert.equal(errors(a),'');
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
console.log(`${count} runtime row-group tests passed`);
