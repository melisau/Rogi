import {handleAuthProxyRequest,resolveNeonAuthLogging} from '@neondatabase/auth/server';
import {readLimited} from '../worker/engine.js';
const routes=new Map([['get-session','GET'],['sign-in/email','POST'],['sign-up/email','POST'],['sign-out','POST']]);
const reply=(code,status)=>Response.json({error:code},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export function createAuthHandler({proxy=handleAuthProxyRequest,config=()=>({baseUrl:process.env.NEON_AUTH_BASE_URL,cookieSecret:process.env.NEON_AUTH_COOKIE_SECRET})}={}){
 return async(request,path)=>{
  if(!routes.has(path))return reply('not_found',404);
  if(request.method!==routes.get(path))return new Response(null,{status:405,headers:{allow:routes.get(path)}});
  const origin=new URL(request.url).origin;
  if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return reply('origin_rejected',403);
  if(request.method==='POST'){
   if(request.headers.get('origin')!==origin)return reply('origin_required',403);
   if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return reply('json_required',415);
   try{const raw=await readLimited(request,4096);const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))return reply('invalid_request',400);request=new Request(request.url,{method:'POST',headers:request.headers,body:raw,signal:request.signal});}catch{return reply('invalid_request',400);}
  }
  try{
   const options=config();if(!options.baseUrl||!options.cookieSecret||options.cookieSecret.length<32)return reply('auth_unavailable',503);
   const base=new URL(options.baseUrl);if(base.protocol!=='https:'||base.username||base.password)return reply('auth_unavailable',503);
   const response=await proxy({request,path,...options,sameSite:'lax',sessionDataTtl:0,log:resolveNeonAuthLogging({logLevel:'silent'})});
   response.headers.set('cache-control','no-store');response.headers.set('x-content-type-options','nosniff');return response;
  }catch{return reply('auth_unavailable',503);}
 };
}
