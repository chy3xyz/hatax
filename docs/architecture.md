# Architecture

## Overview

```
Browser
  /pages/*   public site, Alpine, site nav
  /admin/*   operator shell, Alpine + HTMX
        |
        v
Hono  /api/*
  JWT (aud = admin | community) + CSRF
        |
        v
SQLite (bun:sqlite)  data/hatax.db
```

Runtime: **Bun**. Hono listens via `export default { port, fetch }` and serves production static files with `hono/bun`.


## Two frontends

| Prefix | Layout | Auth | Role |
|--------|--------|------|------|
| `/pages/*` | Standalone pages and site nav | Public reads; community JWT for writes | Members and visitors |
| `/admin/*` | `app-shell` (sidebar, header, tabs) | Admin JWT, except login, lock, and error pages | Operators |

`vite-plugin-layout.js` wraps admin HTML that starts with `<!-- layout: app-shell -->`. Public pages are not wrapped.

`/` redirects to `/pages/index.html`.

## Dual authentication

| Identity | Login | JWT `aud` | Typical rights |
|----------|-------|-----------|----------------|
| Staff | `POST /api/auth/login` | `admin` | Users, roles, departments, content moderation, stats |
| Member | `POST /api/community/login` | `community` | Posts, replies, points, purchases, signups, DMs |

Middleware in `server/middleware/`:

- `requireAuth` — admin JWT
- `requireCommunityAuth` — community JWT
- `requireCsrf` — write requests; header must match the `hatax_csrf` cookie
- `optionalAuth` — attach a member when a token is present (for example “already signed up”)

Passwords are bcrypt hashes via `Bun.password` (`algorithm: 'bcrypt'`, cost 10). Tokens are HS256 via `jose`.

## Response envelope

```json
{ "code": 0, "msg": "ok", "data": {} }
```

`code === 0` is success. Some list endpoints used by HTMX return HTML fragments by default. Pass `?format=json` where the route supports it (departments).

## Frontend state

- `Alpine.store('app')` — sidebar, tabs, theme, breadcrumbs (admin)
- `Alpine.store('i18n')` — English and Chinese admin chrome
- `sessionStorage` — `hatax_token` (admin), `hatax_community_token` (community)

Admin navigation lives in `src/menu.js`. Labels for both locales live in `src/i18n.js` under `menu.*`.

## Server modules

```
server/
├── index.js        # CORS, routes, static files in production
├── config.js       # env and JWT secret checks
├── routes/         # HTTP handlers
├── db/             # SQL and seed
├── middleware/     # auth
└── views/          # HTML fragments for HTMX
```

| Domain | Mount |
|--------|--------|
| Staff auth | `/api/auth` |
| Members | `/api/community` |
| RBAC | `/api/users`, `/api/roles`, `/api/depts` |
| Audit | `/api/logs` |
| Blog | `/api/blog` |
| Forum | `/api/forum` |
| Tasks | `/api/tasks` |
| Courses | `/api/courses` |
| Events | `/api/events` |

## Development and production

| Mode | Frontend | API |
|------|----------|-----|
| Development | Vite | Separate Hono process. The browser calls `VITE_API_BASE` directly |
| Production | `dist/` via `hono/bun` `serveStatic` | Same Bun process |

```bash
bun run build
NODE_ENV=production bun start
```

## Adding a page

**Admin**

1. Add HTML under `admin/` with `<!-- layout: app-shell -->` on the first line.
2. Register it in `MENU_MAP` and `MENU_GROUPS` in `src/menu.js`.
3. Add `menu.<name>` strings for `zh` and `en` in `src/i18n.js`.
4. Put Alpine page logic in `src/admin/` and register it from `main.js`.

**Public**

1. Add HTML under `pages/`.
2. Call the API through `src/public/api.js`.
3. Reuse `components/layout/site-nav.html`.

See [Contributing](../CONTRIBUTING.md).
