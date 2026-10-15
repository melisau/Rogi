import {neon} from '@neondatabase/serverless';
import {randomUUID} from 'node:crypto';
import {readLimited,safeUrl} from '../worker/engine.js';
let sql;
const fields='id,name,url,created_at,updated_at';
export const projectStore={
 db(){if(!process.env.DATABASE_URL)throw Error('Database unavailable');return sql||=neon(process.env.DATABASE_URL);},
 async list(owner){return this.db().query('SELECT '+fields+' FROM rogi_private.projects WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 20',[owner]);},
 async get(owner,id){return (await this.db().query('SELECT '+fields+' FROM rogi_private.projects WHERE owner_id=$1 AND id=$2',[owner,id]))[0];},
 async create(owner,{name,url}){const db=this.db();const results=await db.transaction([db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['rogi-project:'+owner]),db.query('INSERT INTO rogi_private.projects(id,owner_id,name,url) SELECT $1,$2,$3,$4 WHERE (SELECT count(*) FROM rogi_private.projects WHERE owner_id=$2)<20 RETURNING '+fields,[randomUUID(),owner,name,url])]);return results[1][0];},
 async update(owner,id,{name,url}){return (await this.db().query('UPDATE rogi_private.projects SET name=$3,url=$4,updated_at=now() WHERE owner_id=$1 AND id=$2 RETURNING '+fields,[owner,id,name,url]))[0];}
};
export function createProjectsHandler({auth,store=projectStore}={}){
 return async request=>{
  let cookies=[];
  const reply=(data,status=200)=>{const headers=new Headers({'cache-control':'no-store','x-content-type-options':'nosniff'});cookies.forEach(cookie=>headers.append('set-cookie',cookie));return Response.json(data,{status,headers});};
  try{
   const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean),id=parts[2];
   if(parts.length>3||id&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply({error:'not_found'},404);
   if(!['GET','POST','PATCH'].includes(request.method)||request.method==='POST'&&id||request.method==='PATCH'&&!id)return reply({error:'method_not_allowed'},405);
   if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return reply({error:'origin_rejected'},403);
   const sessionResponse=await auth(new Request(url.origin+'/api/auth/get-session',{headers:{cookie:request.headers.get('cookie')||''},signal:request.signal}),'get-session');
   if(!sessionResponse.ok)return reply({error:'auth_unavailable'},503);
   cookies=sessionResponse.headers.getSetCookie();const session=await sessionResponse.json();
   if(!session?.session||typeof session?.user?.id!=='string'||!session.user.id)return reply({error:'sign_in_required'},401);
   const owner=session.user.id;
   if(request.method==='GET'){const data=id?await store.get(owner,id):await store.list(owner);return data?reply(id?{project:data}:{projects:data}):reply({error:'not_found'},404);}
   if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return reply({error:'json_required'},415);
   let data;try{data=JSON.parse(await readLimited(request,4096));}catch{return reply({error:'invalid_request'},400);}
   if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!['name','url'].includes(k))||typeof data.name!=='string'||!data.name.trim()||data.name.trim().length>100||typeof data.url!=='string'||data.url.length>2048)return reply({error:'invalid_project'},400);
   let projectUrl='';try{if(data.url.trim())projectUrl=safeUrl(data.url.trim()).href;}catch{return reply({error:'invalid_url'},400);}
   const payload={name:data.name.trim(),url:projectUrl},project=id?await store.update(owner,id,payload):await store.create(owner,payload);
   if(!project)return reply({error:id?'not_found':'project_limit'},id?404:409);
   return reply({project},id?200:201);
  }catch{return reply({error:'projects_unavailable'},503);}
 };
}
