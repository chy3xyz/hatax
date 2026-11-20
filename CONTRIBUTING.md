# Contributing

Issues and pull requests are welcome.

## Setup

```bash
git clone https://github.com/chy3xyz/hatax.git
cd hatax
bun install
cp .env.example .env
bun run dev:full
```

Details: [Getting started](docs/getting-started.md).

## Branches and commits

Branch from `main`: `feat/…`, `fix/…`, `docs/…`.

| Prefix | Use |
|--------|-----|
| `feat:` | New behavior |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Same behavior, clearer code |
| `chore:` | Tooling or deps |

Example: `feat: rate-limit forum topic creation`

## Conventions

### Paths

- Public pages: `pages/`
- Admin pages: `admin/`, first line `<!-- layout: app-shell -->`
- Frontend modules: `src/`
- HTTP and SQL: `server/routes/` and `server/db/`

### Style

```bash
bun run lint
bun run format
```

Keep imports at the top of the file.

### API

- Respond with `{ code, msg, data }`
- Protect writes with `requireAuth` or `requireCommunityAuth`, plus `requireCsrf`
- Log admin mutations with `addOpLog`

### UI

- Admin Alpine modules live in `src/admin/`
- Public fetches go through `src/public/api.js`
- New menu items need entries in `src/menu.js` and both `zh` and `en` `menu.*` keys in `src/i18n.js`
- Staff stay on `/admin/*`. Members stay on `/pages/*`

## Before you open a pull request

1. `bun run lint` passes
2. You clicked through the pages you changed
3. API changes are reflected in `docs/api.md`
4. Product changes are reflected in `docs/community-features.md`

## Issues

Include steps, expected result, actual result, Node version, and OS. A request or screenshot helps.

## Security

Do not file exploit details in a public issue. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your work is released under the [MIT License](LICENSE).
