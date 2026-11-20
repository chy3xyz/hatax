#!/usr/bin/env bun
/**
 * Build Vite frontend, then compile a standalone Bun binary for VPS deploy.
 *
 * Usage:
 *   bun scripts/compile.js                 # linux-x64 → release/hatax-linux-x64
 *   bun scripts/compile.js linux-x64-musl  # Alpine / musl
 *   bun scripts/compile.js darwin-arm64    # local macOS smoke test
 *   bun scripts/compile.js --skip-vite …   # reuse existing dist/
 */

import { mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const skipVite = args.includes('--skip-vite')
const platform = args.find((a) => !a.startsWith('-')) || 'linux-x64'

const TARGETS = {
  'linux-x64': 'bun-linux-x64',
  'linux-x64-modern': 'bun-linux-x64',
  'linux-x64-musl': 'bun-linux-x64-musl',
  'linux-arm64': 'bun-linux-arm64',
  'linux-arm64-musl': 'bun-linux-arm64-musl',
  'darwin-arm64': 'bun-darwin-arm64',
  'darwin-x64': 'bun-darwin-x64',
  'windows-x64': 'bun-windows-x64',
}

const bunTarget = TARGETS[platform]
if (!bunTarget) {
  console.error(`Unknown platform: ${platform}`)
  console.error(`Supported: ${Object.keys(TARGETS).join(', ')}`)
  process.exit(1)
}

const root = path.resolve(import.meta.dir, '..')
const outDir = path.join(root, 'release')
const outfile = path.join(outDir, `hatax-${platform}${platform.startsWith('windows') ? '.exe' : ''}`)
const distDir = path.join(root, 'dist')

mkdirSync(outDir, { recursive: true })

if (!skipVite) {
  console.log('→ vite build')
  const vite = Bun.spawnSync(['bun', 'run', 'build'], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (vite.exitCode !== 0) process.exit(vite.exitCode ?? 1)
} else if (!existsSync(distDir)) {
  console.error('dist/ missing — run without --skip-vite first')
  process.exit(1)
}

console.log(`→ bun build --compile --target=${bunTarget}`)
console.log(`  outfile: ${outfile}`)

const result = Bun.spawnSync(
  [
    'bun',
    'build',
    '--compile',
    `--target=${bunTarget}`,
    '--minify',
    '--outfile',
    outfile,
    '--asset',
    './dist',
    './server/index.js',
  ],
  {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  },
)

if (result.exitCode !== 0) process.exit(result.exitCode ?? 1)

const stat = Bun.file(outfile).size
console.log(`\n✓ ${outfile} (${(stat / 1024 / 1024).toFixed(1)} MB)`)
console.log(`
VPS quick start (glibc Ubuntu/Debian):
  scp ${path.relative(root, outfile)} user@vps:/opt/hatax/hatax
  ssh user@vps
  mkdir -p /opt/hatax/data && cd /opt/hatax
  export JWT_SECRET='at-least-32-random-characters!!!!!!!!'
  export NODE_ENV=production
  ./hatax

Alpine / musl: compile with  bun scripts/compile.js linux-x64-musl
`)
