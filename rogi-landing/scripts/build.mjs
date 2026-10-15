import {verifyQuota} from './verify-quota.mjs';
import {migrate} from './migrate.mjs';
await migrate();
await verifyQuota();
import { buildProjectClient } from './build-project.mjs';
import { build } from 'esbuild';
await buildProjectClient();
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
console.log('Rogi Worker bundle ready.');
