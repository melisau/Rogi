// Headless rendering split into its own deployment.
// The render deployment (ROGI_ROLE=render) holds no database or session secrets; a Chromium
// escape there reaches nothing but this token. The main site calls it with remoteRenderer().
import { timingSafeEqual } from 'node:crypto';
import { AuditError, readLimited, safeUrl } from '../worker/engine.js';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const MAX_HTML = 1200000;

function sameToken(given, expected) {
  const a = Buffer.from(String(given)), b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Server side: runs in the secret-free render deployment.
export function createRenderHandler({ env = process.env, makeRenderer, settings = () => ({}) }) {
  return async request => {
    if (env.ROGI_ROLE !== 'render' || !env.ROGI_RENDER_TOKEN) return json({ error: 'not_found' }, 404);
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    const auth = request.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ') || !sameToken(auth.slice(7), env.ROGI_RENDER_TOKEN)) return json({ error: 'unauthorized' }, 401);
    let home;
    try {
      const input = JSON.parse(await readLimited(new Response(request.body), MAX_HTML * 2));
      const url = safeUrl(input.url).href;
      if (typeof input.body !== 'string' || input.body.length > MAX_HTML) throw new AuditError('Geçersiz gövde.', 400, 'bad_request');
      home = { url, status: Number(input.status) || 200, type: String(input.type || 'text/html'), body: input.body };
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
    const renderer = await makeRenderer();
    try {
      const result = await renderer.render(home, { ...settings(), signal: AbortSignal.timeout(35000) });
      return json({ html: result.html, blockedRequests: result.blockedRequests, fetchedRequests: result.fetchedRequests });
    } catch (error) {
      return json({ error: error?.code || 'render_failed' }, 502);
    } finally {
      await renderer.close();
    }
  };
}

// Client side: used by the main site instead of a local Chromium.
// claim() reserves one render from the daily budget and returns false when it is spent.
export function remoteRenderer({ url, token, fetchImpl = fetch, claim = async () => true }) {
  return {
    async render(home, settings = {}) {
      if (!(await claim())) throw new AuditError('Günlük tarayıcı sınırı doldu.', 429, 'render_budget');
      const signals = [AbortSignal.timeout(40000), settings.signal].filter(Boolean);
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify({ url: home.url, status: home.status, type: home.type, body: home.body }),
        signal: AbortSignal.any(signals),
      });
      if (!response.ok) throw new AuditError('Tarayıcı servisi yanıt vermedi.', 502, 'render_remote_failed');
      const result = await response.json();
      if (typeof result.html !== 'string' || result.html.length > MAX_HTML) throw new AuditError('Tarayıcı servisi geçersiz yanıt verdi.', 502, 'render_remote_invalid');
      return result;
    },
    async close() {},
  };
}
