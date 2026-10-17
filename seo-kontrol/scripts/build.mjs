import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {buildProjectClient} from '../../rogi-landing/scripts/build-project.mjs';
const require=createRequire(new URL('../../rogi-landing/package.json',import.meta.url));
const {build}=require('esbuild');
await buildProjectClient();
await build({entryPoints:[fileURLToPath(new URL('../worker/index.js',import.meta.url))],outfile:fileURLToPath(new URL('../dist/server/index.js',import.meta.url)),bundle:true,format:'esm',platform:'browser',target:'es2022'});
console.log('Legacy audit compatibility bundle ready.');
