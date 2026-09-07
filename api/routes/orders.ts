import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PlayerRepository } from '../../src/db/repository'
import { getSessionToken } from './session'

export const ordersRouter = new Hono()

const StartOrderSchema = z.object({
  preferredItems: z
    .array(
      z.object({
        foodId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
})

const CompleteOrderSchema = z.object({
  orderId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  servedItems: z.array(
    z.object({
      foodId: z.string(),
      state: z.enum(['raw', 'cooking', 'perfect', 'overcooked']),
    }),
  ),
  appliedSauces: z.array(z.string()).optional().default([]),
  hasDuaChua: z.boolean().optional().default(false),
})

// POST /api/v1/orders/start - Generate and register server-authoritative active order
ordersRouter.post('/start', zValidator('json', StartOrderSchema), async (c) => {
  const token = getSessionToken(c)

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cần phiên đăng nhập để bắt đầu đơn hàng.',
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

  const { preferredItems } = c.req.valid('json')

  try {
    const order = await PlayerRepository.createActiveOrder(playerState.player.id, preferredItems)
    return c.json({
      success: true,
      data: order,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.startsWith('FOOD_NOT_UNLOCKED')) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FOOD_NOT_UNLOCKED',
            message: msg,
          },
        },
        403,
      )
    }
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: msg,
        },
      },
      500,
    )
  }
})

// POST /api/v1/orders/complete - Securely validate and derive order rewards server-side
ordersRouter.post('/complete', zValidator('json', CompleteOrderSchema), async (c) => {
  const token = getSessionToken(c)

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

  try {
    // Award rewards server-side with idempotency protection and authoritative derivation
    const result = await PlayerRepository.completeOrderWithIdempotency(
      playerState.player.id,
      body.orderId,
      body.idempotencyKey,
      body.servedItems,
      body.appliedSauces,
      body.hasDuaChua,
    )

    return c.json({
      success: true,
      data: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Order completion failed'
    if (msg === 'ORDER_NOT_FOUND') {
      return c.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Không tìm thấy đơn hàng trên máy chủ.',
          },
        },
        404,
      )
    }
    if (msg === 'FORBIDDEN_NOT_YOUR_ORDER') {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Đơn hàng này không thuộc về phiên của bạn.',
          },
        },
        403,
      )
    }
    if (msg === 'ORDER_ALREADY_COMPLETED') {
      return c.json(
        {
          success: false,
          error: {
            code: 'ORDER_ALREADY_COMPLETED',
            message: 'Đơn hàng này đã được hoàn thành trước đó.',
          },
        },
        400,
      )
    }
    if (msg.startsWith('FOOD_NOT_UNLOCKED')) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FOOD_NOT_UNLOCKED',
            message: 'Món ăn phục vụ chưa được mở khóa.',
          },
        },
        403,
      )
    }
    if (msg.startsWith('INVALID_FOOD_ID')) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_FOOD_ID',
            message: 'Món ăn không hợp lệ.',
          },
        },
        400,
      )
    }

    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: msg,
        },
      },
      500,
    )
  }
})
