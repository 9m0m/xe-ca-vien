import { Hono } from 'hono'
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

// Universal handler supporting Node.js Serverless Functions (req, res),
// Vercel Edge Runtime, and Vite dev server.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const universalHandler = async (req: any, res?: any) => {
  // Case A: Web Standard Request (Vite dev server, Vercel Edge)
  if (!res || typeof res.setHeader !== 'function') {
    return app.fetch(req)
  }

  // Case B: Node.js Serverless Function (IncomingMessage, ServerResponse)
  try {
    const protocol = req.headers?.['x-forwarded-proto'] || 'https'
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host || 'localhost'
    const originalUrl =
      req.headers?.['x-matched-path'] ||
      req.headers?.['x-invoke-path'] ||
      req.headers?.['x-forwarded-uri'] ||
      req.url ||
      '/api'

    const url = new URL(originalUrl, `${protocol}://${host}`)

    const headers = new Headers()
    if (req.headers) {
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(',') : (v as string))
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer))
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks)
      }
    }

    const webReq = new Request(url.toString(), {
      method: req.method || 'GET',
      headers,
      body,
    })

    const webRes = await app.fetch(webReq)

    res.statusCode = webRes.status

    const cookies =
      typeof webRes.headers.getSetCookie === 'function' ? webRes.headers.getSetCookie() : null

    for (const [k, v] of webRes.headers.entries()) {
      if (k.toLowerCase() === 'set-cookie' && cookies) continue
      res.setHeader(k, v)
    }

    if (cookies && cookies.length > 0) {
      res.setHeader('set-cookie', cookies)
    }

    const buf = await webRes.arrayBuffer()
    res.end(Buffer.from(buf))
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err))
    console.error('SERVERLESS HANDLER ERROR:', errorObj)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVERLESS_INVOCATION_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      }),
    )
  }
}

universalHandler.fetch = app.fetch.bind(app)

export default universalHandler
