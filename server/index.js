import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { config } from './config.js'
import './db/sqlite.js'
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/users.js'
import { roleRoutes } from './routes/roles.js'
import { deptRoutes } from './routes/depts.js'
import { logRoutes } from './routes/logs.js'
import { blogRoutes } from './routes/blog.js'
import { forumRoutes } from './routes/forum.js'
import { communityRoutes } from './routes/community.js'
import { taskRoutes } from './routes/tasks.js'
import { courseRoutes } from './routes/courses.js'
import { eventRoutes } from './routes/events.js'
import { seedTasksIfEmpty } from './db/tasks.js'
import { seedCoursesIfEmpty } from './db/courses.js'
import { seedEventsIfEmpty } from './db/events.js'

seedTasksIfEmpty()
seedCoursesIfEmpty()
seedEventsIfEmpty()

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: false,
  }),
)

app.use(
  '/api/*',
  cors({
    origin: [
      'http://localhost:3485',
      'http://127.0.0.1:3485',
      'http://localhost:3486',
      'http://127.0.0.1:3486',
      'http://localhost:3490',
      'http://127.0.0.1:3490',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'HX-Request', 'HX-Target'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.get('/api/health', (c) =>
  c.json({
    code: 0,
    msg: 'ok',
    data: {
      service: 'hatax',
      db: 'sqlite',
      time: new Date().toISOString(),
    },
  }),
)

app.route('/api/auth', authRoutes)
app.route('/api/community', communityRoutes)
app.route('/api/users', userRoutes)
app.route('/api/roles', roleRoutes)
app.route('/api/depts', deptRoutes)
app.route('/api/logs', logRoutes)
app.route('/api/blog', blogRoutes)
app.route('/api/forum', forumRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/courses', courseRoutes)
app.route('/api/events', eventRoutes)

if (config.isProd) {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' }))
} else {
  app.get('/', (c) =>
    c.json({
      code: 0,
      msg: 'HatTax API (dev). Frontend: Vite — npm run dev:full',
      data: { db: config.dbPath },
    }),
  )
}

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ code: 404, msg: 'Not Found' }, 404)
  }
  return c.text('Not Found', 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ code: 500, msg: config.isProd ? 'Internal Error' : err.message }, 500)
})

const port = config.port
console.log(`HatTax Hono listening on http://localhost:${port} (sqlite: ${config.dbPath})`)
serve({ fetch: app.fetch, port })

export default app
