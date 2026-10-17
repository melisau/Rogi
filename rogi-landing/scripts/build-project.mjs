import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { writeFile, mkdir } from 'node:fs/promises';
export async function buildProjectClient(){
 const result=await build({entryPoints:[fileURLToPath(new URL('../client/project.js',import.meta.url))],write:false,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 await mkdir(new URL('../worker/',import.meta.url),{recursive:true});
 await writeFile(new URL('../worker/project-bundle.js',import.meta.url),'export const projectBundle='+JSON.stringify(result.outputFiles[0].text)+';\n');
}
if(process.argv[1]?.endsWith('build-project.mjs'))await buildProjectClient();
