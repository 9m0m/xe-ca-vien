import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../../api/index.ts'
import { getDb } from '../../src/db/client'

describe('Security, Authority & Adversarial API Tests', () => {
  let player1Token: string
  let player1Id: string
  let player2Token: string

  beforeEach(async () => {
    // Player 1
    const p1Res = await app.request('/api/v1/session/guest', { method: 'POST' })
    const p1Body = await p1Res.json()
    player1Token = p1Body.data.sessionToken
    player1Id = p1Body.data.player.id

    // Player 2
    const p2Res = await app.request('/api/v1/session/guest', { method: 'POST' })
    const p2Body = await p2Res.json()
    player2Token = p2Body.data.sessionToken
  })

  it('1. Server completely ignores client-supplied coinsEarned/xpEarned and derives rewards authoritatively', async () => {
    // Register order for player 1: 1 fish_ball_classic
    const startRes = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        preferredItems: [{ foodId: 'fish_ball_classic', quantity: 1 }],
      }),
    })
    expect(startRes.status).toBe(200)
    const startData = await startRes.json()

    // Malicious request attempting to grant 9,999,999 coins and XP
    const maliciousPayload = {
      orderId: startData.data.id,
      idempotencyKey: `hacker_${Date.now()}`,
      servedItems: [{ foodId: 'fish_ball_classic', state: 'perfect' as const }],
      appliedSauces: ['tuong_ot'],
      hasDuaChua: startData.data.hasDuaChua,
      coinsEarned: 9999999, // Should be ignored
      xpEarned: 9999999, // Should be ignored
    }

    const completeRes = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify(maliciousPayload),
    })

    expect(completeRes.status).toBe(200)
    const json = await completeRes.json()
    expect(json.success).toBe(true)

    // Authoritative math: 1 fish_ball_classic (base 5000) * 1.3 perfect = 6500, +25% tip = 8125
    expect(json.data.coinsAwarded).toBeLessThan(10000)
    expect(json.data.coinsAwarded).not.toBe(9999999)
    expect(json.data.xpAwarded).not.toBe(9999999)
    expect(json.data.newTotalCoins).not.toBe(10000 + 9999999)
    expect(json.data.newTotalCoins).toBe(10000 + json.data.coinsAwarded)
  })

  it('2. Reject completion of non-existent order with 404 ORDER_NOT_FOUND', async () => {
    const fakeOrderId = 'ord_fake_999999'
    const res = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        orderId: fakeOrderId,
        idempotencyKey: `idem_fake_${Date.now()}`,
        servedItems: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
      }),
    })

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('ORDER_NOT_FOUND')
  })

  it('3. Cross-player order isolation: Player 2 cannot complete Player 1 order (403 FORBIDDEN)', async () => {
    // Player 1 creates order
    const startRes = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        preferredItems: [{ foodId: 'fish_ball_classic', quantity: 1 }],
      }),
    })
    const orderData = await startRes.json()
    const orderId = orderData.data.id

    // Player 2 attempts to complete Player 1's order
    const stolenRes = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player2Token}`,
      },
      body: JSON.stringify({
        orderId,
        idempotencyKey: `idem_steal_${Date.now()}`,
        servedItems: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
      }),
    })

    expect(stolenRes.status).toBe(403)
    const json = await stolenRes.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('4. Server rejects serving foods not unlocked by the player (403 FOOD_NOT_UNLOCKED)', async () => {
    // Player 1 has not unlocked tier 5 food "lobster_ball"
    const startRes = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        preferredItems: [{ foodId: 'fish_ball_classic', quantity: 1 }],
      }),
    })
    const orderData = await startRes.json()

    const exploitRes = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        orderId: orderData.data.id,
        idempotencyKey: `idem_locked_${Date.now()}`,
        servedItems: [{ foodId: 'lobster_ball', state: 'perfect' }],
      }),
    })

    expect(exploitRes.status).toBe(403)
    const json = await exploitRes.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FOOD_NOT_UNLOCKED')
  })

  it('5. Duplicate completion with DIFFERENT idempotency key fails (400 ORDER_ALREADY_COMPLETED)', async () => {
    const startRes = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        preferredItems: [{ foodId: 'fish_ball_classic', quantity: 1 }],
      }),
    })
    const orderData = await startRes.json()
    const orderId = orderData.data.id

    // First completion
    const complete1 = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        orderId,
        idempotencyKey: `idem_first_${Date.now()}`,
        servedItems: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
      }),
    })
    expect(complete1.status).toBe(200)

    // Second completion of same order but with DIFFERENT idempotency key
    const complete2 = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${player1Token}`,
      },
      body: JSON.stringify({
        orderId,
        idempotencyKey: `idem_second_diff_${Date.now()}`,
        servedItems: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
      }),
    })

    expect(complete2.status).toBe(400)
    const json2 = await complete2.json()
    expect(json2.success).toBe(false)
    expect(json2.error.code).toBe('ORDER_ALREADY_COMPLETED')
  })

  it('6. HttpOnly Cookie authentication works seamlessly alongside Authorization header', async () => {
    // Access profile using Cookie header only
    const cookieRes = await app.request('/api/v1/player', {
      headers: {
        Cookie: `xcv_session=${player1Token}`,
      },
    })
    expect(cookieRes.status).toBe(200)
    const json = await cookieRes.json()
    expect(json.success).toBe(true)
    expect(json.data.player.id).toBe(player1Id)
  })

  it('7. Production safety: getDb() strictly refuses in-memory fallback when NODE_ENV === production and DATABASE_URL missing', () => {
    const originalEnv = process.env.NODE_ENV
    const originalDbUrl = process.env.DATABASE_URL
    const originalAllowMem = process.env.ALLOW_IN_MEMORY_DB

    try {
      process.env.NODE_ENV = 'production'
      delete process.env.DATABASE_URL
      delete process.env.ALLOW_IN_MEMORY_DB

      expect(() => getDb()).toThrowError(
        /DATABASE_URL environment variable is required in production mode/,
      )
    } finally {
      process.env.NODE_ENV = originalEnv
      if (originalDbUrl !== undefined) process.env.DATABASE_URL = originalDbUrl
      if (originalAllowMem !== undefined) process.env.ALLOW_IN_MEMORY_DB = originalAllowMem
    }
  })

  it('8. Production mock guard: ALLOW_IN_MEMORY_DB=true NEVER enables in-memory fallback in production', () => {
    const originalEnv = process.env.NODE_ENV
    const originalDbUrl = process.env.DATABASE_URL
    const originalAllowMem = process.env.ALLOW_IN_MEMORY_DB

    try {
      process.env.NODE_ENV = 'production'
      process.env.ALLOW_IN_MEMORY_DB = 'true'
      delete process.env.DATABASE_URL

      expect(() => getDb()).toThrowError(
        /DATABASE_URL environment variable is required in production mode/,
      )
    } finally {
      process.env.NODE_ENV = originalEnv
      if (originalDbUrl !== undefined) process.env.DATABASE_URL = originalDbUrl
      if (originalAllowMem !== undefined) process.env.ALLOW_IN_MEMORY_DB = originalAllowMem
    }
  })
})
