import { eq, and } from 'drizzle-orm'
import { getDb } from './client'
import {
  players,
  playerSessions,
  playerProgress,
  playerFoodUnlocks,
  playerUpgrades,
  playerStats,
  playerAchievements,
  orderRuns,
} from './schema'
import crypto from 'crypto'
import { getNextUpgradeTier, getUpgradeConfig } from '../game/data/upgrades'
import { ACHIEVEMENTS, checkAchievementUnlocked } from '../game/data/achievements'

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

const DEFAULT_UPGRADES: Record<string, number> = {
  pan_capacity: 1,
  oil_thermostat: 1,
  awning_comfort: 1,
  speed_tongs: 1,
  tray_expansion: 1,
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
  achievements: Map<string, { id: string; claimed: boolean }[]> = new Map() // playerId -> achievements
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
}

const memStore = new MemoryStore()

export class PlayerRepository {
  /**
   * Generates a new guest player with initial progress and starter food unlocks.
   */
  static async createGuestPlayer(): Promise<CompletePlayerState> {
    const db = getDb()
    const playerId = crypto.randomUUID()
    const sessionToken = `sess_${crypto.randomBytes(24).toString('hex')}`
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
        id: crypto.randomUUID(),
        playerId,
        sessionToken,
        expiresAt,
      })

      // 3. Insert initial progress
      await db.insert(playerProgress).values({
        id: crypto.randomUUID(),
        playerId,
        coins: 10000,
        level: 1,
        xp: 0,
        reputation: 100,
      })

      // 4. Insert starter food unlocks
      for (const foodId of starterFoods) {
        await db.insert(playerFoodUnlocks).values({
          id: crypto.randomUUID(),
          playerId,
          foodId,
        })
      }

      // 5. Insert starter upgrades
      for (const [key, tier] of Object.entries(DEFAULT_UPGRADES)) {
        await db.insert(playerUpgrades).values({
          id: crypto.randomUUID(),
          playerId,
          upgradeKey: key,
          tier,
        })
      }

      // 6. Insert initial stats
      await db.insert(playerStats).values({
        id: crypto.randomUUID(),
        playerId,
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      })
    } else {
      // In-memory fallback
      memStore.players.set(playerId, { id: playerId, displayName, isGuest: true })
      memStore.sessions.set(sessionToken, {
        id: crypto.randomUUID(),
        playerId,
        sessionToken,
        expiresAt,
      })
      memStore.progress.set(playerId, {
        id: crypto.randomUUID(),
        playerId,
        coins: 10000,
        level: 1,
        xp: 0,
        reputation: 100,
      })
      memStore.unlocks.set(playerId, [...starterFoods])
      const upgMap = new Map<string, number>()
      for (const [k, v] of Object.entries(DEFAULT_UPGRADES)) {
        upgMap.set(k, v)
      }
      memStore.upgrades.set(playerId, upgMap)
      memStore.stats.set(playerId, {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      })
      memStore.achievements.set(playerId, [])
    }

    return {
      player: { id: playerId, displayName, isGuest: true },
      progress: { coins: 10000, level: 1, xp: 0, reputation: 100 },
      unlockedFoods: starterFoods,
      sessionToken,
      upgrades: { ...DEFAULT_UPGRADES },
      stats: {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
        foodsUnlockedCount: starterFoods.length,
        upgradesPurchasedCount: 0,
      },
      unlockedAchievements: [],
      claimedAchievements: [],
    }
  }

  /**
   * Retrieves player state by session token.
   */
  static async getPlayerBySession(sessionToken: string): Promise<CompletePlayerState | null> {
    const db = getDb()

    if (db) {
      const sessionResult = await db
        .select()
        .from(playerSessions)
        .where(eq(playerSessions.sessionToken, sessionToken))
        .limit(1)

      if (sessionResult.length === 0) return null
      const session = sessionResult[0]

      if (new Date(session.expiresAt) < new Date()) {
        return null // Session expired
      }

      const playerResult = await db
        .select()
        .from(players)
        .where(eq(players.id, session.playerId))
        .limit(1)
      if (playerResult.length === 0) return null

      const progressResult = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.playerId, session.playerId))
        .limit(1)
      const progress = progressResult[0] || { coins: 0, level: 1, xp: 0, reputation: 100 }

      const unlocksResult = await db
        .select()
        .from(playerFoodUnlocks)
        .where(eq(playerFoodUnlocks.playerId, session.playerId))

      const upgradesResult = await db
        .select()
        .from(playerUpgrades)
        .where(eq(playerUpgrades.playerId, session.playerId))

      const upgradesMap: Record<string, number> = { ...DEFAULT_UPGRADES }
      for (const u of upgradesResult) {
        upgradesMap[u.upgradeKey] = u.tier
      }

      const statsResult = await db
        .select()
        .from(playerStats)
        .where(eq(playerStats.playerId, session.playerId))
        .limit(1)
      const st = statsResult[0] || { ordersServed: 0, perfectItemsFried: 0, totalCoinsEarned: 0 }

      const achievementsResult = await db
        .select()
        .from(playerAchievements)
        .where(eq(playerAchievements.playerId, session.playerId))

      let upgradesPurchased = 0
      for (const [key, tier] of Object.entries(upgradesMap)) {
        const defaultTier = DEFAULT_UPGRADES[key] ?? 1
        if (tier > defaultTier) {
          upgradesPurchased += tier - defaultTier
        }
      }

      const unlockedAchievements = achievementsResult.map((a) => a.achievementId)
      const claimedAchievements = achievementsResult
        .filter((a) => a.claimed)
        .map((a) => a.achievementId)

      return {
        player: playerResult[0],
        progress: {
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation,
        },
        unlockedFoods: unlocksResult.map((u) => u.foodId),
        sessionToken,
        upgrades: upgradesMap,
        stats: {
          ordersServed: st.ordersServed,
          perfectItemsFried: st.perfectItemsFried,
          totalCoinsEarned: st.totalCoinsEarned,
          foodsUnlockedCount: unlocksResult.length,
          upgradesPurchasedCount: upgradesPurchased,
        },
        unlockedAchievements,
        claimedAchievements,
      }
    } else {
      // In-memory fallback
      const session = memStore.sessions.get(sessionToken)
      if (!session || new Date(session.expiresAt) < new Date()) return null

      const player = memStore.players.get(session.playerId)
      if (!player) return null

      const progress = memStore.progress.get(session.playerId) || {
        id: 'mock',
        playerId: player.id,
        coins: 0,
        level: 1,
        xp: 0,
        reputation: 100,
      }
      const unlocks = memStore.unlocks.get(session.playerId) || []

      const upgMap = memStore.upgrades.get(session.playerId) || new Map()
      const upgradesObj: Record<string, number> = { ...DEFAULT_UPGRADES }
      for (const [k, v] of upgMap.entries()) {
        upgradesObj[k] = v
      }

      const st = memStore.stats.get(session.playerId) || {
        ordersServed: 0,
        perfectItemsFried: 0,
        totalCoinsEarned: 0,
      }

      const achList = memStore.achievements.get(session.playerId) || []
      const unlockedAchievements = achList.map((a) => a.id)
      const claimedAchievements = achList.filter((a) => a.claimed).map((a) => a.id)

      let upgradesPurchased = 0
      for (const [key, tier] of Object.entries(upgradesObj)) {
        const defaultTier = DEFAULT_UPGRADES[key] ?? 1
        if (tier > defaultTier) {
          upgradesPurchased += tier - defaultTier
        }
      }

      return {
        player,
        progress: {
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation,
        },
        unlockedFoods: unlocks,
        sessionToken,
        upgrades: upgradesObj,
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
   * Complete order with idempotency protection.
   * Updates stats, unlocks achievements, and awards order rewards safely.
   */
  static async completeOrderWithIdempotency(
    playerId: string,
    idempotencyKey: string,
    itemsJson: string,
    coinsAwarded: number,
    xpAwarded: number,
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

    // Parse items to count perfect fries
    let perfectCount = 0
    try {
      const parsedItems = JSON.parse(itemsJson)
      if (Array.isArray(parsedItems)) {
        perfectCount = parsedItems.filter((it: { state?: string }) => it.state === 'perfect').length
      }
    } catch {
      // Ignored if unparseable
    }

    if (db) {
      // Check existing idempotency key
      const existing = await db
        .select()
        .from(orderRuns)
        .where(eq(orderRuns.idempotencyKey, idempotencyKey))
        .limit(1)

      if (existing.length > 0) {
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
          coinsAwarded: existing[0].coinsAwarded,
          xpAwarded: existing[0].xpAwarded,
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

      // Record order run
      await db.insert(orderRuns).values({
        id: crypto.randomUUID(),
        playerId,
        idempotencyKey,
        itemsJson,
        coinsAwarded,
        xpAwarded,
      })

      // Fetch and update progress with order rewards
      const progressList = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.playerId, playerId))
        .limit(1)

      const prog = progressList[0] || { coins: 0, level: 1, xp: 0 }
      const newCoins = prog.coins + coinsAwarded
      const newXp = prog.xp + xpAwarded
      const newLevel = 1 + Math.floor(newXp / 100) // 100 XP per level

      await db
        .update(playerProgress)
        .set({
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(playerProgress.playerId, playerId))

      // Update player stats
      const statsList = await db
        .select()
        .from(playerStats)
        .where(eq(playerStats.playerId, playerId))
        .limit(1)

      let currentStats = statsList[0]
      if (!currentStats) {
        await db.insert(playerStats).values({
          id: crypto.randomUUID(),
          playerId,
          ordersServed: 1,
          perfectItemsFried: perfectCount,
          totalCoinsEarned: coinsAwarded,
        })
        currentStats = {
          id: 'temp',
          playerId,
          ordersServed: 1,
          perfectItemsFried: perfectCount,
          totalCoinsEarned: coinsAwarded,
          updatedAt: new Date(),
        }
      } else {
        const updatedOrders = currentStats.ordersServed + 1
        const updatedPerfect = currentStats.perfectItemsFried + perfectCount
        const updatedTotalCoins = currentStats.totalCoinsEarned + coinsAwarded

        await db
          .update(playerStats)
          .set({
            ordersServed: updatedOrders,
            perfectItemsFried: updatedPerfect,
            totalCoinsEarned: updatedTotalCoins,
            updatedAt: new Date(),
          })
          .where(eq(playerStats.playerId, playerId))

        currentStats = {
          ...currentStats,
          ordersServed: updatedOrders,
          perfectItemsFried: updatedPerfect,
          totalCoinsEarned: updatedTotalCoins,
        }
      }

      // Check achievements
      const existingAch = await db
        .select()
        .from(playerAchievements)
        .where(eq(playerAchievements.playerId, playerId))
      const unlockedIds = new Set(existingAch.map((a) => a.achievementId))

      const unlocksCount = (
        await db.select().from(playerFoodUnlocks).where(eq(playerFoodUnlocks.playerId, playerId))
      ).length

      const upgradesCount = (
        await db.select().from(playerUpgrades).where(eq(playerUpgrades.playerId, playerId))
      ).filter((u) => u.tier > 1).length

      const statsForCheck = {
        ordersServed: currentStats.ordersServed,
        perfectItemsFried: currentStats.perfectItemsFried,
        totalCoinsEarned: currentStats.totalCoinsEarned,
        foodsUnlockedCount: unlocksCount,
        upgradesPurchasedCount: upgradesCount,
      }

      const newlyUnlocked: string[] = []
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedIds.has(ach.id) && checkAchievementUnlocked(ach, statsForCheck, newCoins)) {
          unlockedIds.add(ach.id)
          newlyUnlocked.push(ach.id)
          await db.insert(playerAchievements).values({
            id: crypto.randomUUID(),
            playerId,
            achievementId: ach.id,
            claimed: false,
          })
        }
      }

      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: newCoins,
        newLevel,
        newXp,
        stats: statsForCheck,
        newlyUnlockedAchievements: newlyUnlocked,
      }
    } else {
      // In-memory fallback
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

      memStore.orderRuns.set(idempotencyKey, {
        id: crypto.randomUUID(),
        playerId,
        idempotencyKey,
        itemsJson,
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
      const unlocks = memStore.unlocks.get(playerId) || []

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
        foodsUnlockedCount: unlocks.length,
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
   * Unlocks a new food item from the shop with coin deduction.
   */
  static async unlockFood(
    playerId: string,
    foodId: string,
    cost: number,
  ): Promise<{ success: boolean; newCoins: number; unlockedFoods: string[] }> {
    const db = getDb()

    if (db) {
      // 1. Check if already unlocked
      const existing = await db
        .select()
        .from(playerFoodUnlocks)
        .where(eq(playerFoodUnlocks.playerId, playerId))

      const unlockedIds = existing.map((e) => e.foodId)
      if (unlockedIds.includes(foodId)) {
        throw new Error('ALREADY_UNLOCKED')
      }

      // 2. Check balance
      const progressRes = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.playerId, playerId))
        .limit(1)

      const prog = progressRes[0]
      if (!prog || prog.coins < cost) {
        throw new Error('INSUFFICIENT_COINS')
      }

      // 3. Deduct coins and add unlock
      const newCoins = prog.coins - cost
      await db
        .update(playerProgress)
        .set({ coins: newCoins, updatedAt: new Date() })
        .where(eq(playerProgress.playerId, playerId))

      await db.insert(playerFoodUnlocks).values({
        id: crypto.randomUUID(),
        playerId,
        foodId,
      })

      return {
        success: true,
        newCoins,
        unlockedFoods: [...unlockedIds, foodId],
      }
    } else {
      // In-memory fallback
      const unlocked = memStore.unlocks.get(playerId) || []
      if (unlocked.includes(foodId)) {
        throw new Error('ALREADY_UNLOCKED')
      }

      const prog = memStore.progress.get(playerId)
      if (!prog || prog.coins < cost) {
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
    }
  }

  /**
   * Purchases a cart upgrade with validation against level requirements, max tier, and coin balance.
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
    if (!upgradeConfig) {
      throw new Error('UPGRADE_NOT_FOUND')
    }

    const db = getDb()

    if (db) {
      // 1. Get current upgrade tier
      const existing = await db
        .select()
        .from(playerUpgrades)
        .where(
          and(eq(playerUpgrades.playerId, playerId), eq(playerUpgrades.upgradeKey, upgradeKey)),
        )
        .limit(1)

      const currentTier = existing[0]?.tier ?? DEFAULT_UPGRADES[upgradeKey] ?? 1
      const nextTierConfig = getNextUpgradeTier(upgradeKey, currentTier)
      if (!nextTierConfig) {
        throw new Error('ALREADY_MAX_TIER')
      }

      // 2. Check player progress (level and coins)
      const progressList = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.playerId, playerId))
        .limit(1)

      const prog = progressList[0]
      if (!prog) throw new Error('PLAYER_NOT_FOUND')

      if (prog.level < nextTierConfig.levelRequired) {
        throw new Error('LEVEL_TOO_LOW')
      }

      if (prog.coins < nextTierConfig.cost) {
        throw new Error('INSUFFICIENT_COINS')
      }

      // 3. Deduct coins and update/insert upgrade
      const newCoins = prog.coins - nextTierConfig.cost
      await db
        .update(playerProgress)
        .set({ coins: newCoins, updatedAt: new Date() })
        .where(eq(playerProgress.playerId, playerId))

      if (existing.length > 0) {
        await db
          .update(playerUpgrades)
          .set({ tier: nextTierConfig.tier, purchasedAt: new Date() })
          .where(
            and(eq(playerUpgrades.playerId, playerId), eq(playerUpgrades.upgradeKey, upgradeKey)),
          )
      } else {
        await db.insert(playerUpgrades).values({
          id: crypto.randomUUID(),
          playerId,
          upgradeKey,
          tier: nextTierConfig.tier,
        })
      }

      // Fetch full upgrades map
      const allUpgrades = await db
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
    } else {
      // In-memory fallback
      const upgMap = memStore.upgrades.get(playerId) || new Map<string, number>()
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
    }
  }

  /**
   * Claims an achievement reward.
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
      const records = await db
        .select()
        .from(playerAchievements)
        .where(
          and(
            eq(playerAchievements.playerId, playerId),
            eq(playerAchievements.achievementId, achievementId),
          ),
        )
        .limit(1)

      if (records.length === 0) throw new Error('ACHIEVEMENT_NOT_UNLOCKED')
      if (records[0].claimed) throw new Error('ACHIEVEMENT_ALREADY_CLAIMED')

      await db
        .update(playerAchievements)
        .set({ claimed: true })
        .where(
          and(
            eq(playerAchievements.playerId, playerId),
            eq(playerAchievements.achievementId, achievementId),
          ),
        )

      const progRes = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.playerId, playerId))
        .limit(1)

      const prog = progRes[0] || { coins: 0, xp: 0, level: 1 }
      const newCoins = prog.coins + ach.rewardCoins
      const newXp = prog.xp + ach.rewardXp
      const newLevel = 1 + Math.floor(newXp / 100)

      await db
        .update(playerProgress)
        .set({ coins: newCoins, xp: newXp, level: newLevel, updatedAt: new Date() })
        .where(eq(playerProgress.playerId, playerId))

      const allClaimed = (
        await db
          .select()
          .from(playerAchievements)
          .where(
            and(eq(playerAchievements.playerId, playerId), eq(playerAchievements.claimed, true)),
          )
      ).map((a) => a.achievementId)

      return {
        success: true,
        newCoins,
        newXp,
        newLevel,
        claimedAchievements: allClaimed,
      }
    } else {
      const achList = memStore.achievements.get(playerId) || []
      const found = achList.find((a) => a.id === achievementId)
      if (!found) throw new Error('ACHIEVEMENT_NOT_UNLOCKED')
      if (found.claimed) throw new Error('ACHIEVEMENT_ALREADY_CLAIMED')

      found.claimed = true
      const prog = memStore.progress.get(playerId)!
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
    }
  }
}
