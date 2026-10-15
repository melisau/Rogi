import { AuditError, readLimited, safeUrl, scan } from './engine.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
export function createScanHandler({runScan=scan,now=()=>Date.now(),maxPerMinute=5,maxConcurrent=3}={}) {
  const clients=new Map(); let active=0;
  return async(request,env={})=>{
    if(request.method!=='POST')return json({error:'Yalnızca POST kullanılabilir.'},405,{allow:'POST'});
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)return json({error:'Başka kaynaktan tarama isteği kabul edilmedi.'},403);
    if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json({error:'JSON içerik türü gerekli.'},415);
    const time=now();
    for(const [key,value] of clients)if(time-value.start>=60000)clients.delete(key);
    // Only trust Cloudflare's edge-set header. Local preview uses one shared client bucket.
    const key=request.headers.get('cf-connecting-ip')||'local';
    const bucket=clients.get(key)||{start:time,count:0};
    if(bucket.count>=maxPerMinute)return json({error:'Tarama sınırına ulaşıldı. Bir dakika sonra tekrar deneyin.'},429,{'retry-after':String(Math.max(1,Math.ceil((60000-(time-bucket.start))/1000)))});
    if(active>=maxConcurrent||clients.size>=10000&&!clients.has(key))return json({error:'Tarama kapasitesi dolu. Tekrar deneyin.'},429,{'retry-after':'10'});
    bucket.count++;clients.set(key,bucket); active++;
    try{
      let body;
      try{body=JSON.parse(await readLimited(request,4096));}catch(e){if(e instanceof AuditError)throw e;throw new AuditError('Geçerli bir JSON isteği gönderin.');}
      if(!body||typeof body!=='object'||Array.isArray(body))throw new AuditError('Geçerli bir JSON nesnesi gönderin.');
      const url=safeUrl(body.url);
      const allowedHosts=env.SCAN_ALLOWED_HOSTS?env.SCAN_ALLOWED_HOSTS.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean):undefined;
      return json(await runScan(url.href,{allowedHosts}));
    }catch(e){
      if(e instanceof AuditError)return json({error:e.message,code:e.code},e.status);
      if(['TimeoutError','AbortError'].includes(e?.name))return json({error:'Tarama zaman sınırına ulaştı.',code:'timeout'},504);
      return json({error:'Tarama tamamlanamadı. Lütfen tekrar deneyin.',code:'scan_failed'},502);
    }finally{active--;}
  };
}
const handleScan=createScanHandler();
export default {fetch:handleScan};
