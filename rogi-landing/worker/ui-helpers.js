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
export function selectProjectFiles(all, {maxFiles=400,maxBytes=500000}={}) {
  const included=[],skipped=[];
  for(const file of all) {
    const name=file.webkitRelativePath||file.path||file.name;
    let reason;
    if(/(^|\/)(node_modules|\.git|dist|build|\.next|coverage|vendor)(\/|$)/i.test(name))reason='excluded_directory';
    else if(file.size>=maxBytes)reason='file_too_large';
    else if(!/\.(tsx?|jsx?|html?|css|py|php|go|rb|java|kt|swift|yaml|yml|env)$/i.test(file.name||name))reason='unsupported_type';
    else if(included.length>=maxFiles)reason='file_count_limit';
    if(reason)skipped.push({path:name,reason,size:file.size});
    else included.push(file);
  }
  return {included,skipped};
}
export const clientHelpers=compareReports.toString()+'\n'+selectProjectFiles.toString();
