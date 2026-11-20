# API overview

Source of truth: `server/routes/`. This page lists the routes that back the product.

## Conventions

- Development base URL: `http://localhost:8790`
- JSON bodies: `Content-Type: application/json`
- Success: `{ "code": 0, "msg": "...", "data": ... }`

| Header | When |
|--------|------|
| `Authorization: Bearer <jwt>` | Any route that requires a session |
| `X-CSRF-Token` | Writes. Must match cookie `hatax_csrf` |

`GET /api/auth/csrf` issues the cookie. Login responses also include `csrfToken`.

## Health

```
GET /api/health
```

## Staff auth — `/api/auth`

| Method | Path | Notes |
|--------|------|--------|
| GET | `/csrf` | CSRF cookie |
| POST | `/login` | `{ username, password }` → admin JWT + csrf. Writes `login_logs` |
| POST | `/logout` | Clear session cookie |

## Community — `/api/community`

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/register` | CSRF | Create a member |
| POST | `/login` | — | Community JWT (`aud=community`) |
| POST | `/logout` | — | |
| GET | `/me` | community | Profile |
| PUT | `/me` | community + CSRF | Update profile |
| POST | `/me/password` | community + CSRF | Change password |
| GET | `/me/points` | community | Point ledger |
| GET | `/me/following` | community | |
| GET | `/me/followers` | community | |
| GET | `/members/:key` | optional | Public profile (`id` or username) |
| GET | `/members/:key/following` | public | |
| GET | `/members/:key/followers` | public | |
| POST | `/members/:id/follow` | community + CSRF | |
| DELETE | `/members/:id/follow` | community + CSRF | |
| GET | `/dm/conversations` | community | Inbox |
| GET | `/dm/conversations/:id` | community | Thread |
| POST | `/dm/messages` | community + CSRF | Send |
| GET | `/dm/unread` | community | Unread count |
| GET | `/admin/members` | admin | Search, status filter |
| PUT | `/admin/members/:id/status` | admin + CSRF | Enable or disable |
| POST | `/admin/members/:id/points` | admin + CSRF | Adjust points |
| GET | `/admin/members/:id/points` | admin | Ledger for one member |

## RBAC and org

Admin JWT. Writes also need CSRF. Mutations are written to `op_logs`.

| Prefix | Notes |
|--------|--------|
| `/api/users` | CRUD. List defaults to HTML rows; `?format=json` for JSON |
| `/api/roles` | Roles and a `permissions` JSON blob |
| `/api/depts` | Department tree. HTML by default; `?format=json` |
| `/api/logs/login` | Login log |
| `/api/logs/ops` | Operation log |

The seeded `admin` user and `admin` role cannot be deleted.

## Blog — `/api/blog`

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/stats` | public | Counts for the dashboard |
| GET | `/tags` | public | |
| POST/PUT/DELETE | `/tags`, `/tags/:id` | admin + CSRF | |
| GET | `/posts` | public | `?admin=1` includes drafts (admin). Filters: `q`, `status`, `authorKind` |
| GET | `/posts/:slug` | public | Markdown rendered to HTML |
| GET | `/works/mine` | community | Member’s own submissions |
| POST | `/works` | community + CSRF | Community article |
| POST | `/posts` | admin + CSRF | Official article |
| PUT | `/posts/:id` | admin + CSRF | |
| DELETE | `/posts/:id` | admin + CSRF | |

## Forum — `/api/forum`

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/stats` | public | |
| GET | `/categories` | public | |
| POST/PUT/DELETE | `/categories`, `/categories/:id` | admin + CSRF | |
| GET | `/tags` | public | Includes topic counts |
| POST/PUT/DELETE | `/tags`, `/tags/:id` | admin + CSRF | |
| GET | `/topics` | public | `category`, `tag`, `q`, `page`, `pageSize`, `sort` |
| GET | `/topics/:id` | optional | Topic and replies |
| POST | `/topics` | community + CSRF | Create |
| PUT | `/topics/:id` | admin + CSRF | Edit, pin, lock |
| DELETE | `/topics/:id` | admin + CSRF | Deletes replies |
| POST | `/topics/:id/replies` | community + CSRF | `{ bodyMd }` or `{ body }` |
| DELETE | `/replies/:id` | admin + CSRF | |
| POST | `/likes` | community + CSRF | |

Create body:

```json
{
  "categoryId": 1,
  "title": "Title",
  "bodyMd": "## Body\n\nMarkdown",
  "tags": ["vite", "alpine"]
}
```

`categoryId`, `title`, and `bodyMd` are required. At most five tags. Unknown tag slugs are created. Locked topics reject new replies.

## Tasks — `/api/tasks`

Types: `read`, `video`, `audio`, `quiz`, `post`.

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/types` | public | |
| GET | `/` | optional | Active tasks, with member progress when logged in |
| GET | `/mine` | community | |
| POST | `/:id/start` | community + CSRF | |
| POST | `/:id/progress` | community + CSRF | |
| POST | `/:id/complete` | community + CSRF | Grants `rewardPoints` |
| GET | `/stats` | admin | |
| GET | `/admin` | admin | `status`, `type`, `q`. Includes drafts |
| GET | `/admin/completions` | admin | Recent completions |
| GET | `/admin/:id/completions` | admin | |
| POST/PUT/DELETE | `/admin`, `/admin/:id` | admin + CSRF | |

## Courses — `/api/courses`

Types: `video`, `article`. `pricePoints` of `0` is free.

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/types` | public | |
| GET | `/` | optional | Published catalog |
| GET | `/mine` | community | Purchased |
| GET | `/:key` | optional | Id or slug. Lessons locked until purchase |
| POST | `/:id/purchase` | community + CSRF | Spends points |
| GET | `/stats` | admin | Sales and point revenue |
| GET | `/admin` | admin | `type`, `status`, `q` |
| GET | `/admin/purchases` | admin | |
| GET | `/admin/:id` | admin | Includes lessons |
| GET | `/admin/:id/purchases` | admin | |
| POST/PUT/DELETE | `/admin`, `/admin/:id` | admin + CSRF | |

## Events — `/api/events`

Categories: `conference`, `healing`, `online`, `meetup`, `other`. Modes: `offline`, `online`, `hybrid`.

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/meta` | public | Category and mode labels |
| GET | `/` | optional | |
| GET | `/mine` | community | |
| GET | `/:key` | optional | Online URL is returned after signup when required |
| POST | `/:id/signup` | community + CSRF | Capacity, deadline, optional point fee |
| POST | `/:id/cancel` | community + CSRF | Member cancels their own signup |
| GET | `/stats` | admin | |
| GET | `/admin` | admin | `category`, `status`, `q` |
| GET | `/admin/:id` | admin | |
| GET | `/admin/:id/signups` | admin | Active signups |
| POST | `/admin/signups/:signupId/cancel` | admin + CSRF | Operator cancel |
| POST/PUT/DELETE | `/admin`, `/admin/:id` | admin + CSRF | |

## AI customer service — `/api/ai`

Public endpoints. No auth required. Rate-limited per IP on `POST /chat`.

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/ai/status` | `{ enabled, llm, model }` — `llm` is true when `AI_API_KEY` is set |
| `GET` | `/api/ai/search?q=` | Ranked hits across blog, forum, courses, tasks, events |
| `POST` | `/api/ai/chat` | Body `{ message, history? }`. Always retrieves site content; summarizes with LLM when configured |

```bash
curl -s 'http://localhost:8790/api/ai/search?q=积分'
curl -s -X POST http://localhost:8790/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"有哪些课程？"}'
```

Env: `AI_API_KEY`, `AI_BASE_URL` (OpenAI-compatible), `AI_MODEL`, `AI_RATE_LIMIT`. See `.env.example`.

## Example: community post

```bash
JAR=/tmp/hatax-cookies.txt
RES=$(curl -s -c "$JAR" -b "$JAR" \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"123456"}' \
  http://localhost:8790/api/community/login)

TOKEN=$(echo "$RES" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["token"])')
CSRF=$(echo "$RES" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["csrfToken"])')

curl -s -b "$JAR" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"categoryId":1,"title":"Hello","bodyMd":"Body","tags":["general"]}' \
  http://localhost:8790/api/forum/topics
```

## Related

- [Architecture](architecture.md)
- [Forum agents](forum-agent.md)
- [Blog and forum design](blog-forum-design.md)
