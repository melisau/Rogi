import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanHandler} from '../worker/audit.js';
const request=()=>new Request('https://rogi.test/api/scan',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'8.8.8.8'},body:JSON.stringify({url:'https://example.com/private?token=sensitive'})});
test('metrics record success and rate rejection without request or report contents',async()=>{
 const metrics=[];let clock=0;const handler=createScanHandler({maxPerMinute:1,now:()=>clock,onMetric:m=>metrics.push(m),runScan:async()=>{clock=25;return {secret:'report evidence'};}});
 assert.equal((await handler(request())).status,200);assert.equal((await handler(request())).status,429);
 assert.deepEqual(metrics.map(m=>m.outcome),['success','limited']);assert.equal(metrics[0].durationMs,25);
 for(const m of metrics)assert.deepEqual(Object.keys(m).sort(),['activeScans','durationMs','event','outcome','status']);
 assert.doesNotMatch(JSON.stringify(metrics),/sensitive|8\.8\.8\.8|example|evidence/);
});
test('metric sink failure never changes scan response',async()=>{
 const handler=createScanHandler({onMetric:()=>{throw Error('sink failed');},runScan:async()=>({ok:true})});
 assert.equal((await handler(request())).status,200);
});
