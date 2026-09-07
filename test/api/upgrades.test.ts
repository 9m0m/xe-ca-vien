import { describe, it, expect } from 'vitest'
import { app } from '../../api/index'

describe('Cart Upgrades & Progression API', () => {
  let sessionToken: string

  it('should fetch the cart upgrades catalog', async () => {
    const res = await app.request('/api/v1/upgrades/catalog')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.upgrades.length).toBeGreaterThanOrEqual(5)
  })

  it('should handle upgrade level requirements, purchases, and state persistence', async () => {
    // 1. Create guest player session (starts with 10,000 coins, level 1)
    const guestRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const guestBody = await guestRes.json()
    sessionToken = guestBody.data.sessionToken
    expect(guestBody.data.upgrades.pan_capacity).toBe(1)
    expect(guestBody.data.progress.level).toBe(1)

    // 2. Try purchasing pan_capacity tier 2 (requires level 2, cost 15,000) -> LEVEL_TOO_LOW
    const lowLevelRes = await app.request('/api/v1/upgrades/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ upgradeKey: 'pan_capacity' }),
    })
    expect(lowLevelRes.status).toBe(400)
    const lowLevelJson = await lowLevelRes.json()
    expect(lowLevelJson.error.code).toBe('LEVEL_TOO_LOW')

    // 3. Purchase awning_comfort tier 2 (requires level 1, cost 10,000) -> Succeeds!
    const awningRes = await app.request('/api/v1/upgrades/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ upgradeKey: 'awning_comfort' }),
    })
    expect(awningRes.status).toBe(200)
    const awningJson = await awningRes.json()
    expect(awningJson.success).toBe(true)
    expect(awningJson.data.newCoins).toBe(0) // 10,000 - 10,000
    expect(awningJson.data.upgrades.awning_comfort).toBe(2)

    // 4. Complete orders to level up to Level 2 and earn 20,000 coins
    const completeRes = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        orderId: 'order_progression_farm',
        idempotencyKey: `idem_upgrade_farm_${Date.now()}`,
        items: [
          { foodId: 'fish_ball_classic', state: 'perfect' },
          { foodId: 'beef_ball_classic', state: 'perfect' },
        ],
        coinsEarned: 20000,
        xpEarned: 150, // 150 XP -> Level 2
      }),
    })
    const completeJson = await completeRes.json()
    expect(completeJson.data.newLevel).toBe(2)
    expect(completeJson.data.newTotalCoins).toBe(20000)
    // Achievement "first_order" should be in newlyUnlockedAchievements
    expect(completeJson.data.newlyUnlockedAchievements).toContain('first_order')
    expect(completeJson.data.stats.ordersServed).toBe(1)
    expect(completeJson.data.stats.perfectItemsFried).toBe(2)

    // 5. Claim "first_order" achievement reward (+2,000 coins, +50 XP)
    const claimRes = await app.request('/api/v1/achievements/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ achievementId: 'first_order' }),
    })
    expect(claimRes.status).toBe(200)
    const claimJson = await claimRes.json()
    expect(claimJson.success).toBe(true)
    expect(claimJson.data.newCoins).toBe(22000) // 20,000 + 2,000
    expect(claimJson.data.claimedAchievements).toContain('first_order')

    // 6. Purchase pan_capacity tier 2 (costs 15,000, player has 22,000) -> Succeeds!
    const panRes = await app.request('/api/v1/upgrades/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ upgradeKey: 'pan_capacity' }),
    })
    expect(panRes.status).toBe(200)
    const panJson = await panRes.json()
    expect(panJson.success).toBe(true)
    expect(panJson.data.newCoins).toBe(7000) // 22,000 - 15,000
    expect(panJson.data.upgrades.pan_capacity).toBe(2)

    // 7. Now player is Level 2 with 7,000 coins. Try purchasing speed_tongs tier 2 (costs 8,000, level 2) -> INSUFFICIENT_COINS
    const noMoneyRes = await app.request('/api/v1/upgrades/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ upgradeKey: 'speed_tongs' }),
    })
    expect(noMoneyRes.status).toBe(400)
    const noMoneyJson = await noMoneyRes.json()
    expect(noMoneyJson.error.code).toBe('INSUFFICIENT_COINS')

    // 8. Verify via GET /api/v1/player that upgrades and achievements remain persisted
    const playerRes = await app.request('/api/v1/player', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    const playerJson = await playerRes.json()
    expect(playerJson.data.upgrades.pan_capacity).toBe(2)
    expect(playerJson.data.upgrades.awning_comfort).toBe(2)
    expect(playerJson.data.stats.ordersServed).toBe(1)
    expect(playerJson.data.claimedAchievements).toContain('first_order')
  })
})
