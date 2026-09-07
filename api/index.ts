import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { z } from 'zod'
import { sessionRouter } from './routes/session'
import { playerRouter } from './routes/player'
import { ordersRouter } from './routes/orders'

export const config = {
  runtime: 'nodejs',
}

export const app = new Hono().basePath('/api')

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

app.route('/v1', v1)

export default handle(app)
