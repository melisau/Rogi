import http from 'node:http';
import worker from '../../rogi-landing/api/index.js';
import {createPreviewHandler} from '../../rogi-landing/server/preview-handler.js';
const port=Number(process.env.PORT||4173);
http.createServer(createPreviewHandler(request=>worker.fetch(request),{port,mapPath:path=>path==='/'?'/app':path})).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
