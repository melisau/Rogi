import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLanding,sitemap} from '../worker/landing-seo.js';
import {parse} from 'parse5';
const elements=html=>{const result=[];function visit(n){if(n.tagName)result.push(n);for(const c of n.childNodes||[])visit(c);}visit(parse(html));return result;};
const attrs=n=>Object.fromEntries(n.attrs.map(a=>[a.name,a.value]));
const text=n=>(n.childNodes||[]).map(c=>c.value||text(c)).join('');
test('English landing is readable before JavaScript runs',()=>{
 const nodes=elements(renderLanding('https://rogi.test','en'));
 assert.equal(attrs(nodes.find(n=>n.tagName==='html')).lang,'en');assert.match(text(nodes.find(n=>n.tagName==='h1')),/Go live/);assert.match(text(nodes.find(n=>n.tagName==='title')),/peace of mind/);
 assert.ok(nodes.some(n=>n.tagName==='a'&&text(n)==='Start audit'));assert.ok(nodes.some(n=>n.tagName==='link'&&attrs(n).rel==='canonical'&&attrs(n).href==='https://rogi.test/en'));
});
test('Turkish variant has correct metadata and alternate language URLs',()=>{
 const nodes=elements(renderLanding('https://rogi.test','tr'));
 assert.match(text(nodes.find(n=>n.tagName==='h1')),/Yayına çık/);assert.ok(nodes.some(n=>n.tagName==='meta'&&attrs(n).property==='og:locale'&&attrs(n).content==='tr_TR'));
 assert.equal(nodes.filter(n=>n.tagName==='link'&&attrs(n).hreflang).length,3);
});
test('structured data contains no fabricated reviews, prices or claims',()=>{
 const n=elements(renderLanding('https://rogi.test','en')).find(n=>n.tagName==='script'&&attrs(n).type==='application/ld+json');const data=JSON.parse(text(n));assert.equal(data['@type'],'WebSite');assert.deepEqual(data.inLanguage,['tr','en']);assert.equal(data.offers,undefined);assert.equal(data.aggregateRating,undefined);
});
test('sitemap covers both canonical pages and alternate links',()=>{
 const xml=sitemap('https://rogi.test');assert.match(xml,/<loc>https:\/\/rogi.test\/tr<\/loc>/);assert.match(xml,/<loc>https:\/\/rogi.test\/en<\/loc>/);assert.doesNotMatch(xml,/\/app/);assert.equal((xml.match(/hreflang=/g)||[]).length,6);
});
