'use strict';

// Synthetic preparation fixtures. These are not new game facts or runtime data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { PACKET_VERSION, createDraftPacket, validatePacket } = require('../prototype/validate-chapter-packet');
const source = require('../packets/hostage.packet.json').sources[0];
const atlas = require('../data/atlas.source.json').atlas;
function fixture(version = '1.1', options = ['A', 'B', 'C']) {
  const p = createDraftPacket('fixture', 'Synthetic choice fixture');
  p.packetVersion = version;
  p.sources = [structuredClone(source)];
  p.chart.sources = [source.id];
  p.chart.nodes = [{id:'pick',label:'Choose',kind:'choice',options}, {id:'done',label:'Done',kind:'action'}];
  p.chart.edges = [{id:'e_pick_done',from:'pick',to:'done',fromOption:0,kind:'traced',sources:[source.id]}];
  p.coverage = {status:'partial',scope:'Synthetic fixture only.',included:['Option validation'],omitted:['All gameplay'],sources:[source.id]};
  return p;
}
let count = 0;
function test(name, run) { run(); count++; console.log(`ok ${name}`); }
function valid(p) { const r=validatePacket(p); assert.equal(r.failed,false,r.errors.join('\n')); return r; }
function invalid(p, expression) { const r=validatePacket(p); assert.equal(r.failed,true); if(expression)assert.match(r.errors.join('\n'),expression); }

test('default authoring version and binary output remain 1.0', () => {
  assert.equal(PACKET_VERSION,'1.0');
  assert.equal(createDraftPacket('fixture','Fixture').packetVersion,'1.0');
  valid(fixture('1.0',['A','B']));
});
for (const options of [['A','B','C'],['A','B','C','D']]) {
  test(`version 1.0 still rejects ${options.length} options`,()=>invalid(fixture('1.0',options),/exactly two/));
}
for (const options of [['A','B'],['A','B','C'],['A','B','C','D']]) {
  test(`version 1.1 accepts ${options.length} distinct options`,()=>valid(fixture('1.1',options)));
}
for (const [name,options] of [['empty',[]],['single',['A']],['duplicate',['A','B','A']],['blank',['A','B',' ']],['non-string',['A','B',3]],['not-array','ABC']]) {
  test(`version 1.1 rejects ${name} choices`,()=>{const p=fixture('1.1',options);p.chart.edges=[];invalid(p);});
}
test('option zero and last valid index survive without remapping',()=>{
  const p=fixture('1.1',['A','B','C','D']);
  valid(p); assert.equal(p.chart.edges[0].fromOption,0);
  p.chart.edges[0].fromOption=3; valid(p); assert.equal(p.chart.edges[0].fromOption,3);
});
test('indices must be integers inside the actual option array',()=>{
  for(const option of [-1,1.5,4,'2']) {const p=fixture('1.1',['A','B','C','D']);p.chart.edges[0].fromOption=option;invalid(p,/fromOption/);}
});
test('supplementary external choices use the same packet-version rule',()=>{
  const p=fixture('1.1',['A','B']);
  p.supplementary=[{id:'guide-fixture',basis:'guide-reported',summary:'Synthetic external choice.',sources:[source.id],externalNodes:[{id:'external',label:'External choice',chapter:'elsewhere',kind:'choice',options:['A','B','C','D']}],edges:[]}];
  valid(p);p.packetVersion='1.0';invalid(p,/exactly two/);
});
test('unsupported and non-string versions are rejected',()=>{
  for(const version of ['2.0','1.2',1.1,null])invalid(fixture(version),/packetVersion/);
});
test('version 1.1 does not bypass exact runtime reconciliation',()=>{
  const p=structuredClone(require('../packets/hostage.packet.json'));p.packetVersion='1.1';
  assert.equal(validatePacket(p,{atlas}).failed,false);
  p.chart.nodes.find(n=>n.kind==='choice').options.push('Unsupported new option');
  const r=validatePacket(p,{atlas});assert.equal(r.failed,true);assert.match(r.errors.join('\n'),/options differ from ATLAS/);
});
test('supplementary runtime reconciliation compares complete option labels and order',()=>{
  for (const version of ['1.0','1.1']) {
    const p=structuredClone(require('../packets/the-painter.packet.json'));p.packetVersion=version;
    const fish=atlas.nodes.find(n=>n.id==='fish');
    const node={id:fish.id,label:fish.label,kind:fish.kind,chapter:fish.chapter,options:[...fish.options]};
    p.supplementary=[{id:'synthetic-external',basis:'guide-reported',summary:'Synthetic reconciliation fixture.',sources:[p.sources[0].id],externalNodes:[node],edges:[]}];
    assert.equal(validatePacket(p,{atlas}).failed,false);
    for(const options of [[...fish.options].reverse(),['Different','Labels'],...(version==='1.1'?[['A','B','C']]:[])]) {
      node.options=options;const result=validatePacket(p,{atlas});
      assert.equal(result.failed,true,'external choices bypassed runtime reconciliation');
      assert.match(result.errors.join('\n'),/external node.*options differ from ATLAS/);
    }
  }
});
test('CLI accepts a 1.1 preparation fixture but does not approve its review gate',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ra9-choice-arity-'));
  try {
    const file=path.join(dir,'fixture.json');fs.writeFileSync(file,JSON.stringify(fixture()));
    const cli=path.resolve(__dirname,'../prototype/validate-chapter-packet.js');
    const plain=spawnSync(process.execPath,[cli,file],{encoding:'utf8'});assert.equal(plain.status,0,plain.stdout+plain.stderr);
    const review=spawnSync(process.execPath,[cli,file,'--require-review'],{encoding:'utf8'});assert.equal(review.status,2,review.stdout+review.stderr);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
console.log(`${count} packet choice arity tests passed`);
