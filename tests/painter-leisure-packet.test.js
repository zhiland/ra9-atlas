'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { readPacket, validatePacket } = require('../prototype/validate-chapter-packet');
const file = path.resolve(__dirname, '../packets/the-painter-leisure.packet.json');
const packet = readPacket(file);
let count=0;
function test(name,run){run();count++;console.log(`ok ${name}`);}
test('reviewed 1.1 leisure preparation reconciles its bounded runtime subset',()=>{
 const r=validatePacket(packet,{atlas:require('../data/atlas.source.json').atlas});assert.equal(r.failed,false,r.errors.join('\n'));
 assert.equal(r.reviewReady,false);assert.equal(packet.packetVersion,'1.1');
 assert.equal(packet.atlas.exactChapterNodes,false);assert.equal(packet.atlas.exactChapterEdges,false);assert.equal(packet.coverage.status,'partial');
});
test('six graph objects preserve stage, action and four descriptive row groups',()=>{
 assert.deepEqual(packet.chart.nodes.map(n=>[n.id,n.label,n.kind]),[
 ['pt_find','FIND SOMETHING TO DO','stage'],['pt_activity','Activity row group','choice'],
 ['pt_chess','Chess result row group','choice'],['pt_book','Book row group','choice'],
 ['pt_piano','Piano variation row group','choice'],['pt_studio','TAKE CARL TO THE STUDIO','action']]);
});
test('thirteen source rows preserve spelling, order and 3/3/3/4 grouping',()=>{
 assert.deepEqual(packet.chart.nodes.filter(n=>n.kind==='choice').map(n=>n.options),[
 ['PLAY CHESS','READ BOOK','PLAY PIANO'],['WIN','LOSE','DRAW'],
 ['THE REPUBLIC BY PLATO','TRAGEDIES OF WILLIAM SHAKESPEARE','ODES BY JOHN KEATS'],
 ['MELANCHOLIC','HOPEFUL','INTIMATE','ENIGMATIC']]);
});
test('seven traced relationships retain row-specific entries and common bracket exits',()=>{
 assert.deepEqual(packet.chart.edges.map(e=>[e.id,e.from,e.to,e.fromOption??null]),[
 ['e_pt_find_activity','pt_find','pt_activity',null],['e_pt_activity_chess','pt_activity','pt_chess',0],
 ['e_pt_activity_book','pt_activity','pt_book',1],['e_pt_activity_piano','pt_activity','pt_piano',2],
 ['e_pt_chess_studio','pt_chess','pt_studio',null],['e_pt_book_studio','pt_book','pt_studio',null],
 ['e_pt_piano_studio','pt_piano','pt_studio',null]]);
 assert.ok(packet.chart.edges.every(e=>e.kind==='traced'&&e.sources.includes('steamPainterLeisure')&&e.legacyEdgeIndex>=106));
});
test('group semantics, completion and build unknowns remain sourced without new mechanics',()=>{
 assert.deepEqual(packet.unknowns.map(u=>u.id),['u_ptl_group_semantics','u_ptl_common_exit','u_ptl_completion','u_ptl_build']);
 assert.ok(packet.unknowns.every(u=>u.status==='unknown'&&u.explanation.trim()&&u.nodes.length&&u.sources.length));
 assert.deepEqual(packet.conditions,[]);assert.deepEqual(packet.supplementary,[]);assert.deepEqual(packet.conflicts,[]);
});
test('worker access remains distinct from source inspection and publication approval',()=>{
 for(const source of packet.sources){
  assert.equal(source.rights.state,'reference-only');
  assert.ok(source.access.some(a=>a.actor==='extraction worker'&&a.outcome==='not-accessed'));
  assert.ok(source.access.some(a=>a.actor==='Codex extraction parent'&&a.outcome==='inspected'));
 }
 assert.equal(packet.packetStatus,'reviewed');assert.equal(packet.review.independent.state,'approved');assert.equal(packet.review.mergeGate.state,'blocked');
 const r=spawnSync(process.execPath,[path.resolve(__dirname,'../prototype/validate-chapter-packet.js'),file,'--require-review'],{encoding:'utf8'});assert.equal(r.status,2,r.stdout+r.stderr);
});
console.log(`${count} Painter leisure packet tests passed`);
