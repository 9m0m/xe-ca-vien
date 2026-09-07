import { Hono } from 'hono'
import { PlayerRepository } from '../../src/db/repository'

export const playerRouter = new Hono()

// GET /api/v1/player - Retrieve player profile and balances
playerRouter.get('/', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Phiên chơi không hợp lệ. Vui lòng bắt đầu lại.',
        },
      },
      401,
    )
  }

  const playerData = await PlayerRepository.getPlayerBySession(token)

  if (!playerData) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Phiên chơi đã hết hạn.',
        },
      },
      401,
    )
  }

  return c.json({
    success: true,
    data: playerData,
  })
})
