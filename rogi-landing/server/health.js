import {neon} from '@neondatabase/serverless';
let sql;
export async function databaseProbe(){
 if(!process.env.DATABASE_URL)throw new Error('Database unavailable');
 sql||=neon(process.env.DATABASE_URL);
 const rows=await sql.query('SELECT 1 AS ready',[],{fetchOptions:{signal:AbortSignal.timeout(5000)}});
 if(rows[0]?.ready!==1)throw new Error('Database unavailable');
}
export function createHealthHandler({probe=databaseProbe}={}){
 return async request=>{
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,allow:'GET, HEAD'}});
  let ready=false;try{await probe();ready=true;}catch{}
  return new Response(request.method==='HEAD'?null:JSON.stringify({status:ready?'ready':'unavailable',database:ready?'connected':'unavailable'}),{status:ready?200:503,headers});
 };
}
