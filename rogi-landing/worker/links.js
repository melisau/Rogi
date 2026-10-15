import {fetchPage,safeUrl} from './engine.js';
export async function checkInternalLinks(links,base,options={}){
 const origin=new URL(base).origin,selected=[],seen=new Set();
 for(const value of links){try{const url=safeUrl(value);url.hash='';if(url.origin!==origin||seen.has(url.href)||url.href===base)continue;seen.add(url.href);selected.push(url.href);}catch{}}
 const targets=selected.slice(0,10),results=[];const load=options.load||fetchPage;
 async function inspect(url){
  if(options.signal?.aborted)return {url,status:'unknown',httpStatus:null};
  try{
   let response=await load(url,{...options,method:'HEAD'});
   if([404,410,405,501].includes(response.status))response=await load(url,{...options,method:'GET'});
   return {url,status:response.status>=200&&response.status<300?'pass':[404,410].includes(response.status)?'fail':'unknown',httpStatus:response.status};
  }catch{return {url,status:'unknown',httpStatus:null};}
 }
 for(let index=0;index<targets.length;index+=2)results.push(...await Promise.all(targets.slice(index,index+2).map(inspect)));
 return {limit:10,discovered:selected.length,omitted:Math.max(0,selected.length-targets.length),results};
}
