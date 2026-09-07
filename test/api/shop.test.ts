import { describe, it, expect } from 'vitest'
import { app } from '../../api/index'

describe('Shop & Food Unlocks API', () => {
  let sessionToken: string

  it('should initialize a guest and handle unlock balance checks', async () => {
    // 1. Initialize guest session (starter coins = 10,000)
    const initRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const initBody = await initRes.json()
    sessionToken = initBody.data.sessionToken
    expect(initBody.data.progress.coins).toBe(10000)

    // 2. Try unlocking fish_cake (cost = 20,000) with only 10,000 coins -> should fail
    const failRes = await app.request('/api/v1/shop/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ foodId: 'fish_cake' }),
    })
    expect(failRes.status).toBe(400)
    const failBody = await failRes.json()
    expect(failBody.success).toBe(false)
    expect(failBody.error.code).toBe('INSUFFICIENT_COINS')

    // 3. Earn coins via order completion to afford unlock
    const earnRes = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        orderId: 'order_farm_coins',
        idempotencyKey: `idem_shop_earn_${Date.now()}`,
        items: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
        coinsEarned: 25000,
        xpEarned: 50,
      }),
    })
    const earnBody = await earnRes.json()
    expect(earnBody.data.newTotalCoins).toBe(35000) // 10,000 + 25,000

    // 4. Now unlock fish_cake (cost = 20,000) -> should succeed
    const unlockRes = await app.request('/api/v1/shop/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ foodId: 'fish_cake' }),
    })
    expect(unlockRes.status).toBe(200)
    const unlockBody = await unlockRes.json()
    expect(unlockBody.success).toBe(true)
    expect(unlockBody.data.newCoins).toBe(15000) // 35,000 - 20,000
    expect(unlockBody.data.unlockedFoods).toContain('fish_cake')

    // 5. Try unlocking fish_cake again -> should return ALREADY_UNLOCKED
    const dupRes = await app.request('/api/v1/shop/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ foodId: 'fish_cake' }),
    })
    expect(dupRes.status).toBe(400)
    const dupBody = await dupRes.json()
    expect(dupBody.error.code).toBe('ALREADY_UNLOCKED')

    // 6. Verify player profile has persisted new unlock and balance
    const profileRes = await app.request('/api/v1/player', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    const profileBody = await profileRes.json()
    expect(profileBody.data.progress.coins).toBe(15000)
    expect(profileBody.data.unlockedFoods).toContain('fish_cake')
  })
})
