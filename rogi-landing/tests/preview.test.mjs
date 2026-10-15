import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createPreviewHandler} from '../server/preview-handler.js';
test('preview propagates socket disconnect to request signal', {timeout:5000},async()=>{
 let started,aborted;const startedPromise=new Promise(r=>started=r),abortedPromise=new Promise(r=>aborted=r);
 const server=http.createServer(createPreviewHandler(async request=>{started();await new Promise(resolve=>request.signal.addEventListener('abort',()=>{aborted();resolve();},{once:true}));return new Response('cancelled');},{port:4175}));
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{const client=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/scan',method:'POST'},()=>{});client.on('error',()=>{});client.end('{}');await startedPromise;client.destroy();await abortedPromise;assert.ok(true);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('preview normal response and request size limit',async()=>{
 let calls=0;const server=http.createServer(createPreviewHandler(async request=>{calls++;assert.equal(request.headers.get('cf-connecting-ip'),null);return new Response('ok');},{port:4175}));server.listen(0,'127.0.0.1');await once(server,'listening');
 try{const base='http://127.0.0.1:'+server.address().port;assert.equal(await (await fetch(base,{headers:{'cf-connecting-ip':'8.8.8.8'}})).text(),'ok');assert.equal((await fetch(base,{method:'POST',body:'x'.repeat(4097)})).status,413);assert.equal(calls,1);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
