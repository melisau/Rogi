# Rogi

Rogi helps website owners and developers audit live websites and development projects for SEO, security, and usability issues.

## Run locally

Requires Node.js 22 or later. No npm dependencies are needed.

```sh
cd rogi-landing
npm run preview
```

Open http://127.0.0.1:4175. The landing page is at `/`; the audit workspace is at `/app`.

```sh
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
