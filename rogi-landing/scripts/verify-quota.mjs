import {neon} from '@neondatabase/serverless';
import {randomUUID} from 'node:crypto';
export async function verifyQuota(){
 if(process.env.VERCEL!=='1')return;
 const sql=neon(process.env.DATABASE_URL),scope='qa-'+randomUUID();
 try{
  const claims=await Promise.all(Array.from({length:4},(_,i)=>sql.query('SELECT * FROM rogi_private.claim_scan($1,$2,$3)',[scope,'client-'+i,randomUUID()])));
  if(claims.filter(rows=>rows[0]?.allowed).length!==3||claims.filter(rows=>rows[0]?.reason==='capacity').length!==1)throw Error('Quota concurrency verification failed');
  await sql.query('DELETE FROM rogi_private.scan_leases WHERE scope=$1',[scope]);
  const next=await sql.query('SELECT * FROM rogi_private.claim_scan($1,$2,$3)',[scope,'after-release',randomUUID()]);if(!next[0]?.allowed)throw Error('Quota release verification failed');
  await sql.query('DELETE FROM rogi_private.scan_leases WHERE scope=$1',[scope]);
  for(const [client,used] of [['rate-client',5],['global',60]]){
   await sql.query('DELETE FROM rogi_private.scan_windows WHERE scope=$1',[scope]);
   await sql.query("INSERT INTO rogi_private.scan_windows SELECT $1,$2,date_trunc('minute',clock_timestamp())+offset_value,$3 FROM (VALUES(interval '0 minutes'),(interval '1 minute')) AS offsets(offset_value)",[scope,client,used]);
   const denied=await sql.query('SELECT * FROM rogi_private.claim_scan($1,$2,$3)',[scope,client==='global'?'new-client':client,randomUUID()]);
   if(denied[0]?.allowed||denied[0]?.reason!=='rate')throw Error('Quota rate verification failed');
  }
  console.log('Rogi Postgres quota concurrency, release, client and global rate verified.');
 }finally{await sql.transaction([sql.query('DELETE FROM rogi_private.scan_leases WHERE scope=$1',[scope]),sql.query('DELETE FROM rogi_private.scan_windows WHERE scope=$1',[scope])]);}
}
