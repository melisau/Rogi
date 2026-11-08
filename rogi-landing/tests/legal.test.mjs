import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
const get=path=>worker.fetch(new Request('https://rogi.test'+path));
test('legal and crawler pages are served in both languages',async()=>{
 for(const path of ['/gizlilik','/privacy','/kosullar','/terms','/bot']){
  const r=await get(path);assert.equal(r.status,200,path);
  assert.ok(r.headers.get('content-security-policy'),path);
  const html=await r.text();assert.match(html,/budgetbuddy\.main\.info@gmail\.com/,path);assert.match(html,/rel="canonical"/,path);
 }
});
test('unknown paths get a branded noindex 404 page',async()=>{
 const r=await get('/nope');assert.equal(r.status,404);const html=await r.text();
 assert.match(html,/Sayfa bulunamadı|Bu sayfa bulunamadı/);assert.match(html,/noindex/);
});
test('favicon, share image and sitemap entries exist',async()=>{
 assert.equal((await get('/favicon.ico')).headers.get('content-type'),'image/svg+xml');
 const og=await get('/og.png');assert.equal(og.headers.get('content-type'),'image/png');assert.ok((await og.arrayBuffer()).byteLength>1000);
 const landing=await (await get('/tr')).text();assert.match(landing,/og:image/);assert.match(landing,/href="\/gizlilik"/);
 assert.match(await (await get('/sitemap.xml')).text(),/\/gizlilik</);
});
test('ROGI_ACCOUNTS=off hides accounts and shortens the privacy notice',async()=>{
 const off=path=>worker.fetch(new Request('https://rogi.test'+path),{ROGI_ACCOUNTS:'off'});
 for(const path of ['/account','/projects']){const r=await off(path);assert.equal(r.status,307);assert.equal(r.headers.get('location'),'/app');}
 assert.doesNotMatch(await (await off('/app')).text(),/href="\/projects"/);
 const privacy=await (await off('/gizlilik')).text();assert.match(privacy,/e-posta veya şifre toplanmaz/);assert.doesNotMatch(privacy,/Hesap açarsanız/);
 assert.match(await (await get('/gizlilik')).text(),/Hesap açarsanız/);
});
