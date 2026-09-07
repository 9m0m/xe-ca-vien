import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PlayerRepository } from '../../src/db/repository'

export const ordersRouter = new Hono()

const CompleteOrderSchema = z.object({
  orderId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  items: z.array(
    z.object({
      foodId: z.string(),
      state: z.enum(['raw', 'cooking', 'perfect', 'overcooked']),
    }),
  ),
  coinsEarned: z.number().int().nonnegative(),
  xpEarned: z.number().int().nonnegative(),
})

// POST /api/v1/orders/complete - Securely validate and persist order rewards
ordersRouter.post('/complete', zValidator('json', CompleteOrderSchema), async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cần phiên đăng nhập để nhận thưởng.',
        },
      },
      401,
    )
  }

  const playerState = await PlayerRepository.getPlayerBySession(token)
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Phiên chơi không tồn tại hoặc đã hết hạn.',
        },
      },
      401,
    )
  }

  const body = c.req.valid('json')

  // Award rewards server-side with idempotency protection
  const result = await PlayerRepository.completeOrderWithIdempotency(
    playerState.player.id,
    body.idempotencyKey,
    JSON.stringify(body.items),
    body.coinsEarned,
    body.xpEarned,
  )

  return c.json({
    success: true,
    data: result,
  })
})
