/**
 * Password hashing via Bun.password (bcrypt).
 * Uses bcrypt so existing better-sqlite3 / bcryptjs hashes keep verifying.
 */

const BCRYPT = { algorithm: 'bcrypt', cost: 10 }

export function hashPassword(password) {
  return Bun.password.hashSync(String(password), BCRYPT)
}

export function verifyPassword(password, hash) {
  if (!hash) return false
  return Bun.password.verifySync(String(password), String(hash))
}

export async function verifyPasswordAsync(password, hash) {
  if (!hash) return false
  return Bun.password.verify(String(password), String(hash))
}
