import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { z } from 'zod'
import { sessionRouter } from './routes/session'
import { playerRouter } from './routes/player'
import { ordersRouter } from './routes/orders'
import { shopRouter } from './routes/shop'
import { upgradesRouter } from './routes/upgrades'
import { achievementsRouter } from './routes/achievements'

export const config = {
  runtime: 'nodejs',
}

export const app = new Hono().basePath('/api')

// In-memory rate limiting map (IP based, 120 requests/minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// 1. Security Headers & Rate Limiting Middleware
app.use('*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1'
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (record && record.resetAt > now) {
    if (record.count >= 120) {
      return c.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.',
          },
        },
        429,
      )
    }
    record.count++
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
  }

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

export default handle(app)
