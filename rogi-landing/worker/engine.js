import {checkInternalLinks} from './links.js';
import { parse } from 'parse5';

export class AuditError extends Error {
  constructor(message, status = 400, code = 'invalid_request') { super(message); this.status = status; this.code = code; }
}
export function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new AuditError('Geçerli bir site adresi girin.');
  let url; try { url = new URL(value); } catch { throw new AuditError('Geçerli bir http veya https adresi girin.'); }
  const host = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) throw new AuditError('Geçerli bir http veya https adresi girin.');
  if (!host.includes('.') || host.endsWith('.') || !/^[a-z0-9.-]+$/.test(host) || host.split('.').some(x => !x || x.startsWith('-') || x.endsWith('-')) || /^\d[\d.]*$/.test(host) || /(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host)) throw new AuditError('Yalnızca herkese açık alan adları taranabilir.');
  url.hash = ''; return url;
}
export function isPublicAddress(ip) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const p = ip.split('.').map(Number); if (p.some(n => n > 255)) return false;
    const [a,b,c] = p;
    return !(a===0 || a===10 || a===127 || a>=224 || (a===100&&b>=64&&b<=127) || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&(b===168 || b===0 || (b===88&&c===99))) || (a===198&&(b===18||b===19||(b===51&&c===100))) || (a===203&&b===0&&c===113));
  }
  // Accept only global-unicast IPv6; reject mapped, local, transition and documentation ranges.
  return /^[23][0-9a-f]{0,3}:/i.test(ip) && !/^2001:(0*:|db8:|0*2:|1[0-9a-f]:)/i.test(ip) && !/^2002:/i.test(ip);
}
export async function resolvePublicHost(host, fetchImpl = fetch) {
  const answers = await Promise.all(['A','AAAA'].map(async type => {
    const r = await fetchImpl('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(host)+'&type='+type, {headers:{accept:'application/dns-json'}, signal:AbortSignal.timeout(5000)});
    if (!r.ok) throw new AuditError('Alan adı doğrulanamadı.',502,'dns_failed');
    const data = await r.json();
    if (data.Status !== 0) throw new AuditError('Alan adı çözümlenemedi.',502,'dns_failed');
    return (data.Answer || []).filter(x => [1,28].includes(x.type)).map(x => x.data);
  }));
  const ips = answers.flat();
  if (!ips.length || ips.some(ip => !isPublicAddress(ip))) throw new AuditError('Alan adı herkese açık bir adrese çözümlenmiyor.',400,'unsafe_target');
  return ips;
}
export async function readLimited(response, maxBytes = 1200000) {
  const length = response.headers.get('content-length');
  if (length && Number(length) > maxBytes) { await response.body?.cancel(); throw new AuditError('Yanıt boyutu sınırı aşıldı.',413,'response_too_large'); }
  if (!response.body) return '';
  const reader=response.body.getReader(), decoder=new TextDecoder(); let bytes=0, text='';
  try { while(true) { const {done,value}=await reader.read(); if(done) break; bytes+=value.byteLength; if(bytes>maxBytes) { await reader.cancel(); throw new AuditError('Yanıt boyutu sınırı aşıldı.',413,'response_too_large'); } text+=decoder.decode(value,{stream:true}); } return text+decoder.decode(); }
  finally { reader.releaseLock(); }
}
export async function fetchPage(input, {fetchImpl=fetch, resolveHost=host=>resolvePublicHost(host,fetchImpl), signal, allowedHosts, method='GET'} = {}) {
  let current=safeUrl(input); const originalHost=current.hostname;
  for(let i=0;i<5;i++) {
    signal?.throwIfAborted();
    if(allowedHosts && !allowedHosts.includes(current.hostname)) throw new AuditError('Bu alan adı tarama izin listesinde değil.',403,'host_not_allowed');
    await resolveHost(current.hostname);
    signal?.throwIfAborted();
    const response=await fetchImpl(current.href,{method,redirect:'manual',headers:{'user-agent':'RogiAudit/1.0',accept:'text/html,text/plain,application/xml;q=0.8'},signal:signal||AbortSignal.timeout(10000)});
    if([301,302,303,307,308].includes(response.status)) {
      const location=response.headers.get('location'); await response.body?.cancel();
      if(!location) throw new AuditError('Yönlendirme hedefi bulunamadı.',502,'invalid_redirect');
      const next=safeUrl(new URL(location,current).href);
      if(next.hostname!==originalHost) throw new AuditError('Başka alan adına yönlendirme taranmadı.',400,'cross_host_redirect');
      if(current.protocol==='https:' && next.protocol!=='https:') throw new AuditError('Güvensiz yönlendirme taranmadı.',400,'insecure_redirect');
      current=next; continue;
    }
    return {url:current.href,status:response.status,type:response.headers.get('content-type')||'',headers:response.headers,body:method==='HEAD'?'':await readLimited(response)};
  }
  throw new AuditError('Çok fazla yönlendirme var.',502,'redirect_limit');
}
const priorities = {Yüksek:0,Orta:1,Düşük:2};
export function summarize(checks) {
  const passed=checks.filter(x=>x.status==='pass').length, failed=checks.filter(x=>x.status==='fail').length;
  return {passed,failed,total:checks.length,unknown:checks.filter(x=>x.status==='unknown').length,notApplicable:checks.filter(x=>x.status==='na').length,score:passed+failed?Math.round(passed/(passed+failed)*100):null};
}
export function sortChecks(checks) { return [...checks].sort((a,b)=>({fail:0,unknown:1,pass:2,na:3}[a.status]-{fail:0,unknown:1,pass:2,na:3}[b.status]) || priorities[a.priority]-priorities[b.priority]); }
export function analyze(html, url, status=200, headers=new Headers()) {
  const nodes=[]; function visit(n){if(n.tagName)nodes.push(n);for(const c of n.childNodes||[])visit(c);} visit(parse(html));
  const all=tag=>nodes.filter(n=>n.tagName===tag), attrs=n=>Object.fromEntries((n?.attrs||[]).map(a=>[a.name,a.value]));
  const text=n=>(n?.nodeName==='#text'?n.value:(n?.childNodes||[]).map(text).join('')).trim();
  const meta=name=>all('meta').filter(n=>(attrs(n).name||'').toLowerCase()===name).map(n=>attrs(n).content||'').join(', ');
  const title=text(all('title')[0]), description=meta('description'), robots=meta('robots')+', '+meta('googlebot')+', '+(headers.get('x-robots-tag')||'');
  const canonicals=all('link').filter(n=>(attrs(n).rel||'').toLowerCase().split(/\s+/).includes('canonical'));
  const canonical=attrs(canonicals[0]).href||'', headings=nodes.filter(n=>/^h[1-6]$/.test(n.tagName)).map(n=>({level:Number(n.tagName[1]),text:text(n)})), images=all('img'), checks=[];
  const add=(id,label,check,detail,category,priority='Orta',fix='',state)=>checks.push({id,label,status:state||(check?'pass':'fail'),detail,category,priority,effort:({alt:'Orta',internal:'Orta',schema:'Orta',https:'Orta',http:'Orta'}[id]||'Düşük'),fix,verify:'Değişikliği yayınlayıp aynı adresi yeniden tarayın.',evidence:{url,detail}});
  add('title','Sayfa başlığı',!!title,title||'Başlık bulunamadı.','İçerik','Yüksek','Sayfayı açıklayan bir title ekleyin.');
  add('description','Meta açıklama',!!description,description||'Meta açıklama bulunamadı.','İçerik','Orta','Sayfaya özgü meta description ekleyin.');
  add('h1','Ana H1 başlığı',headings.filter(x=>x.level===1).length===1,headings.filter(x=>x.level===1).length+' H1 bulundu.','İçerik','Orta','Sayfanın ana konusunu belirten H1 yapısını gözden geçirin.');
  add('hierarchy','Başlık hiyerarşisi',!headings.some((h,i)=>i&&h.level>headings[i-1].level+1),'Başlık düzeyleri incelendi.','İçerik','Düşük','Başlık düzeylerini mantıksal sıraya koyun.',headings.length?undefined:'na');
  let canonicalValid=false;try{canonicalValid=canonicals.length===1&&['http:','https:'].includes(new URL(canonical,url).protocol)&&!!canonical;}catch{}
  add('canonical','Canonical etiketi',canonicalValid,canonical||'Canonical bulunamadı.','Teknik','Orta','Tercih edilen sayfa adresine tek bir canonical ekleyin.');
  add('index','İndeksleme işaretleri',!/\b(noindex|none)\b/i.test(robots),robots.replace(/^[,\s]+|[,\s]+$/g,'')||'HTML ve HTTP başlığında noindex bulunamadı; gerçek indeksleme doğrulanmadı.','Teknik','Yüksek','İndekslenmesi gereken sayfada noindex işaretini kaldırın; robots.txt ve Search Console ile doğrulayın.');
  const missing=images.filter(n=>!Object.hasOwn(attrs(n),'alt'));
  add('alt','Görsel alt niteliği',!missing.length,images.length+' görsel; '+missing.length+' görselde alt niteliği eksik. Boş alt metnin uygunluğu elle doğrulanmalıdır.','Medya','Orta','İçerik görsellerine açıklayıcı alt metin, dekoratif görsellere alt="" ekleyin.',images.length?undefined:'na');
  const internalLinks=[...new Set(all('a').flatMap(n=>{const href=attrs(n).href;if(!href||href.startsWith('#'))return [];try{const u=new URL(href,url);return ['http:','https:'].includes(u.protocol)&&u.hostname===new URL(url).hostname?[u.href]:[];}catch{return [];}}))];
  add('internal','İç bağlantılar',!!internalLinks.length,internalLinks.length+' iç bağlantı bulundu.','Bağlantılar','Düşük','İlgili içeriklere açıklayıcı bağlantılar ekleyin.');
  const schemas=all('script').filter(n=>(attrs(n).type||'').toLowerCase()==='application/ld+json'); let invalidSchema=false;
  for(const n of schemas)try{JSON.parse(text(n));}catch{invalidSchema=true;}
  add('schema','Yapısal veri JSON biçimi',!invalidSchema,schemas.length+' JSON-LD bloğu; şema uygunluğu ayrıca doğrulanmalıdır.','Teknik','Orta','JSON-LD sözdizimini düzeltin; ilgili şema türünü doğrulayın.',schemas.length?undefined:'na');
  add('https','HTTPS',new URL(url).protocol==='https:',new URL(url).protocol,'Güvenlik','Yüksek','Siteyi HTTPS üzerinden yayınlayın.');
  add('http','Sayfa yanıtı',status===200,'HTTP '+status,'Teknik','Yüksek','Sayfanın beklenen HTTP durum koduyla dönmesini sağlayın.');
  return {checks,title,description,headings,internalLinks:internalLinks.slice(0,20),internalLinkCount:internalLinks.length,images:images.length};
}
export async function crawlLinkedPages(links, homeUrl, settings={}) {
  const origin=new URL(homeUrl).origin, selected=[], seen=new Set([homeUrl]);
  for(const value of links.slice(0,20)) {
    try {
      const url=safeUrl(value);
      if(url.origin!==origin||url.search||seen.has(url.href)||/(^|\/)(logout|signout|delete|remove|unsubscribe)(\/|$)/i.test(url.pathname))continue;
      seen.add(url.href);selected.push(url.href);
    } catch {}
  }
  const targets=selected.slice(0,3),results=[];
  async function inspect(url) {
    settings.signal?.throwIfAborted();
    try {
      const page=await fetchPage(url,settings);
      if(page.status!==200)return {url:page.url,status:page.status===404||page.status===410?'fail':'unknown',httpStatus:page.status,reason:'http_status'};
      if(!/text\/html|application\/xhtml\+xml/i.test(page.type))return {url:page.url,status:'na',httpStatus:page.status,reason:'not_html'};
      const result=analyze(page.body,page.url,page.status,page.headers),summary=summarize(result.checks);
      return {url:page.url,status:'pass',httpStatus:page.status,title:result.title,description:result.description,score:summary.score,passed:summary.passed,failed:summary.failed,checks:result.checks.filter(x=>x.status==='fail').map(x=>({id:x.id,label:x.label,detail:x.detail,priority:x.priority,fix:x.fix}))};
    } catch(error) {
      if(settings.signal?.aborted)throw error;
      return {url,status:'unknown',httpStatus:null,reason:'unavailable'};
    }
  }
  for(let index=0;index<targets.length;index+=2)results.push(...await Promise.all(targets.slice(index,index+2).map(inspect)));
  return {limit:3,discovered:selected.length,omitted:Math.max(0,selected.length-targets.length),results};
}
export async function scan(input, options={}) {
  const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000), settings={...options,signal}, home=await fetchPage(input,settings);
  if(!/text\/html|application\/xhtml\+xml/i.test(home.type)) throw new AuditError('Adres HTML sayfası döndürmedi.',422,'not_html');
  if(home.status===429||home.status>=500) throw new AuditError('Hedef site geçici olarak taranamadı.',502,'target_unavailable');
  const analysis=analyze(home.body,home.url,home.status,home.headers), origin=new URL(home.url).origin;
  const extras=await Promise.allSettled([fetchPage(origin+'/robots.txt',settings),fetchPage(origin+'/sitemap.xml',settings)]);
  for(const [index,id,label] of [[0,'robots','robots.txt'],[1,'sitemap','XML sitemap']]) {
    const result=extras[index]; let status,detail;
    if(result.status==='rejected'){status='unknown';detail='Dosya doğrulanamadı; ağ, DNS, boyut veya zaman sınırı nedeniyle okunamadı.';}
    else {const r=result.value;status=r.status===200?(id==='robots'?/^\s*user-agent\s*:/im.test(r.body):/<(?:[a-z]+:)?(?:urlset|sitemapindex)\b/i.test(r.body))?'pass':'fail':r.status===404?'fail':'unknown';detail='HTTP '+r.status+'; '+(status==='pass'?'dosya biçimi tanındı.':'dosya yok, biçim tanınmadı veya erişim doğrulanamadı.');}
    analysis.checks.push({id,label,status,detail,category:'Teknik',priority:'Orta',effort:id==='sitemap'?'Orta':'Düşük',fix:id==='robots'?'Tarayıcı kurallarını içeren robots.txt dosyasını doğrulayın.':'Geçerli sitemap dosyasını yayınlayın; farklı yol kullanılıyorsa ayrıca doğrulayın.',verify:'Dosya adresini açıp yeniden tarayın.',evidence:{url:origin+'/'+(id==='robots'?'robots.txt':'sitemap.xml'),detail}});
  }
  if(options.checkLinks){
   analysis.linkAudit=await checkInternalLinks(analysis.internalLinks,home.url,settings);
   analysis.linkAudit.candidateLimit=20;analysis.linkAudit.pageInternalLinks=analysis.internalLinkCount;
   const results=analysis.linkAudit.results,status=results.some(x=>x.status==='fail')?'fail':results.some(x=>x.status==='unknown')?'unknown':results.length?'pass':'na';
   const detail='En fazla 10 uygun iç bağlantı kontrol edildi. 404/410 sonuçları GET ile doğrulandı; erişilemeyen sonuçlar doğrulanamadı olarak ayrıldı.';
   analysis.checks.push({id:'broken-links',label:'Bozuk iç bağlantılar',status,detail,category:'Bağlantılar',priority:'Orta',effort:'Orta',fix:'404/410 dönen iç bağlantıları güncelleyin veya kaldırın.',verify:'Bağlantıları açıp yeniden tarayın.',evidence:{url:home.url,detail}});
  }
  if(options.checkPages)analysis.pageAudit=await crawlLinkedPages(analysis.internalLinks,home.url,settings);
  analysis.checks=sortChecks(analysis.checks);
  return {version:2,url:home.url,scannedAt:new Date().toISOString(),...analysis,...summarize(analysis.checks),manual:['Gerçek indeksleme ve robots.txt kurallarının etkisi','Google Search Console raporu','PageSpeed / Core Web Vitals','Gerçek cihaz ve kullanılabilirlik akışları','Güvenlik davranışının çalışma zamanında doğrulanması']};
}
