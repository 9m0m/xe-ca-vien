import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PlayerRepository } from '../../src/db/repository'
import { getFoodConfig, getUnlockCost } from '../../src/game/data/catalog'
import { getSessionToken } from './session'

export const shopRouter = new Hono()

const UnlockFoodSchema = z.object({
  foodId: z.string().min(1),
})

// POST /api/v1/shop/unlock - Unlock new food item with coins
shopRouter.post('/unlock', zValidator('json', UnlockFoodSchema), async (c) => {
  const token = getSessionToken(c)

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cần phiên đăng nhập để mở khóa món.',
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

  const { foodId } = c.req.valid('json')
  const food = getFoodConfig(foodId)

  if (!food) {
    return c.json(
      {
        success: false,
        error: {
          code: 'FOOD_NOT_FOUND',
          message: 'Món ăn không tồn tại trong thực đơn.',
        },
      },
      404,
    )
  }

  const cost = getUnlockCost(food)

  try {
    const result = await PlayerRepository.unlockFood(playerState.player.id, foodId, cost)
    return c.json({
      success: true,
      data: {
        newCoins: result.newCoins,
        unlockedFoods: result.unlockedFoods,
        unlockedFood: food,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unlock failed'
    if (msg === 'ALREADY_UNLOCKED') {
      return c.json(
        {
          success: false,
          error: {
            code: 'ALREADY_UNLOCKED',
            message: 'Món này bạn đã mở khóa rồi!',
          },
        },
        400,
      )
    }
    if (msg === 'INSUFFICIENT_COINS') {
      return c.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_COINS',
            message: `Không đủ xu để mở khóa món (Cần ${cost.toLocaleString('vi-VN')} đ).`,
          },
        },
        400,
      )
    }
    return c.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: msg,
        },
      },
      500,
    )
  }
})
