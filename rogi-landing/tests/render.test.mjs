import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouteHandler, createRenderer, browserArgs, hardenedArgs, limits } from '../server/render.js';
import { renderEnabled } from '../server/transport.js';

const home = { url: 'https://example.com/', status: 200, type: 'text/html', body: '<div id="root"></div>' };
function fakeRoute(url, { method = 'GET', type = 'script' } = {}) {
  const route = {
    result: null,
    request: () => ({ url: () => url, method: () => method, resourceType: () => type }),
    abort: async () => { route.result = 'abort'; },
    fulfill: async options => { route.result = options; },
  };
  return route;
}
const resource = (url, body = 'x') => ({ url, status: 200, type: 'text/javascript', body });

test('route handler blocks cross-origin, non-GET, disallowed types and unsafe hosts without fetching', async () => {
  const calls = [];
  const handler = createRouteHandler({ home, fetchResource: async url => { calls.push(url); return resource(url); } });
  const cases = [
    fakeRoute('https://cdn.other.com/app.js'),
    fakeRoute('https://example.com/api', { method: 'POST', type: 'fetch' }),
    fakeRoute('https://example.com/logo.png', { type: 'image' }),
    fakeRoute('https://example.com/beacon', { type: 'ping' }),
    fakeRoute('http://localhost/admin'),
    fakeRoute('http://169.254.169.254/latest/meta-data/'),
    fakeRoute('https://example.com:8443/app.js'),
  ];
  for (const route of cases) { await handler(route); assert.equal(route.result, 'abort', route.request().url()); }
  assert.deepEqual(calls, []);
  assert.equal(handler.stats.blocked, cases.length);
});

test('route handler serves the entry document from memory and same-origin assets through the checked transport', async () => {
  const calls = [];
  const handler = createRouteHandler({ home, fetchResource: async (url, settings) => { calls.push([url, settings.marker]); return resource(url, 'console.log(1)'); }, settings: { marker: 'checked' } });
  const doc = fakeRoute('https://example.com/', { type: 'document' });
  await handler(doc);
  assert.equal(doc.result.body, home.body);
  const script = fakeRoute('https://example.com/assets/app.js');
  await handler(script);
  assert.equal(script.result.body, 'console.log(1)');
  assert.deepEqual(calls, [['https://example.com/assets/app.js', 'checked']]);
});

test('route handler aborts cross-origin redirects and transport failures', async () => {
  const redirected = createRouteHandler({ home, fetchResource: async () => resource('https://evil.example.org/app.js') });
  const a = fakeRoute('https://example.com/app.js');
  await redirected(a);
  assert.equal(a.result, 'abort');
  const failing = createRouteHandler({ home, fetchResource: async () => { throw new Error('unsafe target'); } });
  const b = fakeRoute('https://example.com/app.js');
  await failing(b);
  assert.equal(b.result, 'abort');
});

test('route handler enforces request and byte budgets', async () => {
  const handler = createRouteHandler({ home, fetchResource: async url => resource(url) });
  for (let i = 0; i < limits.maxRequests; i++) { const r = fakeRoute('https://example.com/a' + i + '.js'); await handler(r); assert.notEqual(r.result, 'abort'); }
  const over = fakeRoute('https://example.com/one-too-many.js');
  await handler(over);
  assert.equal(over.result, 'abort');
  const big = createRouteHandler({ home, fetchResource: async url => resource(url, 'x'.repeat(limits.maxTotalBytes + 1)) });
  const r = fakeRoute('https://example.com/huge.js');
  await big(r);
  assert.equal(r.result, 'abort');
});

test('browser flags replace base network flags and never map hosts to 0.0.0.0', () => {
  const args = browserArgs(['--no-sandbox', '--host-resolver-rules=MAP * 0.0.0.0', '--proxy-server=http://open-proxy:8080']);
  assert.ok(args.includes('--no-sandbox'));
  assert.ok(!args.some(a => a.includes('0.0.0.0') || a.includes('open-proxy')));
  for (const flag of hardenedArgs) assert.ok(args.includes(flag), flag);
  assert.ok(args.includes('--host-resolver-rules=MAP * ~NOTFOUND'));
  assert.ok(args.some(a => a.startsWith('--force-webrtc-ip-handling-policy=disable_non_proxied_udp')));
});

function fakeBrowser({ gotoDelay = 0 } = {}) {
  const log = { launches: 0, contexts: 0, contextsClosed: 0, browserClosed: 0, active: 0, maxActive: 0, routed: 0, sockets: 0 };
  const browser = {
    async newContext(options) {
      assert.equal(options.serviceWorkers, 'block');
      assert.equal(options.acceptDownloads, false);
      log.contexts++;
      let closeContext;
      const closed = new Promise(resolve => { closeContext = resolve; });
      return {
        async newPage() {
          return {
            setDefaultTimeout() {},
            async route(pattern, handler) { log.routed++; assert.equal(typeof handler, 'function'); },
            async routeWebSocket() { log.sockets++; },
            async goto() {
              log.active++; log.maxActive = Math.max(log.maxActive, log.active);
              let timer;
              try { await Promise.race([new Promise(r => { timer = setTimeout(r, gotoDelay); }), closed.then(() => { throw new Error('context closed'); })]); }
              finally { clearTimeout(timer); log.active--; }
            },
            async waitForLoadState() {},
            async content() { return '<h1>Rendered</h1>'; },
          };
        },
        async close() { log.contextsClosed++; closeContext(); },
      };
    },
    async close() { log.browserClosed++; },
  };
  return { log, launch: async () => { log.launches++; return browser; } };
}

test('renderer shares one browser per scan, renders pages one at a time and closes everything', async () => {
  const { log, launch } = fakeBrowser({ gotoDelay: 20 });
  const renderer = createRenderer({ launch });
  const results = await Promise.all([renderer.render(home, {}), renderer.render({ ...home, url: 'https://example.com/a' }, {})]);
  assert.deepEqual(results.map(r => r.html), ['<h1>Rendered</h1>', '<h1>Rendered</h1>']);
  assert.equal(log.launches, 1);
  assert.equal(log.maxActive, 1);
  assert.equal(log.contexts, 2);
  assert.equal(log.contextsClosed, 2);
  assert.equal(log.routed, 2);
  assert.equal(log.sockets, 2);
  await renderer.close();
  assert.equal(log.browserClosed, 1);
  await assert.rejects(renderer.render(home, {}), /kapatıldı/);
});

test('aborting a scan stops rendering immediately and closes the context', async () => {
  const { log, launch } = fakeBrowser({ gotoDelay: 10000 });
  const renderer = createRenderer({ launch });
  const controller = new AbortController();
  const started = Date.now();
  const pending = renderer.render(home, { signal: controller.signal });
  setTimeout(() => controller.abort(new Error('cancelled')), 20);
  await assert.rejects(pending, /cancelled/);
  assert.ok(Date.now() - started < 2000);
  assert.equal(log.contextsClosed, 1);
  await renderer.close();
  const before = log.launches;
  await assert.rejects(createRenderer({ launch }).render(home, { signal: AbortSignal.abort(new Error('already')) }), /already/);
  assert.equal(log.launches, before);
});

test('rendering can be switched off with ROGI_RENDER=off', () => {
  assert.equal(renderEnabled({}), true);
  assert.equal(renderEnabled({ ROGI_RENDER: 'off' }), false);
});
