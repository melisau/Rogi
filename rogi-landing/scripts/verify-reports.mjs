import {projectStore} from '../server/projects.js';
import {reportStore} from '../server/reports.js';
import {randomUUID} from 'node:crypto';
export async function verifyReports(){
 if(process.env.VERCEL!=='1')return;
 const db=projectStore.db(),project=randomUUID(),owner='qa-'+randomUUID(),payload={url:'https://example.com/',score:null,checks:[]};
 try{
  await db.query('INSERT INTO rogi_private.projects(id,owner_id,name,url) VALUES($1,$2,$3,$4)',[project,owner,'Isolated retention QA','']);
  await db.query("INSERT INTO rogi_private.reports(id,owner_id,project_id,payload) SELECT gen_random_uuid(),$1,$2,$3::jsonb FROM generate_series(1,21)",[owner,project,JSON.stringify(payload)]);
  const saved=await reportStore.save(owner,project,payload),reports=await reportStore.list(owner,project);
  if(reports.length!==20||!reports.some(r=>r.id===saved.id))throw Error('Report retention verification failed');
  if(await reportStore.get('other-'+owner,project,saved.id))throw Error('Report owner verification failed');
  console.log('Rogi Postgres report retention and owner isolation verified.');
 }finally{await db.query('DELETE FROM rogi_private.projects WHERE id=$1 AND owner_id=$2',[project,owner]);}
}
