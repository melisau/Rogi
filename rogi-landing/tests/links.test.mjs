import test from 'node:test';
import assert from 'node:assert/strict';
import {checkInternalLinks} from '../worker/links.js';
test('link checks stay same origin, deduplicate fragments, cap at ten and use two concurrent probes',async()=>{
 let active=0,max=0;const load=async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,1));active--;return {status:200};};
 const links=Array.from({length:12},(_,i)=>'https://example.com/'+i);const result=await checkInternalLinks([...links,links[0]+'#hash','https://elsewhere.com/','http://example.com/','http://127.0.0.1'], 'https://example.com/',{load});assert.equal(result.results.length,10);assert.equal(result.omitted,2);assert.equal(max,2);
});
test('HEAD failures are confirmed with GET; access failures remain unknown',async()=>{
 const methods=[];const result=await checkInternalLinks(['https://example.com/missing','https://example.com/head-only','https://example.com/blocked'],'https://example.com/',{load:async(url,{method})=>{methods.push([url,method]);return {status:url.endsWith('missing')?404:url.endsWith('blocked')?403:method==='HEAD'?405:200};}});
 assert.deepEqual(result.results.map(r=>r.status),['fail','pass','unknown']);assert.equal(methods.filter(x=>x[1]==='GET').length,2);
});
test('aborted link checks make no requests and mark results unknown',async()=>{
 const controller=new AbortController();controller.abort();const result=await checkInternalLinks(['https://example.com/a'],'https://example.com/',{signal:controller.signal,load:()=>{throw Error('must not run');}});assert.equal(result.results[0].status,'unknown');
});
