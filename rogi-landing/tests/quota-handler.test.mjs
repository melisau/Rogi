import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanHandler} from '../worker/audit.js';
import {AuditError} from '../worker/engine.js';
const request=()=>new Request('https://rogi.test/api/scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:'https://example.com'})});
test('distributed quota rejects before scan and supplies retry-after',async()=>{
 let scanned=false;const handler=createScanHandler({acquireLease:async()=>({allowed:false,retryAfter:27}),runScan:async()=>{scanned=true;}});const response=await handler(request());assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'27');assert.equal(scanned,false);
});
test('distributed lease is released after scan errors',async()=>{
 let released=0;const handler=createScanHandler({acquireLease:async()=>({allowed:true,release:async()=>{released++;}}),runScan:async()=>{throw Error('failure');}});assert.equal((await handler(request())).status,502);assert.equal(released,1);
});
test('unavailable distributed quota fails closed',async()=>{
 let scanned=false;const handler=createScanHandler({acquireLease:async()=>{throw new AuditError('unavailable',503,'quota_unavailable');},runScan:async()=>{scanned=true;}});assert.equal((await handler(request())).status,503);assert.equal(scanned,false);
});
