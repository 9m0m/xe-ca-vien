import { describe, it, expect } from 'vitest'
import { app } from '../../api/index'

describe('Server-Authoritative Persistence & Sessions', () => {
  let sessionToken: string
  let playerId: string

  it('should initialize a new guest session', async () => {
    const res = await app.request('/api/v1/session/guest', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.sessionToken).toBeDefined()
    expect(body.data.player.isGuest).toBe(true)
    expect(body.data.progress.coins).toBe(10000)
    expect(body.data.progress.level).toBe(1)
    expect(body.data.unlockedFoods.length).toBeGreaterThanOrEqual(4)

    sessionToken = body.data.sessionToken
    playerId = body.data.player.id
    expect(playerId).toBeDefined()
  })

  it('should retrieve existing player profile using valid session token', async () => {
    const res = await app.request('/api/v1/player', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.player.id).toBe(playerId)
    expect(body.data.progress.coins).toBe(10000)
  })

  it('should reject unauthenticated request to /api/v1/player', async () => {
    const res = await app.request('/api/v1/player')
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('should reject request with invalid/expired session token', async () => {
    const res = await app.request('/api/v1/player', {
      headers: {
        Authorization: 'Bearer invalid_nonexistent_token',
      },
    })
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('SESSION_EXPIRED')
  })

  it('should record completed order and award coins/xp idempotently', async () => {
    const idempotencyKey = `idem_${Date.now()}_test1234`
    const orderPayload = {
      orderId: 'order_test_999',
      idempotencyKey,
      items: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
      coinsEarned: 13000,
      xpEarned: 30,
    }

    // First attempt
    const res1 = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(orderPayload),
    })
    expect(res1.status).toBe(200)
    const body1 = await res1.json()
    expect(body1.success).toBe(true)
    expect(body1.data.wasIdempotent).toBe(false)
    expect(body1.data.coinsAwarded).toBe(13000)
    expect(body1.data.newTotalCoins).toBe(23000) // 10000 starter + 13000

    // Duplicate submission with identical idempotencyKey
    const res2 = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(orderPayload),
    })
    expect(res2.status).toBe(200)
    const body2 = await res2.json()
    expect(body2.success).toBe(true)
    expect(body2.data.wasIdempotent).toBe(true)
    // Coins must remain 23000, NOT 36000!
    expect(body2.data.newTotalCoins).toBe(23000)

    // Verify player profile reflects exactly 23000
    const profileRes = await app.request('/api/v1/player', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })
    const profileBody = await profileRes.json()
    expect(profileBody.data.progress.coins).toBe(23000)
  })
})
