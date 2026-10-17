import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectsHandler} from '../server/projects.js';
const id='11111111-1111-4111-8111-111111111111';
const request=(method='GET',body,path='')=>new Request('https://rogi.test/api/projects'+path,{method,headers:{origin:'https://rogi.test','content-type':'application/json'},body:body?JSON.stringify(body):undefined});
const auth=async()=>Response.json({session:{id:'session-a'},user:{id:'user-a'}});
test('projects require a valid session before storage access',async()=>{
 const handler=createProjectsHandler({auth:async()=>Response.json(null),store:{list:()=>{throw Error('storage must not run');}}});assert.equal((await handler(request())).status,401);
});
test('project owner is supplied only by verified session',async()=>{
 const calls=[];const handler=createProjectsHandler({auth,store:{create:async(owner,payload)=>{calls.push({owner,payload});return {id,...payload};}}});
 const response=await handler(request('POST',{name:' Demo ',url:'https://example.com'}));assert.equal(response.status,201);assert.equal(calls[0].owner,'user-a');assert.equal(calls[0].payload.name,'Demo');
 assert.equal((await handler(request('POST',{name:'Demo',url:'',owner_id:'user-b'}))).status,400);assert.equal(calls.length,1);
});
test('foreign/missing project returns 404 for read and update',async()=>{
 const handler=createProjectsHandler({auth,store:{get:async(owner,key)=>{assert.equal(owner,'user-a');assert.equal(key,id);},update:async(owner)=>{assert.equal(owner,'user-a');}}});
 assert.equal((await handler(request('GET',undefined,'/'+id))).status,404);assert.equal((await handler(request('PATCH',{name:'Update',url:''},'/'+id))).status,404);
});
test('projects reject cross-origin changes and unsafe URLs',async()=>{
 const handler=createProjectsHandler({auth,store:{create:()=>{throw Error('must not write');}}});
 assert.equal((await handler(new Request('https://rogi.test/api/projects',{method:'POST',headers:{origin:'https://evil.test'}}))).status,403);
 assert.equal((await handler(request('POST',{name:'Test',url:'http://127.0.0.1'}))).status,400);
});
