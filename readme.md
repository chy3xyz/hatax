# HatTax Admin — Lightweight Admin Dashboard

> Production-ready admin dashboard template. **13KB of business logic + Vite + Alpine.js + HTMX + Tailwind CSS.**

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

- **Zero-build-overhead UI reactivity** — Alpine.js handles state (sidebar, tabs, theme, modals). No virtual DOM.
- **Partial-page navigation** — HTMX swaps only the content area. Layout stays, no full-page reload flicker.
- **Build-time layout injection** — Shell template + Vite plugin. One `<aside>` change propagates to all 18 pages automatically.
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
git clone https://github.com/your-org/hatax-admin.git
cd hatax-admin
npm install
npm run dev
```

Open `http://localhost:3000` — redirects to dashboard.

**Test credentials**: `admin` / `123456` (demo only; replace with real auth in production).

## Project Structure

```
.
├── index.html                     # Entry — redirects to /pages/dashboard.html
├── package.json                   # 3 runtime deps, 4 dev deps
├── vite.config.js                 # Multi-page input + layout plugin
├── vite-plugin-layout.js          # Build-time shell injection
├── tailwind.config.js             # Dark mode, content paths, safelist
├── main.js                        # Alpine store, components, router (~700 lines)
├── style.css                      # Tailwind directives, theme variables, animations
├── components/
│   └── layout/
│       ├── app-shell.html         # Single source of truth for layout
│       ├── header.html            # Reference (not used at runtime)
│       ├── sidebar.html           # Reference
│       ├── tab-bar.html           # Reference
│       ├── footer.html            # Reference
│       └── breadcrumb.html        # Reference
│   └── ui/                        # UI component references
│       ├── button.html
│       ├── modal.html
│       ├── drawer.html
│       ├── table.html
│       ├── form-item.html
│       ├── icon-picker.html
│       └── skeleton.html
├── pages/                         # Content fragments (layout injected at build)
│   ├── dashboard.html             # Analytics + ECharts
│   ├── user.html                  # User CRUD
│   ├── role.html                  # Role & permission
│   ├── menu.html                  # Menu tree editor
│   ├── dept.html                  # Department management
│   ├── dict.html                  # Dictionary management
│   ├── table.html                 # Data table (Alpine-reactive)
│   ├── form-basic.html            # Basic form
│   ├── form-advanced.html         # Advanced form
│   ├── profile.html               # User profile
│   ├── login-log.html             # Login audit log
│   ├── op-log.html                # Operation audit log
│   ├── about.html                 # About page
│   ├── login.html                 # Standalone login (no layout shell)
│   ├── lock.html                  # Lock screen
│   ├── error-403.html             # 403 Forbidden
│   ├── error-404.html             # 404 Not Found
│   └── error-500.html             # 500 Server Error
└── mock-api/                      # HTMX demo endpoints (replace with real backend)
    ├── user-list.html
    ├── user-add.html
    └── user/
```

## Architecture

### Build-time layout injection

Pages are **content fragments** — they contain only the `<main>` content area. A Vite plugin (`vite-plugin-layout.js`) wraps each fragment with `components/layout/app-shell.html` at build time.

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
'my-page': { group: 'My Group', title: 'My Page', path: '/pages/my-page.html', ... },

// MENU_GROUPS
{ title: 'My Group', items: [{ name: 'my-page', title: 'My Page', path: '/pages/my-page.html', icon: '...' }] }
```

3. Build — layout injected automatically.

## Production Build

```bash
npm run build     # Output: dist/
npm run preview   # Preview the built output
```

## Security Notes

This is a **frontend template**. Before production deployment:

- [ ] Replace `mock-api/` with a real backend
- [ ] Implement server-side authentication (JWT, session, OAuth)
- [ ] Add CSRF protection for all mutating requests
- [ ] Add Content Security Policy headers
- [ ] Replace hardcoded test credentials in `login.html`
- [ ] Add rate limiting on login endpoints
- [ ] Audit `x-html` usage — currently uses hardcoded data, must sanitize if data comes from API

## Browser Support

Modern browsers (ES2020+): Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.

## License

MIT License — see [LICENSE](LICENSE) file.

## Acknowledgments

Inspired by [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) layout patterns. Built with the philosophy that admin dashboards don't need React or Vue — 15KB of Alpine + 10KB of HTMX is sufficient for 95% of use cases.
