import {projectStore} from './projects.js';
import {randomUUID} from 'node:crypto';
import {readLimited} from '../worker/engine.js';
export const reportStore={
 async list(owner,project){return projectStore.db().query("SELECT r.id,r.created_at,r.payload->>'url' AS url,r.payload->'score' AS score FROM rogi_private.reports r JOIN rogi_private.projects p ON p.id=r.project_id WHERE p.owner_id=$1 AND r.owner_id=$1 AND r.project_id=$2 ORDER BY r.created_at DESC,r.id DESC LIMIT 20",[owner,project]);},
 async get(owner,project,id){return (await projectStore.db().query('SELECT r.id,r.created_at,r.payload FROM rogi_private.reports r JOIN rogi_private.projects p ON p.id=r.project_id WHERE p.owner_id=$1 AND r.owner_id=$1 AND r.project_id=$2 AND r.id=$3',[owner,project,id]))[0];},
 async save(owner,project,payload){const db=projectStore.db();const results=await db.transaction([db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['rogi-report:'+project]),db.query('INSERT INTO rogi_private.reports(id,project_id,owner_id,payload) SELECT $1,id,owner_id,$4::jsonb FROM rogi_private.projects WHERE id=$2 AND owner_id=$3 RETURNING id,created_at',[randomUUID(),project,owner,JSON.stringify(payload)]),db.query('DELETE FROM rogi_private.reports WHERE owner_id=$1 AND project_id=$2 AND id IN (SELECT id FROM rogi_private.reports WHERE owner_id=$1 AND project_id=$2 ORDER BY created_at DESC,id DESC OFFSET 20)',[owner,project])]);return results[1][0];}
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createReportsHandler({auth,scan,projects=projectStore,store=reportStore}={}){
 return async request=>{
  let cookies=[];const reply=(data,status=200,extra={})=>{const headers=new Headers({'cache-control':'no-store','x-content-type-options':'nosniff',...extra});cookies.forEach(c=>headers.append('set-cookie',c));return Response.json(data,{status,headers});};
  try{
   const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean),project=parts[2],id=parts[4];
   if(!uuid.test(project||'')||parts[3]!=='reports'||parts.length>5||id&&!uuid.test(id))return reply({error:'not_found'},404);
   if(!['GET','POST'].includes(request.method)||id&&request.method==='POST')return reply({error:'method_not_allowed'},405);
   if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return reply({error:'origin_rejected'},403);
   const sessionResponse=await auth(new Request(url.origin+'/api/auth/get-session',{headers:{cookie:request.headers.get('cookie')||''},signal:request.signal}),'get-session');
   if(!sessionResponse.ok)return reply({error:'auth_unavailable'},503);cookies=sessionResponse.headers.getSetCookie();const session=await sessionResponse.json();
   if(!session?.session||typeof session?.user?.id!=='string'||!session.user.id)return reply({error:'sign_in_required'},401);
   const owner=session.user.id;if(!await projects.get(owner,project))return reply({error:'not_found'},404);
   if(request.method==='GET'){if(!id)return reply({reports:await store.list(owner,project)});const report=await store.get(owner,project,id);return report?reply({report}):reply({error:'not_found'},404);}
   if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return reply({error:'json_required'},415);
   let body;try{body=JSON.parse(await readLimited(request,4096));}catch{return reply({error:'invalid_request'},400);}
   if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['url','locale','checkLinks','checkPages'].includes(k)))return reply({error:'invalid_request'},400);
   const scanResponse=await scan(new Request(url.origin+'/api/scan',{method:'POST',headers:request.headers,body:JSON.stringify(body),signal:request.signal}));
   const payload=await scanResponse.json();if(!scanResponse.ok)return reply(payload,scanResponse.status,scanResponse.headers.has('retry-after')?{'retry-after':scanResponse.headers.get('retry-after')}:{});
   if(Buffer.byteLength(JSON.stringify(payload))>262144)return reply({error:'report_too_large'},413);
   const saved=await store.save(owner,project,payload);if(!saved)return reply({error:'not_found'},404);
   return reply({report:{...saved,payload}},201);
  }catch{return reply({error:'reports_unavailable'},503);}
 };
}
