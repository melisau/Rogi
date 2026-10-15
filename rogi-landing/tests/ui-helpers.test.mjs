import test from 'node:test';
import assert from 'node:assert/strict';
import {compareReports,selectProjectFiles,sortFindings} from '../worker/ui-helpers.js';
const report=checks=>({url:'https://example.com/',checks:checks.map(([id,status])=>({id,status,label:id}))});
test('comparison distinguishes new, resolved, unverified, unchanged and removed',()=>{
 const result=compareReports(report([['a','pass'],['b','fail'],['c','unknown'],['d','fail'],['e','na']]),report([['a','fail'],['b','pass'],['c','fail'],['d','fail'],['gone','fail']]));
 assert.deepEqual(result.resolved.map(c=>c.id),['a']);assert.deepEqual(result.newIssues.map(c=>c.id),['b']);assert.deepEqual(result.changed.map(c=>c.id),['c','e']);assert.deepEqual(result.unchanged.map(c=>c.id),['d']);assert.deepEqual(result.removed.map(c=>c.id),['gone']);
});
test('different sites never compared',()=>assert.equal(compareReports(report([]),{url:'https://other.com/',checks:[]}),null));
test('project scope reports every skipped path and reason',()=>{
 const files=[{name:'a.ts',size:5,path:'src/a.ts'},{name:'b.ts',size:5,path:'node_modules/b.ts'},{name:'photo.png',size:10},{name:'big.ts',size:500000},{name:'extra.ts',size:10}];
 const r=selectProjectFiles(files,{maxFiles:1});assert.equal(r.included.length,1);assert.deepEqual(r.skipped.map(x=>x.reason),['excluded_directory','unsupported_type','file_too_large','file_count_limit']);
});

test('project reads have a total byte budget',()=>{const r=selectProjectFiles([{name:'a.ts',size:60},{name:'b.ts',size:60}],{maxTotalBytes:100});assert.equal(r.included.length,1);assert.equal(r.skipped[0].reason,'project_size_limit');});

test('effort sorting keeps failures first and does not mutate input',()=>{
 const checks=[{id:'a',status:'fail',priority:'Yüksek',effort:'Orta'},{id:'b',status:'fail',priority:'Orta',effort:'Düşük'},{id:'c',status:'pass',priority:'Yüksek',effort:'Düşük'}];
 assert.deepEqual(sortFindings(checks).map(c=>c.id),['a','b','c']);assert.deepEqual(sortFindings(checks,'effort').map(c=>c.id),['b','a','c']);assert.equal(checks[0].id,'a');
});
