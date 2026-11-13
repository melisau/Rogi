import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderHandler, remoteRenderer } from '../server/render-service.js';
import { chooseRenderer } from '../server/transport.js';

const env = { ROGI_ROLE: 'render', ROGI_RENDER_TOKEN: 'secret-token' };
const fakeRenderer = (calls = []) => async () => ({ render: async (home) => { calls.push(home); return { html: '<h1>ok</h1>', blockedRequests: 0, fetchedRequests: 1 }; }, close: async () => { calls.push('closed'); } });
const post = (body, token = 'secret-token') => new Request('https://render.test/api/render', { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
const home = { url: 'https://example.com/', status: 200, type: 'text/html', body: '<div id="root"></div>' };

test('render service only answers in the render role with the right token', async () => {
  assert.equal((await createRenderHandler({ env: {}, makeRenderer: fakeRenderer() })(post(home))).status, 404);
  assert.equal((await createRenderHandler({ env: { ROGI_ROLE: 'render' }, makeRenderer: fakeRenderer() })(post(home))).status, 404);
  const handle = createRenderHandler({ env, makeRenderer: fakeRenderer() });
  assert.equal((await handle(post(home, 'wrong'))).status, 401);
  assert.equal((await handle(new Request('https://render.test/api/render'))).status, 405);
});

test('render service rejects private targets and renders public ones', async () => {
  const calls = [];
  const handle = createRenderHandler({ env, makeRenderer: fakeRenderer(calls) });
  assert.equal((await handle(post({ ...home, url: 'http://127.0.0.1/' }))).status, 400);
  assert.equal((await handle(post({ ...home, body: 5 }))).status, 400);
  const r = await handle(post(home));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).html, '<h1>ok</h1>');
  assert.equal(calls[0].url, 'https://example.com/');
  assert.equal(calls.at(-1), 'closed');
});

test('remote renderer sends the token, respects the daily budget and validates replies', async () => {
  const sent = [];
  const fetchImpl = async (url, init) => { sent.push({ url, init }); return Response.json({ html: '<h1>x</h1>' }); };
  const r = remoteRenderer({ url: 'https://render.test/api/render', token: 't', fetchImpl });
  assert.equal((await r.render(home)).html, '<h1>x</h1>');
  assert.equal(sent[0].init.headers.authorization, 'Bearer t');
  assert.equal(JSON.parse(sent[0].init.body).url, home.url);
  const spent = remoteRenderer({ url: 'https://render.test/api/render', token: 't', fetchImpl, claim: async () => false });
  await assert.rejects(spent.render(home), e => e.code === 'render_budget');
  const bad = remoteRenderer({ url: 'https://render.test/api/render', token: 't', fetchImpl: async () => Response.json({ html: 1 }) });
  await assert.rejects(bad.render(home), e => e.code === 'render_remote_invalid');
  const down = remoteRenderer({ url: 'https://render.test/api/render', token: 't', fetchImpl: async () => new Response('', { status: 502 }) });
  await assert.rejects(down.render(home), e => e.code === 'render_remote_failed');
});

test('remote mode never starts a local browser', async () => {
  let local = 0;
  const loadRenderer = async () => { local++; return { createRenderer: () => ({}) }; };
  assert.equal(chooseRenderer({ ROGI_RENDER: 'off' }, { loadRenderer }), undefined);
  assert.equal(chooseRenderer({ ROGI_RENDER: 'remote' }, { loadRenderer }), undefined);
  const make = chooseRenderer({ ROGI_RENDER: 'remote', ROGI_RENDER_URL: 'https://render.test/api/render', ROGI_RENDER_TOKEN: 't' }, { loadRenderer, claim: async () => true });
  const renderer = await make();
  assert.equal(typeof renderer.render, 'function');
  assert.equal(local, 0);
});
