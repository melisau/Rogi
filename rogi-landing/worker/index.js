import audit from './audit.js';
import {page} from './page.js';
import {landing} from './landing.js';
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/')return new Response(landing,{headers:{'content-type':'text/html; charset=utf-8'}});
 if(url.pathname==='/app'||url.pathname==='/app/')return new Response(page,{headers:{'content-type':'text/html; charset=utf-8'}});
 return audit.fetch(request);
}};
