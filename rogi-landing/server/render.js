import { AuditError, fetchPage, safeUrl } from '../worker/engine.js';

export const limits = {
  maxRequests: 30,
  maxTotalBytes: 4000000,
  maxHtmlBytes: 1200000,
  launchMs: 12000,
  navigationMs: 12000,
  idleMs: 2500,
};
const allowedTypes = new Set(['document', 'script', 'stylesheet', 'fetch', 'xhr']);

// Defence in depth for traffic that page.route never sees (preconnect, DNS prefetch,
// WebRTC, browser background services): every hostname resolves nowhere, every
// proxied connection goes to a closed local port, and WebRTC may not use raw UDP.
// MAP * ~NOTFOUND matters: mapping to 0.0.0.0 would reach this host's own loopback services on Linux.
export const hardenedArgs = [
  '--host-resolver-rules=MAP * ~NOTFOUND',
  '--proxy-server=http://127.0.0.1:9',
  '--proxy-bypass-list=<-loopback>',
  '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
  '--webrtc-ip-handling-policy=disable_non_proxied_udp',
  '--dns-prefetch-disable',
  '--no-pings',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-domain-reliability',
  '--disable-sync',
  '--no-first-run',
];
const overriddenFlags = ['--host-resolver-rules', '--proxy-server', '--proxy-bypass-list', '--force-webrtc-ip-handling-policy', '--webrtc-ip-handling-policy'];
export const browserArgs = (baseArgs = []) => [...baseArgs.filter(arg => !overriddenFlags.some(flag => arg.startsWith(flag))), ...hardenedArgs];

async function launchBrowser() {
  const [{ chromium: playwright }, { default: chromium }] = await Promise.all([import('playwright-core'), import('@sparticuz/chromium')]);
  const localChrome = process.env.ROGI_CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '');
  return playwright.launch({
    executablePath: localChrome || await chromium.executablePath(),
    args: browserArgs(localChrome ? [] : chromium.args),
    headless: true,
    timeout: limits.launchMs,
  });
}

function untilAborted(promise, signal) {
  if (!signal) return promise;
  signal.throwIfAborted();
  let onAbort;
  const aborted = new Promise((_, reject) => { onAbort = () => reject(signal.reason); signal.addEventListener('abort', onAbort, { once: true }); });
  return Promise.race([promise, aborted]).finally(() => signal.removeEventListener('abort', onAbort));
}

// Chromium never performs a target-site request itself. Every allowed request is
// fulfilled by the same socket-validated transport used by the HTML scanner.
export function createRouteHandler({ home, settings = {}, fetchResource = fetchPage, stats = { requests: 0, blocked: 0, totalBytes: 0 } }) {
  const target = safeUrl(home.url);
  const handler = async route => {
    const request = route.request();
    try {
      const url = safeUrl(request.url());
      if (request.method() !== 'GET' || url.origin !== target.origin || !allowedTypes.has(request.resourceType()) || ++stats.requests > limits.maxRequests) {
        stats.blocked++;
        return await route.abort();
      }
      const resource = url.href === home.url ? home : await fetchResource(url.href, settings);
      if (new URL(resource.url).origin !== target.origin) throw new AuditError('Başka kaynağa yönlendirme engellendi.');
      const body = resource.body || '';
      stats.totalBytes += Buffer.byteLength(body);
      if (stats.totalBytes > limits.maxTotalBytes) throw new AuditError('Tarayıcı kaynak sınırı aşıldı.', 413, 'browser_budget');
      await route.fulfill({ status: resource.status, contentType: resource.type || 'text/plain; charset=utf-8', body });
    } catch {
      stats.blocked++;
      await route.abort().catch(() => {});
    }
  };
  handler.stats = stats;
  return handler;
}

// One browser per scan; pages render one at a time and each gets a fresh context.
// An aborted scan closes the active context at once instead of waiting for timeouts.
export function createRenderer({ launch = launchBrowser } = {}) {
  let browserPromise, queue = Promise.resolve(), closed = false;
  async function renderOnce(home, settings = {}) {
    const { signal } = settings;
    signal?.throwIfAborted();
    if (closed) throw new AuditError('Tarayıcı kapatıldı.', 503, 'browser_closed');
    const browser = await untilAborted(browserPromise ??= launch(), signal);
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false, ignoreHTTPSErrors: false });
    const onAbort = () => { context.close().catch(() => {}); };
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(limits.navigationMs);
      const handler = createRouteHandler({ home, settings });
      await page.route('**/*', handler);
      await page.routeWebSocket('**/*', socket => socket.close());
      await untilAborted(page.goto(home.url, { waitUntil: 'domcontentloaded', timeout: limits.navigationMs }), signal);
      await untilAborted(page.waitForLoadState('networkidle', { timeout: limits.idleMs }).catch(() => {}), signal);
      const html = await untilAborted(page.content(), signal);
      if (Buffer.byteLength(html) > limits.maxHtmlBytes) throw new AuditError('Oluşan sayfa boyutu sınırı aşıldı.', 413, 'rendered_page_too_large');
      return { html, blockedRequests: handler.stats.blocked, fetchedRequests: handler.stats.requests };
    } finally {
      signal?.removeEventListener('abort', onAbort);
      await context.close().catch(() => {});
    }
  }
  return {
    render(home, settings) {
      const run = queue.then(() => renderOnce(home, settings));
      queue = run.catch(() => {});
      return run;
    },
    async close() {
      closed = true;
      const browser = await browserPromise?.catch(() => null);
      await browser?.close().catch(() => {});
    },
  };
}
