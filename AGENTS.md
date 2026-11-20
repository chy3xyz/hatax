# AGENTS.md — HatTax (Vite + Alpine + HTMX + Tailwind + Hono + Bun + SQLite)

Conventions for coding agents. This file describes the repository as it is.

---

## 1. Overview

| Layer | Stack |
|-------|--------|
| Frontend | Vite 6, Alpine 3, HTMX 1, Tailwind 3, ECharts |
| Backend | **Bun**, Hono 4 (`hono/bun`), jose JWT, `Bun.password` (bcrypt), **bun:sqlite** |

```bash
bun install
cp .env.example .env   # optional JWT_SECRET override in development
bun run dev:full       # Vite (VITE_PORT, often 3490) + Hono :8790

# Production (source)
export JWT_SECRET='at least 32 random characters'
export NODE_ENV=production
bun run build && bun start

# Linux VPS single binary
bun run compile          # release/hatax-linux-x64 (embed dist/)
# bun run compile:musl   # Alpine
```

Demo accounts: admin `admin` / `123456`, community `demo` / `123456`.  
Database: `data/hatax.db` (created and seeded on first boot).

**Docs:** [README.md](README.md) · [docs/](docs/README.md) · [CONTRIBUTING.md](CONTRIBUTING.md)

| Prefix | Role | Auth |
|--------|------|------|
| `/pages/*` | Public site, blog, forum, tasks, courses, events | Public reads |
| `/admin/*` | Operator UI | Token required, except login, lock, and error pages |
| `/` | Redirects to `/pages/index.html` | — |

---

## 2. Layout

```
admin/          # Admin HTML (layout: app-shell)
pages/          # Public HTML (no shell)
server/
  config.js     # Bun.env / process.env; JWT_SECRET enforced in production
  index.js      # export default { port, fetch } for Bun.serve
  db/  routes/  views/  lib/
src/
  auth.js       # PUBLIC_PREFIXES=/pages/ ; admin login allowlist
  admin/        # Alpine page modules
```

---

## 3. API

Envelope: `{ code, msg, data }`. `code === 0` is success.

| Path | Notes |
|------|--------|
| `POST /api/auth/login` | Admin JWT + CSRF; writes `login_logs` |
| `POST /api/community/login` | Community JWT (`aud=community`) |
| `GET/POST/PUT/DELETE /api/users` | Staff users; writes go to `op_logs` |
| `GET/POST/PUT/DELETE /api/roles` | Roles and `permissions` JSON |
| `GET/POST/PUT/DELETE /api/depts` | Tree; HTML by default, `?format=json` |
| `GET /api/blog/posts` | Public list; `?admin=1` includes drafts |
| `GET /api/blog/posts/:slug` | Markdown to HTML |
| `POST /api/blog/works` | Community article |
| `POST/PUT/DELETE /api/blog/posts` | Official posts (admin JWT + CSRF) |
| `GET /api/forum/categories` | Categories |
| `GET /api/forum/topics` | Topic list |
| `GET /api/forum/topics/:id` | Topic and replies |
| `POST /api/forum/topics`, replies, likes | Community JWT + CSRF |
| `/api/tasks` `/api/courses` `/api/events` | See `docs/api.md` |
| `GET/POST /api/ai/*` | Customer service: status, search, chat (site aggregate ± optional LLM) |

Public: `/pages/blog.html`, `/pages/forum.html`.  
Admin: `/admin/blog.html`, `/admin/forum.html`.  
Design: `docs/blog-forum-design.md`.

---

## 4. JWT_SECRET

- **Development:** Bun loads `.env` automatically. A missing secret uses a weak default and logs a warning.
- **Production:** `NODE_ENV=production` must use real process env. Missing, short (<32), or known placeholder secrets **exit the process**.

---

## 5. Frontend wiring

- User list and department tree: HTMX to `/api/users` and `/api/depts`
- Roles, login log, operation log: Alpine `rolePage`, `loginLogPage`, `opLogPage`
- Writes: `Authorization` plus `X-CSRF-Token`
- Admin menu copy: `src/i18n.js` `menu.*` for `zh` and `en`

---

## 6. Notes

- Runtime is **Bun** (not Node). Entry is `export default { port, fetch }`. Production static files via `server/lib/static.js` (works with `bun build --compile --asset ./dist`).
- `bun run compile` → `release/hatax-linux-x64`. DB stays on host (`./data` or `DB_PATH`), not inside the binary.
- `data/*.db` and `release/` are gitignored
- Reset the database by deleting `data/hatax.db*` and restarting
- The `admin` user and `admin` role cannot be deleted
- Dictionary, form demos, and table demo are templates. AI 客服 is real: `/api/ai` + public FAB (`components/layout/site-cs.html`)
- Optional LLM: `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL` (OpenAI-compatible). Without a key, chat still returns ranked site hits

---

## Learned user preferences

- Treat completion work as production-grade: auth, persistence, and production secret checks belong in the same change
- Admin UI lives under `/admin/*`. Public marketing, forum, and blog pages live under `/pages/*`
- Product scope: community blog and forum, point tasks, point-paid courses, event signups. Public browsing, admin operations
- Community accounts are separate from staff accounts. Admin operates content; it does not replace member login
- Public mobile UI uses a bottom bar. The top bar collapses behind a hamburger

## Learned workspace facts

- Use **Bun** (`bun install`, `bun run …`). Lockfile is `bun.lock`. Do not reintroduce Node-only deps (`@hono/node-server`, `better-sqlite3`, `bcryptjs`, `dotenv`)
- Vite defaults to port `3485` (`VITE_PORT` overrides it). Day-to-day work often uses `3490`. Hono defaults to `8790`. `bun run dev:full` starts both
- In development the browser calls `http://localhost:8790` via `VITE_API_BASE`. Login and writes fail if Hono is not running
- CORS allows common Vite origins, including `3485` and `3490`
- Community demo account `demo` / `123456`. JWT `aud` splits community and admin (staff remains `admin` / `123456`)
- Nav labels are Blog and Forum. Compose entry is `/pages/create.html`. Community articles use `POST /api/blog/works`
- Tasks: `/pages/tasks.html`, `/admin/tasks.html`, `/api/tasks` (read, audio, video, quiz, post)
- Courses: `/pages/courses.html`, `/admin/courses.html`, `/api/courses` (points unlock video or article lessons)
- Events: `/pages/events.html`, `/admin/events.html`, `/api/events`
- Members have points, follows, DMs, and tags. Profile: `/pages/me.html`. Public profile: `/pages/user.html`
- Passwords: `Bun.password` with `{ algorithm: 'bcrypt', cost: 10 }` so existing bcryptjs hashes still verify
