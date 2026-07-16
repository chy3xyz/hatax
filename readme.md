# HatTax Admin — Lightweight Admin Dashboard

> Production-ready admin dashboard template. **Vite + Alpine.js + HTMX + Tailwind CSS** — modular `src/`, auth guard, CSRF headers, XSS-safe toasts.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/vite-6.x-646CFF)](https://vitejs.dev)
[![Alpine.js](https://img.shields.io/badge/alpine-3.x-8BC0D0)](https://alpinejs.dev)
[![HTMX](https://img.shields.io/badge/htmx-1.x-3366CC)](https://htmx.org)
[![Tailwind](https://img.shields.io/badge/tailwind-3.x-38BDF8)](https://tailwindcss.com)

<p align="center">
  <img src="https://img.shields.io/badge/pages-18-blue" />
  <img src="https://img.shields.io/badge/layout%20code-once%20(DRY)-brightgreen" />
  <img src="https://img.shields.io/badge/build-~1s-orange" />
</p>

## Features

- **Auth guard** — `sessionStorage` token + `requireAuth()`; HTMX attaches `Authorization` / `X-CSRF-Token`; 401 → login.
- **Modular JS** — `src/auth`, `i18n`, `menu`, `store`, `notify`, `htmx-setup`, `components`, page modules.
- **Zero-build-overhead UI reactivity** — Alpine.js handles state (sidebar, tabs, theme, modals). No virtual DOM.
- **Partial-page navigation** — HTMX swaps only the content area. Layout stays, no full-page reload flicker.
- **Build-time layout injection** — Shell template + Vite plugin. One `<aside>` change propagates to all pages automatically.
- **Dark mode + 7 theme colors** — CSS custom properties drive `bg-primary` / `text-primary`. Toggle persists to localStorage.
- **Multi-tab browsing** — Open pages in tabs, close individually or batch (left/right/all), right-click context menu.
- **Command palette** — `⌘K` fuzzy-search across all menu items.
- **Interactive dashboard** — ECharts line + pie charts with dark mode auto-update.
- **Mobile responsive** — Collapsible sidebar overlay, viewport-aware layout, scrollable tables.
- **Setting drawer** — Toggle tab bar, sidebar width, transition speed, theme color picker.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | [Vite 6](https://vitejs.dev) | Sub-second HMR, native ESM, zero-config multi-page |
| Reactivity | [Alpine.js 3](https://alpinejs.dev) | 15KB, `x-data` / `x-show` / `$store` cover all UI state |
| Partial refresh | [HTMX 1](https://htmx.org) | 10KB, `hx-get` / `hx-select` for content-area swap, no SPA router needed |
| CSS | [Tailwind 3](https://tailwindcss.com) | Utility-first, dark mode via `class`, JIT compilation |
| Charts | [ECharts 5](https://echarts.apache.org) | Tree-shaken import, ~380KB gzip on dashboard page only |

## Quick Start

```bash
npm install
npm run dev:full    # Vite（默认 :3485，可用 VITE_PORT）+ Hono API :8790
```

- 官网 / 用户端：`http://localhost:3490/pages/index.html`（或当前 Vite 端口）
- 管理后台：`http://localhost:3490/admin/login.html`

**Test credentials**: `admin` / `123456`

```bash
npm run build && NODE_ENV=production npm start   # Hono serves dist/ + /api
```

## Project Structure

```
.
├── index.html                     # Entry — redirects to /pages/index.html
├── package.json
├── vite.config.js                 # Multi-page: admin/* + pages/*
├── vite-plugin-layout.js          # Admin pages: <!-- layout: app-shell -->
├── main.js                        # Admin bootstrap (auth + modules)
├── src/
│   ├── auth.js                    # /pages/* public; /admin/* gated
│   ├── menu.js / store.js / …
│   └── admin/                     # Admin Alpine page modules
├── admin/                         # 管理后台（需登录，注入 app-shell）
│   ├── login.html / dashboard.html / user.html …
│   └── error-*.html
├── pages/                         # 官网 / 落地页 / 用户端（公开，无 shell）
│   ├── index.html                 # 官网首页
│   ├── blog.html / forum.html     # 博客 / 论坛骨架
│   └── …
├── components/layout/app-shell.html
└── public/mock-api/
```

## Architecture

### Build-time layout injection

Pages are **content fragments** — they contain only the content area. A Vite plugin (`vite-plugin-layout.js`) wraps each fragment with `components/layout/app-shell.html` at build time.

```
Page source (50-200 lines)         Built output (~600 lines)
┌──────────────────────┐           ┌──────────────────────┐
│ <!-- layout: shell -->│           │ <!DOCTYPE html>      │
│ <html>                │           │ <html>               │
│ <head>                │  Vite     │ <head>               │
│   <title>Users</title>│  plugin   │   <!-- shell head -->│
│ </head>               │ ────────→ │   <title>Users</…>   │
│ <body>                │           │ </head>              │
│   <main id="page-…">  │           │ <body>               │
│     <!-- content -->  │           │   <aside>sidebar</…> │
│   </main>             │           │   <header>topbar</…> │
│ </body>               │           │   <nav>tabs</nav>    │
│ </html>               │           │   <main>CONTENT</…>  │
└──────────────────────┘           │   <footer></footer>   │
                                   │   <script src="main"> │
                                   └──────────────────────┘
```

### Runtime navigation

- **Initial load**: Full HTML page with layout + content (direct URL access works).
- **Subsequent navigation**: HTMX `hx-get` fetches the target page, extracts `#page-content` via `hx-select`, swaps into current layout. No full-page reload. Browser history updated via `pushState`.

### State management

Single Alpine store (`Alpine.store('app')`) holds:
- `dark`, `themeColor` — persisted to localStorage
- `sidebarOpen`, `mobileMenuOpen` — responsive sidebar state
- `tabs[]`, `activeMenu` — multi-tab state
- `breadcrumbs[]` — dynamic breadcrumb trail
- `loading` — global loading indicator (HTMX-driven)

## Adding a New Page

1. Create `pages/my-page.html`:

```html
<!-- layout: app-shell -->
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <div id="page-content" x-data x-cloak class="pt-28 p-6 animate-fade-in"
       :class="$store.app.sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'">
    <h1 class="text-2xl font-bold mb-6">My Page</h1>
    <!-- page content -->
  </div>
</body>
</html>
```

2. Register in `main.js`:

```js
// MENU_MAP
'my-page': { group: 'My Group', title: 'My Page', path: '/admin/my-page.html', ... },

// MENU_GROUPS
{ title: 'My Group', items: [{ name: 'my-page', title: 'My Page', path: '/admin/my-page.html', icon: '...' }] }
```

3. Build — layout injected automatically.

## Production Build

```bash
npm run build     # Output: dist/
npm run preview   # Preview the built output
```

## Security Notes

This is a **frontend template**. Before production deployment:

- [x] Client auth gate (`requireAuth`) + HTMX 401 handling
- [x] CSRF token meta + `X-CSRF-Token` on HTMX requests (validate server-side)
- [x] XSS-safe toast (`textContent`, not `innerHTML` for message body)
- [ ] Replace `public/mock-api/` with a real backend
- [ ] Implement server-side authentication (JWT / session / OAuth)
- [ ] Set Content-Security-Policy **HTTP headers** (not only meta)
- [ ] Replace hardcoded demo credentials in `login.html`
- [ ] Rate-limit login endpoints
- [ ] Sanitize any `x-html` / HTML fragments from the API

## Scripts

```bash
npm run dev:full     # frontend + Hono together
npm run dev          # Vite only (:3000, proxies /api → :8787)
npm run dev:server   # Hono only (:8787)
npm run build && npm start   # production (set NODE_ENV=production)
npm run lint
npm run format
```

## Backend (Hono)

| Endpoint | Notes |
|----------|--------|
| `POST /api/auth/login` | JWT + CSRF cookie |
| `GET /api/users` | HTMX HTML table rows |
| `POST/PUT/DELETE /api/users` | CSRF required |

See `AGENTS.md` and `server/` for details. Data is in-memory (`server/db/store.js`) — swap for SQLite/Postgres when ready.

## Browser Support

Modern browsers (ES2020+): Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.

## License

MIT License — see [LICENSE](LICENSE) file.

## Acknowledgments

Inspired by [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) layout patterns. Built with the philosophy that admin dashboards don't need React or Vue — Alpine + HTMX is sufficient for most use cases.
