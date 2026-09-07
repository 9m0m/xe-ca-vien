import { eq, and, sql } from 'drizzle-orm'
import { getDb } from './client.js'
import {
  players,
  playerSessions,
  playerProgress,
  playerFoodUnlocks,
  playerUpgrades,
  playerStats,
  playerAchievements,
  orderRuns,
  activeOrders,
} from './schema.js'
import { getNextUpgradeTier, getUpgradeConfig } from '../game/data/upgrades.js'
import { ACHIEVEMENTS, checkAchievementUnlocked } from '../game/data/achievements.js'
import { getFoodConfig, FULL_FOOD_CATALOG } from '../game/data/catalog.js'

function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

function generateRandomUUID(): string {
  return globalThis.crypto.randomUUID()
}

export interface CompletePlayerState {
  player: {
    id: string
    displayName: string
    isGuest: boolean
  }
  progress: {
    coins: number
    level: number
    xp: number
    reputation: number
  }
  unlockedFoods: string[]
  sessionToken: string
  upgrades: Record<string, number>
  stats: {
    ordersServed: number
    perfectItemsFried: number
    totalCoinsEarned: number
    foodsUnlockedCount: number
    upgradesPurchasedCount: number
  }
  unlockedAchievements: string[]
  claimedAchievements: string[]
}

export interface ActiveOrderData {
  id: string
  playerId: string
  items: { foodId: string; quantity: number }[]
  requestedSauces: string[]
  hasDuaChua: boolean
  status: string
  createdAt: number
  patienceMs: number
}

export interface OrderEvaluationResult {
  coinsEarned: number
  xpEarned: number
  satisfactionScore: number
  perfectCount: number
  acceptableCount: number
  undercookedCount: number
  overcookedCount: number
}

const DEFAULT_UPGRADES: Record<string, number> = {
  pan_capacity: 1,
  oil_thermostat: 1,
  awning_comfort: 1,
  speed_tongs: 1,
  tray_expansion: 1,
}

/**
 * Server-authoritative evaluation of an order run.
 * Pure deterministic calculation based on catalog values, cooking quality, sauces, and patience.
 */
export function evaluateOrderServerSide(
  order: ActiveOrderData,
  servedItems: { foodId: string; state: 'raw' | 'cooking' | 'perfect' | 'overcooked' }[],
  appliedSauces: string[] = [],
  hasDuaChua = false,
): OrderEvaluationResult {
  let totalCoins = 0
  let totalXp = 0
  let perfectCount = 0
  let acceptableCount = 0
  let undercookedCount = 0
  let overcookedCount = 0

  const remainingServed = [...servedItems]
  const matchedIndices: number[] = []

  for (const orderItem of order.items) {
    const config = getFoodConfig(orderItem.foodId)
    const basePrice = config?.basePrice ?? 5000
    const baseReward = config?.baseReward ?? 20

    let fulfilled = 0
    for (let i = 0; i < remainingServed.length; i++) {
      if (matchedIndices.includes(i)) continue
      const item = remainingServed[i]

      if (item.foodId === orderItem.foodId) {
        matchedIndices.push(i)
        fulfilled++

        if (item.state === 'perfect') {
          perfectCount++
          totalCoins += Math.round(basePrice * 1.3)
          totalXp += Math.round(baseReward * 1.5)
        } else if (item.state === 'cooking') {
          acceptableCount++
          totalCoins += basePrice
          totalXp += baseReward
        } else if (item.state === 'raw') {
          undercookedCount++
        } else if (item.state === 'overcooked') {
          overcookedCount++
        }

        if (fulfilled >= orderItem.quantity) break
      }
    }
  }

  // 1. Cook Score (0 - 50 pts)
  const totalCount = matchedIndices.length || 1
  const perfectRatio = perfectCount / totalCount
  let cookScore = Math.round(perfectRatio * 50)
  if (undercookedCount > 0) cookScore = Math.max(0, cookScore - 25)
  if (overcookedCount > 0) cookScore = Math.max(0, cookScore - 30)

  // 2. Sauce Score (0 - 30 pts)
  let sauceScore = 20
  if (order.requestedSauces.length > 0) {
    let matchedSauces = 0
    for (const sauce of order.requestedSauces) {
      if (appliedSauces.includes(sauce)) matchedSauces++
    }
    const sauceRatio = matchedSauces / order.requestedSauces.length
    sauceScore = Math.round(sauceRatio * 30)
  }
  if (order.hasDuaChua) {
    if (hasDuaChua) {
      sauceScore = Math.min(30, sauceScore + 5)
    } else {
      sauceScore = Math.max(0, sauceScore - 10)
    }
  }

  // 3. Speed Score (0 - 20 pts)
  const elapsed = Date.now() - order.createdAt
  const remainingRatio = Math.max(0, 1 - elapsed / order.patienceMs)
  const speedScore = Math.round(remainingRatio * 20)

  const satisfactionScore = Math.max(0, Math.min(100, cookScore + sauceScore + speedScore))

  // Tip bonus (+25%) if satisfaction >= 80%
  if (satisfactionScore >= 80) {
    totalCoins = Math.round(totalCoins * 1.25)
  }

  return {
    coinsEarned: totalCoins,
    xpEarned: totalXp,
    satisfactionScore,
    perfectCount,
    acceptableCount,
    undercookedCount,
    overcookedCount,
  }
}

// In-Memory fallback store for environments where DATABASE_URL is not yet connected (e.g. testing/preview)
class MemoryStore {
  players: Map<string, { id: string; displayName: string; isGuest: boolean }> = new Map()
  sessions: Map<string, { id: string; playerId: string; sessionToken: string; expiresAt: Date }> =
    new Map()
  progress: Map<
    string,
    { id: string; playerId: string; coins: number; level: number; xp: number; reputation: number }
  > = new Map()
  unlocks: Map<string, string[]> = new Map() // playerId -> foodId[]
  upgrades: Map<string, Map<string, number>> = new Map() // playerId -> (upgradeKey -> tier)
  stats: Map<
    string,
    {
      ordersServed: number
      perfectItemsFried: number
      totalCoinsEarned: number
    }
  > = new Map()
  achievements: Map<string, { id: string; claimed: boolean }[]> = new Map()
  activeOrders: Map<
    string,
    {
      id: string
      playerId: string
      itemsJson: string
      requestedSaucesJson: string
      hasDuaChua: boolean
      status: string
      createdAt: Date
      patienceMs: number
    }
  > = new Map()
  orderRuns: Map<
    string,
    {
      id: string
      playerId: string
      idempotencyKey: string
      itemsJson: string
      coinsAwarded: number
      xpAwarded: number
    }
  > = new Map()

  /**
   * Runs a state mutation synchronously inside an atomic transaction snapshot.
   * If any exception is thrown, state is cleanly rolled back to its pre-transaction state.
   */
  runInTransaction<T>(action: () => T): T {
    const playersSnap = new Map(this.players)
    const sessionsSnap = new Map(this.sessions)
    const progressSnap = new Map(Array.from(this.progress.entries()).map(([k, v]) => [k, { ...v }]))
    const unlocksSnap = new Map(Array.from(this.unlocks.entries()).map(([k, v]) => [k, [...v]]))
    const upgradesSnap = new Map(
      Array.from(this.upgrades.entries()).map(([k, v]) => [k, new Map(v)]),
    )
    const statsSnap = new Map(Array.from(this.stats.entries()).map(([k, v]) => [k, { ...v }]))
    const achSnap = new Map(
      Array.from(this.achievements.entries()).map(([k, v]) => [k, v.map((item) => ({ ...item }))]),
    )
    const ordersSnap = new Map(this.activeOrders)
    const runsSnap = new Map(this.orderRuns)

    try {
      return action()
    } catch (err) {
      this.players = playersSnap
      this.sessions = sessionsSnap
      this.progress = progressSnap
      this.unlocks = unlocksSnap
      this.upgrades = upgradesSnap
      this.stats = statsSnap
      this.achievements = achSnap
      this.activeOrders = ordersSnap
      this.orderRuns = runsSnap
      throw err
    }
  }

  reset() {
    this.players.clear()
    this.sessions.clear()
    this.progress.clear()
    this.unlocks.clear()
    this.upgrades.clear()
    this.stats.clear()
    this.achievements.clear()
    this.activeOrders.clear()
    this.orderRuns.clear()
  }
}

const memStore = new MemoryStore()

export class PlayerRepository {
  /**
   * Generates a new guest player with initial progress and starter food unlocks.
   */
  static async createGuestPlayer(): Promise<CompletePlayerState> {
    const db = getDb()
    const playerId = generateRandomUUID()
    const sessionToken = `sess_${generateRandomHex(24)}`
    const displayName = `Khách #${Math.floor(1000 + Math.random() * 9000)}`
    const starterFoods = ['fish_ball_classic', 'beef_ball_classic', 'sausage_red', 'fish_tofu']
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    if (db) {
      // 1. Insert player
      await db.insert(players).values({
        id: playerId,
        displayName,
        isGuest: true,
      })

      // 2. Insert session
      await db.insert(playerSessions).values({
        id: generateRandomUUID(),
        playerId,
        sessionToken,
        expiresAt,
      })

      // 3. Insert initial progress (10,000 đ starter capital)
      await db.insert(playerProgress).values({
        id: generateRandomUUID(),
        playerId,
        coins: 10000,
        level: 1,
        xp: 0,
        reputation: 100,
      })

      // 4. Insert starter food unlocks
      for (const foodId of starterFoods) {
        await db.insert(playerFoodUnlocks).values({
          id: generateRandomUUID(),
          playerId,
          foodId,
        })
      }

      // 5. Insert starter upgrades
      for (const [key, tier] of Object.entries(DEFAULT_UPGRADES)) {
        await db.insert(playerUpgrades).values({
          id: generateRandomUUID(),
          playerId,
          upgradeKey: key,
          tier,
        })
      }

      // 6. Insert initial stats
      await db.insert(playerStats).values({
        id: generateRandomUUID(),
        playerId,
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      })
    } else {
      // In-memory fallback
      memStore.players.set(playerId, { id: playerId, displayName, isGuest: true })
      memStore.sessions.set(sessionToken, {
        id: generateRandomUUID(),
        playerId,
        sessionToken,
        expiresAt,
      })
      memStore.progress.set(playerId, {
        id: generateRandomUUID(),
        playerId,
        coins: 10000,
        level: 1,
        xp: 0,
        reputation: 100,
      })
      memStore.unlocks.set(playerId, [...starterFoods])
      const initialUpgrades = new Map<string, number>()
      for (const [k, v] of Object.entries(DEFAULT_UPGRADES)) {
        initialUpgrades.set(k, v)
      }
      memStore.upgrades.set(playerId, initialUpgrades)
      memStore.stats.set(playerId, {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      })
      memStore.achievements.set(playerId, [])
    }

    return this.getPlayerBySession(sessionToken) as Promise<CompletePlayerState>
  }

  /**
   * Retrieves full player state by session token.
   */
  static async getPlayerBySession(sessionToken: string): Promise<CompletePlayerState | null> {
    const db = getDb()

    if (db) {
      // Find valid session
      const sessionResult = await db
        .select()
        .from(playerSessions)
        .where(eq(playerSessions.sessionToken, sessionToken))
        .limit(1)

      if (sessionResult.length === 0) return null
      const session = sessionResult[0]
      if (new Date() > new Date(session.expiresAt)) return null

      // Fetch player info
      const playerResult = await db
        .select()
        .from(players)
        .where(eq(players.id, session.playerId))
        .limit(1)
      if (playerResult.length === 0) return null
      const player = playerResult[0]

      // Fetch progress
      const progressResult = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.playerId, player.id))
        .limit(1)
      const progress = progressResult[0] || { coins: 0, level: 1, xp: 0, reputation: 100 }

      // Fetch unlocked foods
      const unlocksResult = await db
        .select()
        .from(playerFoodUnlocks)
        .where(eq(playerFoodUnlocks.playerId, player.id))
      const unlockedFoods = unlocksResult.map((u) => u.foodId)

      // Fetch upgrades
      const upgradesResult = await db
        .select()
        .from(playerUpgrades)
        .where(eq(playerUpgrades.playerId, player.id))
      const upgrades: Record<string, number> = { ...DEFAULT_UPGRADES }
      for (const u of upgradesResult) {
        upgrades[u.upgradeKey] = u.tier
      }

      // Fetch stats
      const statsResult = await db
        .select()
        .from(playerStats)
        .where(eq(playerStats.playerId, player.id))
        .limit(1)
      const st = statsResult[0] || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      }

      let upgradesPurchased = 0
      for (const [k, v] of Object.entries(upgrades)) {
        const def = DEFAULT_UPGRADES[k] ?? 1
        if (v > def) upgradesPurchased += v - def
      }

      // Fetch achievements
      const achievementsResult = await db
        .select()
        .from(playerAchievements)
        .where(eq(playerAchievements.playerId, player.id))

      const unlockedAchievements = achievementsResult.map((a) => a.achievementId)
      const claimedAchievements = achievementsResult
        .filter((a) => a.claimed)
        .map((a) => a.achievementId)

      return {
        player: {
          id: player.id,
          displayName: player.displayName,
          isGuest: player.isGuest,
        },
        progress: {
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation,
        },
        unlockedFoods,
        sessionToken,
        upgrades,
        stats: {
          ordersServed: st.ordersServed,
          perfectItemsFried: st.perfectItemsFried,
          totalCoinsEarned: st.totalCoinsEarned,
          foodsUnlockedCount: unlockedFoods.length,
          upgradesPurchasedCount: upgradesPurchased,
        },
        unlockedAchievements,
        claimedAchievements,
      }
    } else {
      // In-memory fallback
      const session = memStore.sessions.get(sessionToken)
      if (!session || new Date() > session.expiresAt) return null

      const player = memStore.players.get(session.playerId)
      if (!player) return null

      const progress = memStore.progress.get(player.id) || {
        id: 'mock',
        playerId: player.id,
        coins: 0,
        level: 1,
        xp: 0,
        reputation: 100,
      }
      const unlocks = memStore.unlocks.get(player.id) || []
      const upgMap = memStore.upgrades.get(player.id) || new Map()

      const upgrades: Record<string, number> = { ...DEFAULT_UPGRADES }
      for (const [k, v] of upgMap.entries()) {
        upgrades[k] = v
      }

      let upgradesPurchased = 0
      for (const [k, v] of Object.entries(upgrades)) {
        const def = DEFAULT_UPGRADES[k] ?? 1
        if (v > def) upgradesPurchased += v - def
      }

      const st = memStore.stats.get(player.id) || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      }

      const achList = memStore.achievements.get(player.id) || []
      const unlockedAchievements = achList.map((a) => a.id)
      const claimedAchievements = achList.filter((a) => a.claimed).map((a) => a.id)

      return {
        player: {
          id: player.id,
          displayName: player.displayName,
          isGuest: player.isGuest,
        },
        progress: {
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation,
        },
        unlockedFoods: [...unlocks],
        sessionToken,
        upgrades,
        stats: {
          ordersServed: st.ordersServed,
          perfectItemsFried: st.perfectItemsFried,
          totalCoinsEarned: st.totalCoinsEarned,
          foodsUnlockedCount: unlocks.length,
          upgradesPurchasedCount: upgradesPurchased,
        },
        unlockedAchievements,
        claimedAchievements,
      }
    }
  }

  /**
   * Creates a server-authoritative active order for the player.
   * Validates that all items are among the player's unlocked foods.
   */
  static async createActiveOrder(
    playerId: string,
    preferredItems?: { foodId: string; quantity: number }[],
  ): Promise<ActiveOrderData> {
    const db = getDb()

    // 1. Fetch unlocked foods for this player
    let unlockedFoodIds: string[] = []
    if (db) {
      const rows = await db
        .select()
        .from(playerFoodUnlocks)
        .where(eq(playerFoodUnlocks.playerId, playerId))
      unlockedFoodIds = rows.map((r) => r.foodId)
    } else {
      unlockedFoodIds = memStore.unlocks.get(playerId) || [
        'fish_ball_classic',
        'beef_ball_classic',
        'sausage_red',
        'fish_tofu',
      ]
    }

    if (unlockedFoodIds.length === 0) {
      unlockedFoodIds = ['fish_ball_classic', 'beef_ball_classic', 'sausage_red', 'fish_tofu']
    }

    let items: { foodId: string; quantity: number }[] = []

    if (preferredItems && preferredItems.length > 0) {
      for (const it of preferredItems) {
        if (!unlockedFoodIds.includes(it.foodId)) {
          throw new Error(`FOOD_NOT_UNLOCKED: ${it.foodId}`)
        }
      }
      items = preferredItems
    } else {
      const pool = FULL_FOOD_CATALOG.filter((f) => unlockedFoodIds.includes(f.id))
      const count = Math.min(pool.length, Math.random() < 0.6 ? 1 : 2)
      const shuffled = [...pool].sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, count)
      items = selected.map((f) => ({
        foodId: f.id,
        quantity:
          Math.floor(
            Math.random() * (f.quantityPerOrderRange[1] - f.quantityPerOrderRange[0] + 1),
          ) + f.quantityPerOrderRange[0],
      }))
    }

    const orderId = `ord_${Date.now()}_${generateRandomHex(6)}`
    const requestedSauces = ['tuong_ot']
    const hasDuaChua = Math.random() < 0.5
    const patienceMs = 60000

    const activeOrderObj: ActiveOrderData = {
      id: orderId,
      playerId,
      items,
      requestedSauces,
      hasDuaChua,
      status: 'active',
      createdAt: Date.now(),
      patienceMs,
    }

    if (db) {
      await db.insert(activeOrders).values({
        id: orderId,
        playerId,
        itemsJson: JSON.stringify(items),
        requestedSaucesJson: JSON.stringify(requestedSauces),
        hasDuaChua,
        status: 'active',
        createdAt: new Date(activeOrderObj.createdAt),
        patienceMs,
      })
    } else {
      memStore.activeOrders.set(orderId, {
        id: orderId,
        playerId,
        itemsJson: JSON.stringify(items),
        requestedSaucesJson: JSON.stringify(requestedSauces),
        hasDuaChua,
        status: 'active',
        createdAt: new Date(activeOrderObj.createdAt),
        patienceMs,
      })
    }

    return activeOrderObj
  }

  /**
   * Retrieves an active order by orderId.
   */
  static async getActiveOrder(orderId: string): Promise<ActiveOrderData | null> {
    const db = getDb()
    if (db) {
      const rows = await db.select().from(activeOrders).where(eq(activeOrders.id, orderId)).limit(1)
      if (rows.length === 0) return null
      const row = rows[0]
      return {
        id: row.id,
        playerId: row.playerId,
        items: JSON.parse(row.itemsJson),
        requestedSauces: JSON.parse(row.requestedSaucesJson),
        hasDuaChua: row.hasDuaChua,
        status: row.status,
        createdAt: new Date(row.createdAt).getTime(),
        patienceMs: row.patienceMs,
      }
    } else {
      const row = memStore.activeOrders.get(orderId)
      if (!row) return null
      return {
        id: row.id,
        playerId: row.playerId,
        items: JSON.parse(row.itemsJson),
        requestedSauces: JSON.parse(row.requestedSaucesJson),
        hasDuaChua: row.hasDuaChua,
        status: row.status,
        createdAt: new Date(row.createdAt).getTime(),
        patienceMs: row.patienceMs,
      }
    }
  }

  /**
   * Complete order with server-authoritative reward derivation and idempotency protection.
   * Validates active order, cross-player access, unlocked foods, and derives rewards server-side.
   */
  static async completeOrderWithIdempotency(
    playerId: string,
    orderId: string,
    idempotencyKey: string,
    servedItems: { foodId: string; state: 'raw' | 'cooking' | 'perfect' | 'overcooked' }[],
    appliedSauces: string[] = [],
    hasDuaChua = false,
  ): Promise<{
    wasIdempotent: boolean
    coinsAwarded: number
    xpAwarded: number
    newTotalCoins: number
    newLevel: number
    newXp: number
    stats: {
      ordersServed: number
      perfectItemsFried: number
      totalCoinsEarned: number
      foodsUnlockedCount: number
      upgradesPurchasedCount: number
    }
    newlyUnlockedAchievements: string[]
  }> {
    const db = getDb()

    // 1. Check idempotency key first
    if (db) {
      const existingRun = await db
        .select()
        .from(orderRuns)
        .where(eq(orderRuns.idempotencyKey, idempotencyKey))
        .limit(1)

      if (existingRun.length > 0) {
        const run = existingRun[0]
        const currentProgress = (
          await db
            .select()
            .from(playerProgress)
            .where(eq(playerProgress.playerId, playerId))
            .limit(1)
        )[0]
        const st = (
          await db.select().from(playerStats).where(eq(playerStats.playerId, playerId)).limit(1)
        )[0] || { ordersServed: 0, perfectItemsFried: 0, totalCoinsEarned: 0 }
        const unlocksCount = (
          await db.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, playerId))
        ).length

        return {
          wasIdempotent: true,
          coinsAwarded: run.coinsAwarded,
          xpAwarded: run.xpAwarded,
          newTotalCoins: currentProgress?.coins ?? 0,
          newLevel: currentProgress?.level ?? 1,
          newXp: currentProgress?.xp ?? 0,
          stats: {
            ordersServed: st.ordersServed,
            perfectItemsFried: st.perfectItemsFried,
            totalCoinsEarned: st.totalCoinsEarned,
            foodsUnlockedCount: unlocksCount,
            upgradesPurchasedCount: 0,
          },
          newlyUnlockedAchievements: [],
        }
      }
    } else {
      if (memStore.orderRuns.has(idempotencyKey)) {
        const existing = memStore.orderRuns.get(idempotencyKey)!
        const prog = memStore.progress.get(playerId)!
        const st = memStore.stats.get(playerId) || {
          ordersServed: 0,
          perfectItemsFried: 0,
          totalCoinsEarned: 0,
        }
        const unlocks = memStore.unlocks.get(playerId) || []
        return {
          wasIdempotent: true,
          coinsAwarded: existing.coinsAwarded,
          xpAwarded: existing.xpAwarded,
          newTotalCoins: prog.coins,
          newLevel: prog.level,
          newXp: prog.xp,
          stats: {
            ...st,
            foodsUnlockedCount: unlocks.length,
            upgradesPurchasedCount: 0,
          },
          newlyUnlockedAchievements: [],
        }
      }
    }

    // 2. Fetch and validate active order
    const order = await this.getActiveOrder(orderId)
    if (!order) {
      throw new Error('ORDER_NOT_FOUND')
    }

    if (order.playerId !== playerId) {
      throw new Error('FORBIDDEN_NOT_YOUR_ORDER')
    }

    if (order.status === 'completed') {
      throw new Error('ORDER_ALREADY_COMPLETED')
    }

    // 3. Validate food unlock authorization
    let unlockedFoodIds: string[] = []
    if (db) {
      const rows = await db
        .select()
        .from(playerFoodUnlocks)
        .where(eq(playerFoodUnlocks.playerId, playerId))
      unlockedFoodIds = rows.map((r) => r.foodId)
    } else {
      unlockedFoodIds = memStore.unlocks.get(playerId) || []
    }

    for (const item of servedItems) {
      const config = getFoodConfig(item.foodId)
      if (!config) {
        throw new Error(`INVALID_FOOD_ID: ${item.foodId}`)
      }
      if (!unlockedFoodIds.includes(item.foodId)) {
        throw new Error(`FOOD_NOT_UNLOCKED: ${item.foodId}`)
      }
    }

    // 4. Server-Authoritatively derive rewards
    const evalResult = evaluateOrderServerSide(order, servedItems, appliedSauces, hasDuaChua)
    const coinsAwarded = evalResult.coinsEarned
    const xpAwarded = evalResult.xpEarned
    const perfectCount = evalResult.perfectCount

    // 5. Persist order completion and update progress
    if (db) {
      // Mark active order as completed
      await db.update(activeOrders).set({ status: 'completed' }).where(eq(activeOrders.id, orderId))

      // Insert order run
      await db.insert(orderRuns).values({
        id: generateRandomUUID(),
        playerId,
        idempotencyKey,
        status: 'completed',
        itemsJson: JSON.stringify(servedItems),
        coinsAwarded,
        xpAwarded,
      })

      // Update player progress
      const progRes = await db
        .update(playerProgress)
        .set({
          coins: sql`${playerProgress.coins} + ${coinsAwarded}`,
          xp: sql`${playerProgress.xp} + ${xpAwarded}`,
          level: sql`1 + floor((${playerProgress.xp} + ${xpAwarded}) / 100)`,
          updatedAt: new Date(),
        })
        .where(eq(playerProgress.playerId, playerId))
        .returning({
          coins: playerProgress.coins,
          xp: playerProgress.xp,
          level: playerProgress.level,
        })

      const newProg = progRes[0] || { coins: coinsAwarded, xp: xpAwarded, level: 1 }

      // Update player stats
      await db
        .update(playerStats)
        .set({
          ordersServed: sql`${playerStats.ordersServed} + 1`,
          perfectItemsFried: sql`${playerStats.perfectItemsFried} + ${perfectCount}`,
          totalCoinsEarned: sql`${playerStats.totalCoinsEarned} + ${coinsAwarded}`,
          updatedAt: new Date(),
        })
        .where(eq(playerStats.playerId, playerId))

      const currentStats = (
        await db.select().from(playerStats).where(eq(playerStats.playerId, playerId)).limit(1)
      )[0]

      // Check achievements
      const existingAch = await db
        .select()
        .from(playerAchievements)
        .where(eq(playerAchievements.playerId, playerId))
      const unlockedAchIds = new Set(existingAch.map((a) => a.achievementId))

      const upgradesCount = (
        await db.select().from(playerUpgrades).where(eq(playerUpgrades.playerId, playerId))
      ).filter((u) => u.tier > 1).length

      const statsForCheck = {
        ordersServed: currentStats?.ordersServed ?? 1,
        perfectItemsFried: currentStats?.perfectItemsFried ?? perfectCount,
        totalCoinsEarned: currentStats?.totalCoinsEarned ?? coinsAwarded,
        foodsUnlockedCount: unlockedFoodIds.length,
        upgradesPurchasedCount: upgradesCount,
      }

      const newlyUnlocked: string[] = []
      for (const ach of ACHIEVEMENTS) {
        if (
          !unlockedAchIds.has(ach.id) &&
          checkAchievementUnlocked(ach, statsForCheck, newProg.coins)
        ) {
          unlockedAchIds.add(ach.id)
          newlyUnlocked.push(ach.id)
          try {
            await db.insert(playerAchievements).values({
              id: generateRandomUUID(),
              playerId,
              achievementId: ach.id,
              claimed: false,
            })
          } catch {
            // Safe if duplicate concurrently
          }
        }
      }

      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: newProg.coins,
        newLevel: newProg.level,
        newXp: newProg.xp,
        stats: statsForCheck,
        newlyUnlockedAchievements: newlyUnlocked,
      }
    } else {
      // In-memory fallback
      const activeOrd = memStore.activeOrders.get(orderId)
      if (activeOrd) {
        activeOrd.status = 'completed'
      }

      memStore.orderRuns.set(idempotencyKey, {
        id: generateRandomUUID(),
        playerId,
        idempotencyKey,
        itemsJson: JSON.stringify(servedItems),
        coinsAwarded,
        xpAwarded,
      })

      const prog = memStore.progress.get(playerId) || {
        id: 'mock',
        playerId,
        coins: 0,
        level: 1,
        xp: 0,
        reputation: 100,
      }
      prog.coins += coinsAwarded
      prog.xp += xpAwarded
      prog.level = 1 + Math.floor(prog.xp / 100)
      memStore.progress.set(playerId, prog)

      const currentStats = memStore.stats.get(playerId) || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      }
      currentStats.ordersServed += 1
      currentStats.perfectItemsFried += perfectCount
      currentStats.totalCoinsEarned += coinsAwarded
      memStore.stats.set(playerId, currentStats)

      const achList = memStore.achievements.get(playerId) || []
      const unlockedIds = new Set(achList.map((a) => a.id))

      const upgMap = memStore.upgrades.get(playerId) || new Map()
      let upgradesPurchased = 0
      for (const [k, v] of upgMap.entries()) {
        const def = DEFAULT_UPGRADES[k] ?? 1
        if (v > def) upgradesPurchased += v - def
      }

      const statsForCheck = {
        ordersServed: currentStats.ordersServed,
        perfectItemsFried: currentStats.perfectItemsFried,
        totalCoinsEarned: currentStats.totalCoinsEarned,
        foodsUnlockedCount: unlockedFoodIds.length,
        upgradesPurchasedCount: upgradesPurchased,
      }

      const newlyUnlocked: string[] = []
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedIds.has(ach.id) && checkAchievementUnlocked(ach, statsForCheck, prog.coins)) {
          unlockedIds.add(ach.id)
          newlyUnlocked.push(ach.id)
          achList.push({ id: ach.id, claimed: false })
        }
      }
      memStore.achievements.set(playerId, achList)

      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: prog.coins,
        newLevel: prog.level,
        newXp: prog.xp,
        stats: statsForCheck,
        newlyUnlockedAchievements: newlyUnlocked,
      }
    }
  }

  /**
   * Unlocks a new food item from the shop with atomic database transaction,
   * row locking, balance check, and rollback on failure.
   */
  static async unlockFood(
    playerId: string,
    foodId: string,
    cost: number,
  ): Promise<{ success: boolean; newCoins: number; unlockedFoods: string[] }> {
    const db = getDb()

    if (db) {
      return await db.transaction(async (tx) => {
        // 1. Lock progression row for this player
        const [progress] = await tx
          .select()
          .from(playerProgress)
          .where(eq(playerProgress.playerId, playerId))
          .for('update')

        if (!progress) {
          throw new Error('PLAYER_NOT_FOUND')
        }

        // 2. Lock & verify food is unowned
        const existing = await tx
          .select()
          .from(playerFoodUnlocks)
          .where(
            and(eq(playerFoodUnlocks.playerId, playerId), eq(playerFoodUnlocks.foodId, foodId)),
          )
          .for('update')

        if (existing.length > 0) {
          throw new Error('ALREADY_UNLOCKED')
        }

        // 3. Check balance >= cost
        if (progress.coins < cost) {
          throw new Error('INSUFFICIENT_COINS')
        }

        // 4. Deduct coins atomically
        const newCoins = progress.coins - cost
        await tx
          .update(playerProgress)
          .set({
            coins: newCoins,
            updatedAt: new Date(),
          })
          .where(eq(playerProgress.playerId, playerId))

        // 5. Insert ownership
        await tx.insert(playerFoodUnlocks).values({
          id: generateRandomUUID(),
          playerId,
          foodId,
        })

        // 6. Fetch all unlocked food IDs within the transaction
        const allUnlocks = await tx
          .select()
          .from(playerFoodUnlocks)
          .where(eq(playerFoodUnlocks.playerId, playerId))

        return {
          success: true,
          newCoins,
          unlockedFoods: allUnlocks.map((r) => r.foodId),
        }
      })
    } else {
      // In-memory fallback with atomic transaction and rollback support
      return memStore.runInTransaction(() => {
        const unlocked = memStore.unlocks.get(playerId) || []
        if (unlocked.includes(foodId)) {
          throw new Error('ALREADY_UNLOCKED')
        }

        const prog = memStore.progress.get(playerId)
        if (!prog) {
          throw new Error('PLAYER_NOT_FOUND')
        }
        if (prog.coins < cost) {
          throw new Error('INSUFFICIENT_COINS')
        }

        prog.coins -= cost
        unlocked.push(foodId)
        memStore.unlocks.set(playerId, unlocked)

        return {
          success: true,
          newCoins: prog.coins,
          unlockedFoods: [...unlocked],
        }
      })
    }
  }

  /**
   * Purchases a cart upgrade with atomic database transaction,
   * row locking, tier and level validation, and rollback on failure.
   */
  static async purchaseUpgrade(
    playerId: string,
    upgradeKey: string,
  ): Promise<{
    success: boolean
    newCoins: number
    upgrades: Record<string, number>
  }> {
    const upgradeConfig = getUpgradeConfig(upgradeKey)
    if (!upgradeConfig) throw new Error('INVALID_UPGRADE_KEY')

    const db = getDb()

    if (db) {
      return await db.transaction(async (tx) => {
        // 1. Lock player progress row
        const [progress] = await tx
          .select()
          .from(playerProgress)
          .where(eq(playerProgress.playerId, playerId))
          .for('update')

        if (!progress) throw new Error('PLAYER_NOT_FOUND')

        // 2. Lock player upgrade row for this upgradeKey
        const existing = await tx
          .select()
          .from(playerUpgrades)
          .where(
            and(eq(playerUpgrades.playerId, playerId), eq(playerUpgrades.upgradeKey, upgradeKey)),
          )
          .for('update')

        const currentTier = existing[0]?.tier ?? DEFAULT_UPGRADES[upgradeKey] ?? 1
        const nextTierConfig = getNextUpgradeTier(upgradeKey, currentTier)
        if (!nextTierConfig) {
          throw new Error('ALREADY_MAX_TIER')
        }

        // 3. Verify level requirement
        if (progress.level < nextTierConfig.levelRequired) {
          throw new Error('LEVEL_TOO_LOW')
        }

        // 4. Check balance >= cost
        if (progress.coins < nextTierConfig.cost) {
          throw new Error('INSUFFICIENT_COINS')
        }

        // 5. Deduct coins
        const newCoins = progress.coins - nextTierConfig.cost
        await tx
          .update(playerProgress)
          .set({
            coins: newCoins,
            updatedAt: new Date(),
          })
          .where(eq(playerProgress.playerId, playerId))

        // 6. Update or insert upgrade tier
        if (existing.length > 0) {
          await tx
            .update(playerUpgrades)
            .set({ tier: nextTierConfig.tier, purchasedAt: new Date() })
            .where(
              and(eq(playerUpgrades.playerId, playerId), eq(playerUpgrades.upgradeKey, upgradeKey)),
            )
        } else {
          await tx.insert(playerUpgrades).values({
            id: generateRandomUUID(),
            playerId,
            upgradeKey,
            tier: nextTierConfig.tier,
          })
        }

        // 7. Get all upgrades within transaction
        const allUpgrades = await tx
          .select()
          .from(playerUpgrades)
          .where(eq(playerUpgrades.playerId, playerId))

        const upgradesMap: Record<string, number> = { ...DEFAULT_UPGRADES }
        for (const u of allUpgrades) {
          upgradesMap[u.upgradeKey] = u.tier
        }

        return {
          success: true,
          newCoins,
          upgrades: upgradesMap,
        }
      })
    } else {
      // In-memory fallback with atomic transaction and rollback support
      return memStore.runInTransaction(() => {
        const upgMap = memStore.upgrades.get(playerId) || new Map()
        const currentTier = upgMap.get(upgradeKey) ?? DEFAULT_UPGRADES[upgradeKey] ?? 1
        const nextTierConfig = getNextUpgradeTier(upgradeKey, currentTier)
        if (!nextTierConfig) {
          throw new Error('ALREADY_MAX_TIER')
        }

        const prog = memStore.progress.get(playerId)
        if (!prog) throw new Error('PLAYER_NOT_FOUND')

        if (prog.level < nextTierConfig.levelRequired) {
          throw new Error('LEVEL_TOO_LOW')
        }

        if (prog.coins < nextTierConfig.cost) {
          throw new Error('INSUFFICIENT_COINS')
        }

        prog.coins -= nextTierConfig.cost
        upgMap.set(upgradeKey, nextTierConfig.tier)
        memStore.upgrades.set(playerId, upgMap)

        const upgradesMap: Record<string, number> = { ...DEFAULT_UPGRADES }
        for (const [k, v] of upgMap.entries()) {
          upgradesMap[k] = v
        }

        return {
          success: true,
          newCoins: prog.coins,
          upgrades: upgradesMap,
        }
      })
    }
  }

  /**
   * Claims an achievement reward with atomic database transaction,
   * row locking, reward crediting, and rollback on failure.
   */
  static async claimAchievement(
    playerId: string,
    achievementId: string,
  ): Promise<{
    success: boolean
    newCoins: number
    newXp: number
    newLevel: number
    claimedAchievements: string[]
  }> {
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId)
    if (!ach) throw new Error('ACHIEVEMENT_NOT_FOUND')

    const db = getDb()

    if (db) {
      return await db.transaction(async (tx) => {
        // 1. Lock achievement row and verify unlocked & unclaimed
        const existing = await tx
          .select()
          .from(playerAchievements)
          .where(
            and(
              eq(playerAchievements.playerId, playerId),
              eq(playerAchievements.achievementId, achievementId),
            ),
          )
          .for('update')

        if (existing.length === 0) {
          throw new Error('ACHIEVEMENT_NOT_UNLOCKED')
        }

        if (existing[0].claimed) {
          throw new Error('ACHIEVEMENT_ALREADY_CLAIMED')
        }

        // 2. Mark claimed = true
        await tx
          .update(playerAchievements)
          .set({ claimed: true })
          .where(eq(playerAchievements.id, existing[0].id))

        // 3. Lock progression row
        const [progress] = await tx
          .select()
          .from(playerProgress)
          .where(eq(playerProgress.playerId, playerId))
          .for('update')

        if (!progress) throw new Error('PLAYER_NOT_FOUND')

        // 4. Calculate rewards and new level
        const newCoins = progress.coins + ach.rewardCoins
        const newXp = progress.xp + ach.rewardXp
        const newLevel = 1 + Math.floor(newXp / 100)

        await tx
          .update(playerProgress)
          .set({
            coins: newCoins,
            xp: newXp,
            level: newLevel,
            updatedAt: new Date(),
          })
          .where(eq(playerProgress.playerId, playerId))

        // 5. Get all claimed achievements
        const allClaimed = await tx
          .select()
          .from(playerAchievements)
          .where(
            and(eq(playerAchievements.playerId, playerId), eq(playerAchievements.claimed, true)),
          )

        return {
          success: true,
          newCoins,
          newXp,
          newLevel,
          claimedAchievements: allClaimed.map((a) => a.achievementId),
        }
      })
    } else {
      // In-memory fallback with atomic transaction and rollback support
      return memStore.runInTransaction(() => {
        const achList = memStore.achievements.get(playerId) || []
        const target = achList.find((a) => a.id === achievementId)
        if (!target) throw new Error('ACHIEVEMENT_NOT_UNLOCKED')
        if (target.claimed) throw new Error('ACHIEVEMENT_ALREADY_CLAIMED')

        target.claimed = true

        const prog = memStore.progress.get(playerId) || {
          id: 'mock',
          playerId,
          coins: 0,
          xp: 0,
          level: 1,
          reputation: 100,
        }
        prog.coins += ach.rewardCoins
        prog.xp += ach.rewardXp
        prog.level = 1 + Math.floor(prog.xp / 100)
        memStore.progress.set(playerId, prog)

        const claimed = achList.filter((a) => a.claimed).map((a) => a.id)
        return {
          success: true,
          newCoins: prog.coins,
          newXp: prog.xp,
          newLevel: prog.level,
          claimedAchievements: claimed,
        }
      })
    }
  }

  static getMemStore(): MemoryStore {
    return memStore
  }
}
