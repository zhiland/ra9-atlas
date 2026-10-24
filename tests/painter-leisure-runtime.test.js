'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {painterLeisureRuntimeErrors:leisure}=require('../prototype/validate-painter-leisure-runtime');
const {painterRuntimeErrors:opening}=require('../prototype/validate-painter-runtime');
const {validateAtlas}=require('../prototype/validate-atlas-data');
const atlas=require('../data/atlas.source.json').atlas,ledger=require('../data/legacy-index.json');
const packet=require('../packets/the-painter-leisure.packet.json'),before=require('./fixtures/pre-leisure-atlas.json');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
let count=0;function test(name,run){run();count++;console.log(`ok ${name}`);}
function rejects(name,change){test(name,()=>{const a=structuredClone(atlas);change(a);assert.ok(leisure(a).length||opening(a).length);});}
test('whole atlas and both bounded source fences pass',()=>{assert.deepEqual(leisure(atlas),[]);assert.deepEqual(opening(atlas),[]);const r=validateAtlas(atlas);assert.equal(r.failed,false,JSON.stringify(r.checks.filter(c=>c.errors.length)));});
test('every prior node, edge, detail, condition, unknown and other chapter stays exact',()=>{
 for(const [key,n] of [['nodes',123],['edges',106],['uncertainties',18]])assert.equal(digest(atlas[key].slice(0,n)),before[key]);
 assert.equal(digest(atlas.conditions),before.conditions);
 for(const [id,hash]of Object.entries(before.detail))assert.equal(digest(atlas.detail[id]),hash,id);
 for(const [id,url]of Object.entries(before.refs))assert.equal(atlas.refs[id],url,id);
 assert.equal(digest(atlas.chapters.filter(c=>c.id!=='the-painter')),before.otherChapters);
 assert.equal(digest(ledger.nodes.slice(0,123)),before.legacyNodeIds);assert.equal(digest(ledger.edges.slice(0,106)),before.legacyEdges);
});
test('five nodes and seven edges append, with one reused checkpoint and exact indices',()=>{
 assert.deepEqual(atlas.nodes.slice(123).map(n=>n.id),packet.chart.nodes.slice(1).map(n=>n.id));
 assert.deepEqual(atlas.edges.slice(106).map(e=>e.id),packet.chart.edges.map(e=>e.id));
 assert.deepEqual(packet.chart.edges.map(e=>e.legacyEdgeIndex),[106,107,108,109,110,111,112]);
 assert.equal(atlas.nodes.filter(n=>n.id==='pt_find').length,1);
 assert.equal(atlas.meta.counts.nodes,128);assert.equal(atlas.meta.counts.activeEdges,111);
});
test('four exact row groups preserve thirteen labels and common exits stay whole-group',()=>{
 assert.deepEqual(atlas.nodes.slice(123,127).map(n=>n.options),packet.chart.nodes.slice(1,5).map(n=>n.options));
 assert.equal(atlas.nodes.slice(123,127).flatMap(n=>n.options).length,13);
 assert.ok(atlas.edges.slice(110).every(e=>e.fromOption==null));
});
test('all new unknowns remain exact and publication stays blocked',()=>{
 const expected=packet.unknowns.map(u=>Object.fromEntries(Object.entries(u).filter(([k,v])=>!['nodes','edges'].includes(k)||v.length)));
 assert.deepEqual(atlas.uncertainties.slice(18),expected);assert.equal(packet.review.mergeGate.state,'blocked');
});
for(const [name,change] of [
 ['row flag',a=>{a.nodes[123].rowGroup=false;}],['label',a=>{a.nodes[123].label='Invented';}],
 ['row order',a=>{a.nodes[124].options.reverse();}],['source',a=>{a.nodes[125].src=[];}],
 ['missing group',a=>{a.nodes.splice(125,1);}],['extra node',a=>{a.nodes.push({...a.nodes[123],id:'invented'});}],
 ['activity row zero',a=>{a.edges[107].fromOption=2;}],['common exit option',a=>{a.edges[110].fromOption=0;}],
 ['missing relation',a=>{a.edges.splice(112,1);}],['extra relation',a=>{a.edges.push({id:'invented',from:'pt_find',to:'pt_studio'});}],
 ['invented opening bridge',a=>{a.edges.push({id:'invented',from:'pt_birds',to:'pt_activity'});}],
 ['eligibility',a=>{a.conditions.push({appliesTo:['e_pt_activity_book']});}],
 ['unknown promotion',a=>{a.uncertainties.at(-1).status='verified';}],['coverage promotion',a=>{a.chapters.at(-1).coverage.status='complete';}],
 ['version downgrade',a=>{a.meta.contractVersion='1.0';}]
])rejects(`reject ${name}`,change);
test('missing collections return errors',()=>{assert.ok(leisure({}).length);assert.ok(leisure(null).length);});
console.log(`${count} Painter leisure runtime tests passed`);
