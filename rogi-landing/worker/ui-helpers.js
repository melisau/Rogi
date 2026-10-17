export function compareReports(current, previous) {
  if (!previous || current.url !== previous.url) return null;
  const before=new Map(previous.checks.map(c=>[c.id,c]));
  const groups={newIssues:[],resolved:[],changed:[],unchanged:[],removed:[]};
  for(const check of current.checks) {
    const old=before.get(check.id);
    if(check.status==='fail'&&old?.status!=='fail')groups.newIssues.push(check);
    else if(old?.status==='fail'&&check.status==='pass')groups.resolved.push(check);
    else if(!old||old.status!==check.status)groups.changed.push({...check,previousStatus:old?.status||null});
    else groups.unchanged.push(check);
    before.delete(check.id);
  }
  groups.removed=[...before.values()];
  return groups;
}
export function selectProjectFiles(all, {maxFiles=400,maxBytes=500000,maxTotalBytes=10000000}={}) {
  const included=[],skipped=[];let totalBytes=0;
  for(const file of all) {
    const name=file.webkitRelativePath||file.path||file.name;
    let reason;
    if(/(^|\/)(node_modules|\.git|dist|build|\.next|coverage|vendor)(\/|$)/i.test(name))reason='excluded_directory';
    else if(file.size>=maxBytes)reason='file_too_large';
    else if(!/\.(tsx?|jsx?|html?|css|py|php|go|rb|java|kt|swift|yaml|yml|env)$/i.test(file.name||name))reason='unsupported_type';
    else if(included.length>=maxFiles)reason='file_count_limit';
    else if(totalBytes+file.size>maxTotalBytes)reason='project_size_limit';
    if(reason)skipped.push({path:name,reason,size:file.size});
    else {included.push(file);totalBytes+=file.size;}
  }
  return {included,skipped};
}
export function sortFindings(checks,mode='priority'){
 const status={fail:0,unknown:1,pass:2,na:3},rank={Yüksek:0,Orta:1,Düşük:2,High:0,Medium:1,Low:2},effort={Düşük:0,Orta:1,Yüksek:2,Low:0,Medium:1,High:2};
 return [...checks].sort((a,b)=>(status[a.status]??1)-(status[b.status]??1)||(mode==='effort'?(effort[a.effort]??1)-(effort[b.effort]??1):0)||(rank[a.priority]??1)-(rank[b.priority]??1));
}

export const clientHelpers=compareReports.toString()+'\n'+selectProjectFiles.toString()+'\n'+sortFindings.toString();
