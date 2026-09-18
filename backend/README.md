# Codevera backend

NestJS API with PostgreSQL persistence for the bilingual Codevera website. The sibling `../codevera` frontend now consumes this API dynamically. Admin authentication and management APIs are implemented; an admin panel UI is not part of this backend project.

## Local development

Node.js 22.13+ and PostgreSQL 16+ are required.

```sh
cd ~/Desktop/codevera-nest
npm ci
# On a fresh checkout only:
cp .env.example .env
# Edit DATABASE_URL, CORS_ORIGINS and other settings for your environment.
npm run db:migrate
npm run db:seed
npm run start:dev
```

The API runs at `http://127.0.0.1:4000/api/v1`. Health: `/api/v1/health`. Swagger UI: `/api/docs`, OpenAPI JSON: `/api/docs-json` when `DOCS_ENABLED=true`.

**This workspace is already configured:** an isolated PostgreSQL cluster lives in `.local/pg`, bound to `127.0.0.1:55432`, with `codevera`, `codevera_test`, and `codevera_browser_test` databases. Generated credentials are in the ignored, permission-restricted `.env`; do not overwrite it with the example. The existing PostgreSQL installation on port 5432 was not modified.

`npm run start:dev` automatically starts this existing local cluster when `DATABASE_URL` targets localhost port 55432. It verifies the connection and preserves all data. Other database URLs and production environments are left externally managed. You can also start it separately with `npm run db:start`.

If you need to start the cluster manually, run from this directory:

```sh
pg_ctl -D .local/pg -l .local/postgres.log -o "-p 55432 -h 127.0.0.1 -k $PWD/.local" start
```

For a portable Docker alternative, set a strong `POSTGRES_PASSWORD` in `.env`, run `docker compose up -d postgres`, and point `DATABASE_URL` to port **5433** (the Compose host port). Create separate test databases before running tests. Compose does not replace or mount the workspace’s native PostgreSQL cluster.

## First admin account

There is no default password, public registration, or seed admin. Set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` temporarily in your shell or private environment file, then run:

```sh
npm run admin:create
```

Use a unique password of at least 12 characters. The command creates an `OWNER` only if no users exist, and never logs credentials. Remove the bootstrap variables afterward. Subsequent users are created by an authenticated owner using `/admin/users`.

`POST /api/v1/auth/login` accepts `{ "email": "…", "password": "…" }` and returns `accessToken`, `tokenType`, `expiresAt`, and the public user fields. Use `Authorization: Bearer <accessToken>` for admin requests. Swagger’s **Authorize** dialog accepts this token.

Passwords use salted scrypt (N=32768, r=8, p=1). Opaque 256-bit session tokens are stored only as SHA-256 hashes, expire after `SESSION_HOURS` (default 8), and can be revoked immediately. Logout revokes the current session; password changes revoke every session; disabling a user or changing their role invalidates sessions. Roles and active status are checked against PostgreSQL on every authenticated request.

For the future admin UI, keep bearer tokens in memory or use a server-side session/BFF with secure HttpOnly cookies; do not persist them in browser localStorage. All production traffic must use HTTPS.

## API routes

All routes below have the `/api/v1` prefix. Public routes are explicitly marked; the global guard protects every other endpoint by default.

| Method           | Route                                                     | Access / purpose                                                      |
| ---------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| GET              | `/health`                                                 | Public database health check                                          |
| GET              | `/projects?locale=en&page=1&limit=24`                     | Published projects; `en` or `fa`                                      |
| GET              | `/projects/:slug?locale=fa`                               | Published project detail; drafts return 404                           |
| GET              | `/company`                                                | Bilingual company data and contact arrays                             |
| GET              | `/tools`, `/founders`                                     | Published tools/founders, paginated                                   |
| GET              | `/consultation-settings`, `/availability`                 | Schedule and remaining slots; no personal information                 |
| POST             | `/bookings`                                               | Validated reservation creation                                        |
| POST             | `/contact`                                                | Persist a contact message                                             |
| POST             | `/auth/login`                                             | Public, rate limited                                                  |
| GET              | `/auth/me`                                                | Current authenticated user                                            |
| POST             | `/auth/logout`, `/auth/password`                          | Revoke session / change password                                      |
| GET, PUT         | `/admin/company`, `/admin/consultation-settings`          | Admin reads/replaces settings                                         |
| GET, POST        | `/admin/content/:kind`                                    | Admin list/create; kind is `projects`, `tools`, or `founders`         |
| GET, PUT, DELETE | `/admin/content/:kind/:id`                                | Admin read/replace/delete by UUID                                     |
| GET              | `/admin/bookings`, `/admin/messages`, `/admin/audit-logs` | Admin paginated lists                                                 |
| PATCH            | `/admin/bookings/:id`                                     | Set `{ "status": "cancelled" }` or `completed` on a confirmed booking |
| PATCH            | `/admin/messages/:id`                                     | Set status to `new`, `read`, or `archived`                            |
| GET, POST        | `/admin/users`                                            | Owner-only list/create                                                |
| PATCH            | `/admin/users/:id`                                        | Owner-only name/role/active updates                                   |

List responses are `{ items, total, page, limit }`; page size is capped at 100. The frontend fetches every project page so its portfolio has no artificial maximum. `PUT` replaces the complete editable record; omit read-only IDs/timestamps when submitting it. `PATCH` is reserved for user/status updates. Unknown fields and invalid content are rejected. Refer to Swagger schemas and `seed/content.json` for complete request payload examples.

## Entities and design

- **Projects:** UUID, unique stable slug, publication/featured flags, order, shared cover/year/technologies/demo fields, and validated English/Persian translations containing case-study copy, services and optional galleries.
- **Company:** one record with bilingual name/description/location, multiple emails and normalized phone numbers, labeled bilingual addresses, optional map links and social links. `contactConfigured` distinguishes initial demo details from real business information.
- **Tools:** unique slug, order/publication controls, bilingual names and optional descriptions/HTTPS links.
- **Founders:** unique slug, publication controls, bilingual names/roles/biographies and optional portrait data. Empty until real profiles are supplied.
- **Bookings:** customer name/phone, UTC start/end timestamps, locale, status and timestamps.
- **Consultation settings:** UTC business schedule, working weekdays, duration, booking horizon, notice period, blocked dates and slots.
- **Users and sessions:** owner/admin accounts and revocable authenticated sessions. Self-disable/self-demotion is blocked; at least one active owner must remain.
- **Messages:** contact details, message, locale, workflow status and timestamp.
- **Audit logs:** actor, action, entity and identifier, without copied request bodies or passwords. Content/user/settings/status mutations and password changes are recorded transactionally.

Relational keys, timestamps, status constraints and indexes live in versioned SQL migrations. Flexible bilingual editorial fields use JSONB, validated through strict Zod schemas. The project intentionally uses the `pg` driver and parameterized SQL rather than automatic ORM schema synchronization. SQL table names are chosen only from a fixed server-side allowlist. Database operations are isolated in services; HTTP controllers own routing and validation.

Directories: `src/auth`, `src/content`, `src/bookings`, `src/database`, `src/common`, `migrations`, `scripts`, `seed`, and `test`. Auth, content and bookings are separate Nest modules.

## Scheduling and concurrency

The default seeded schedule is Monday–Friday, 09:00–17:00 UTC, 30-minute meetings, 24 hours’ notice, and a 28-day horizon. Change it with the authenticated settings endpoint. Weekdays use 0=Sunday through 6=Saturday. Blocked dates use `YYYY-MM-DD`; blocked slots use `YYYY-MM-DDTHH:mm`.

Booking creation reads/locks the schedule in a transaction and revalidates the requested time. A PostgreSQL GiST exclusion constraint on `tstzrange(starts_at, ends_at, '[)')` rejects **any overlapping confirmed interval**, including unequal start times. Availability also checks overlapping intervals, so changing meeting duration cannot silently double-book existing appointments. Cancellation releases capacity. Schedule changes do not cancel existing reservations.

The backend time basis is explicitly UTC. Persian/Jalali dates and digits are a frontend display concern. Persian and Arabic-Indic phone digits are normalized before validation. No email, SMS, meeting-room or calendar-provider integration is claimed; bookings/messages persist in PostgreSQL and are accessible to authorized admins.

## Seed and legacy migration

`npm run db:migrate` applies each numbered SQL file once under a PostgreSQL advisory lock and per-migration transaction. Never edit an already applied migration; add another file.

`npm run db:seed` inserts the three labeled demo portfolio projects, existing tools, company placeholders and consultation settings. It preserves existing rows rather than overwriting edited content. It creates no admin and no fictional founders.

The frontend’s existing consultation was imported with its original ID. Its SQLite file remains untouched as a backup. The ignored `.local/legacy-data.json` export can be replayed with `npm run db:import-legacy`; imports are transactional and idempotent by original ID, and conflicting overlapping bookings cause a rollback rather than silent data loss. Protect/delete that export according to your retention policy once the migration is accepted.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

API integration tests require `TEST_DATABASE_URL` pointing to a separate database whose name ends in `_test`. They **reset only that test database**, apply migrations/seed data, create test-only users, start a real Nest HTTP server, and verify PostgreSQL persistence, role/session security, validation, bilingual data, drafts, booking concurrency/overlaps, scheduling, messages and audit records.

The sibling frontend’s `npm run test:e2e` starts a second test API on port 4100 and uses **BROWSER_TEST_DATABASE_URL** (also ending in `_test`) so browser tests cannot reset API integration-test data. It launches Next.js on 3100 and verifies both languages, forms, accessibility and live admin changes appearing on pages without rebuilding. Both test databases must be distinct from `DATABASE_URL`.

## Deployment considerations

Build with `npm ci && npm run build`, apply migrations as a deployment step, and run `npm start`. Set `HOST=0.0.0.0` inside a container; the default binds only localhost. Set the frontend’s server-only `CODEVERA_API_URL` to the reachable API URL ending in `/api/v1`.

Use a managed/private PostgreSQL service or persistent volumes with backups, a least-privilege application role, HTTPS termination, explicit `CORS_ORIGINS`, and production secrets from your hosting platform. `PGSSL=true` verifies database TLS; `PGSSL_CA_FILE` optionally supplies the trusted CA. Do not disable certificate verification. Public docs can be disabled with `DOCS_ENABLED=false`.

Helmet headers, 64 KiB JSON body limits, parameterized queries, strict input validation, sanitized errors and rate limiting are installed. Login is limited to 5 attempts/minute per source IP; public bookings to 30/minute and contact messages to 5/minute. The current rate-limit store is in-process; use a shared Redis-backed throttler for multiple API instances. The API does not trust arbitrary forwarded IP headers. With the Next.js public proxy, requests share the proxy IP until your deployment configures a trusted-proxy strategy.

Assets currently reference validated local paths in the frontend’s `public` directory. Upload/object-storage management, email delivery, password-recovery email, and the visual admin panel are separate future features. There is no default admin secret, public user registration or automatic deployment.
