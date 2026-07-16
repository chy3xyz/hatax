import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const isProd = process.env.NODE_ENV === 'production'

// Dev: load .env / .env.local. Production: rely on real process env only.
if (!isProd) {
  loadEnv({ path: path.join(root, '.env') })
  loadEnv({ path: path.join(root, '.env.local'), override: true })
}

const jwtSecret = process.env.JWT_SECRET || ''
const WEAK = new Set([
  '',
  'hatax-dev-secret-change-me',
  'change-me-to-a-long-random-string',
  'change-me-to-a-long-random-string-at-least-32-chars',
  'hatax-local-dev-secret-do-not-use-in-prod-32c',
])

function assertJwtSecret(secret) {
  if (WEAK.has(secret) || secret.length < 32) {
    console.error(
      '[fatal] JWT_SECRET must be set to a strong value (≥32 chars) in production. See .env.example',
    )
    process.exit(1)
  }
}

if (isProd) {
  assertJwtSecret(jwtSecret)
} else if (!jwtSecret) {
  console.warn('[warn] JWT_SECRET not set — using insecure development default')
}

export const config = {
  port: Number(process.env.PORT || 8790),
  jwtSecret: jwtSecret || 'hatax-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES || '8h',
  csrfHeader: 'x-csrf-token',
  isProd,
  dbPath: process.env.DB_PATH || path.join(root, 'data', 'hatax.db'),
  distDir: path.join(root, 'dist'),
}

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
