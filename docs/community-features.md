# Community features

HatTax is a small community product on top of an admin shell. This page lists what is wired to SQLite, and what is still a static demo.

## Product modules

| Module | Public page | Admin page | API |
|--------|-------------|------------|-----|
| Home | `/pages/index.html` | `/admin/dashboard.html` | stats endpoints |
| Blog | `/pages/blog.html`, `/pages/blog-post.html` | `/admin/blog.html` | `/api/blog` |
| Forum | `/pages/forum.html`, `/pages/forum-topic.html`, `/pages/forum-new.html` | `/admin/forum.html`, `/admin/forum-categories.html` | `/api/forum` |
| Tags | — | `/admin/tags.html` | blog and forum tag routes |
| Tasks | `/pages/tasks.html`, `/pages/task.html` | `/admin/tasks.html` | `/api/tasks` |
| Courses | `/pages/courses.html`, `/pages/course.html` | `/admin/courses.html` | `/api/courses` |
| Events | `/pages/events.html`, `/pages/event.html` | `/admin/events.html` | `/api/events` |
| Members | `/pages/me.html`, `/pages/user.html`, `/pages/messages.html` | `/admin/members.html` | `/api/community` |
| Compose | `/pages/create.html`, `/pages/work-new.html` | — | `POST /api/blog/works`, `POST /api/forum/topics` |
| Auth | `/pages/login.html`, `/pages/register.html` | `/admin/login.html` | `/api/community`, `/api/auth` |

Public navigation: home, blog, forum, tasks, courses, events. The mobile bar is home, blog, events, forum, and profile.

## Blog

- Official posts: admin `POST /api/blog/posts` (draft or published, featured, tags)
- Member posts: `POST /api/blog/works` under the community identity
- Body is stored as Markdown and rendered to HTML on the detail page
- Blog tags are separate from forum tags

## Forum

- Shape: category, then topic, then replies
- Up to five tags per topic. Unknown slugs are created. Filter with `?tag=`
- Members can reply and like. Admins can pin, lock, edit, and delete
- New topics and replies grant points

See [Blog and forum design](blog-forum-design.md).

## Points and tasks

- Balance on `community_members.points`, history in `community_point_logs`
- Task types: `read`, `video`, `audio`, `quiz`, `post`
- Completing a task pays `rewardPoints`
- Points pay for courses and optional event fees
- Admins can list completions and adjust a member’s balance

## Courses

- `video` courses have lessons. `article` courses are long-form posts
- `pricePoints = 0` means free
- Purchases live in `kb_purchases`
- Buyers see media and lesson bodies. Others see the public summary

## Events

- Categories: conference, healing, online, meetup, other
- Modes: offline, online, hybrid
- Capacity (`0` means unlimited), signup deadline, optional point fee
- An online URL can stay hidden until the member has signed up
- Admins can cancel a signup and export the list as CSV from the admin UI

## Social

- Follow and unfollow
- Direct messages and an unread count
- Public profile `/pages/user.html?id=`
- Member home `/pages/me.html`

## Two account systems

| | Staff | Members |
|--|--------|---------|
| Table | `users` | `community_members` |
| Login page | `/admin/login.html` | `/pages/login.html` |
| JWT `aud` | `admin` | `community` |
| Job | Operate and moderate | Read, write, spend points |

## Admin operations that are real

- Dashboard counts for blog, forum, courses, events, and tasks, plus recent operation logs
- Course purchase drawer, task completion drawer, event signup export
- Member search, disable, point adjustment, point history
- Sidebar labels in English and Chinese (`src/i18n.js`)
- Users, roles, departments, login log, operation log

## AI customer service

Public floating widget on `/pages/*` (and the marketing home). It:

1. Searches blog, forum, courses, tasks, and events
2. Returns ranked links + snippets immediately (works with zero LLM config)
3. Optionally summarizes via an OpenAI-compatible API when `AI_API_KEY` is set

Admin **AI 客服** (`/admin/ai-chat.html`) uses the same `/api/ai/chat` endpoint for tryouts.

## Admin pages that are templates

These routes exist in the menu but do not persist product data:

- Menu manager (edits labels in memory for the current session only)
- Dictionary
- Basic form, advanced form, table list
- About, profile, lock screen, and the 403 / 404 / 500 pages

## Not built

- No dedicated agent posting API (see [forum-agent.md](forum-agent.md) for HTTP bots)
- No card payments (points only)
- No content moderation pipeline
- No Dockerfile or CI config in the repo

## Demo data

The first empty database seeds sample posts, topics, a free course, a paid course, events, and tasks. Delete `data/hatax.db*` and restart to seed again.
