import app from '../../rogi-landing/worker/index.js';
import {page} from '../../rogi-landing/worker/page.js';
// Compatibility entrypoint: the original audit workspace stays at /.
export default {fetch(request,env={}){
 if(new URL(request.url).pathname==='/')return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','x-content-type-options':'nosniff'}});
 return app.fetch(request,env);
}};
