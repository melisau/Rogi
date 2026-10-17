import {neon} from '@neondatabase/serverless';
import {createHmac,randomUUID} from 'node:crypto';
import {AuditError} from '../worker/engine.js';
let sql;
export async function acquireScanLease({client}){
 if(process.env.VERCEL!=='1'&&!process.env.DATABASE_URL)return null;
 if(!process.env.DATABASE_URL||!process.env.NEON_AUTH_COOKIE_SECRET)throw new AuditError('Tarama servisi geçici olarak kullanılamıyor.',503,'quota_unavailable');
 try{
  sql||=neon(process.env.DATABASE_URL);
  const key=createHmac('sha256',process.env.NEON_AUTH_COOKIE_SECRET).update('rogi-quota:'+client).digest('hex'),id=randomUUID();
  const rows=await sql.query('SELECT * FROM rogi_private.claim_scan($1,$2,$3)',['audit',key,id],{fetchOptions:{signal:AbortSignal.timeout(5000)}});
  const admission=rows[0];if(!admission)throw Error('No admission');
  return {allowed:admission.allowed,retryAfter:admission.retry_after,reason:admission.reason,release:async()=>{if(admission.allowed)await sql.query('DELETE FROM rogi_private.scan_leases WHERE id=$1 AND scope=$2',[id,'audit'],{fetchOptions:{signal:AbortSignal.timeout(5000)}});}};
 }catch{throw new AuditError('Tarama servisi geçici olarak kullanılamıyor.',503,'quota_unavailable');}
}
