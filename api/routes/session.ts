import { Hono } from 'hono'
import { PlayerRepository } from '../../src/db/repository'

export const sessionRouter = new Hono()

// POST /api/v1/session/guest - Start or retrieve guest player session
sessionRouter.post('/guest', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      const existing = await PlayerRepository.getPlayerBySession(token)
      if (existing) {
        return c.json({
          success: true,
          data: existing,
        })
      }
    }

    // Otherwise create brand new guest session
    const newGuest = await PlayerRepository.createGuestPlayer()
    return c.json({
      success: true,
      data: newGuest,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session creation failed'
    return c.json(
      {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message,
        },
      },
      500,
    )
  }
})
