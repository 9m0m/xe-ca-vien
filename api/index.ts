import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { z } from 'zod'
import { sessionRouter } from './routes/session.js'
import { playerRouter } from './routes/player.js'
import { ordersRouter } from './routes/orders.js'
import { shopRouter } from './routes/shop.js'
import { upgradesRouter } from './routes/upgrades.js'
import { achievementsRouter } from './routes/achievements.js'

export const config = {
  runtime: 'edge',
}

export const app = new Hono().basePath('/api')

// 1. Security Headers Middleware
app.use('*', async (c, next) => {
  await next()

  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'SAMEORIGIN')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
})

// Standard JSON error handling
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    },
    500,
  )
})

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    },
    404,
  )
})

// V1 API Router
const v1 = new Hono()

// Root API info endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      service: 'xe-ca-vien-api',
      version: '0.1.0',
      endpoints: ['/api/v1/health', '/api/v1/game/config', '/api/v1/session/guest'],
    },
  })
})

// Direct health endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      service: 'xe-ca-vien-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    },
  })
})

// Health check endpoint
v1.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      service: 'xe-ca-vien-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    },
  })
})

// Config response schema
const GameConfigResponseSchema = z.object({
  gameTitle: z.string(),
  version: z.string(),
  locale: z.string(),
  defaultPanSlots: z.number(),
  maxConcurrentIndex: z.number(),
  features: z.object({
    guestSession: z.boolean(),
    sauceSystem: z.boolean(),
    upgrades: z.boolean(),
  }),
})

// Game config endpoint
v1.get('/game/config', (c) => {
  const data = {
    gameTitle: 'Xe Cá Viên',
    version: '0.1.0',
    locale: 'vi-VN',
    defaultPanSlots: 6,
    maxConcurrentIndex: 2,
    features: {
      guestSession: true,
      sauceSystem: true,
      upgrades: true,
    },
  }

  // Validate response contract
  GameConfigResponseSchema.parse(data)

  return c.json({
    success: true,
    data,
  })
})

// Sub-routers
v1.route('/session', sessionRouter)
v1.route('/player', playerRouter)
v1.route('/orders', ordersRouter)
v1.route('/shop', shopRouter)
v1.route('/upgrades', upgradesRouter)
v1.route('/achievements', achievementsRouter)

app.route('/v1', v1)

// Universal Edge Handler & Method Exports for Vercel
export const handler = handle(app)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(handler as any).fetch = app.fetch.bind(app)

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
export const HEAD = handler
export const OPTIONS = handler

export default handler
