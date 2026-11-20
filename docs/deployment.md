# Deployment

Two production modes:

1. **Single binary (recommended for VPS)** — no Bun/Node install on the server
2. **Bun from source** — `bun install` + `bun start` on the host

---

## Single binary (Linux VPS)

Build on your Mac or CI (cross-compiles to Linux):

```bash
# Ubuntu / Debian / most VPS (glibc)
bun run compile

# Alpine Linux (musl)
bun run compile:musl

# ARM VPS (Oracle Ampere, etc.)
bun run compile:arm64
```

Output: `release/hatax-linux-x64` (or `-musl` / `linux-arm64`).

### Upload and run

```bash
scp release/hatax-linux-x64 user@vps:/opt/hatax/hatax
ssh user@vps
mkdir -p /opt/hatax/data
cd /opt/hatax
chmod +x ./hatax

export NODE_ENV=production
export JWT_SECRET='replace-with-at-least-32-random-characters'
export PORT=8790
# optional: export DB_PATH=/var/lib/hatax/hatax.db

./hatax
```

What is inside the binary: Hono API + Vite `dist/` (HTML/JS/CSS).  
What stays on disk: SQLite under `./data/hatax.db` (or `DB_PATH`).

Health check: `curl http://127.0.0.1:8790/api/health` — expect `"compiled": true`.

### systemd (binary)

```ini
[Unit]
Description=HatTax
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hatax
Environment=NODE_ENV=production
Environment=JWT_SECRET=your-long-secret
Environment=PORT=8790
ExecStart=/opt/hatax/hatax
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Local smoke test on macOS before uploading:

```bash
bun run compile:local
JWT_SECRET='hatax-local-test-secret-32chars-min!!' ./release/hatax-darwin-arm64
```

---

## Bun from source

```bash
bun install --frozen-lockfile
bun run build

export NODE_ENV=production
export JWT_SECRET='replace-with-at-least-32-random-characters'
export PORT=8790

bun start
```

The process will:

1. Reject a missing, short, or placeholder `JWT_SECRET`
2. Open SQLite at `DB_PATH` or `./data/hatax.db` via `bun:sqlite`
3. Serve `dist/` and `/api/*` with Hono on Bun

## Production variables

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | yes | Must be `production` (compiled binaries treat themselves as production) |
| `JWT_SECRET` | yes | 32+ characters. Not the example string |
| `PORT` | no | Default `8790` |
| `JWT_EXPIRES` | no | Default `8h` |
| `DB_PATH` | no | Put this on a persistent volume |

Inject secrets through the process manager. Do not bake secrets into the binary.

## Reverse proxy

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8790;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Terminate TLS at the proxy (Caddy, certbot, or your load balancer).

## Data

- Mount `data/` or the directory behind `DB_PATH`
- Copy `hatax.db` while writes are stopped, or use SQLite’s backup API
- WAL mode also creates `hatax.db-wal` and `hatax.db-shm`

SQLite is a single-writer database. Run one API process against a given file.

## Security checklist

- [ ] Replace demo passwords for `admin` and `demo` (`123456`)
- [ ] Set a strong `JWT_SECRET`
- [ ] Serve the admin UI only on a private network, or behind auth at the proxy
- [ ] Use HTTPS
- [ ] Rate-limit login and posting at the proxy (the app does not)
- [ ] Rebuild and replace the binary when upgrading

500 responses in production do not include stack traces.

## CORS

Same-origin production does not need browser CORS. If the UI is on another origin, add that origin in `server/index.js`.

## Docker

There is no Dockerfile yet. Prefer the single binary on a slim host image, or:

1. Use `oven/bun:1`
2. Run `bun install --frozen-lockfile && bun run build`
3. Start with `bun server/index.js`
4. Mount a volume at `/app/data`
5. Set `JWT_SECRET` at runtime

## Health and logs

- `GET /api/health` (includes `runtime: "bun"` and `compiled` when applicable)
- Request lines go to stdout via Hono’s logger

## Failures

| Symptom | Likely cause |
|---------|----------------|
| Exits on start | `JWT_SECRET` missing or too short |
| Writes return 403 | CSRF header or cookie missing, or a cross-site cookie problem |
| HTML 404 after deploy | Frontend not embedded / `dist/` missing (rebuild with `bun run compile`) |
| `No such file` / wrong ELF | Used musl binary on glibc (or reverse). Match `compile` vs `compile:musl` |
| Database is locked | Two processes writing the same SQLite file |

Local setup issues: [Getting started](getting-started.md).
