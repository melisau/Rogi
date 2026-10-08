import http from 'node:http';
const port=Number(process.env.PORT || 4175);
http.createServer(async(req,res)=>{
 try {
  const {default:worker}=await import('../worker/index.js?preview='+Date.now());
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const request=new Request('http://127.0.0.1:'+port+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
  const response=await worker.fetch(request);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error.message);res.writeHead(500);res.end('Preview error');}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
