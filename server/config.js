import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/** True when running inside a `bun build --compile` binary */
export const isCompiled =
  typeof import.meta.path === 'string' && import.meta.path.includes('$bunfs')

/**
 * Project / embed root:
 * - source: repo root (parent of server/)
 * - compiled with --asset ./dist: virtual root that contains dist/
 */
function resolveRoot() {
  if (isCompiled) return import.meta.dir
  return path.resolve(import.meta.dir, '..')
}

const root = resolveRoot()

function resolveDistDir() {
  const embedded = path.join(import.meta.dir, 'dist')
  if (existsSync(embedded)) return embedded
  const project = path.join(root, 'dist')
  if (existsSync(project)) return project
  return project
}

const isProd =
  isCompiled ||
  (Bun.env.NODE_ENV || process.env.NODE_ENV) === 'production'

// Bun loads .env automatically when present. Production / compiled still require a strong secret.
const jwtSecret = Bun.env.JWT_SECRET || process.env.JWT_SECRET || ''
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

// Mutable DB stays on the host filesystem (cwd), never inside the read-only binary.
const dbPath =
  Bun.env.DB_PATH ||
  process.env.DB_PATH ||
  path.join(process.cwd(), 'data', 'hatax.db')

export const config = {
  port: Number(Bun.env.PORT || process.env.PORT || 8790),
  jwtSecret: jwtSecret || 'hatax-dev-secret-change-me',
  jwtExpiresIn: Bun.env.JWT_EXPIRES || process.env.JWT_EXPIRES || '8h',
  csrfHeader: 'x-csrf-token',
  isProd,
  isCompiled,
  dbPath,
  distDir: resolveDistDir(),
  root,
  /** OpenAI-compatible API (optional). Without a key, CS still aggregates site content. */
  aiApiKey: Bun.env.AI_API_KEY || process.env.AI_API_KEY || '',
  aiBaseUrl:
    Bun.env.AI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  aiModel: Bun.env.AI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini',
  aiTimeoutMs: Number(Bun.env.AI_TIMEOUT_MS || process.env.AI_TIMEOUT_MS || 25000),
  aiRateLimit: Number(Bun.env.AI_RATE_LIMIT || process.env.AI_RATE_LIMIT || 20),
}

mkdirSync(path.dirname(config.dbPath), { recursive: true })
