import test from 'node:test';
import assert from 'node:assert/strict';
import {safeUrl,isPublicAddress,readLimited,fetchPage,analyze,scan,summarize,resolvePublicHost,crawlLinkedPages} from '../worker/engine.js';
import {createScanHandler} from '../worker/audit.js';
const html='<title>Rogi &amp; Audit</title><meta NAME=description CONTENT="Site description"><h1>Başlık</h1><img ALT = ""><a>no link</a><script type="application/ld+json">{"@type":"WebSite"}</script>';
const req=(body={url:'https://example.com'},headers={})=>new Request('https://rogi.test/api/scan',{method:'POST',headers:{'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
test('rejects non-public URLs and credentials',()=>{for(const value of ['file:///etc/passwd','http://localhost','http://127.0.0.1','http://2130706433','http://[::1]','http://foo.internal','https://user:pass@example.com','http://example.com:8080',null,{}])assert.throws(()=>safeUrl(value));assert.equal(safeUrl('https://example.com/a#b').href,'https://example.com/a');});
test('classifies private and reserved IPs',()=>{for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','100.64.0.1','192.168.1.1','172.16.0.1','198.18.0.1','203.0.113.1','::1','fc00::1','::ffff:127.0.0.1','2001:db8::1'])assert.equal(isPublicAddress(ip),false,ip);assert.equal(isPublicAddress('8.8.8.8'),true);assert.equal(isPublicAddress('2606:4700:4700::1111'),true);});
test('DNS refuses mixed public/private answers',async()=>{await assert.rejects(resolvePublicHost('example.com',async url=>Response.json({Status:0,Answer:[{type:1,data:url.includes('AAAA')?'127.0.0.1':'8.8.8.8'}]})),/herkese açık/);});
test('HTML parser handles case, whitespace, entities and empty alt',()=>{const r=analyze(html,'https://example.com');assert.equal(r.title,'Rogi & Audit');assert.equal(r.description,'Site description');assert.equal(r.checks.find(x=>x.id==='alt').status,'pass');assert.equal(r.internalLinks.length,0);});
test('script/comment fake metadata is ignored',()=>{const r=analyze('<script>const x="<meta name=description content=bad>";</script><!--<h1>fake</h1>-->','https://example.com');assert.equal(r.description,'');assert.equal(r.headings.length,0);});
test('absent images are not applicable; malformed JSON-LD fails',()=>{const r=analyze('<script type="application/ld+json">{bad}</script>','https://example.com');assert.equal(r.checks.find(x=>x.id==='alt').status,'na');assert.equal(r.checks.find(x=>x.id==='schema').status,'fail');});
test('honors X-Robots-Tag and all robots declarations',()=>{assert.equal(analyze(html,'https://example.com',200,new Headers({'x-robots-tag':'googlebot: noindex'})).checks.find(x=>x.id==='index').status,'fail');assert.equal(analyze(html+'<meta name=robots content="none">','https://example.com').checks.find(x=>x.id==='index').status,'fail');});
test('unknown/na checks excluded from score',()=>assert.deepEqual(summarize([{status:'pass'},{status:'fail'},{status:'unknown'},{status:'na'}]),{passed:1,failed:1,total:4,unknown:1,notApplicable:1,score:50}));
test('cancels streaming response above byte limit',async()=>{let cancelled=false;const body=new ReadableStream({pull(c){c.enqueue(new Uint8Array(10));},cancel(){cancelled=true;}});await assert.rejects(readLimited(new Response(body),15),/boyutu/);assert.equal(cancelled,true);});
test('content-length oversized response rejected',async()=>await assert.rejects(readLimited(new Response('small',{headers:{'content-length':'9999'}}),20),/boyutu/));
test('redirects are revalidated and bodies cancelled',async()=>{let calls=0,resolves=0;const r=await fetchPage('https://example.com',{resolveHost:async()=>{resolves++;},fetchImpl:async()=>++calls===1?new Response(null,{status:301,headers:{location:'/new'}}):new Response('ok')});assert.equal(r.url,'https://example.com/new');assert.equal(resolves,2);});
test('cross-host and HTTPS downgrade redirects blocked',async()=>{for(const location of ['https://other.com','http://example.com'])await assert.rejects(fetchPage('https://example.com',{resolveHost:async()=>{},fetchImpl:async()=>new Response(null,{status:302,headers:{location}})}));});
test('host allowlist enforced before network access',async()=>await assert.rejects(fetchPage('https://example.com',{allowedHosts:['other.com'],resolveHost:async()=>{throw Error('must not resolve');}}),/izin listesinde/));
test('robots timeout is unknown, sitemap 404 fails',async()=>{const r=await scan('https://example.com',{resolveHost:async()=>{},fetchImpl:async url=>{if(url.endsWith('/robots.txt'))throw Error('timeout');if(url.endsWith('/sitemap.xml'))return new Response('missing',{status:404});return new Response(html,{headers:{'content-type':'text/html'}});}});assert.equal(r.checks.find(x=>x.id==='robots').status,'unknown');assert.equal(r.checks.find(x=>x.id==='sitemap').status,'fail');assert.equal(r.failed,r.checks.filter(x=>x.status==='fail').length);});
test('browser-rendered DOM supplies H1 and internal links for app shells',async()=>{
 const shell='<title>Portfolio</title><meta name="description" content="Portfolio"><div id="root"></div><script type="module" src="/assets/app.js"></script>';
 const fetchImpl=async url=>new Response(url.endsWith('/robots.txt')?'User-agent: *':url.endsWith('/sitemap.xml')?'<urlset></urlset>':shell,{headers:{'content-type':url.endsWith('.txt')?'text/plain':'text/html'}});
 const base={resolveHost:async()=>{},fetchImpl};
 const raw=await scan('https://example.com/',base);
 assert.equal(raw.score,null);assert.equal(raw.renderStatus,'unavailable');assert.equal(raw.checks.find(x=>x.id==='h1').status,'unknown');
 const rendered=await scan('https://example.com/',{...base,renderPage:async()=>({html:shell+'<h1>Portfolio</h1><a href="/projects">Projects</a>'})});
 assert.equal(rendered.renderStatus,'success');assert.ok(rendered.score>0);assert.equal(rendered.internalLinkCount,1);assert.equal(rendered.checks.find(x=>x.id==='h1').status,'pass');
 const failed=await scan('https://example.com/',{...base,renderPage:async()=>{throw Error('browser unavailable');}});
 assert.equal(failed.score,null);assert.equal(failed.renderStatus,'unavailable');
});
test('optional linked-page crawl stays on origin, caps at three and reports page findings',async()=>{
 const calls=[],home='<title>Home</title><h1>Home</h1>'+['/a','/b','/c','/d','/a','https://other.com/x','/logout','/search?q=x'].map(href=>'<a href="'+href+'">page</a>').join('');
 const r=await scan('https://example.com/',{checkPages:true,resolveHost:async()=>{},fetchImpl:async url=>{calls.push(url);if(url.endsWith('/robots.txt'))return new Response('User-agent: *');if(url.endsWith('/sitemap.xml'))return new Response('<urlset></urlset>');return new Response(url==='https://example.com/'?home:'<title>Linked</title><h1>Linked</h1>',{headers:{'content-type':'text/html'}});}});
 assert.equal(r.pageAudit.limit,3);assert.equal(r.pageAudit.discovered,4);assert.equal(r.pageAudit.omitted,1);assert.deepEqual(r.pageAudit.results.map(x=>x.url),['https://example.com/a','https://example.com/b','https://example.com/c']);
 assert.ok(r.pageAudit.results[0].checks.some(x=>x.id==='description'));assert.equal(calls.filter(x=>x.endsWith('/d')).length,0);assert.equal(calls.filter(x=>x.includes('other.com')).length,0);
 assert.equal(r.score,r.passed+r.failed?Math.round(r.passed/(r.passed+r.failed)*100):null);
});
test('linked-page redirects to another host remain unverified',async()=>{
 const r=await crawlLinkedPages(['https://example.com/a'],'https://example.com/',{resolveHost:async()=>{},fetchImpl:async()=>new Response(null,{status:302,headers:{location:'https://other.com/'}})});
 assert.equal(r.results[0].status,'unknown');assert.equal(r.results[0].httpStatus,null);
});
test('API validates method, content type, origin, JSON and URL',async()=>{const h=createScanHandler({maxPerMinute:100,runScan:async()=>({ok:true})});assert.equal((await h(new Request('https://rogi.test/api/scan'))).status,405);assert.equal((await h(req({}, {'content-type':'text/plain'}))).status,415);assert.equal((await h(req({}, {origin:'https://evil.test'}))).status,403);assert.equal((await h(req('{'))).status,400);assert.equal((await h(req({url:'http://localhost'}))).status,400);assert.equal((await h(req('x'.repeat(5000)))).status,413);});
test('per-client minute window resets',async()=>{let now=0;const h=createScanHandler({now:()=>now,maxPerMinute:1,runScan:async()=>({ok:true})});assert.equal((await h(req())).status,200);const limited=await h(req());assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'60');now=60000;assert.equal((await h(req())).status,200);});
test('concurrency permit released after failure',async()=>{let release;const h=createScanHandler({maxConcurrent:1,runScan:()=>new Promise((_,reject)=>{release=reject;})});const first=h(req());while(!release)await new Promise(r=>setTimeout(r,1));assert.equal((await h(req())).status,429);release(Error('internal secret'));const failed=await first;assert.equal(failed.status,502);assert.doesNotMatch(await failed.text(),/internal secret/);});
test('structured timeout status',async()=>{const h=createScanHandler({runScan:async()=>{throw new DOMException('timeout','TimeoutError');}});assert.equal((await h(req())).status,504);});

test('unconfigured default transport fails closed',async()=>{const {default:audit}=await import('../worker/audit.js');assert.equal((await audit.fetch(req())).status,503);});
