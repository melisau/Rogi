import {projectsPage} from '../worker/projects-page.js';
import test from 'node:test';
import {Script} from 'node:vm';
import {parse} from 'parse5';
import {account} from '../worker/account.js';
import {page} from '../worker/page.js';
import {renderLanding} from '../worker/landing-seo.js';
for(const [name,html] of [['projects',projectsPage],['account',account],['app',page],['tr',renderLanding('https://rogi.test','tr')],['en',renderLanding('https://rogi.test','en')]])test(name+' inline scripts parse as delivered HTML',()=>{
 const visit=node=>{if(node.tagName==='script'&&!node.attrs.some(a=>a.name==='type'&&a.value==='application/ld+json'))new Script(node.childNodes.map(n=>n.value||'').join(''),{filename:name});for(const child of node.childNodes||[])visit(child);};visit(parse(html));
});
