import { eq } from 'drizzle-orm'
import { getDb } from './client'
import { players, playerSessions, playerProgress, playerFoodUnlocks, orderRuns } from './schema'
import crypto from 'crypto'

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
    }

    return {
      player: { id: playerId, displayName, isGuest: true },
      progress: { coins: 10000, level: 1, xp: 0, reputation: 100 },
      unlockedFoods: starterFoods,
      sessionToken,
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
      }
    }
  }

  /**
   * Complete order with idempotency protection.
   * If idempotencyKey exists, returns previous reward without double awarding.
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
  }> {
    const db = getDb()

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

        return {
          wasIdempotent: true,
          coinsAwarded: existing[0].coinsAwarded,
          xpAwarded: existing[0].xpAwarded,
          newTotalCoins: currentProgress?.coins ?? 0,
          newLevel: currentProgress?.level ?? 1,
          newXp: currentProgress?.xp ?? 0,
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

      // Fetch and update progress
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

      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: newCoins,
        newLevel,
        newXp,
      }
    } else {
      // In-memory fallback
      if (memStore.orderRuns.has(idempotencyKey)) {
        const existing = memStore.orderRuns.get(idempotencyKey)!
        const prog = memStore.progress.get(playerId)!
        return {
          wasIdempotent: true,
          coinsAwarded: existing.coinsAwarded,
          xpAwarded: existing.xpAwarded,
          newTotalCoins: prog.coins,
          newLevel: prog.level,
          newXp: prog.xp,
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

      return {
        wasIdempotent: false,
        coinsAwarded,
        xpAwarded,
        newTotalCoins: prog.coins,
        newLevel: prog.level,
        newXp: prog.xp,
      }
    }
  }
}
