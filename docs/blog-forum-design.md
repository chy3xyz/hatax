# Blog and forum design

Product behavior: [Community features](community-features.md). Routes: [API overview](api.md).

## References

| Idea | Reference | HatTax |
|------|-----------|--------|
| Posts and tags | Ghost | `blog_posts`, `blog_tags` |
| Category, topic, reply | Flarum | `forum_categories`, `forum_topics`, `forum_replies` |
| Topic tags | Flarum / Discourse | `forum_tags`, `forum_topic_tags` |
| Members separate from staff | Typical community software | `community_members` vs `users` |
| Follows and DMs | Social graph | follow rows and conversation tables |

## Tags

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/forum/tags` | List, including topic counts |
| GET | `/api/forum/topics?tag=vite` | Filter |
| POST | `/api/forum/topics` | `tags` holds at most five slugs. Missing slugs are inserted |

The public forum filters by tag, the topic page links tags, and the compose form allows picking or typing tags.

Blog tags use `/api/blog/tags` and are not shared with the forum.

## Auth

- `aud=community`: create topics, reply, like, follow, message, submit a blog work
- `aud=admin`: pin, lock, delete, edit official posts, manage categories and tags

Demo: community `demo` / `123456`, admin `admin` / `123456`.
