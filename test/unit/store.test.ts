import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../../src/store/useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      coins: 0,
      level: 1,
      xp: 0,
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.8,
      musicVolume: 0.5,
      activeModal: 'none',
      isLoading: true,
    })
  })

  it('should toggle sound and music', () => {
    expect(useAppStore.getState().soundEnabled).toBe(true)
    useAppStore.getState().toggleSound()
    expect(useAppStore.getState().soundEnabled).toBe(false)
    useAppStore.getState().toggleSound()
    expect(useAppStore.getState().soundEnabled).toBe(true)

    expect(useAppStore.getState().musicEnabled).toBe(true)
    useAppStore.getState().toggleMusic()
    expect(useAppStore.getState().musicEnabled).toBe(false)
  })

  it('should clamp volume within 0 and 1', () => {
    useAppStore.getState().setSoundVolume(1.5)
    expect(useAppStore.getState().soundVolume).toBe(1)

    useAppStore.getState().setSoundVolume(-0.5)
    expect(useAppStore.getState().soundVolume).toBe(0)

    useAppStore.getState().setMusicVolume(0.42)
    expect(useAppStore.getState().musicVolume).toBe(0.42)
  })

  it('should update player stats from server sync', () => {
    useAppStore.getState().setPlayerStats({ coins: 50000, level: 3, xp: 240 })
    const state = useAppStore.getState()
    expect(state.coins).toBe(50000)
    expect(state.level).toBe(3)
    expect(state.xp).toBe(240)
  })

  it('should set active modal', () => {
    useAppStore.getState().setActiveModal('settings')
    expect(useAppStore.getState().activeModal).toBe('settings')
    useAppStore.getState().setActiveModal('none')
    expect(useAppStore.getState().activeModal).toBe('none')
  })
})
