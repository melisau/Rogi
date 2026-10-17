import test from 'node:test';
import assert from 'node:assert/strict';
import {createHealthHandler} from '../server/health.js';
test('health checks database and reports safe unavailable state',async()=>{
 const request=new Request('https://rogi.test/api/health');
 assert.deepEqual(await (await createHealthHandler({probe:async()=>{}})(request)).json(),{status:'ready',database:'connected'});
 const failed=await createHealthHandler({probe:async()=>{throw Error('postgres://user:password@host');}})(request);
 assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/password|postgres|host/);
 assert.equal(failed.headers.get('cache-control'),'no-store');
});
test('health only accepts GET and HEAD and sends no HEAD body',async()=>{
 let calls=0;const handler=createHealthHandler({probe:async()=>{calls++;}});
 assert.equal((await handler(new Request('https://rogi.test/api/health',{method:'POST'}))).status,405);assert.equal(calls,0);
 const response=await handler(new Request('https://rogi.test/api/health',{method:'HEAD'}));assert.equal(response.status,200);assert.equal(await response.text(),'');assert.equal(calls,1);
});
