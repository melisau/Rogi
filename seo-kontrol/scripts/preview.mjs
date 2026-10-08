import http from 'node:http';
const port = Number(process.env.PORT || 4173);
http.createServer(async (req, res) => {
  try {
    const { default: worker } = await import('../worker/index.js?preview=' + Date.now());
    const { page } = await import('../worker/page.js?preview=' + Date.now());
    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(page);
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request('http://localhost:' + port + req.url, {
      method: req.method, headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
    });
    const response = await worker.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('İşlem tamamlanamadı. Lütfen tekrar deneyin.');
  }
}).listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port));
