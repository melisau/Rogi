import {verifyReports} from './verify-reports.mjs';
import {verifyQuota} from './verify-quota.mjs';
import {migrate} from './migrate.mjs';
// The render deployment has no database (ROGI_ROLE=render).
if(process.env.ROGI_ROLE!=='render'){await migrate();await verifyQuota();await verifyReports();}
import { buildProjectClient } from './build-project.mjs';
await buildProjectClient();
console.log('Rogi build ready.');
