# HatTax 博客 & 论坛设计（对标开源）

## 对标

| 能力 | 对标 | 本项目 |
|------|------|--------|
| 博客内容模型 | Ghost：Posts + Tags | `blog_posts` + `blog_tags` |
| 论坛结构 | Flarum Category → Topic → Post | `forum_categories` → `topics` → `posts` |
| 论坛标签 | Flarum / Discourse tags | `forum_tags` + `forum_topic_tags` |
| 社区账号 | 独立会员 | `community_members` |
| 关注 / 私信 | 社交关系 | follows + conversations |

## 论坛标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/forum/tags` | 标签列表（含 topicCount） |
| GET | `/api/forum/topics?tag=vite` | 按标签筛选 |
| POST | `/api/forum/topics` | body.tags 最多 5 个，不存在则自动创建 |

前端：首页标签筛选与侧栏热门标签、详情页标签链接、发帖多选/自定义标签。

## 鉴权（双轨）

- 社区 `aud=community`：发帖 / 回复 / 点赞 / 关注 / 私信
- 后台 `aud=admin`：置顶 / 锁帖 / 删帖 · 博客管理

演示：社区 `demo / 123456` · 后台 `admin / 123456`
