import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanHandler} from '../worker/audit.js';
test('request cancellation reaches scan and releases concurrency slot',async()=>{
 const controller=new AbortController();let calls=0;
 const handler=createScanHandler({maxConcurrent:1,runScan:async(url,{signal})=>{calls++;if(calls===1){assert.equal(signal.aborted,false);controller.abort();signal.throwIfAborted();}return {ok:true};}});
 const request=signal=>new Request('https://rogi.test/api/scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:'https://example.com'}),signal});
 assert.equal((await handler(request(controller.signal))).status,499);
 const retry=await handler(request());assert.equal(retry.status,200);assert.equal(calls,2);
});
