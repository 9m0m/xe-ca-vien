import { describe, it, expect } from 'vitest'
import { app } from '@/../api/index'
import { CookingManager } from '@/game/systems/CookingManager'
import { getFoodConfig } from '@/game/data/catalog'

describe('Critical Flow Integration: New Visitor to Persisted Upgrade', () => {
  let sessionToken: string
  let playerId: string
  let initialCoins: number

  it('1. New visitor creates a guest session with starter capital and tier 1 cart', async () => {
    const res = await app.request('/api/v1/session/guest', {
      method: 'POST',
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.sessionToken).toBeDefined()
    expect(json.data.player.id).toBeDefined()
    expect(json.data.progress.coins).toBe(10000)
    expect(json.data.progress.level).toBe(1)
    expect(json.data.upgrades.pan_capacity).toBe(1)
    expect(json.data.unlockedFoods.length).toBeGreaterThanOrEqual(4)

    sessionToken = json.data.sessionToken
    playerId = json.data.player.id
    initialCoins = json.data.progress.coins
  })

  it('2. Player cooks order in CookingManager, serves with satisfaction, and receives rewards', async () => {
    const starterFoods = ['fish_ball_classic', 'beef_ball_classic', 'sausage_red', 'fish_tofu']
    const manager = new CookingManager(6)
    const order = manager.generateCustomerOrder(starterFoods)
    expect(order).toBeDefined()

    // Cook first required item to golden perfection
    const firstReq = order.items[0]
    const cfg = getFoodConfig(firstReq.foodId)!
    const perfectTime = cfg.cookTimeMs + cfg.perfectWindowMs / 2

    for (let i = 0; i < firstReq.quantity; i++) {
      const slot = manager.addFoodToPan(firstReq.foodId)!
      manager.update(perfectTime)
      manager.removeFoodFromPan(slot)
    }

    // Cook second item if order has 2 items
    if (order.items.length > 1) {
      const secondReq = order.items[1]
      const cfg2 = getFoodConfig(secondReq.foodId)!
      const perfectTime2 = cfg2.cookTimeMs + cfg2.perfectWindowMs / 2
      for (let i = 0; i < secondReq.quantity; i++) {
        const slot = manager.addFoodToPan(secondReq.foodId)!
        manager.update(perfectTime2)
        manager.removeFoodFromPan(slot)
      }
    }

    const evalResult = manager.serveCurrentOrder()
    expect(evalResult.success).toBe(true)
    expect(evalResult.coinsEarned).toBeGreaterThan(0)
    expect(evalResult.xpEarned).toBeGreaterThan(0)

    // 1. Register order on server first
    const startRes = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        preferredItems: order.items.map((it) => ({ foodId: it.foodId, quantity: it.quantity })),
      }),
    })
    expect(startRes.status).toBe(200)
    const startData = await startRes.json()
    const serverOrderId = startData.data.id

    // Submit reward to server with idempotency key
    const idempotencyKey = `crit_flow_order_${Date.now()}`
    const servedItems = evalResult.servedItems ?? [
      { foodId: firstReq.foodId, state: 'perfect' as const },
    ]
    const res = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        orderId: serverOrderId,
        idempotencyKey,
        servedItems,
        appliedSauces: manager.getSelectedSauces(),
        hasDuaChua: manager.getHasDuaChua(),
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.coinsAwarded).toBeGreaterThan(0)
    const expectedCoins = initialCoins + json.data.coinsAwarded
    expect(json.data.newTotalCoins).toBe(expectedCoins)

    // Replay attack / duplicate submit protection: same idempotencyKey should return existing record without adding coins
    const replayRes = await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        orderId: serverOrderId,
        idempotencyKey,
        servedItems,
        appliedSauces: manager.getSelectedSauces(),
        hasDuaChua: manager.getHasDuaChua(),
      }),
    })

    expect(replayRes.status).toBe(200)
    const replayJson = await replayRes.json()
    expect(replayJson.data.wasIdempotent).toBe(true)
    expect(replayJson.data.newTotalCoins).toBe(expectedCoins)
  })

  it('3. Page refresh restores authoritative progress from server', async () => {
    const res = await app.request('/api/v1/player', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.player.id).toBe(playerId)
    expect(json.data.progress.coins).toBeGreaterThan(0)
    expect(json.data.progress.level).toBeGreaterThanOrEqual(1)
  })

  it('4. Player earns enough coins, purchases cart upgrade, and upgrade persists after refresh', async () => {
    // Register active order to fund pan_capacity upgrade (Tier 2 costs 15,000 đ and requires Level 2)
    const bonusStart = await app.request('/api/v1/orders/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        preferredItems: [
          { foodId: 'fish_ball_classic', quantity: 2 },
          { foodId: 'beef_ball_classic', quantity: 2 },
        ],
      }),
    })
    expect(bonusStart.status).toBe(200)
    const bonusStartData = await bonusStart.json()

    await app.request('/api/v1/orders/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        orderId: bonusStartData.data.id,
        idempotencyKey: `crit_bonus_${Date.now()}`,
        servedItems: [
          { foodId: 'fish_ball_classic', state: 'perfect' as const },
          { foodId: 'fish_ball_classic', state: 'perfect' as const },
          { foodId: 'beef_ball_classic', state: 'perfect' as const },
          { foodId: 'beef_ball_classic', state: 'perfect' as const },
        ],
        appliedSauces: ['tuong_ot'],
        hasDuaChua: bonusStartData.data.hasDuaChua,
      }),
    })

    // Purchase pan_capacity upgrade (6 -> 8 slots)
    const purchaseRes = await app.request('/api/v1/upgrades/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        upgradeKey: 'pan_capacity',
      }),
    })

    expect(purchaseRes.status).toBe(200)
    const purchaseJson = await purchaseRes.json()
    expect(purchaseJson.success).toBe(true)
    expect(purchaseJson.data.upgrades.pan_capacity).toBe(2)

    // Refresh simulation: fetch /api/v1/player to verify upgrade remains persisted
    const refreshRes = await app.request('/api/v1/player', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    expect(refreshRes.status).toBe(200)
    const refreshJson = await refreshRes.json()
    expect(refreshJson.success).toBe(true)
    expect(refreshJson.data.upgrades.pan_capacity).toBe(2)

    // Verify security headers
    expect(refreshRes.headers.get('x-content-type-options')).toBe('nosniff')
    expect(refreshRes.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(refreshRes.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })
})
