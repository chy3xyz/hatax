# Posting to the forum from an AI agent

HatTax does not ship an LLM or an agent runtime. A bot can still publish topics through the community API if it follows the same rules as a member.

## Rules that the server enforces

Use a **community** account. An admin JWT cannot create topics.

```
POST /api/forum/topics
Authorization: Bearer <community JWT>
X-CSRF-Token: <csrf>
Cookie: hatax_csrf=<csrf>
Content-Type: application/json
```

```json
{
  "categoryId": 1,
  "title": "Short title",
  "bodyMd": "## Body\n\nMarkdown",
  "tags": ["general"]
}
```

| Check | Behavior |
|-------|----------|
| `categoryId` | Required. The category must exist |
| `title`, `bodyMd` | Required after trim. `body` is accepted as an alias of `bodyMd` |
| `tags` | Optional. At most five. Unknown slugs are created |
| Locked topic | New replies are rejected. New topics are unaffected |

There is no rate limit, profanity filter, or `source=agent` flag yet. Put those in the agent or at the proxy until the API grows them.

## Rules to put in the agent prompt

1. Call `GET /api/forum/categories` and pick a real `categoryId`.
2. Prefer existing tag slugs from `GET /api/forum/tags`.
3. Keep the title under 120 characters (the compose page does; the API only requires a non-empty string).
4. Write Markdown, not a bare link dump.
5. Say in the post that an agent wrote it.
6. On `400`, read `msg` and edit the payload. Do not retry the same body.
7. Use a dedicated member such as `forum-bot`, not `demo` or `admin`.

## Login and post

```bash
JAR=/tmp/hatax-agent-cookies.txt
RES=$(curl -s -c "$JAR" -b "$JAR" \
  -H 'Content-Type: application/json' \
  -d '{"username":"forum-bot","password":"YOUR_PASSWORD"}' \
  http://localhost:8790/api/community/login)

TOKEN=$(echo "$RES" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["token"])')
CSRF=$(echo "$RES" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["csrfToken"])')

curl -s -b "$JAR" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF" \
  -H 'Content-Type: application/json' \
  -d '{"categoryId":1,"title":"Agent test","bodyMd":"Hello from an agent.","tags":["general"]}' \
  http://localhost:8790/api/forum/topics
```

Register `forum-bot` with `POST /api/community/register` (CSRF required) before the first post.

## Tool schema

```json
{
  "name": "forum_create_topic",
  "description": "Publish a HatTax forum topic. categoryId must come from forum_list_categories.",
  "parameters": {
    "type": "object",
    "required": ["categoryId", "title", "bodyMd"],
    "properties": {
      "categoryId": { "type": "integer" },
      "title": { "type": "string", "maxLength": 120 },
      "bodyMd": { "type": "string" },
      "tags": { "type": "array", "items": { "type": "string" }, "maxItems": 5 }
    }
  }
}
```

Pair it with `forum_list_categories` and `forum_list_tags`.

## Possible follow-ups

- `POST /api/forum/agent/topics` with an API key, so CSRF is not required
- `is_bot` on members, plus a per-bot rate limit
- A moderation queue and a `source` column

See [API overview](api.md) and [Blog and forum design](blog-forum-design.md).
