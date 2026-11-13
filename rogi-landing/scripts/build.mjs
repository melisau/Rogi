import {verifyReports} from './verify-reports.mjs';
import {verifyQuota} from './verify-quota.mjs';
import {migrate} from './migrate.mjs';
// The render deployment has no database (ROGI_ROLE=render).
if(process.env.ROGI_ROLE!=='render'){await migrate();await verifyQuota();await verifyReports();}
import { buildProjectClient } from './build-project.mjs';
import { build } from 'esbuild';
await buildProjectClient();
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
console.log('Rogi Worker bundle ready.');
