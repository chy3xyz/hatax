# Getting started

## 1. Clone and install

```bash
git clone https://github.com/chy3xyz/hatax.git
cd hatax
bun install
```

[Bun](https://bun.sh) 1.1 or newer is required. Node is not used as the runtime.

## 2. Environment

```bash
cp .env.example .env
```

Bun loads `.env` automatically in development.

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8790` | Hono listen port |
| `JWT_SECRET` | weak dev fallback if unset | HMAC secret. Production requires 32+ characters and rejects known placeholders |
| `JWT_EXPIRES` | `8h` | Token lifetime (`8h`, `7d`, …) |
| `NODE_ENV` | `development` | `production` enforces a strong `JWT_SECRET` |
| `DB_PATH` | `./data/hatax.db` | SQLite file. The directory must be writable |

Frontend-only overrides for `bun run dev`:

| Variable | Purpose |
|----------|---------|
| `VITE_PORT` | Vite port. Default `3485` |
| `VITE_API_BASE` | Browser API origin. Default `http://localhost:8790`. Empty string uses the Vite `/api` proxy |
| `API_URL` | Proxy target for `/api`. Default `http://localhost:8790` |

## 3. Run both processes

```bash
bun run dev:full
```

- Public home: http://localhost:3485/pages/index.html
- Admin: http://localhost:3485/admin/login.html
- API: http://localhost:8790/api/health

If port 3485 is taken:

```bash
VITE_PORT=3490 bun run dev:full
```

CORS already allows `3485` and `3490`. Add other origins in `server/index.js` if you use a custom port.

## 4. Demo accounts

| Use | Username | Password | JWT `aud` |
|-----|----------|----------|-----------|
| Admin | `admin` | `123456` | `admin` |
| Community | `demo` | `123456` | `community` |

Tokens are not interchangeable. An admin token cannot create forum topics. A community token cannot manage users.

## 5. Database

- Path: `data/hatax.db` (gitignored, including WAL files)
- Engine: Bun built-in `bun:sqlite`
- First boot creates tables and seeds users, posts, topics, tasks, courses, and events
- Reset: stop the API, delete `data/hatax.db`, `data/hatax.db-wal`, and `data/hatax.db-shm`, then start again

## 6. Running only one side

| Command | Result |
|---------|--------|
| `bun run dev` | Pages load. Login and writes fail |
| `bun run dev:server` | API only. Use curl or start Vite separately |

Use `bun run dev:full` for day-to-day work.

## 7. Troubleshooting

### CORS errors

Add your Vite origin to the CORS list in `server/index.js`.

### Login fails with a network error

The API is not running. Start `bun run dev:server` or `bun run dev:full`.

### `JWT_SECRET` fatal in production

Set a secret of at least 32 characters that is not one of the known placeholders in `server/config.js`.

### Port already in use

Change `PORT` or `VITE_PORT`, or stop the other process.

Further reading: [Architecture](architecture.md), [API](api.md), [Deployment](deployment.md).
