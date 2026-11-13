// Entry point of the separate, secret-free render deployment (ROGI_ROLE=render).
// On the main site this returns 404.
import { createRenderHandler } from '../server/render-service.js';
import { createRenderer } from '../server/render.js';
import { publicAddresses, secureFetch } from '../server/transport.js';

const handle = createRenderHandler({
  makeRenderer: () => createRenderer(),
  settings: () => ({ fetchImpl: secureFetch, resolveHost: publicAddresses }),
});
export default { fetch: request => handle(request) };
