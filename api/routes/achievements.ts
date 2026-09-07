import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PlayerRepository } from '../../src/db/repository'
import { ACHIEVEMENTS } from '../../src/game/data/achievements'

export const achievementsRouter = new Hono()

const ClaimAchievementSchema = z.object({
  achievementId: z.string().min(1),
})

// GET /api/v1/achievements/list - List all achievements metadata
achievementsRouter.get('/list', (c) => {
  return c.json({
    success: true,
    data: {
      achievements: ACHIEVEMENTS,
    },
  })
})

// POST /api/v1/achievements/claim - Claim reward for an unlocked achievement
achievementsRouter.post('/claim', zValidator('json', ClaimAchievementSchema), async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cần phiên đăng nhập để nhận thưởng thành tựu.',
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

  const { achievementId } = c.req.valid('json')

  try {
    const result = await PlayerRepository.claimAchievement(playerState.player.id, achievementId)
    return c.json({
      success: true,
      data: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Claim failed'
    if (msg === 'ACHIEVEMENT_NOT_UNLOCKED') {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_UNLOCKED',
            message: 'Thành tựu này chưa được mở khóa!',
          },
        },
        400,
      )
    }
    if (msg === 'ACHIEVEMENT_ALREADY_CLAIMED') {
      return c.json(
        {
          success: false,
          error: {
            code: 'ALREADY_CLAIMED',
            message: 'Bạn đã nhận phần thưởng này rồi!',
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
