import {createHealthHandler} from '../server/health.js';
const handleHealth=createHealthHandler();
import worker from '../worker/index.js';
import { createScanHandler } from '../worker/audit.js';
import { nodeScan } from '../server/transport.js';
const handleScan=createScanHandler({runScan:nodeScan,onMetric:metric=>console.info(JSON.stringify(metric))});
export default {async fetch(request){
  const url=new URL(request.url);
  const route=url.searchParams.get('rogi_route');
  if(url.pathname==='/api/index'&&route!==null)url.pathname='/'+route;
  url.searchParams.delete('rogi_route');
  if(url.pathname==='/api/health')return handleHealth(request);
  const headers=new Headers(request.headers);
  headers.delete('cf-connecting-ip');
  // Vercel overwrites this header at its edge. In local adapters, no forwarded IP is trusted.
  if(process.env.VERCEL==='1')headers.set('cf-connecting-ip',request.headers.get('x-vercel-forwarded-for')||'unknown');
  const forwarded=new Request(url,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,duplex:'half',signal:request.signal});
  return worker.fetch(forwarded,{handleScan,SCAN_ALLOWED_HOSTS:process.env.SCAN_ALLOWED_HOSTS});
}};
