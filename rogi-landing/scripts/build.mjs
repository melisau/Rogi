import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/server', {recursive:true});
for (const file of ['index.js','audit.js','page.js','landing.js']) await copyFile('worker/'+file,'dist/server/'+file);
console.log('Rogi build complete.');
