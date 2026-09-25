# Andrew Coggins portfolio

A Next.js portfolio for summer 2027 engineering internships. Cream/sage styling, image-led projects, expandable experience, and interactive project demos.

## Develop

```sh
npm install
npm run dev
npm run lint
npm run test:engine
npm run build
```

Next.js 16.2.10 is installed. Read `AGENTS.md` and the relevant guides under `node_modules/next/dist/docs/` before framework changes. Builds fetch Google Fonts and need network access.

## Edit content

`src/content/copy.ts` contains personal prose. `projects.ts` defines project order and assets. `case-studies.ts` contains project narratives. Contact and resume paths are in `src/lib/site.ts`. Shared styling is in `src/app/globals.css`; `/styleguide` previews the components.

See `docs/portfolio-evidence.md` for factual sources and `docs/portfolio-verification.md` for the latest validation. Demos use sample or prototype data, as labeled on their pages. No public deployment is included in this change.
