import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';
import { AuditError, fetchPage, safeUrl } from '../worker/engine.js';

const allowedTypes = new Set(['document', 'script', 'stylesheet', 'fetch', 'xhr']);
const maxRequests = 30;
const maxTotalBytes = 4000000;

// Chromium never performs a target-site request itself. Every allowed request is
// fulfilled by the same socket-validated transport used by the HTML scanner.
export async function renderPage(home, settings) {
  const target = safeUrl(home.url);
  const localChrome = process.env.ROGI_CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '');
  const browser = await playwright.launch({
    executablePath: localChrome || await chromium.executablePath(),
    args: localChrome ? ['--no-first-run', '--disable-background-networking', '--host-resolver-rules=MAP * 0.0.0.0'] : [...chromium.args, '--host-resolver-rules=MAP * 0.0.0.0'],
    headless: true,
    timeout: 12000,
  });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block', ignoreHTTPSErrors: false });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    let requests = 0, totalBytes = 0, blocked = 0;
    await page.route('**/*', async route => {
      const request = route.request();
      try {
        const url = safeUrl(request.url());
        if (request.method() !== 'GET' || url.origin !== target.origin || !allowedTypes.has(request.resourceType()) || ++requests > maxRequests) {
          blocked++;
          return await route.abort();
        }
        const resource = url.href === home.url ? home : await fetchPage(url.href, settings);
        if (new URL(resource.url).origin !== target.origin) throw new AuditError('Başka kaynağa yönlendirme engellendi.');
        const body = resource.body || '';
        totalBytes += Buffer.byteLength(body);
        if (totalBytes > maxTotalBytes) throw new AuditError('Tarayıcı kaynak sınırı aşıldı.', 413, 'browser_budget');
        await route.fulfill({ status: resource.status, contentType: resource.type || 'text/plain; charset=utf-8', body });
      } catch {
        blocked++;
        await route.abort().catch(() => {});
      }
    });
    await page.routeWebSocket('**/*', socket => socket.close());
    await page.goto(home.url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
    const html = await page.content();
    if (Buffer.byteLength(html) > 1200000) throw new AuditError('Oluşan sayfa boyutu sınırı aşıldı.', 413, 'rendered_page_too_large');
    return { html, blockedRequests: blocked, fetchedRequests: requests };
  } finally {
    await browser.close();
  }
}
