'use strict';
// Reviewed source slice only. This does not validate game mechanics.
const NODES = [
 ['pt_activity','Activity row group','choice',['PLAY CHESS','READ BOOK','PLAY PIANO']],
 ['pt_chess','Chess result row group','choice',['WIN','LOSE','DRAW']],
 ['pt_book','Book row group','choice',['THE REPUBLIC BY PLATO','TRAGEDIES OF WILLIAM SHAKESPEARE','ODES BY JOHN KEATS']],
 ['pt_piano','Piano variation row group','choice',['MELANCHOLIC','HOPEFUL','INTIMATE','ENIGMATIC']],
 ['pt_studio','TAKE CARL TO THE STUDIO','action',null]
];
const EDGES = [
 ['e_pt_find_activity','pt_find','pt_activity',null],
 ['e_pt_activity_chess','pt_activity','pt_chess',0],
 ['e_pt_activity_book','pt_activity','pt_book',1],
 ['e_pt_activity_piano','pt_activity','pt_piano',2],
 ['e_pt_chess_studio','pt_chess','pt_studio',null],
 ['e_pt_book_studio','pt_book','pt_studio',null],
 ['e_pt_piano_studio','pt_piano','pt_studio',null]
];
const UNKNOWN_IDS = ['u_ptl_group_semantics','u_ptl_common_exit','u_ptl_completion','u_ptl_build'];
const list = value => Array.isArray(value) ? value : [];
const records = value => list(value).filter(v => v && typeof v === 'object');
function painterLeisureRuntimeErrors(atlas) {
 const errors=[];
 if (!atlas || typeof atlas !== 'object') return ['Painter leisure atlas must be an object'];
 const chapter=records(atlas.chapters).find(c=>c.id==='the-painter');
 if (atlas.meta?.contractVersion !== '1.1' || chapter?.coverage?.status !== 'partial') errors.push('Painter leisure requires runtime1.1 and partial coverage');
 for (const source of ['steamPainterLeisure','powerpyxPainterLeisure']) if (!list(chapter?.coverage?.sources).includes(source)) errors.push(`Painter leisure needs coverage source ${source}`);
 const nodes=records(atlas.nodes),ids=new Set(NODES.map(n=>n[0]));
 for (const [id,label,kind,options] of NODES) {
  const n=nodes.find(n=>n.id===id);
  if (!n || n.label!==label || n.kind!==kind || n.chapter!=='the-painter' || n.status!=='ocr' || !list(n.src).includes('steamPainterLeisure') || JSON.stringify(n.options??null)!==JSON.stringify(options) || (kind==='choice' ? n.rowGroup!==true : n.rowGroup===true)) errors.push(`Painter leisure node ${id} must retain reviewed rows, representation and source`);
 }
 const touching=records(atlas.edges).filter(e=>ids.has(e.from)||ids.has(e.to));
 if (touching.length!==EDGES.length) errors.push('Painter leisure must retain exactly seven reviewed relationships');
 for (const [id,from,to,option] of EDGES) {
  const e=touching.find(e=>e.id===id);
  if (!e || e.from!==from || e.to!==to || (e.fromOption??null)!==option || e.kind!=='traced' || !list(e.src).includes('steamPainterLeisure')) errors.push(`Painter leisure edge ${id} must retain reviewed endpoints, row origin and chart source`);
 }
 const allowed=new Set(EDGES.map(e=>e[0]));
 for (const e of touching) if (!allowed.has(e.id)) errors.push(`Unexpected Painter leisure edge ${e.id}`);
 for (const c of records(atlas.conditions)) if ((Array.isArray(c.appliesTo)?c.appliesTo:[c.appliesTo]).some(id=>allowed.has(id))) errors.push('Painter leisure must not acquire eligibility or completion conditions');
 for (const id of UNKNOWN_IDS) {
  const u=records(atlas.uncertainties).find(u=>u.id===id);
  if (!u || u.status!=='unknown' || typeof u.explanation!=='string' || !u.explanation.trim() || !list(u.nodes).some(id=>ids.has(id)||id==='pt_find') || !list(u.sources).includes('steamPainterLeisure')) errors.push(`Painter leisure unknown ${id} must retain explanation and source references`);
 }
 return errors;
}
module.exports={painterLeisureRuntimeErrors};
