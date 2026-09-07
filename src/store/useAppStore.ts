import { create } from 'zustand'

export type ModalType = 'none' | 'settings' | 'pause' | 'help'

interface AppState {
  // Player state (display cached from server)
  coins: number
  level: number
  xp: number
  reputation: number
  guestSessionId: string | null

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
  setPlayerStats: (stats: {
    coins?: number
    level?: number
    xp?: number
    reputation?: number
  }) => void
  setGuestSessionId: (id: string | null) => void
  toggleSound: () => void
  toggleMusic: () => void
  setSoundVolume: (vol: number) => void
  setMusicVolume: (vol: number) => void
  setActiveModal: (modal: ModalType) => void
  setIsLoading: (isLoading: boolean, message?: string) => void
  setIsOnline: (online: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  coins: 0,
  level: 1,
  xp: 0,
  reputation: 100,
  guestSessionId: null,

  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.5,

  activeModal: 'none',
  isLoading: true,
  loadingMessage: 'Đang chuẩn bị xe cá viên...',
  isOnline: true,

  setPlayerStats: (stats) =>
    set((state) => ({
      coins: stats.coins ?? state.coins,
      level: stats.level ?? state.level,
      xp: stats.xp ?? state.xp,
      reputation: stats.reputation ?? state.reputation,
    })),

  setGuestSessionId: (id) => set({ guestSessionId: id }),

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
