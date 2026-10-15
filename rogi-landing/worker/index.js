import { projectBundle } from './project-bundle.js';
import audit from './audit.js';
import {page} from './page.js';
import {landing} from './landing.js';
const security={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY'};
export default {async fetch(request,env={}){
 const url=new URL(request.url);
 if(url.pathname==='/assets/project.js')return new Response(projectBundle,{headers:{...security,'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache'}});
 if(url.pathname==='/api/scan')return env.handleScan?env.handleScan(request,env):audit.fetch(request,env);
 const htmlHeaders={...security,'content-type':'text/html; charset=utf-8','cache-control':'no-cache'};
 if(url.pathname==='/')return new Response(landing,{headers:htmlHeaders});
 if(url.pathname==='/app'||url.pathname==='/app/')return new Response(page,{headers:htmlHeaders});
 if(url.pathname==='/robots.txt')return new Response('User-agent: *\nAllow: /\nDisallow: /app\nSitemap: '+url.origin+'/sitemap.xml',{headers:{...security,'content-type':'text/plain'}});
 if(url.pathname==='/sitemap.xml')return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+url.origin+'/</loc></url></urlset>',{headers:{...security,'content-type':'application/xml'}});
 return new Response('Sayfa bulunamadı.',{status:404,headers:security});
}};
