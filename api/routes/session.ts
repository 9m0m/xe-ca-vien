import { Hono, Context } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { PlayerRepository } from '../../src/db/repository'

export const sessionRouter = new Hono()

export const COOKIE_SESSION_NAME = 'xcv_session'

/**
 * Extracts session token from Authorization: Bearer <token> or HttpOnly xcv_session cookie.
 */
export function getSessionToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim()
  }

  const cookieToken = getCookie(c, COOKIE_SESSION_NAME)
  if (cookieToken) {
    return cookieToken.trim()
  }

  return null
}

// POST /api/v1/session/guest - Start or retrieve guest player session with secure HttpOnly cookie
sessionRouter.post('/guest', async (c) => {
  try {
    const token = getSessionToken(c)

    if (token) {
      const existing = await PlayerRepository.getPlayerBySession(token)
      if (existing) {
        setCookie(c, COOKIE_SESSION_NAME, existing.sessionToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
          maxAge: 30 * 24 * 60 * 60,
        })

        return c.json({
          success: true,
          data: existing,
        })
      }
    }

    // Otherwise create brand new guest session
    const newGuest = await PlayerRepository.createGuestPlayer()

    setCookie(c, COOKIE_SESSION_NAME, newGuest.sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
    })

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
