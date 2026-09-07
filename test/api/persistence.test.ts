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
    // 1. Register active order on server first
    const startRes = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        preferredItems: [{ foodId: 'fish_ball_classic', quantity: 1 }],
      }),
    })
    expect(startRes.status).toBe(200)
    const startData = await startRes.json()
    const orderId = startData.data.id

    const idempotencyKey = `idem_${Date.now()}_test1234`
    const orderPayload = {
      orderId,
      idempotencyKey,
      servedItems: [{ foodId: 'fish_ball_classic', state: 'perfect' as const }],
      appliedSauces: ['tuong_ot'],
      hasDuaChua: startData.data.hasDuaChua,
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
    expect(body1.data.coinsAwarded).toBeGreaterThan(0)
    const expectedCoins = 10000 + body1.data.coinsAwarded
    expect(body1.data.newTotalCoins).toBe(expectedCoins)

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
    // Coins must remain exactly expectedCoins, NOT duplicate award!
    expect(body2.data.newTotalCoins).toBe(expectedCoins)

    // Verify player profile reflects exactly expectedCoins
    const profileRes = await app.request('/api/v1/player', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })
    const profileBody = await profileRes.json()
    expect(profileBody.data.progress.coins).toBe(expectedCoins)
  })
})
