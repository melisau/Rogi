import http from 'node:http';
import worker from '../../rogi-landing/api/index.js';
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
 try {
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413,{'content-type':'text/plain'});res.end('Request too large');return;}chunks.push(chunk);}
  const headers={...req.headers};delete headers['cf-connecting-ip'];
  const request=new Request('http://127.0.0.1:'+port+(req.url==='/'?'/app':req.url),{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
  const response=await worker.fetch(request,{SCAN_ALLOWED_HOSTS:process.env.SCAN_ALLOWED_HOSTS});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'content-type':'text/plain'});res.end('Preview error');}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
