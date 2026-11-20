# HatTax

Lightweight full-stack community platform: **blog, forum, point tasks, paid courses, and event signups**.

Built to run lean on a small VPS — **Bun-native** backend (no Node), thin frontend (no React/Vue), one process, optional **single binary** deploy.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.1-fbf0df)](https://bun.sh)
[![Vite](https://img.shields.io/badge/vite-6-646CFF)](https://vitejs.dev)
[![Hono](https://img.shields.io/badge/hono-4-orange)](https://hono.dev)

---

## Why Bun-native

| Benefit | What you get |
|---------|----------------|
| **Native runtime** | Hono on Bun via `export default { port, fetch }` — no `@hono/node-server`, no Node adapter |
| **Fewer deps, less RAM** | Built-in `bun:sqlite`, `Bun.password` (bcrypt), auto `.env` — drops `better-sqlite3` / `bcryptjs` / `dotenv` and their native builds |
| **Fast I/O** | Bun’s HTTP + SQLite stack is aimed at low latency and high throughput on modest CPU |
| **One binary** | `bun run compile` embeds the API and Vite `dist/` — copy one file to Linux, keep a writable `data/` folder |
| **Thin UI** | Alpine + HTMX + Tailwind; no heavy SPA runtime in the browser |

Stack: **Bun · Hono · bun:sqlite · jose** (API) · **Vite · Alpine · HTMX · Tailwind · ECharts** (UI).

---

## Features

| Area | What it does |
|------|----------------|
| **Runtime** | Bun-native full stack; Linux single-binary deploy for quick VPS rollout |
| **AI 客服** | Floating helper on public pages: aggregates blog/forum/courses/tasks/events; optional LLM summary via OpenAI-compatible API |
| **Public site** `/pages/*` | Marketing home, blog, forum, tasks, courses, events. Mobile bottom navigation. |
| **Admin** `/admin/*` | Content operations, members, RBAC, departments, audit logs. Vben-style shell. |
| **Accounts** | Separate community members and admin staff. JWT audience `community` vs `admin`. |
| **Blog** | Markdown posts, tags, community submissions, official publishing. |
| **Forum** | Categories, tags, replies, likes, pin and lock. |
| **Tasks** | Read, watch, listen, quiz, or post to earn points. |
| **Courses** | Unlock video or article courses with points. |
| **Events** | Online and offline signups, capacity, deadlines, optional point fees. |
| **Social** | Followers, direct messages, public profiles, member center. |

HTMX swaps admin content in place. Writes require JWT plus CSRF. SQLite is created and seeded on first start.

Some admin menu entries are still UI templates (dictionary, form demos, table demo, and the AI chat page). They are not backed by product APIs. See [Community features](docs/community-features.md).

---

## Quick start

### Requirements

- [Bun](https://bun.sh) **1.1+** (1.4+ recommended) — used for install, API, and production compile. Node is not required.

### Install and run

```bash
git clone https://github.com/chy3xyz/hatax.git
cd hatax
bun install
cp .env.example .env
bun run dev:full
```

| Service | URL | Notes |
|---------|-----|--------|
| Vite | http://localhost:3485 | Override with `VITE_PORT` (often `3490`) |
| Hono API | http://localhost:8790 | Override with `PORT` |

Public home: http://localhost:3485/pages/index.html  
Admin login: http://localhost:3485/admin/login.html  
Health check: http://localhost:8790/api/health

### Demo accounts

| Role | Username | Password | Entry |
|------|----------|----------|--------|
| Admin | `admin` | `123456` | `/admin/login.html` |
| Community | `demo` | `123456` | `/pages/login.html` |

The first launch creates `data/hatax.db` and seeds demo content. Change or disable these accounts before any public deployment.

### Production

```bash
# Single binary for Linux VPS (no Bun install on the server)
bun run compile          # → release/hatax-linux-x64
# Alpine: bun run compile:musl

# Or run from source on a host that has Bun
export JWT_SECRET='a-random-string-at-least-32-characters'
export NODE_ENV=production
bun run build && bun start
```

VPS: copy the binary + keep a writable `data/` directory; set `JWT_SECRET`. Details: [Deployment](docs/deployment.md).

---

## Documentation

| Doc | Contents |
|-----|----------|
| [Docs index](docs/README.md) | Where to start |
| [Getting started](docs/getting-started.md) | Environment, database, troubleshooting |
| [Architecture](docs/architecture.md) | Layout, auth, request flow |
| [API overview](docs/api.md) | REST endpoints and examples |
| [Community features](docs/community-features.md) | Product modules and pages |
| [Blog and forum design](docs/blog-forum-design.md) | Data model and references |
| [Deployment](docs/deployment.md) | Production checklist |
| [Forum agents](docs/forum-agent.md) | How an external agent can post |
| [Contributing](CONTRIBUTING.md) | Branches, style, pull requests |
| [Security](SECURITY.md) | How to report vulnerabilities |
| [AGENTS.md](AGENTS.md) | Conventions for coding agents |

---

## Layout

```
hatax/
├── admin/          # Admin HTML (app-shell injected at build time)
├── pages/          # Public HTML (no admin shell)
├── components/     # Shared layout and UI fragments
├── src/            # Frontend JS (auth, i18n, stores, page modules)
├── server/         # Hono routes, SQLite access, middleware
├── docs/           # English documentation
└── public/         # Static assets
```

| Prefix | Audience | Auth |
|--------|----------|------|
| `/pages/*` | Visitors and members | Browse is public; writes need a community JWT |
| `/admin/*` | Operators | Admin JWT, except login, lock, and error pages |
| `/api/*` | Both | Envelope `{ code, msg, data }`. `code === 0` means success |

---

## Scripts

```bash
bun run dev          # Vite only
bun run dev:server   # Hono only (Bun --hot)
bun run dev:full     # Both (recommended)
bun run build        # Output: dist/
bun start            # Production from source
bun run compile      # Linux x64 single binary → release/
bun run lint
bun run format
```

Login and writes fail if only Vite is running.

---

## License

[MIT](LICENSE)

Admin shell layout is inspired by [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin). Blog and forum models draw on Ghost and Flarum.
