# AGENTS.md — HatTax 全栈（Vite + Alpine + HTMX + Tailwind + Hono + SQLite）

> 面向 AI 编程助手。描述**当前代码库**的真实结构与约定。

---

## 一、概述

| 层 | 技术 |
|----|------|
| 前端 | Vite 6 · Alpine 3 · HTMX 1 · Tailwind 3 · ECharts |
| 后端 | Hono 4 · jose JWT · bcryptjs · **better-sqlite3** |

```bash
npm install
cp .env.example .env          # 开发可改 JWT_SECRET
npm run dev:full              # Vite（VITE_PORT，常用 3490）+ Hono :8790

# 生产
export JWT_SECRET='至少32位随机串'
export NODE_ENV=production
npm run build && npm start
```

演示账号：`admin` / `123456`  
数据库文件：`data/hatax.db`（首次启动自动建表 + seed）

**路径约定**

| 前缀 | 用途 | 鉴权 |
|------|------|------|
| `/pages/*` | 官网、落地页、论坛/博客等用户端 | 公开 |
| `/admin/*` | 管理后台 | 需 token（login/lock/error 除外） |
| `/` | 跳转到 `/pages/index.html` | — |

---

## 二、结构

```
admin/                # 管理后台 HTML（layout: app-shell）
pages/                # 公开站点 HTML（独立页面，不注入 shell）
server/
  config.js           # dotenv（仅非 production）+ JWT_SECRET 强校验
  db/ … routes/ … views/
src/
  auth.js             # PUBLIC_PREFIXES=/pages/ ；admin 登录页白名单
  admin/              # demo-pages / api-pages / user-form
```

---

## 三、API

| 路径 | 说明 |
|------|------|
| `POST /api/auth/login` | JWT + CSRF；写入 login_logs |
| `GET/POST/PUT/DELETE /api/users` | 用户；写操作记 op_logs |
| `GET/POST/PUT/DELETE /api/roles` | 角色 + permissions JSON |
| `GET/POST/PUT/DELETE /api/depts` | 部门树；默认 HTML，`?format=json` |
| `GET /api/blog/posts` | 公开博客列表；`?admin=1` 需登录含草稿 |
| `GET /api/blog/posts/:slug` | 文章详情（Markdown→HTML） |
| `POST/PUT/DELETE /api/blog/posts` | 博客写操作（JWT+CSRF） |
| `GET /api/forum/categories` | 论坛分区 |
| `GET /api/forum/topics` | 主题列表 |
| `GET /api/forum/topics/:id` | 主题+回复 |
| `POST /api/forum/topics` · replies · likes | 发帖/回复/点赞（JWT+CSRF） |

信封：`{ code, msg, data }`，`code === 0` 成功。

公开站：`/pages/blog.html` · `/pages/forum.html`  
管理：`/admin/blog.html` · `/admin/forum.html`  
设计：`docs/blog-forum-design.md`

---

## 四、JWT_SECRET

- **开发**：可读 `.env`；未设置则用弱默认并 warn  
- **生产**：`NODE_ENV=production` 时**不读** `.env`；未设置或弱密钥（&lt;32 字符 / 已知占位）→ **进程退出**

---

## 五、前端对接

- 用户列表 / 部门树：HTMX → `/api/users`、`/api/depts`
- 角色 / 登录日志 / 操作日志：Alpine `rolePage` / `loginLogPage` / `opLogPage` → JSON API
- 写请求：`Authorization` + `X-CSRF-Token`

---

## 六、注意

- `data/*.db` 已 gitignore  
- 重置库：删 `data/hatax.db*` 后重启  
- admin 用户与 admin 角色不可删  

---

## Learned User Preferences

- 完善/改造类任务默认按生产级标准推进（鉴权、持久化、生产环境密钥校验等一并落地）
- 管理后台统一放在 `/admin/*`，面向用户的官网/落地页/论坛/博客前端统一放在 `/pages/*`
- 产品方向：社区博客 + 论坛、任务积分、知识付费课程、活动报名；公开浏览 + 管理端维护
- 论坛/社区用户与后台管理账号分离：社区自有登录注册，后台只管内容与运营
- 公开站移动端优先底栏主导航，顶栏用汉堡菜单折叠

## Learned Workspace Facts

- Vite 默认端口为 `3485`（可用 `VITE_PORT` 覆盖）；日常常用 `3490`；Hono API 默认 `8790`；`npm run dev:full` 同时启动前后端
- 开发时前端默认直连 `http://localhost:8790`（`VITE_API_BASE`）；只起 Vite 不起 Hono 时登录与写操作会失败
- CORS 已放行常见 Vite 源（含 `3485` / `3490`）
- 社区演示账号 `demo` / `123456`；JWT `aud` 区分 community 与 admin（后台仍为 `admin` / `123456`）
- 内容命名：导航与页面统一用「博客 / 论坛」；创作入口 `/pages/create.html`，社区发博客走 `POST /api/blog/works`
- 任务系统：`/pages/tasks.html` · `/admin/tasks.html` · `/api/tasks`（阅读/音视频/答题/发帖赚积分）
- 知识付费：`/pages/courses.html` · `/admin/courses.html` · `/api/courses`（积分购买视频课/文章课）
- 活动报名：`/pages/events.html` · `/admin/events.html` · `/api/events`
- 社区能力含积分、关注/粉丝、私信、标签；个人中心 `/pages/me.html`，公开主页 `/pages/user.html`
