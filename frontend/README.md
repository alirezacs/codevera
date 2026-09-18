# Codevera frontend

Bilingual Next.js website for Codevera, with English and Persian routes, RTL layouts and self-hosted Vazir typography. The sibling `../codevera-nest` NestJS backend stores content and submissions in PostgreSQL.

## Run locally

Use Node.js 22.13+ and npm. First start PostgreSQL and the backend following [its setup guide](../codevera-nest/README.md). This workspace already has private environment files configured; do not overwrite them.

```sh
npm ci
# Fresh checkout only: copy .env.example to .env.local and configure it.
npm run dev
```

Open http://localhost:3000. `CODEVERA_API_URL` is server-only and defaults to `http://127.0.0.1:4000/api/v1`. Keep it reachable from the Next.js server. No database credentials belong in the frontend.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Data and architecture

Next.js Server Components fetch published projects, company details, tools, founders and consultation settings through `src/lib/backend.ts`. Requests are uncached so published admin changes appear without rebuilding. Metadata and sitemap use the same API data. Content outages are surfaced instead of silently substituting stale demonstration records.

Browser forms use same-origin Next.js API routes, which validate input and origin before forwarding to NestJS. PostgreSQL is authoritative for availability, interval overlap protection, bookings and contact messages. The frontend no longer opens SQLite. The previous `data/codevera.db` remains as a backup; its existing booking was imported into PostgreSQL.

| Location                             | Purpose                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| `src/app/[locale]`                   | Pages and localized metadata                            |
| `src/lib/backend.ts`                 | Server-side content API client                          |
| `src/lib/api-proxy.ts`               | Public form API forwarding                              |
| `src/components`                     | Navigation, portfolio, founders and interactive forms   |
| `src/i18n`                           | Routing, translation helpers and Persian interface copy |
| `src/config/site.ts`                 | Static services/process and site URL                    |
| `src/config/availability.ts`         | Schedule type; settings are managed in the backend      |
| `src/data`                           | Content types and founder-section interface copy        |
| `public/projects`, `public/founders` | Project artwork and approved portraits                  |
| `tests`                              | Form validation and browser integration tests           |

## Loading experience

Server-rendered pages stream a shared skeleton while API data is pending. Silhouettes adapt to the home, portfolio, project detail, about and contact layouts, using the site's paper and olive palette. The footer has its own Suspense boundary so company data does not block the page shell. Header navigation remains available during loading.

Loading labels are localized, decorative placeholders are hidden from assistive technology, and reduced-motion preferences disable shimmer. No artificial delay is added. Browser tests hold database reads in the isolated test database to verify that placeholders render before content resolves in both languages.

## Managing content

Create the first owner in the backend using `npm run admin:create`, then authenticate through its API. Swagger documentation is at http://127.0.0.1:4000/api/docs. Projects, tools and founders have publication and ordering controls. Company data supports multiple emails, phone numbers and bilingual addresses. Both English and Persian editorial fields are required and validated by the backend.

The seed preserves the three clearly labeled concept projects and company placeholders. Supply actual company details before setting `contactConfigured` to true. Founder profiles stay empty until verified names and biographies are provided. Portraits are optional; the frontend uses initials when absent. Add image files under `public` and reference their local paths through the content API. Upload management and a visual admin panel are not included.

## English and Persian

Persian is the default language at `/`, `/about`, `/portfolio` and `/contact`. English uses `/en` and corresponding subpaths. The language switch preserves the current page. `src/proxy.ts` internally rewrites unprefixed Persian requests to `/fa`; legacy `/fa` URLs redirect to their canonical unprefixed equivalents.

Pages have localized metadata, alternate-language links, HTML language/direction and bilingual sitemap entries. Interface translations live in `src/i18n/fa.json`; editorial translations live in PostgreSQL. Original Vazir v30.1.0 font files and their SIL Open Font License are self-hosted in `public/fonts`.

The Persian booking calendar displays Jalali dates, Persian digits and a Saturday-first week. Both languages reserve the same UTC slots. Persian and Arabic-Indic phone digits normalize to ASCII. Business hours, duration, notice, booking horizon and exclusions are managed through the backend consultation-settings endpoint.

Contact messages and bookings persist in PostgreSQL. Email, SMS and calendar-provider delivery are not connected; confirmation copy reflects this. Authorized admins can inspect submissions and cancel bookings through the API.

## Browser verification

Build first, then run:

```sh
npm run build
npm run test:e2e
```

Playwright uses installed Google Chrome, starts a test API on port 4100 and Next.js on 3100. The backend must have a separate `BROWSER_TEST_DATABASE_URL` ending in `_test`; this database is reset for the suite. It is distinct from both the development database and API integration-test database. Test-only admin credentials are generated for each run.

Tests cover both languages, RTL/Vazir, responsive layouts, accessibility rules, navigation, bookings and duplicate attempts, contact submissions, request validation, and admin changes appearing dynamically without a rebuild. Artifacts and failure screenshots are ignored by version control.

## Deployment

Deploy Next.js with a reachable NestJS API and set `CODEVERA_API_URL` plus `NEXT_PUBLIC_SITE_URL`. Follow the backend guide for migrations, PostgreSQL backups, secrets, HTTPS and rate limiting. The frontend requires no persistent database disk. Google fonts used by the English design are downloaded during the initial build and served locally afterward.
