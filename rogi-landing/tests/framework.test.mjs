import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFrameworkFile} from '../client/project.js';
const file=text=>({path:'src/app/blog/[slug]/page.tsx',text});
test('Next metadata supports TypeScript satisfies and reports source locations',()=>{
 const rows=inspectFrameworkFile(file('export const metadata = { title: "Blog", description: "Description", alternates: {canonical: "/blog"} } satisfies Metadata;\nexport default function Page(){return <h1>Blog</h1>}'));
 assert.equal(rows.find(r=>r.label==='Metadata: title').value,'Blog');assert.equal(rows.find(r=>r.label==='Metadata: canonical').value,'/blog');assert.ok(rows.find(r=>r.label==='JSX: H1'));assert.ok(rows.every(r=>/:\d+$/.test(r.path)));
});
test('comments and strings do not create metadata signals',()=>{
 const rows=inspectFrameworkFile(file('// export const metadata={title:"fake"};\nconst text="<title>fake</title>"; export default ()=> <div/>;'));
 assert.equal(rows.filter(r=>r.label==='Metadata: title'||r.label==='JSX: title').length,0);
});
test('dynamic metadata is never executed',()=>{
 const rows=inspectFrameworkFile(file('export async function generateMetadata(){ throw Error("must not execute"); } export default ()=> <h1/>'));
 assert.ok(rows.find(r=>r.label==='generateMetadata'));assert.ok(!rows.find(r=>r.detail.startsWith('Metadata bulunamadı')));
});
test('computed metadata stays unverified rather than passing',()=>{
 const rows=inspectFrameworkFile(file('export const metadata=loadMetadata();'));assert.ok(rows.find(r=>r.detail.includes('çözümlenemedi')));
});
test('JSX Helmet source values are inspected without rendering',()=>{
 const rows=inspectFrameworkFile({path:'src/Page.jsx',text:'export default ()=> <><title>Real title</title><meta name="description" content={"A description"}/><link rel="canonical" href="/page"/><h1>Heading</h1></>'});
 assert.equal(rows.find(r=>r.label==='JSX: title').value,'Real title');assert.equal(rows.find(r=>r.label==='JSX: description').value,'A description');
});
test('syntax failures are explicitly unverified',()=>assert.ok(inspectFrameworkFile(file('export const =')).some(r=>r.label==='Framework sözdizimi')));
