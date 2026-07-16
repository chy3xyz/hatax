import { db } from './sqlite.js'
import { findMemberById, mapMember, memberActivityStats } from './members.js'
import { listTopicsByAuthor, listRepliesByAuthor } from './forum.js'

function pairIds(a, b) {
  const x = Number(a)
  const y = Number(b)
  return x < y ? [x, y] : [y, x]
}

export function followCounts(memberId) {
  const following = db
    .prepare(`SELECT COUNT(*) AS c FROM community_follows WHERE follower_id = ?`)
    .get(memberId).c
  const followers = db
    .prepare(`SELECT COUNT(*) AS c FROM community_follows WHERE following_id = ?`)
    .get(memberId).c
  return { following, followers }
}

export function isFollowing(followerId, followingId) {
  if (!followerId || !followingId) return false
  return !!db
    .prepare(
      `SELECT 1 FROM community_follows WHERE follower_id = ? AND following_id = ?`,
    )
    .get(followerId, followingId)
}

export function followMember(followerId, followingId) {
  const fid = Number(followerId)
  const tid = Number(followingId)
  if (!fid || !tid) throw new Error('无效用户')
  if (fid === tid) throw new Error('不能关注自己')
  if (!findMemberById(tid)) throw new Error('用户不存在')
  if (isFollowing(fid, tid)) return { following: true }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.prepare(
    `INSERT INTO community_follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`,
  ).run(fid, tid, now)
  return { following: true }
}

export function unfollowMember(followerId, followingId) {
  db.prepare(`DELETE FROM community_follows WHERE follower_id = ? AND following_id = ?`).run(
    Number(followerId),
    Number(followingId),
  )
  return { following: false }
}

function mapMemberCard(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    bio: row.bio || '',
    points: Number(row.points || 0),
    followedAt: row.followed_at || null,
  }
}

export function listFollowing(memberId, { limit = 50 } = {}) {
  return db
    .prepare(
      `SELECT m.id, m.username, m.display_name, m.bio, m.points, f.created_at AS followed_at
       FROM community_follows f
       JOIN community_members m ON m.id = f.following_id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC
       LIMIT ?`,
    )
    .all(memberId, Math.min(Number(limit) || 50, 100))
    .map(mapMemberCard)
}

export function listFollowers(memberId, { limit = 50 } = {}) {
  return db
    .prepare(
      `SELECT m.id, m.username, m.display_name, m.bio, m.points, f.created_at AS followed_at
       FROM community_follows f
       JOIN community_members m ON m.id = f.follower_id
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC
       LIMIT ?`,
    )
    .all(memberId, Math.min(Number(limit) || 50, 100))
    .map(mapMemberCard)
}

export function resolveMember(idOrUsername) {
  const key = String(idOrUsername || '').trim()
  if (!key) return null
  if (/^\d+$/.test(key)) return findMemberById(Number(key))
  const row = db.prepare(`SELECT * FROM community_members WHERE username = ?`).get(key)
  return row ? mapMember(row) : null
}

export function publicProfile(memberId, viewerId = null) {
  const member = findMemberById(memberId)
  if (!member || member.status === 'disabled') return null
  const counts = followCounts(member.id)
  const stats = memberActivityStats(member.id)
  const followsBack =
    viewerId && Number(viewerId) !== Number(member.id)
      ? isFollowing(member.id, viewerId)
      : false
  return {
    id: member.id,
    username: member.username,
    displayName: member.displayName,
    bio: member.bio,
    points: member.points,
    createdAt: member.createdAt,
    followingCount: counts.following,
    followerCount: counts.followers,
    isFollowing: viewerId ? isFollowing(viewerId, member.id) : false,
    followsBack,
    isSelf: viewerId != null && Number(viewerId) === Number(member.id),
    stats,
    recentTopics: listTopicsByAuthor(member.id, { limit: 8 }),
    recentReplies: listRepliesByAuthor(member.id, { limit: 8 }),
    followingPreview: listFollowing(member.id, { limit: 8 }),
    followersPreview: listFollowers(member.id, { limit: 8 }),
  }
}

export function getOrCreateConversation(memberId, otherId) {
  const a = Number(memberId)
  const b = Number(otherId)
  if (!a || !b) throw new Error('无效用户')
  if (a === b) throw new Error('不能给自己发私信')
  if (!findMemberById(b)) throw new Error('对方不存在')

  const [lo, hi] = pairIds(a, b)
  let row = db
    .prepare(`SELECT * FROM community_conversations WHERE member_a = ? AND member_b = ?`)
    .get(lo, hi)
  if (!row) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const info = db
      .prepare(
        `INSERT INTO community_conversations (member_a, member_b, last_message_at, created_at)
         VALUES (?, ?, NULL, ?)`,
      )
      .run(lo, hi, now)
    row = db.prepare(`SELECT * FROM community_conversations WHERE id = ?`).get(info.lastInsertRowid)
  }
  return row
}

function otherMemberId(conv, me) {
  return Number(conv.member_a) === Number(me) ? Number(conv.member_b) : Number(conv.member_a)
}

export function listConversations(memberId) {
  const mid = Number(memberId)
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT body FROM community_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
        (SELECT COUNT(*) FROM community_messages m
          WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read_at IS NULL) AS unread
       FROM community_conversations c
       WHERE c.member_a = ? OR c.member_b = ?
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
    )
    .all(mid, mid, mid)

  return rows.map((row) => {
    const otherId = otherMemberId(row, mid)
    const other = findMemberById(otherId)
    return {
      id: row.id,
      other: other
        ? {
            id: other.id,
            username: other.username,
            displayName: other.displayName,
          }
        : { id: otherId, username: '未知', displayName: '未知用户' },
      lastBody: row.last_body || '',
      lastMessageAt: row.last_message_at,
      unread: Number(row.unread || 0),
    }
  })
}

export function getConversationForMember(conversationId, memberId) {
  const row = db.prepare(`SELECT * FROM community_conversations WHERE id = ?`).get(conversationId)
  if (!row) return null
  const mid = Number(memberId)
  if (Number(row.member_a) !== mid && Number(row.member_b) !== mid) return null
  return row
}

export function listMessages(conversationId, memberId, { limit = 100 } = {}) {
  const conv = getConversationForMember(conversationId, memberId)
  if (!conv) return null
  const mid = Number(memberId)
  db.prepare(
    `UPDATE community_messages SET read_at = datetime('now')
     WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
  ).run(conversationId, mid)

  const other = findMemberById(otherMemberId(conv, mid))
  const messages = db
    .prepare(
      `SELECT id, sender_id AS senderId, body, created_at AS createdAt, read_at AS readAt
       FROM community_messages
       WHERE conversation_id = ?
       ORDER BY id ASC
       LIMIT ?`,
    )
    .all(conversationId, Math.min(Number(limit) || 100, 200))

  return {
    id: conv.id,
    other: other
      ? { id: other.id, username: other.username, displayName: other.displayName }
      : null,
    messages,
  }
}

export function sendMessage(senderId, { toMemberId, conversationId, body }) {
  const text = String(body || '').trim()
  if (!text) throw new Error('消息不能为空')
  if (text.length > 2000) throw new Error('消息最多 2000 字')

  let conv
  if (conversationId) {
    conv = getConversationForMember(conversationId, senderId)
    if (!conv) throw new Error('会话不存在')
  } else {
    conv = getOrCreateConversation(senderId, toMemberId)
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const info = db
    .prepare(
      `INSERT INTO community_messages (conversation_id, sender_id, body, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(conv.id, senderId, text, now)
  db.prepare(`UPDATE community_conversations SET last_message_at = ? WHERE id = ?`).run(now, conv.id)

  return {
    id: info.lastInsertRowid,
    conversationId: conv.id,
    senderId: Number(senderId),
    body: text,
    createdAt: now,
  }
}

export function unreadMessageCount(memberId) {
  return db
    .prepare(
      `SELECT COUNT(*) AS c FROM community_messages m
       JOIN community_conversations c ON c.id = m.conversation_id
       WHERE (c.member_a = ? OR c.member_b = ?)
         AND m.sender_id != ?
         AND m.read_at IS NULL`,
    )
    .get(memberId, memberId, memberId).c
}
