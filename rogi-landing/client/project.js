import { parse } from '@babel/parser';

const literal=node=>{
 if(!node)return {known:false};
 if(['TSAsExpression','TSSatisfiesExpression','ParenthesizedExpression','TSNonNullExpression'].includes(node.type))return literal(node.expression);
 if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(node.type))return {known:true,value:node.value};
 if(node.type==='TemplateLiteral'&&!node.expressions.length)return {known:true,value:node.quasis.map(x=>x.value.cooked).join('')};
 if(node.type==='ObjectExpression'){
  const value=Object.create(null);for(const p of node.properties){if(p.type!=='ObjectProperty'||p.computed)return {known:false};const key=p.key.name??p.key.value,result=literal(p.value);if(!result.known)return {known:false};value[key]=result.value;}return {known:true,value};
 }
 return {known:false};
};
function walk(node,visit){if(!node||typeof node!=='object')return;if(node.type)visit(node);for(const [key,value] of Object.entries(node)){if(['comments','leadingComments','trailingComments','innerComments','loc','tokens','errors'].includes(key))continue;if(Array.isArray(value))value.forEach(x=>walk(x,visit));else if(value&&typeof value==='object')walk(value,visit);}}
const jsxAttrs=node=>Object.fromEntries(node.attributes.filter(x=>x.type==='JSXAttribute').map(x=>[x.name.name,literal(x.value?.type==='JSXExpressionContainer'?x.value.expression:x.value)]));
export function inspectFrameworkFile(file){
 const rows=[],location=node=>file.path+':'+(node?.loc?.start.line||1);
 const row=(label,detail,node,value)=>rows.push({label,detail,path:location(node),value});
 let ast;try{ast=parse(file.text,{sourceType:'unambiguous',plugins:[...(/\.tsx?$/i.test(file.path)?['typescript']:[]),'jsx'],errorRecovery:false});}
 catch{row('Framework sözdizimi','Dosya ayrıştırılamadı; kaynak bulguları doğrulanamadı.',null);return rows;}
 const isRoute=/(^|\/)(app|pages)\/.*(?:page|layout|index|\[[^\]]+\])\.[jt]sx?$/i.test(file.path)||/(^|\/)pages\/[^/]+\.[jt]sx?$/i.test(file.path);
 if(isRoute)row('Framework rotası','Route dosyası bulundu; dinamik parametreler ve layout kalıtımı çalışan uygulamada doğrulanmalıdır.',ast.program);
 let metadata=false,dynamic=false;
 for(const statement of ast.program.body){
  if(statement.type!=='ExportNamedDeclaration')continue;
  if(statement.declaration?.type==='FunctionDeclaration'&&statement.declaration.id?.name==='generateMetadata'){dynamic=true;row('generateMetadata','Dinamik metadata üretimi bulundu; kaynak kod çalıştırılmadı.',statement);}
  for(const d of statement.declaration?.declarations||[]){
   if(d.id?.name==='generateMetadata'){dynamic=true;row('generateMetadata','Dinamik metadata üretimi bulundu; kaynak kod çalıştırılmadı.',d);}
   if(d.id?.name!=='metadata')continue;metadata=true;const result=literal(d.init);
   if(!result.known||typeof result.value!=='object'||result.value===null){row('Metadata','Metadata ifadesi statik olarak çözümlenemedi; kaynak kod çalıştırılmadı.',d);continue;}
   for(const key of ['title','description'])if(Object.hasOwn(result.value,key))row('Metadata: '+key,'Statik kaynak işareti bulundu; çalışma zamanında doğrulayın.',d,typeof result.value[key]==='string'?result.value[key]:JSON.stringify(result.value[key]));
   if(result.value.alternates?.canonical)row('Metadata: canonical','Statik kaynak işareti bulundu; çalışma zamanında doğrulayın.',d,result.value.alternates.canonical);
   if(result.value.robots)row('Metadata: robots','Statik kaynak işareti bulundu; çalışma zamanında doğrulayın.',d,JSON.stringify(result.value.robots));
  }
 }
 let h1=0;
 walk(ast,node=>{
  if(node.type!=='JSXElement')return;
  const opening=node.openingElement,name=opening.name.name,attrs=jsxAttrs(opening);
  if(name==='h1')h1++;
  if(name==='title'){
   const parts=node.children.filter(x=>x.type!=='JSXText'||x.value.trim()).map(x=>x.type==='JSXText'?{known:true,value:x.value}:x.type==='JSXExpressionContainer'?literal(x.expression):{known:false});
   row('JSX: title',parts.every(x=>x.known)?'Statik kaynak işareti bulundu; çalışma zamanında doğrulayın.':'Dinamik JSX içeriği bulundu; çalışma zamanında doğrulayın.',node,parts.every(x=>x.known)?parts.map(x=>x.value).join('').trim():undefined);
  }
  if(name==='meta'&&attrs.name?.value==='description')row('JSX: description',attrs.content?.known?'Statik kaynak işareti bulundu; çalışma zamanında doğrulayın.':'Dinamik JSX içeriği bulundu; çalışma zamanında doğrulayın.',node,attrs.content?.value);
  if(name==='link'&&String(attrs.rel?.value||'').split(/\s+/).includes('canonical'))row('JSX: canonical',attrs.href?.known?'Statik kaynak işareti bulundu; çalışma zamanında doğrulayın.':'Dinamik JSX içeriği bulundu; çalışma zamanında doğrulayın.',node,attrs.href?.value);
 });
 if(h1)row('JSX: H1','Kaynakta H1 işareti bulundu; koşullu render nedeniyle gerçek başlık sayısı canlı sayfada doğrulanmalıdır.',ast.program,String(h1));
 if(isRoute&&!metadata&&!dynamic)row('Metadata','Metadata bulunamadı; üst layout veya dinamik üretimden gelebilir.',ast.program);
 return rows;
}
export async function inspectFrameworkFiles(files){
 const results=[];for(const file of files.filter(f=>/\.[jt]sx?$/i.test(f.path))){results.push(...inspectFrameworkFile(file));await new Promise(resolve=>setTimeout(resolve,0));}return results;
}
