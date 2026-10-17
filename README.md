# Rogi

Rogi helps website owners and developers audit live websites and development projects for SEO, security, and usability issues.

## Run locally

Requires Node.js 24. Install the pinned dependencies before running.

```sh
cd rogi-landing
npm ci
npm run preview
```

Open http://127.0.0.1:4175. The landing page is at `/`; the audit workspace is at `/app`.

```sh
npm test
npm run build
```

Build output is generated in `dist/server/` as Cloudflare Worker modules.

## Features and scope

- Turkish/English landing page, with saved language preference.
- Interactive sample report, workflow instructions, and FAQ.
- Responsive desktop and mobile layouts.
- Existing Turkish audit workspace, live website scan API, and local project review.
- Security and mobile checklists require verification in real flows and on devices.
- The landing-page score is illustrative, not a real audit result.

The original audit implementation is retained in `seo-kontrol/`.

## Development backlog

See [TASKS.md](TASKS.md) for verified progress and remaining work. See [SECURITY.md](rogi-landing/SECURITY.md) before deploying a public scanning endpoint. DNS rebinding protection and distributed rate limits remain open.

Reports and checklist notes are stored only in this browser (last 10 reports). JSON and CSV export are available. The audit workspace, checklists, repair guidance, report exports, and API errors support Turkish and English; original website content and user notes are preserved.

## Personal demo

https://rogi-audit.vercel.app — Vercel Authentication is enabled. The owner must sign in with the Vercel account. This is a non-commercial Hobby deployment; no paid services were enabled. Vercel uses the Node transport with socket-level DNS validation; the Worker-only transport still needs equivalent egress hardening.

## Local framework review

Next.js exported metadata, generateMetadata, route files and JSX title/description/canonical/H1 signals are parsed locally with Babel. Dynamic code is not executed. Findings identify file/line evidence and require runtime verification. The parser is loaded only when a project is reviewed. Project reading is limited to 400 supported files, under 500 KB each, with a 10 MB total source budget.

`seo-kontrol` is now a compatibility entrypoint using the canonical `rogi-landing` implementation. Run `npm ci` in `rogi-landing` first. The compatibility preview serves the audit workspace at `/`; both builds use the same engine. Worker environments without a secure transport refuse scanning rather than falling back to unchecked networking.

### Dil adresleri ve SEO
Landing sayfası `/tr` ve `/en` adreslerinde sunucu tarafında çevrilmiş HTML sunar. `/` Türkçe adrese yönlenir. Her dil için canonical, hreflang, sosyal metaveri ve WebSite yapılandırılmış verisi bulunur; sitemap iki dil adresini içerir.
