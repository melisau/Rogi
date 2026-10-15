import {parse,serialize} from 'parse5';
import {landing,landingTranslations} from './landing.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text={tr:{title:'Rogi — Yayına çık. İçin rahat olsun.',description:'Rogi ile canlı sitenizi ve geliştirme projenizi SEO, güvenlik ve kullanılabilirlik açısından inceleyin. Eksikleri bulun, düzeltmeleri önceliklendirin.',locale:'tr_TR'},en:{title:'Rogi — Go live with peace of mind.',description:'Audit live websites and development projects for SEO, security, and usability with Rogi. Find gaps and prioritize fixes.',locale:'en_GB'}};
export function renderLanding(origin,language='tr'){
 const lang=language==='en'?'en':'tr',copy=text[lang],canonical=origin+'/'+lang,document=parse(landing);
 const visit=(node,parentTag)=>{
  if(node.tagName==='html'){const attr=node.attrs.find(a=>a.name==='lang');attr.value=lang;}
  if(node.tagName==='title')node.childNodes=[{nodeName:'#text',value:copy.title,parentNode:node}];
  if(node.tagName==='meta'&&node.attrs.find(a=>a.name==='name')?.value==='description')node.attrs.find(a=>a.name==='content').value=copy.description;
  if(lang==='en'&&node.nodeName==='#text'&&!['script','style','title'].includes(parentTag)){
   const key=node.value.trim();if(landingTranslations[key])node.value=node.value.replace(key,landingTranslations[key]);
  }
  if(lang==='en'&&node.attrs){const labels={'Rogi ana sayfa':'Rogi home','Ana menü':'Main navigation','Kapat':'Close','Örnek denetim görünümü':'Sample audit views'};for(const attr of node.attrs)if(attr.name==='aria-label'&&labels[attr.value])attr.value=labels[attr.value];}
  for(const child of node.childNodes||[])visit(child,node.tagName);
 };
 visit(document);
 const tags='<link rel="canonical" href="'+escape(canonical)+'">'+
  ['tr','en','x-default'].map(code=>'<link rel="alternate" hreflang="'+code+'" href="'+escape(origin+'/'+(code==='x-default'?'tr':code))+'">').join('')+
  [['og:type','website'],['og:site_name','Rogi'],['og:title',copy.title],['og:description',copy.description],['og:url',canonical],['og:locale',copy.locale],['og:locale:alternate',lang==='en'?'tr_TR':'en_GB']].map(([property,content])=>'<meta property="'+property+'" content="'+escape(content)+'">').join('')+
  '<meta name="twitter:card" content="summary"><meta name="twitter:title" content="'+escape(copy.title)+'"><meta name="twitter:description" content="'+escape(copy.description)+'">'+
  '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebSite','@id':origin+'/#website',name:'Rogi',url:origin+'/tr',inLanguage:['tr','en']}).replace(/</g,'\\u003c')+'</script>';
 return serialize(document).replace('</head>',tags+'</head>');
}
export function sitemap(origin){
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+['tr','en'].map(lang=>'<url><loc>'+escape(origin+'/'+lang)+'</loc>'+['tr','en','x-default'].map(code=>'<xhtml:link rel="alternate" hreflang="'+code+'" href="'+escape(origin+'/'+(code==='x-default'?'tr':code))+'"/>').join('')+'</url>').join('')+'</urlset>';
}
