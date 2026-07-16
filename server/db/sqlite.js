import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../../data')
const dbPath = config.dbPath || path.join(dataDir, 'hatax.db')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      permissions TEXT NOT NULL DEFAULT '[]',
      sort INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS depts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      name TEXT NOT NULL,
      sort INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      role_code TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      dept_id INTEGER,
      remark TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (date('now')),
      FOREIGN KEY (role_code) REFERENCES roles(code),
      FOREIGN KEY (dept_id) REFERENCES depts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      ip TEXT DEFAULT '',
      location TEXT DEFAULT '',
      browser TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'success',
      message TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS op_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      module TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL DEFAULT '',
      detail TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      duration_ms INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Success',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_op_logs_created ON op_logs(created_at);

    -- Blog (Ghost-inspired: posts + tags)
    CREATE TABLE IF NOT EXISTS blog_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      body_md TEXT NOT NULL DEFAULT '',
      cover_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      author_id INTEGER,
      author_name TEXT DEFAULT '',
      author_kind TEXT NOT NULL DEFAULT 'admin',
      view_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS blog_post_tags (
      post_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
    );

    -- Forum (Flarum-inspired: categories → topics → posts)
    CREATE TABLE IF NOT EXISTS forum_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#1890ff',
      sort INTEGER DEFAULT 0,
      topic_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body_md TEXT NOT NULL DEFAULT '',
      author_id INTEGER,
      author_name TEXT DEFAULT '',
      pinned INTEGER NOT NULL DEFAULT 0,
      locked INTEGER NOT NULL DEFAULT 0,
      reply_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      last_reply_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      body_md TEXT NOT NULL DEFAULT '',
      author_id INTEGER,
      author_name TEXT DEFAULT '',
      like_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS forum_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS forum_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#64748b',
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_topic_tags (
      topic_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (topic_id, tag_id),
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES forum_tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      points INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_point_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      ref_type TEXT DEFAULT '',
      ref_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES community_members(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status, published_at);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_forum_topics_cat ON forum_topics(category_id, pinned, last_reply_at);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_forum_topic_tags_tag ON forum_topic_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_community_members_username ON community_members(username);
    CREATE INDEX IF NOT EXISTS idx_community_point_logs_member ON community_point_logs(member_id, created_at);
  `)

  seedIfEmpty()
  seedContentIfEmpty()
  migrateContentExtras()
  migrateCommunityAuth()
  migrateCommunityProfile()
  migrateCommunitySocial()
  migrateForumTags()
  seedCommunityIfEmpty()
  migrateCommunityTasks()
  migrateKnowledgeCourses()
  migrateCommunityEvents()
}

function migrateContentExtras() {
  const cols = db.prepare(`PRAGMA table_info(blog_posts)`).all().map((c) => c.name)
  if (!cols.includes('featured')) {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`)
  }
  if (!cols.includes('author_kind')) {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN author_kind TEXT NOT NULL DEFAULT 'admin'`)
  }
  // Promote first published post to featured if none marked
  const hasFeatured = db.prepare(`SELECT COUNT(*) AS c FROM blog_posts WHERE featured = 1`).get().c
  if (!hasFeatured) {
    const first = db
      .prepare(
        `SELECT id FROM blog_posts WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`,
      )
      .get()
    if (first) db.prepare(`UPDATE blog_posts SET featured = 1 WHERE id = ?`).run(first.id)
  }
}

/** Detach forum author/like FKs from admin users → community_members */
function migrateCommunityAuth() {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map((r) => r.name)
  if (!tables.includes('community_members')) return

  const topicSql = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='forum_topics'`).get()?.sql || ''
  if (topicSql.includes('REFERENCES users(id)')) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN;
      CREATE TABLE forum_topics_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body_md TEXT NOT NULL DEFAULT '',
        author_id INTEGER,
        author_name TEXT DEFAULT '',
        pinned INTEGER NOT NULL DEFAULT 0,
        locked INTEGER NOT NULL DEFAULT 0,
        reply_count INTEGER NOT NULL DEFAULT 0,
        like_count INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        last_reply_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE
      );
      INSERT INTO forum_topics_new SELECT * FROM forum_topics;
      DROP TABLE forum_topics;
      ALTER TABLE forum_topics_new RENAME TO forum_topics;
      CREATE INDEX IF NOT EXISTS idx_forum_topics_cat ON forum_topics(category_id, pinned, last_reply_at);

      CREATE TABLE forum_posts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER NOT NULL,
        body_md TEXT NOT NULL DEFAULT '',
        author_id INTEGER,
        author_name TEXT DEFAULT '',
        like_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
      );
      INSERT INTO forum_posts_new SELECT * FROM forum_posts;
      DROP TABLE forum_posts;
      ALTER TABLE forum_posts_new RENAME TO forum_posts;
      CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id, created_at);

      CREATE TABLE forum_likes_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, target_type, target_id)
      );
      INSERT INTO forum_likes_new (id, user_id, target_type, target_id, created_at)
        SELECT id, user_id, target_type, target_id, created_at FROM forum_likes;
      DROP TABLE forum_likes;
      ALTER TABLE forum_likes_new RENAME TO forum_likes;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `)
  }
}

function migrateCommunitySocial() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (follower_id, following_id),
      CHECK (follower_id != following_id),
      FOREIGN KEY (follower_id) REFERENCES community_members(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES community_members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_a INTEGER NOT NULL,
      member_b INTEGER NOT NULL,
      last_message_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(member_a, member_b),
      CHECK (member_a < member_b),
      FOREIGN KEY (member_a) REFERENCES community_members(id) ON DELETE CASCADE,
      FOREIGN KEY (member_b) REFERENCES community_members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      read_at TEXT,
      FOREIGN KEY (conversation_id) REFERENCES community_conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES community_members(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_community_follows_following ON community_follows(following_id);
    CREATE INDEX IF NOT EXISTS idx_community_messages_conv ON community_messages(conversation_id, id);
  `)

  // Second demo user for follow/DM smoke
  const alice = db.prepare(`SELECT id FROM community_members WHERE username = 'alice'`).get()
  if (!alice) {
    const hash = bcrypt.hashSync('123456', 10)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    db.prepare(
      `INSERT INTO community_members
        (username, email, password_hash, display_name, bio, points, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 10, 'active', ?, ?)`,
    ).run('alice', 'alice@hatax.local', hash, 'Alice', '随便逛逛的社区用户', now, now)
  }
}

function migrateForumTags() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#64748b',
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS forum_topic_tags (
      topic_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (topic_id, tag_id),
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES forum_tags(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_forum_topic_tags_tag ON forum_topic_tags(tag_id);
  `)

  const count = db.prepare(`SELECT COUNT(*) AS c FROM forum_tags`).get().c
  if (count > 0) return

  const insert = db.prepare(
    `INSERT INTO forum_tags (slug, name, color, description) VALUES (?, ?, ?, ?)`,
  )
  const seeds = [
    ['help', '求助', '#fa8c16', '提问与排障'],
    ['vite', 'Vite', '#646cff', '构建与多页面'],
    ['alpine', 'Alpine', '#77c1d2', '前端交互'],
    ['api', 'API', '#52c41a', '接口与鉴权'],
    ['newbie', '新手', '#722ed1', '入门讨论'],
    ['showcase', '分享', '#eb2f96', '实践与展示'],
  ]
  for (const row of seeds) insert.run(...row)

  const tagId = db.prepare(`SELECT id FROM forum_tags WHERE slug = ?`)
  const link = db.prepare(`INSERT OR IGNORE INTO forum_topic_tags (topic_id, tag_id) VALUES (?, ?)`)
  const topics = db.prepare(`SELECT id, title FROM forum_topics`).all()
  for (const t of topics) {
    const title = String(t.title || '')
    const slugs = []
    if (/admin|Vite|挂到/i.test(title)) slugs.push('vite', 'api')
    else if (/落地|导航|shell/i.test(title)) slugs.push('alpine', 'showcase')
    else if (/登录|跳转|账号/i.test(title)) slugs.push('help', 'newbie')
    else slugs.push('help')
    for (const s of slugs) {
      const tag = tagId.get(s)
      if (tag) link.run(t.id, tag.id)
    }
  }
}

function seedCommunityIfEmpty() {
  const count = db.prepare(`SELECT COUNT(*) AS c FROM community_members`).get().c
  if (count > 0) return
  const hash = bcrypt.hashSync('123456', 10)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.prepare(
    `INSERT INTO community_members
      (username, email, password_hash, display_name, bio, points, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).run('demo', 'demo@hatax.local', hash, 'Demo', '社区演示账号', 10, now, now)
  const id = db.prepare(`SELECT id FROM community_members WHERE username = 'demo'`).get().id
  db.prepare(
    `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, created_at)
     VALUES (?, 10, '注册奖励', 'register', ?)`,
  ).run(id, now)
}

function migrateCommunityProfile() {
  const cols = db.prepare(`PRAGMA table_info(community_members)`).all().map((c) => c.name)
  if (!cols.includes('bio')) {
    db.exec(`ALTER TABLE community_members ADD COLUMN bio TEXT DEFAULT ''`)
  }
  if (!cols.includes('points')) {
    db.exec(`ALTER TABLE community_members ADD COLUMN points INTEGER NOT NULL DEFAULT 0`)
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_point_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      ref_type TEXT DEFAULT '',
      ref_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES community_members(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_point_logs_member ON community_point_logs(member_id, created_at);
  `)
  // Give existing members a welcome balance if still zero and no logs
  const zeros = db.prepare(`SELECT id FROM community_members WHERE points = 0`).all()
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const hasLog = db.prepare(`SELECT COUNT(*) AS c FROM community_point_logs WHERE member_id = ?`)
  const bump = db.prepare(`UPDATE community_members SET points = 10 WHERE id = ?`)
  const log = db.prepare(
    `INSERT INTO community_point_logs (member_id, delta, reason, ref_type, created_at) VALUES (?, 10, '注册奖励', 'register', ?)`,
  )
  for (const row of zeros) {
    if (hasLog.get(row.id).c === 0) {
      bump.run(row.id)
      log.run(row.id, now)
    }
  }
}

function seedIfEmpty() {
  const roleCount = db.prepare('SELECT COUNT(*) AS c FROM roles').get().c
  if (roleCount > 0) return

  const hash = bcrypt.hashSync('123456', 10)
  const allPerms = JSON.stringify([
    'system:user',
    'system:role',
    'system:menu',
    'system:dept',
    'biz:dashboard',
    'biz:form',
    'biz:table',
    'biz:blog',
    'biz:forum',
    'data:export',
    'data:backup',
    'data:oplog',
  ])

  const insertRole = db.prepare(
    `INSERT INTO roles (code, name, description, permissions, sort) VALUES (?, ?, ?, ?, ?)`,
  )
  insertRole.run('admin', '超级管理员', '拥有系统所有权限', allPerms, 1)
  insertRole.run(
    'operator',
    '运营主管',
    '业务运营与数据查看',
    JSON.stringify(['biz:dashboard', 'biz:form', 'biz:table', 'data:export']),
    2,
  )
  insertRole.run(
    'user',
    '普通员工',
    '基础业务权限',
    JSON.stringify(['biz:dashboard', 'biz:form', 'biz:table']),
    3,
  )
  insertRole.run('viewer', '访客角色', '只读访问', JSON.stringify(['biz:dashboard']), 4)

  const insertDept = db.prepare(
    `INSERT INTO depts (id, parent_id, name, sort, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  )
  insertDept.run(1, null, '公司总部', 1, 'active', '2020-01-01')
  insertDept.run(2, 1, '技术研发中心', 2, 'active', '2020-03-15')
  insertDept.run(3, 2, '前端开发组', 3, 'active', '2020-06-01')
  insertDept.run(4, 2, '后端开发组', 3, 'active', '2020-06-01')
  insertDept.run(5, null, '市场运营部', 1, 'active', '2021-02-01')

  // Fix parent_id NULL for roots (SQLite FK with 0 is awkward)
  db.prepare(`UPDATE depts SET parent_id = NULL WHERE id IN (1, 5)`).run()

  const insertUser = db.prepare(
    `INSERT INTO users (username, password_hash, phone, email, role_code, status, dept_id, remark, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  insertUser.run('admin', hash, '13800008888', 'admin@hatax.com', 'admin', 'active', 2, '超级管理员', '2024-01-01')
  insertUser.run('zhangwei', hash, '13900001234', 'zhangwei@hatax.com', 'user', 'active', 3, '', '2024-02-15')
  insertUser.run('lihua', hash, '13700005678', 'lihua@hatax.com', 'user', 'disabled', 5, '', '2024-03-20')
  insertUser.run('wangfang', hash, '13600009999', 'wangfang@hatax.com', 'user', 'active', 4, '', '2024-04-01')
  insertUser.run('chenjie', hash, '13500000001', 'chenjie@hatax.com', 'operator', 'active', 5, '', '2024-05-12')

  const insertLogin = db.prepare(
    `INSERT INTO login_logs (username, ip, location, browser, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  )
  const loginSeed = [
    ['admin', '192.168.1.101', 'Beijing', 'Chrome 120', 'success', '2024-12-01 09:23:15'],
    ['zhangwei', '10.0.0.55', 'Shanghai', 'Firefox 121', 'success', '2024-12-01 09:45:32'],
    ['admin', '192.168.1.101', 'Beijing', 'Chrome 120', 'fail', '2024-12-01 10:12:08'],
    ['lihua', '172.16.0.23', 'Guangzhou', 'Edge 120', 'success', '2024-12-01 11:05:44'],
    ['wangfang', '10.10.10.10', 'Shenzhen', 'Safari 17', 'success', '2024-12-01 13:22:17'],
    ['chenjie', '192.168.2.88', 'Hangzhou', 'Chrome 119', 'fail', '2024-12-01 14:08:53'],
    ['admin', '192.168.1.101', 'Beijing', 'Chrome 120', 'success', '2024-12-01 16:44:06'],
  ]
  for (const row of loginSeed) insertLogin.run(...row)

  const insertOp = db.prepare(
    `INSERT INTO op_logs (operator, module, action, detail, ip, duration_ms, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const opSeed = [
    ['admin', '用户管理', '编辑', '修改用户 张伟 的角色为运营主管', '192.168.1.101', 120, 'Success', '2024-12-01 10:23:15'],
    ['admin', '角色权限', '编辑', '更新超级管理员权限配置', '192.168.1.101', 450, 'Success', '2024-12-01 10:45:32'],
    ['admin', '菜单管理', '新增', '新增菜单项：数据分析', '192.168.1.101', 80, 'Success', '2024-12-01 11:12:08'],
    ['zhangwei', '表单管理', '提交', '提交高级表单申请单据', '10.0.0.55', 200, 'Success', '2024-12-01 13:05:44'],
    ['lihua', '数据导出', '导出', '导出用户数据 Excel', '172.16.0.23', 12000, 'Success', '2024-12-01 14:22:17'],
    ['admin', '系统配置', '编辑', '修改主题色为火山红', '192.168.1.101', 45, 'Success', '2024-12-01 15:08:53'],
    ['wangfang', '菜单管理', '删除', '删除菜单项：临时页面', '10.10.10.10', 60, 'Success', '2024-12-01 15:33:21'],
    ['chenjie', '用户管理', '新增', '新增用户 李娜', '192.168.2.88', 150, 'Success', '2024-12-01 16:44:06'],
    ['admin', '数据备份', '备份', '执行数据库完整备份', '192.168.1.101', 45000, 'Warning', '2024-12-01 17:11:39'],
    ['liuyang', '数据导入', '导入', '批量导入用户数据 CSV', '10.50.60.70', 8000, 'Error', '2024-12-01 20:18:42'],
  ]
  for (const row of opSeed) insertOp.run(...row)

  console.log(`[db] Seeded SQLite at ${dbPath}`)
}

function seedContentIfEmpty() {
  const postCount = db.prepare('SELECT COUNT(*) AS c FROM blog_posts').get().c
  if (postCount > 0) return

  const admin = db.prepare(`SELECT id, username FROM users WHERE username = 'admin'`).get()
  const authorId = admin?.id || null
  const authorName = admin?.username || 'admin'

  const insertTag = db.prepare(
    `INSERT INTO blog_tags (slug, name, description) VALUES (?, ?, ?)`,
  )
  insertTag.run('architecture', '架构', '系统设计与目录约定')
  insertTag.run('frontend', '前端', 'Alpine / HTMX / Vite')
  insertTag.run('community', '社区', '论坛与内容运营')

  const insertPost = db.prepare(
    `INSERT INTO blog_posts (slug, title, excerpt, body_md, status, author_id, author_name, view_count, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?)`,
  )
  const posts = [
    [
      'split-admin-and-pages',
      '用 Vite 多页面拆分官网与管理后台',
      '将 /pages/* 留给落地页与社区，/admin/* 留给运营后台，鉴权与布局各自独立。',
      `# 用 Vite 多页面拆分官网与管理后台

现代产品往往同时需要 **面向用户的站点** 与 **运营后台**。HatTax 采用双轨目录：

- \`/pages/*\` — 官网、博客、论坛（公开，无 app-shell）
- \`/admin/*\` — 管理后台（JWT + CSRF，注入侧栏）

## 为什么这样拆

1. **布局隔离**：用户端不该出现侧栏与标签栏
2. **鉴权前缀**：\`PUBLIC_PREFIXES = ['/pages/']\` 一次覆盖全部公开页
3. **构建简单**：Vite \`rollupOptions.input\` 同时扫描两个目录

## 下一步

对接 Content API 风格的 \`GET /api/blog/posts\`，管理端用 Admin API 写草稿与发布。
`,
      42,
      '2026-07-01 10:00:00',
    ],
    [
      'alpine-htmx-fullstack',
      'Alpine + HTMX：少框架也能做全栈',
      '演示账号、JWT、CSRF 与 SQLite 如何在 HatTax 模板里串起来。',
      `# Alpine + HTMX 全栈

运行时体积约 **30KB**，却能覆盖：

- 列表局部刷新（HTMX）
- 表单校验与弹窗（Alpine）
- 鉴权头自动注入

\`\`\`js
fetch('/api/blog/posts')
  .then(r => r.json())
  .then(({ data }) => console.log(data.rows))
\`\`\`

写操作务必带 \`Authorization\` 与 \`X-CSRF-Token\`。
`,
      28,
      '2026-06-15 14:30:00',
    ],
    [
      'forum-conventions',
      '落地页与论坛前端的目录约定',
      '公开页不注入 app-shell；管理页通过 layout 注释复用侧栏。',
      `# 论坛目录约定

对标 **Flarum**：分区 → 主题 → 回复。

| 概念 | 表 |
|------|-----|
| Category | forum_categories |
| Discussion | forum_topics |
| Post | forum_posts |

支持置顶、锁帖、点赞。正文使用 Markdown。
`,
      19,
      '2026-05-20 09:15:00',
    ],
  ]

  const linkTag = db.prepare(`INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)`)
  const tagBySlug = db.prepare(`SELECT id FROM blog_tags WHERE slug = ?`)

  for (const [slug, title, excerpt, body, views, published] of posts) {
    const info = insertPost.run(
      slug,
      title,
      excerpt,
      body,
      authorId,
      authorName,
      views,
      published,
      published,
      published,
    )
    const postId = info.lastInsertRowid
    const tags =
      slug === 'split-admin-and-pages'
        ? ['architecture', 'frontend']
        : slug === 'alpine-htmx-fullstack'
          ? ['frontend']
          : ['community', 'architecture']
    for (const t of tags) {
      const tag = tagBySlug.get(t)
      if (tag) linkTag.run(postId, tag.id)
    }
  }

  const insertCat = db.prepare(
    `INSERT INTO forum_categories (slug, name, description, color, sort, topic_count) VALUES (?, ?, ?, ?, ?, ?)`,
  )
  insertCat.run('general', '综合讨论', '产品使用、建议与闲聊', '#1890ff', 1, 0)
  insertCat.run('dev', '开发者', 'API、扩展与二次开发', '#52c41a', 2, 0)
  insertCat.run('feedback', '反馈与求助', 'Bug 报告与使用问题', '#faad14', 3, 0)

  const insertTopic = db.prepare(
    `INSERT INTO forum_topics
      (category_id, title, body_md, author_id, author_name, pinned, locked, reply_count, like_count, view_count, last_reply_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
  )
  const insertReply = db.prepare(
    `INSERT INTO forum_posts (topic_id, body_md, author_id, author_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  const bumpCat = db.prepare(`UPDATE forum_categories SET topic_count = topic_count + 1 WHERE id = ?`)

  const catGeneral = db.prepare(`SELECT id FROM forum_categories WHERE slug = 'general'`).get().id
  const catDev = db.prepare(`SELECT id FROM forum_categories WHERE slug = 'dev'`).get().id
  const catFb = db.prepare(`SELECT id FROM forum_categories WHERE slug = 'feedback'`).get().id

  const topics = [
    {
      cat: catDev,
      title: '如何把管理后台挂到 /admin？',
      body: 'Vite 多入口 + auth 白名单 + 公开 pages 目录，有没有踩坑经验？',
      pinned: 1,
      replies: [
        '可以参考 docs/blog-forum-design.md，公开前缀用 PUBLIC_PREFIXES。',
        '记得 CORS 里把 Vite 端口加进去，否则浏览器会拦跨域。',
      ],
      at: '2026-07-09 08:00:00',
    },
    {
      cat: catGeneral,
      title: '落地页不走 app-shell 的实践',
      body: '官网 / 博客 / 论坛用独立 HTML，避免侧栏污染用户端。大家怎么做公共导航复用？',
      pinned: 0,
      replies: ['目前三页各写一份 header，后续可以抽 public-nav 组件。'],
      at: '2026-07-08 16:20:00',
    },
    {
      cat: catFb,
      title: '演示账号登录后跳转到哪？',
      body: '默认应该是 /admin/dashboard.html，可用 redirect 参数覆盖吗？',
      pinned: 0,
      replies: ['可以，consumeRedirect 会校验同域 path。'],
      at: '2026-07-06 11:05:00',
    },
  ]

  for (const t of topics) {
    const info = insertTopic.run(
      t.cat,
      t.title,
      t.body,
      authorId,
      authorName,
      t.pinned,
      t.replies.length,
      2,
      10 + t.replies.length * 3,
      t.at,
      t.at,
      t.at,
    )
    const topicId = info.lastInsertRowid
    bumpCat.run(t.cat)
    let offset = 1
    for (const reply of t.replies) {
      const ts = t.at.replace(/(\d{2}):(\d{2}):(\d{2})$/, (_, h, m, s) => {
        const sec = Number(s) + offset * 120
        return `${h}:${m}:${String(sec % 60).padStart(2, '0')}`
      })
      insertReply.run(topicId, reply, authorId, authorName, ts, ts)
      offset++
    }
  }

  console.log(`[db] Seeded blog + forum content at ${dbPath}`)
}

function migrateCommunityTasks() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL,
      reward_points INTEGER NOT NULL DEFAULT 0,
      config_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      sort INTEGER NOT NULL DEFAULT 0,
      repeatable INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_task_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      progress_json TEXT NOT NULL DEFAULT '{}',
      score INTEGER,
      reward_granted INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES community_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES community_members(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_community_tasks_status ON community_tasks(status, sort);
    CREATE INDEX IF NOT EXISTS idx_community_task_progress_member ON community_task_progress(member_id, task_id);
  `)
}

function migrateKnowledgeCourses() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kb_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'article',
      price_points INTEGER NOT NULL DEFAULT 0,
      summary TEXT DEFAULT '',
      intro_md TEXT DEFAULT '',
      body_md TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      sales_count INTEGER NOT NULL DEFAULT 0,
      sort INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kb_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      content_type TEXT NOT NULL DEFAULT 'article',
      media_url TEXT DEFAULT '',
      body_md TEXT DEFAULT '',
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      is_free INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (course_id) REFERENCES kb_courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kb_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      points_spent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(member_id, course_id),
      FOREIGN KEY (member_id) REFERENCES community_members(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES kb_courses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_kb_courses_status ON kb_courses(status, sort);
    CREATE INDEX IF NOT EXISTS idx_kb_courses_type ON kb_courses(type);
    CREATE INDEX IF NOT EXISTS idx_kb_lessons_course ON kb_lessons(course_id, sort);
    CREATE INDEX IF NOT EXISTS idx_kb_purchases_member ON kb_purchases(member_id);
  `)
}

function migrateCommunityEvents() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      mode TEXT NOT NULL DEFAULT 'offline',
      location TEXT DEFAULT '',
      online_url TEXT DEFAULT '',
      starts_at TEXT NOT NULL,
      ends_at TEXT DEFAULT '',
      signup_deadline TEXT DEFAULT '',
      capacity INTEGER NOT NULL DEFAULT 0,
      fee_points INTEGER NOT NULL DEFAULT 0,
      summary TEXT DEFAULT '',
      body_md TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      sort INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_event_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      contact_name TEXT NOT NULL DEFAULT '',
      contact_phone TEXT NOT NULL DEFAULT '',
      note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'confirmed',
      points_spent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES community_events(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES community_members(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_community_events_status ON community_events(status, sort, starts_at);
    CREATE INDEX IF NOT EXISTS idx_community_events_category ON community_events(category);
    CREATE INDEX IF NOT EXISTS idx_community_event_signups_event ON community_event_signups(event_id, status);
    CREATE INDEX IF NOT EXISTS idx_community_event_signups_member ON community_event_signups(member_id);
  `)
}

migrate()
