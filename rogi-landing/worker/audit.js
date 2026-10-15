import { localizeReport, translateUiText } from './i18n.js';
import { AuditError, readLimited, safeUrl, scan } from './engine.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
export function createScanHandler({runScan=scan,now=()=>Date.now(),maxPerMinute=5,maxConcurrent=3}={}) {
  const clients=new Map(); let active=0;
  return async(request,env={})=>{
    let language=/^en(?:[-,;]|$)/i.test(request.headers.get('accept-language')||'')?'en':'tr';
    const reply=(data,status=200,extra={})=>json(data.error?{...data,error:translateUiText(data.error,language)}:data,status,extra);
    if(request.method!=='POST')return reply({error:'Yalnızca POST kullanılabilir.'},405,{allow:'POST'});
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)return reply({error:'Başka kaynaktan tarama isteği kabul edilmedi.'},403);
    if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return reply({error:'JSON içerik türü gerekli.'},415);
    const time=now();
    for(const [key,value] of clients)if(time-value.start>=60000)clients.delete(key);
    // Only trust Cloudflare's edge-set header. Local preview uses one shared client bucket.
    const key=request.headers.get('cf-connecting-ip')||'local';
    const bucket=clients.get(key)||{start:time,count:0};
    if(bucket.count>=maxPerMinute)return reply({error:'Tarama sınırına ulaşıldı. Bir dakika sonra tekrar deneyin.'},429,{'retry-after':String(Math.max(1,Math.ceil((60000-(time-bucket.start))/1000)))});
    if(active>=maxConcurrent||clients.size>=10000&&!clients.has(key))return reply({error:'Tarama kapasitesi dolu. Tekrar deneyin.'},429,{'retry-after':'10'});
    bucket.count++;clients.set(key,bucket); active++;
    try{
      let body;
      try{body=JSON.parse(await readLimited(request,4096));}catch(e){if(e instanceof AuditError)throw e;throw new AuditError('Geçerli bir JSON isteği gönderin.');}
      if(!body||typeof body!=='object'||Array.isArray(body))throw new AuditError('Geçerli bir JSON nesnesi gönderin.');
      if(['tr','en'].includes(body.locale))language=body.locale;
      const url=safeUrl(body.url);
      const allowedHosts=env.SCAN_ALLOWED_HOSTS?env.SCAN_ALLOWED_HOSTS.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean):undefined;
      const report=await runScan(url.href,{allowedHosts});
      return reply(Array.isArray(report.checks)?localizeReport(report,language):report);
    }catch(e){
      if(e instanceof AuditError)return reply({error:e.message,code:e.code},e.status);
      if(['TimeoutError','AbortError'].includes(e?.name))return reply({error:'Tarama zaman sınırına ulaştı.',code:'timeout'},504);
      return reply({error:'Tarama tamamlanamadı. Lütfen tekrar deneyin.',code:'scan_failed'},502);
    }finally{active--;}
  };
}
const handleScan=createScanHandler();
export default {fetch:handleScan};
