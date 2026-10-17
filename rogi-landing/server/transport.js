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
export const nodeScan=(url,options={})=>scan(url,{...options,fetchImpl:secureFetch,resolveHost:publicAddresses});
