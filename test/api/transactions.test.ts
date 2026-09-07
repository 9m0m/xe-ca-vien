import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../../api/index.js'
import { PlayerRepository } from '../../src/db/repository'

describe('Purchase & Achievement Transaction Atomicity & Concurrency', () => {
  beforeEach(() => {
    PlayerRepository.getMemStore().reset()
  })

  it('two concurrent food unlock requests with only enough coins for one -> exactly one succeeds', async () => {
    // 1. Create a guest session
    const guestRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const { data } = await guestRes.json()
    const token = data.sessionToken
    const playerId = data.player.id

    // Set coins to exactly 20,000 (enough for fish_cake which costs 20,000, but not two)
    const memStore = PlayerRepository.getMemStore()
    const prog = memStore.progress.get(playerId)!
    prog.coins = 20000

    // 2. Fire two concurrent unlock requests
    const [res1, res2] = await Promise.all([
      app.request('/api/v1/shop/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ foodId: 'fish_cake' }),
      }),
      app.request('/api/v1/shop/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ foodId: 'fish_cake' }),
      }),
    ])

    const json1 = await res1.json()
    const json2 = await res2.json()

    // Exactly one should succeed
    const results = [json1, json2]
    const successCount = results.filter((r) => r.success === true).length
    const failCount = results.filter((r) => r.success === false).length

    expect(successCount).toBe(1)
    expect(failCount).toBe(1)

    // Player coins must be exactly 0 (20000 - 20000), never negative
    const finalProg = memStore.progress.get(playerId)!
    expect(finalProg.coins).toBe(0)

    // fish_cake appears only once in unlocks
    const unlocks = memStore.unlocks.get(playerId)!
    expect(unlocks.filter((id) => id === 'fish_cake').length).toBe(1)
  })

  it('two concurrent upgrade requests with only enough coins for one -> exactly one succeeds', async () => {
    // 1. Create a guest session
    const guestRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const { data } = await guestRes.json()
    const token = data.sessionToken
    const playerId = data.player.id

    // awning_comfort tier 2 costs 10,000 and requires level 1. Set coins to 10,000
    const memStore = PlayerRepository.getMemStore()
    const prog = memStore.progress.get(playerId)!
    prog.coins = 10000

    // 2. Fire two concurrent purchase requests
    const [res1, res2] = await Promise.all([
      app.request('/api/v1/upgrades/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upgradeKey: 'awning_comfort' }),
      }),
      app.request('/api/v1/upgrades/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upgradeKey: 'awning_comfort' }),
      }),
    ])

    const json1 = await res1.json()
    const json2 = await res2.json()

    const results = [json1, json2]
    const successCount = results.filter((r) => r.success === true).length
    const failCount = results.filter((r) => r.success === false).length

    expect(successCount).toBe(1)
    expect(failCount).toBe(1)

    // Coins deducted once: 10000 - 10000 = 0
    const finalProg = memStore.progress.get(playerId)!
    expect(finalProg.coins).toBe(0)

    // Upgrade tier should be 2
    const upgrades = memStore.upgrades.get(playerId)!
    expect(upgrades.get('awning_comfort')).toBe(2)
  })

  it('simulated transaction failure -> zero mutations persist', async () => {
    const guestRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const { data } = await guestRes.json()
    const playerId = data.player.id

    const memStore = PlayerRepository.getMemStore()
    const initialCoins = memStore.progress.get(playerId)!.coins
    const initialUnlocks = [...memStore.unlocks.get(playerId)!]

    // Simulate an operation that deducts coins but throws an error before commit
    expect(() => {
      memStore.runInTransaction(() => {
        const prog = memStore.progress.get(playerId)!
        prog.coins -= 5000
        memStore.unlocks.get(playerId)!.push('simulated_failure_item')
        throw new Error('SIMULATED_DB_ERROR_MIDWAY')
      })
    }).toThrow('SIMULATED_DB_ERROR_MIDWAY')

    // State must be completely restored
    expect(memStore.progress.get(playerId)!.coins).toBe(initialCoins)
    expect(memStore.unlocks.get(playerId)).toEqual(initialUnlocks)
  })

  it('concurrent claim attempts for the same achievement -> exactly one succeeds', async () => {
    const guestRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const { data } = await guestRes.json()
    const token = data.sessionToken
    const playerId = data.player.id

    const memStore = PlayerRepository.getMemStore()
    const initialCoins = memStore.progress.get(playerId)!.coins
    const initialXp = memStore.progress.get(playerId)!.xp

    // Unlock an achievement (first_order: 1000 coins, 30 xp)
    const achList = memStore.achievements.get(playerId) || []
    achList.push({ id: 'first_order', claimed: false })
    memStore.achievements.set(playerId, achList)

    // Fire two concurrent claim requests
    const [res1, res2] = await Promise.all([
      app.request('/api/v1/achievements/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ achievementId: 'first_order' }),
      }),
      app.request('/api/v1/achievements/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ achievementId: 'first_order' }),
      }),
    ])

    const json1 = await res1.json()
    const json2 = await res2.json()

    const results = [json1, json2]
    const successCount = results.filter((r) => r.success === true).length
    const failCount = results.filter((r) => r.success === false).length

    expect(successCount).toBe(1)
    expect(failCount).toBe(1)

    // Coins and XP credited exactly once: first_order grants 2,000 coins, 50 xp
    const finalProg = memStore.progress.get(playerId)!
    expect(finalProg.coins).toBe(initialCoins + 2000)
    expect(finalProg.xp).toBe(initialXp + 50)

    // Claimed flag is true
    const ach = memStore.achievements.get(playerId)!.find((a) => a.id === 'first_order')!
    expect(ach.claimed).toBe(true)
  })

  it('error during reward credit -> achievement claim status rolls back', async () => {
    const guestRes = await app.request('/api/v1/session/guest', { method: 'POST' })
    const { data } = await guestRes.json()
    const playerId = data.player.id

    const memStore = PlayerRepository.getMemStore()
    const initialCoins = memStore.progress.get(playerId)!.coins
    const initialXp = memStore.progress.get(playerId)!.xp

    const achList = memStore.achievements.get(playerId) || []
    achList.push({ id: 'first_order', claimed: false })
    memStore.achievements.set(playerId, achList)

    // Simulate transaction failing after claimed is marked true
    expect(() => {
      memStore.runInTransaction(() => {
        const target = memStore.achievements.get(playerId)!.find((a) => a.id === 'first_order')!
        target.claimed = true
        // Throws before awarding coins/xp
        throw new Error('SIMULATED_REWARD_CREDIT_FAILURE')
      })
    }).toThrow('SIMULATED_REWARD_CREDIT_FAILURE')

    // Claimed must have rolled back to false
    const target = memStore.achievements.get(playerId)!.find((a) => a.id === 'first_order')!
    expect(target.claimed).toBe(false)
    expect(memStore.progress.get(playerId)!.coins).toBe(initialCoins)
    expect(memStore.progress.get(playerId)!.xp).toBe(initialXp)
  })
})
