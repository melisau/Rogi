import { lookup as dnsLookup } from 'node:dns/promises';
import { Agent, fetch as nodeFetch } from 'undici';
import { AuditError, isPublicAddress, safeUrl, scan } from '../worker/engine.js';

export async function publicAddresses(host, lookup=dnsLookup) {
  safeUrl('https://'+host);
  let timer,result;try{result=await Promise.race([lookup(host,{all:true,verbatim:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new AuditError('DNS zaman sınırı.',504,'dns_timeout')),5000);timer.unref?.();})]);}finally{clearTimeout(timer);}
  if(!result.length||result.some(r=>!isPublicAddress(r.address)))throw new AuditError('Özel veya rezerve adrese bağlantı engellendi.',400,'unsafe_target');
  return result;
}
export function checkedLookup(lookup=dnsLookup) {
  return (host,options,callback)=>publicAddresses(host,lookup).then(records=>{
    const selected=options.family?records.filter(x=>x.family===options.family):records;
    if(!selected.length)return callback(new AuditError('Uygun IP adresi bulunamadı.',502,'dns_failed'));
    // These exact vetted IPs are handed to the socket; the hostname is retained for TLS.
    if(options.all)callback(null,selected);
    else callback(null,selected[0].address,selected[0].family);
  },callback);
}
const dispatcher=new Agent({connections:3,connect:{lookup:checkedLookup(),timeout:10000},headersTimeout:10000,bodyTimeout:10000});
export const secureFetch=(url,init)=>nodeFetch(url,{...init,dispatcher});
// ROGI_RENDER=off disables headless rendering; client-rendered pages are then reported as unverified.
export const renderEnabled=(env=process.env)=>env.ROGI_RENDER!=='off';
// ROGI_RENDER=remote sends pages to the separate render deployment (ROGI_RENDER_URL, ROGI_RENDER_TOKEN)
// and never starts Chromium here. Each render takes one slot of the daily budget (ROGI_RENDER_DAILY_LIMIT).
export function chooseRenderer(env,{loadRenderer=()=>import('./render.js'),loadRemote=()=>import('./render-service.js'),claim}={}){
  if(!renderEnabled(env))return undefined;
  if(env.ROGI_RENDER==='remote'){
    if(!env.ROGI_RENDER_URL||!env.ROGI_RENDER_TOKEN)return undefined;
    const limit=Number(env.ROGI_RENDER_DAILY_LIMIT)||30;
    return ()=>loadRemote().then(m=>m.remoteRenderer({url:env.ROGI_RENDER_URL,token:env.ROGI_RENDER_TOKEN,claim:()=>(claim||defaultClaim)(limit)}));
  }
  return ()=>loadRenderer().then(m=>m.createRenderer());
}
const defaultClaim=limit=>import('./quota.js').then(m=>m.claimRender(limit));
export async function nodeScan(url,options={},{env=process.env,loadRenderer,loadRemote,claim}={}) {
  let renderer;
  const make=chooseRenderer(env,{loadRenderer,loadRemote,claim});
  const renderPage=make?async(home,settings)=>(await (renderer??=make())).render(home,settings):undefined;
  try {
    return await scan(url,{...options,fetchImpl:secureFetch,resolveHost:publicAddresses,renderPage});
  } finally {
    // The browser is shared by every page in this scan and always closed with it.
    if(renderer)await (await renderer.catch(()=>null))?.close();
  }
}
