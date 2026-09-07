import { describe, it, expect, beforeEach, vi } from 'vitest'
import { soundManager } from '@/game/audio/soundManager'
import { triggerHaptic } from '@/game/systems/haptics'
import { isReducedMotionPreferred, getAnimationDuration } from '@/game/systems/accessibility'
import { useAppStore } from '@/store/useAppStore'

describe('SoundManager', () => {
  beforeEach(() => {
    useAppStore.setState({ soundEnabled: true, soundVolume: 0.8 })
  })

  it('reports correct volume based on store settings', () => {
    expect(soundManager.getVolume()).toBe(0.8)

    useAppStore.setState({ soundEnabled: false })
    expect(soundManager.getVolume()).toBe(0)

    useAppStore.setState({ soundEnabled: true, soundVolume: 0.5 })
    expect(soundManager.getVolume()).toBe(0.5)
  })

  it('safely handles procedural sound methods without crash when AudioContext is missing or mockable', () => {
    expect(() => soundManager.playDropSplash()).not.toThrow()
    expect(() => soundManager.playScoop()).not.toThrow()
    expect(() => soundManager.playSauceSquirt()).not.toThrow()
    expect(() => soundManager.playCashChime()).not.toThrow()
    expect(() => soundManager.playError()).not.toThrow()
    expect(() => soundManager.startFryingLoop()).not.toThrow()
    expect(() => soundManager.updateFryingVolume()).not.toThrow()
    expect(() => soundManager.stopFryingLoop()).not.toThrow()
  })

  it('does not crash when AudioContext is mocked and available', () => {
    const mockAudioNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      Q: { value: 1 },
      loop: false,
    }

    class MockAudioContext {
      sampleRate = 44100
      currentTime = 0
      state = 'running'
      destination = {}
      createGain() {
        return {
          ...mockAudioNode,
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        }
      }
      createBuffer(channels: number, length: number, sampleRate: number) {
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          getChannelData: () => new Float32Array(length),
        }
      }
      createBufferSource() {
        return { ...mockAudioNode }
      }
      createBiquadFilter() {
        return {
          ...mockAudioNode,
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        }
      }
      createOscillator() {
        return { ...mockAudioNode }
      }
      resume() {
        return Promise.resolve()
      }
    }

    vi.stubGlobal('AudioContext', MockAudioContext)

    expect(() => soundManager.playDropSplash()).not.toThrow()
    expect(() => soundManager.playScoop()).not.toThrow()
    expect(() => soundManager.playSauceSquirt()).not.toThrow()
    expect(() => soundManager.playCashChime()).not.toThrow()
    expect(() => soundManager.playError()).not.toThrow()
    expect(() => soundManager.startFryingLoop()).not.toThrow()
    expect(() => soundManager.stopFryingLoop()).not.toThrow()

    vi.unstubAllGlobals()
  })
})

describe('Haptics System', () => {
  it('returns false if navigator.vibrate is unsupported', () => {
    const originalVibrate = navigator.vibrate
    // @ts-expect-error test deleting vibrate
    delete navigator.vibrate

    expect(triggerHaptic('light')).toBe(false)
    expect(triggerHaptic('medium')).toBe(false)
    expect(triggerHaptic('success')).toBe(false)
    expect(triggerHaptic('warning')).toBe(false)

    if (originalVibrate) {
      navigator.vibrate = originalVibrate
    }
  })

  it('calls navigator.vibrate with correct vibration patterns', () => {
    const vibrateMock = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true,
    })

    expect(triggerHaptic('light')).toBe(true)
    expect(vibrateMock).toHaveBeenCalledWith(12)

    expect(triggerHaptic('medium')).toBe(true)
    expect(vibrateMock).toHaveBeenCalledWith(20)

    expect(triggerHaptic('success')).toBe(true)
    expect(vibrateMock).toHaveBeenCalledWith([20, 40, 30])

    expect(triggerHaptic('warning')).toBe(true)
    expect(vibrateMock).toHaveBeenCalledWith([40, 50, 40])
  })
})

describe('Accessibility & Reduced Motion', () => {
  it('detects reduced motion preferences correctly', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(isReducedMotionPreferred()).toBe(true)
    expect(getAnimationDuration(300)).toBe(0)

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(isReducedMotionPreferred()).toBe(false)
    expect(getAnimationDuration(300)).toBe(300)
  })
})
