import {neon} from '@neondatabase/serverless';
import {readFile} from 'node:fs/promises';
export async function migrate(){
 if(process.env.VERCEL!=='1')return;
 if(!process.env.DATABASE_URL)throw Error('Database configuration required for deployment');
 const sql=neon(process.env.DATABASE_URL),source=await readFile(new URL('../migrations/001-scan-quota.sql',import.meta.url),'utf8');
 await sql.transaction([sql.query("SELECT pg_advisory_xact_lock(73059126)"),...source.split(/\n(?=CREATE)/).map(statement=>sql.query(statement))]);console.log('Rogi quota schema ready.');
}
