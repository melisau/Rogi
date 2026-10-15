import {account} from './account.js';
import { projectBundle } from './project-bundle.js';
import audit from './audit.js';
import {page} from './page.js';
import {renderLanding,sitemap} from './landing-seo.js';
const security={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY'};
export default {async fetch(request,env={}){
 const url=new URL(request.url);
 if(url.pathname==='/assets/project.js')return new Response(projectBundle,{headers:{...security,'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache'}});
 if(url.pathname==='/api/scan')return env.handleScan?env.handleScan(request,env):audit.fetch(request,env);
 const htmlHeaders={...security,'content-type':'text/html; charset=utf-8','cache-control':'no-cache'};
 if(url.pathname==='/')return new Response(null,{status:308,headers:{...security,location:'/tr'}});
 if(['/tr','/en'].includes(url.pathname))return new Response(renderLanding(url.origin,url.pathname.slice(1)),{headers:htmlHeaders});
 if(url.pathname==='/account')return new Response(account,{headers:{...htmlHeaders,'cache-control':'no-store'}});
 if(url.pathname==='/app'||url.pathname==='/app/')return new Response(page,{headers:htmlHeaders});
 if(url.pathname==='/robots.txt')return new Response('User-agent: *\nAllow: /\nDisallow: /app\nSitemap: '+url.origin+'/sitemap.xml',{headers:{...security,'content-type':'text/plain'}});
 if(url.pathname==='/sitemap.xml')return new Response(sitemap(url.origin),{headers:{...security,'content-type':'application/xml'}});
 return new Response('Sayfa bulunamadı.',{status:404,headers:security});
}};
