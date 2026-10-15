export function createPreviewHandler(fetchHandler,{port,mapPath=path=>path}={}){
 return async(req,res)=>{
  const controller=new AbortController();
  const disconnected=()=>{if(!res.writableEnded)controller.abort();};
  req.once('aborted',disconnected);res.once('close',disconnected);
  try{
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413,{'content-type':'text/plain'});res.end('Request too large');return;}chunks.push(chunk);}
   const headers={...req.headers};delete headers['cf-connecting-ip'];
   const request=new Request('http://127.0.0.1:'+port+mapPath(req.url),{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),signal:controller.signal});
   const response=await fetchHandler(request);
   if(res.destroyed)return;
   const body=Buffer.from(await response.arrayBuffer());
   if(res.destroyed)return;
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(body);
  }catch{
   if(!res.destroyed&&!res.headersSent){res.writeHead(500,{'content-type':'text/plain'});res.end('Preview error');}
  }finally{req.off('aborted',disconnected);res.off('close',disconnected);}
 };
}
