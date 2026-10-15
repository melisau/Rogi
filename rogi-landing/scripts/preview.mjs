import http from 'node:http';
import worker from '../api/index.js';
import {createPreviewHandler} from '../server/preview-handler.js';
const port=Number(process.env.PORT||4175);
http.createServer(createPreviewHandler(request=>worker.fetch(request),{port})).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
