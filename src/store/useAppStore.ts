import { create } from 'zustand'
import { PlayerGameStats } from '@/game/data/achievements'

export type ModalType =
  'none' | 'settings' | 'pause' | 'help' | 'collection' | 'shop' | 'upgrades' | 'achievements'

interface AppState {
  // Player state (display cached from server)
  playerId: string | null
  sessionToken: string | null
  coins: number
  level: number
  xp: number
  reputation: number
  unlockedFoods: string[]
  upgrades: Record<string, number>
  stats: PlayerGameStats
  unlockedAchievements: string[]
  claimedAchievements: string[]

  // Audio / Accessibility settings
  soundEnabled: boolean
  musicEnabled: boolean
  soundVolume: number
  musicVolume: number

  // UI Flow State
  activeModal: ModalType
  isLoading: boolean
  loadingMessage: string
  isOnline: boolean

  // Actions
  initSession: () => Promise<void>
  unlockFood: (foodId: string) => Promise<{ success: boolean; message?: string }>
  purchaseUpgrade: (upgradeKey: string) => Promise<{ success: boolean; message?: string }>
  claimAchievement: (achievementId: string) => Promise<{ success: boolean; message?: string }>
  submitOrderReward: (payload: {
    orderId: string
    items: { foodId: string; state: 'raw' | 'cooking' | 'perfect' | 'overcooked' }[]
    coinsEarned: number
    xpEarned: number
  }) => Promise<{ success: boolean; newCoins: number; newXp: number; newLevel: number }>
  setPlayerStats: (stats: {
    coins?: number
    level?: number
    xp?: number
    reputation?: number
  }) => void
  toggleSound: () => void
  toggleMusic: () => void
  setSoundVolume: (vol: number) => void
  setMusicVolume: (vol: number) => void
  setActiveModal: (modal: ModalType) => void
  setIsLoading: (isLoading: boolean, message?: string) => void
  setIsOnline: (online: boolean) => void
}

const SESSION_STORAGE_KEY = 'xcv_session_token'

export const useAppStore = create<AppState>((set, get) => ({
  playerId: null,
  sessionToken: null,
  coins: 0,
  level: 1,
  xp: 0,
  reputation: 100,
  unlockedFoods: [],
  upgrades: {
    pan_capacity: 1,
    oil_thermostat: 1,
    awning_comfort: 1,
    speed_tongs: 1,
    tray_expansion: 1,
  },
  stats: {
    ordersServed: 0,
    perfectItemsFried: 0,
    totalCoinsEarned: 0,
    foodsUnlockedCount: 4,
    upgradesPurchasedCount: 0,
  },
  unlockedAchievements: [],
  claimedAchievements: [],

  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.5,

  activeModal: 'none',
  isLoading: true,
  loadingMessage: 'Đang chuẩn bị xe cá viên...',
  isOnline: true,

  initSession: async () => {
    try {
      const storedToken =
        typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null

      const headers: Record<string, string> = {}
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`
      }

      const res = await fetch('/api/v1/session/guest', {
        method: 'POST',
        headers,
      })

      if (!res.ok) throw new Error('Không thể khởi tạo phiên chơi')
      const json = await res.json()

      if (json.success && json.data) {
        const {
          player,
          progress,
          sessionToken,
          unlockedFoods,
          upgrades,
          stats,
          unlockedAchievements,
          claimedAchievements,
        } = json.data
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, sessionToken)
        }

        set({
          playerId: player.id,
          sessionToken,
          coins: progress.coins,
          level: progress.level,
          xp: progress.xp,
          reputation: progress.reputation,
          unlockedFoods: unlockedFoods || [],
          upgrades: upgrades || {
            pan_capacity: 1,
            oil_thermostat: 1,
            awning_comfort: 1,
            speed_tongs: 1,
            tray_expansion: 1,
          },
          stats: stats || {
            ordersServed: 0,
            perfectItemsFried: 0,
            totalCoinsEarned: 0,
            foodsUnlockedCount: (unlockedFoods || []).length,
            upgradesPurchasedCount: 0,
          },
          unlockedAchievements: unlockedAchievements || [],
          claimedAchievements: claimedAchievements || [],
          isLoading: false,
        })
      }
    } catch (err) {
      console.warn('Fallback offline mode:', err)
      set({ isLoading: false })
    }
  },

  unlockFood: async (foodId: string) => {
    const { sessionToken, unlockedFoods } = get()
    try {
      const res = await fetch('/api/v1/shop/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
        },
        body: JSON.stringify({ foodId }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        set((state) => ({
          coins: json.data.newCoins,
          unlockedFoods: json.data.unlockedFoods,
          stats: {
            ...state.stats,
            foodsUnlockedCount: json.data.unlockedFoods.length,
          },
        }))
        return { success: true }
      }
      return { success: false, message: json.error?.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ'
      // Local fallback for offline mode
      if (!unlockedFoods.includes(foodId)) {
        set((s) => ({
          unlockedFoods: [...s.unlockedFoods, foodId],
          stats: { ...s.stats, foodsUnlockedCount: s.unlockedFoods.length + 1 },
        }))
        return { success: true }
      }
      return { success: false, message }
    }
  },

  purchaseUpgrade: async (upgradeKey: string) => {
    const { sessionToken, upgrades } = get()
    try {
      const res = await fetch('/api/v1/upgrades/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
        },
        body: JSON.stringify({ upgradeKey }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        set((state) => {
          let count = 0
          for (const [k, tier] of Object.entries(json.data.upgrades)) {
            if (k && (tier as number) > 1) count += (tier as number) - 1
          }
          return {
            coins: json.data.newCoins,
            upgrades: json.data.upgrades,
            stats: {
              ...state.stats,
              upgradesPurchasedCount: count,
            },
          }
        })
        return { success: true }
      }
      return { success: false, message: json.error?.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ'
      // Local fallback for offline mode
      const curTier = upgrades[upgradeKey] ?? 1
      set((s) => ({
        upgrades: { ...s.upgrades, [upgradeKey]: curTier + 1 },
        stats: { ...s.stats, upgradesPurchasedCount: s.stats.upgradesPurchasedCount + 1 },
      }))
      return { success: true, message }
    }
  },

  claimAchievement: async (achievementId: string) => {
    const { sessionToken, unlockedAchievements, claimedAchievements } = get()
    try {
      const res = await fetch('/api/v1/achievements/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
        },
        body: JSON.stringify({ achievementId }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        set({
          coins: json.data.newCoins,
          xp: json.data.newXp,
          level: json.data.newLevel,
          claimedAchievements: json.data.claimedAchievements,
        })
        return { success: true }
      }
      return { success: false, message: json.error?.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ'
      if (
        !claimedAchievements.includes(achievementId) &&
        unlockedAchievements.includes(achievementId)
      ) {
        set((s) => ({
          claimedAchievements: [...s.claimedAchievements, achievementId],
        }))
        return { success: true }
      }
      return { success: false, message }
    }
  },

  submitOrderReward: async (payload) => {
    const { sessionToken, coins, xp, stats, isOnline } = get()
    const idempotencyKey = `ord_${payload.orderId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    if (isOnline) {
      try {
        const res = await fetch('/api/v1/orders/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
          },
          body: JSON.stringify({
            orderId: payload.orderId,
            idempotencyKey,
            items: payload.items,
            coinsEarned: payload.coinsEarned,
            xpEarned: payload.xpEarned,
          }),
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const {
              newTotalCoins,
              newXp,
              newLevel,
              stats: serverStats,
              newlyUnlockedAchievements,
            } = json.data
            set((s) => ({
              coins: newTotalCoins,
              xp: newXp,
              level: newLevel,
              stats: serverStats || s.stats,
              unlockedAchievements: newlyUnlockedAchievements
                ? Array.from(new Set([...s.unlockedAchievements, ...newlyUnlockedAchievements]))
                : s.unlockedAchievements,
            }))
            return {
              success: true,
              newCoins: newTotalCoins,
              newXp,
              newLevel,
            }
          }
        }
      } catch (err) {
        console.warn('Network error during reward sync:', err)
      }
    }

    // Local fallback if offline
    const updatedCoins = coins + payload.coinsEarned
    const updatedXp = xp + payload.xpEarned
    const updatedLevel = 1 + Math.floor(updatedXp / 100)
    const perfectCount = payload.items.filter((it) => it.state === 'perfect').length
    set({
      coins: updatedCoins,
      xp: updatedXp,
      level: updatedLevel,
      stats: {
        ...stats,
        ordersServed: stats.ordersServed + 1,
        perfectItemsFried: stats.perfectItemsFried + perfectCount,
        totalCoinsEarned: stats.totalCoinsEarned + payload.coinsEarned,
      },
    })
    return {
      success: true,
      newCoins: updatedCoins,
      newXp: updatedXp,
      newLevel: updatedLevel,
    }
  },

  setPlayerStats: (stats) =>
    set((state) => ({
      coins: stats.coins ?? state.coins,
      level: stats.level ?? state.level,
      xp: stats.xp ?? state.xp,
      reputation: stats.reputation ?? state.reputation,
    })),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

  setSoundVolume: (vol) => set({ soundVolume: Math.max(0, Math.min(1, vol)) }),

  setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(1, vol)) }),

  setActiveModal: (modal) => set({ activeModal: modal }),

  setIsLoading: (isLoading, message) =>
    set((state) => ({
      isLoading,
      loadingMessage: message ?? state.loadingMessage,
    })),

  setIsOnline: (online) => set({ isOnline: online }),
}))
