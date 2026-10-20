import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthHandler} from '../server/auth.js';
const url='https://rogi.test/api/auth/sign-in/email';
const request=(origin='https://rogi.test')=>new Request(url,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'private'})});
const config=()=>({baseUrl:'https://example.neonauth.us-east-1.aws.neon.tech/neondb/auth',cookieSecret:'x'.repeat(48)});
test('auth adapter routes body without losing separate cookies',async()=>{
 const handler=createAuthHandler({config,proxy:async args=>{assert.equal(args.path,'sign-in/email');assert.equal((await args.request.json()).password,'private');const headers=new Headers();headers.append('set-cookie','one=a; HttpOnly; Secure; SameSite=Lax');headers.append('set-cookie','two=b; Expires=Wed, 01 Jan 2030 00:00:00 GMT; HttpOnly; Secure');return new Response('{}',{headers});}});
 const response=await handler(request(),'sign-in/email');assert.equal(response.headers.getSetCookie().length,2);assert.equal(response.headers.get('cache-control'),'no-store');
});
test('auth rejects cross-origin, unsupported endpoints and missing configuration',async()=>{
 let calls=0;const handler=createAuthHandler({config,proxy:async()=>{calls++;return new Response('{}');}});
 assert.equal((await handler(request('https://evil.test'),'sign-in/email')).status,403);
 assert.equal((await handler(request(),'admin/delete-user')).status,404);
 assert.equal((await handler(new Request(url),'sign-in/email')).status,405);assert.equal(calls,0);
 assert.equal((await createAuthHandler({config:()=>({})})(request(),'sign-in/email')).status,503);
});
test('account recovery routes are proxied and email links must return to this site',async()=>{
 const paths=[];const handler=createAuthHandler({config,proxy:async args=>{paths.push(args.path);return Response.json({status:true});}});
 const post=(path,body,origin='https://rogi.test')=>handler(new Request('https://rogi.test/api/auth/'+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}),path);
 assert.equal((await post('request-password-reset',{email:'a@example.com',redirectTo:'https://rogi.test/account'})).status,200);
 assert.equal((await post('request-password-reset',{email:'a@example.com',redirectTo:'https://evil.test/account'})).status,400);
 assert.equal((await post('request-password-reset',{email:'a@example.com'})).status,400);
 assert.equal((await post('send-verification-email',{email:'a@example.com',callbackURL:'https://rogi.test/account'})).status,200);
 assert.equal((await post('send-verification-email',{email:'a@example.com',callbackURL:'https://rogi.test/account/../evil'})).status,400);
 assert.equal((await post('reset-password',{token:'t',newPassword:'new-password-1'})).status,200);
 assert.equal((await post('change-password',{currentPassword:'old-password',newPassword:'new-password-1',revokeOtherSessions:true})).status,200);
 assert.equal((await post('change-password',{currentPassword:'x',newPassword:'y'},'https://evil.test')).status,403);
 assert.equal((await post('delete-user',{})).status,404);
 assert.deepEqual(paths,['request-password-reset','send-verification-email','reset-password','change-password']);
});
