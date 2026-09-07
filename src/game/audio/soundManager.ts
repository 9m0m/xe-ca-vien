import { useAppStore } from '@/store/useAppStore'

/**
 * Web Audio Procedural Sound Engine for Xe Cá Viên
 * Produces authentic Vietnamese street-food cart sound effects without external audio files:
 * - Sizzling oil frying noise loop
 * - Hot oil drop splash
 * - Stainless steel tongs scooping clink
 * - Squeeze bottle squirt
 * - Cash register / coin reward chime
 * - Defect / warning thud
 */
class SoundManager {
  private ctx: AudioContext | null = null
  private fryingNode: AudioBufferSourceNode | null = null
  private fryingGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private isFryingPlaying = false

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
        this.masterGain = this.ctx.createGain()
        this.masterGain.connect(this.ctx.destination)
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public getVolume(): number {
    const { soundEnabled, soundVolume } = useAppStore.getState()
    return soundEnabled ? soundVolume : 0
  }

  /**
   * Continuous simmering/frying oil sound synthesis using filtered pink noise + crackle
   */
  public startFryingLoop(): void {
    if (this.isFryingPlaying) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const vol = this.getVolume()
    if (vol <= 0) return

    try {
      // 2 seconds looping pink noise buffer with sizzling crackle
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let b0 = 0,
        b1 = 0,
        b2 = 0

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        let pink = b0 + b1 + b2 + white * 0.5362

        // Occasional hot oil crackle pops
        if (Math.random() < 0.003) {
          pink += (Math.random() * 2 - 1) * 1.8
        }
        data[i] = pink * 0.12
      }

      this.fryingNode = ctx.createBufferSource()
      this.fryingNode.buffer = buffer
      this.fryingNode.loop = true

      // Bandpass filter centered around 1800Hz for sizzling oil tone
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1800
      filter.Q.value = 0.8

      this.fryingGain = ctx.createGain()
      this.fryingGain.gain.setValueAtTime(vol * 0.35, ctx.currentTime)

      this.fryingNode.connect(filter)
      filter.connect(this.fryingGain)
      this.fryingGain.connect(this.masterGain)

      this.fryingNode.start(0)
      this.isFryingPlaying = true
    } catch {
      // Audio autoplay policy handled gracefully
    }
  }

  public updateFryingVolume(): void {
    if (!this.fryingGain || !this.ctx) return
    const vol = this.getVolume()
    this.fryingGain.gain.setValueAtTime(vol * 0.35, this.ctx.currentTime)
  }

  public stopFryingLoop(): void {
    if (!this.isFryingPlaying) return
    try {
      this.fryingNode?.stop()
      this.fryingNode?.disconnect()
      this.fryingNode = null
      this.isFryingPlaying = false
    } catch {
      this.isFryingPlaying = false
    }
  }

  /**
   * Sizzling drop splash sound when food drops into boiling oil
   */
  public playDropSplash(): void {
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return
    const vol = this.getVolume()
    if (vol <= 0) return

    try {
      const duration = 0.15
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04))
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(3200, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.6, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)

      noise.start(ctx.currentTime)
    } catch {
      // Safe fallback
    }
  }

  /**
   * Resonant stainless steel tongs clink sound
   */
  public playScoop(): void {
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return
    const vol = this.getVolume()
    if (vol <= 0) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1480, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.14)

      gain.gain.setValueAtTime(vol * 0.45, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.14)
    } catch {
      // Safe fallback
    }
  }

  /**
   * Tactile sauce squeeze bottle squirt chirp
   */
  public playSauceSquirt(): void {
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return
    const vol = this.getVolume()
    if (vol <= 0) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(420, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(680, ctx.currentTime + 0.08)

      gain.gain.setValueAtTime(vol * 0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    } catch {
      // Safe fallback
    }
  }

  /**
   * Two-tone golden coin bell chime upon order completion
   */
  public playCashChime(): void {
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return
    const vol = this.getVolume()
    if (vol <= 0) return

    try {
      const now = ctx.currentTime
      // Note 1 (C6 - 1046.5 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(1046.5, now)
      gain1.gain.setValueAtTime(vol * 0.5, now)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      osc1.connect(gain1)
      gain1.connect(this.masterGain)
      osc1.start(now)
      osc1.stop(now + 0.25)

      // Note 2 (E6 - 1318.5 Hz)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1318.5, now + 0.08)
      gain2.gain.setValueAtTime(vol * 0.55, now + 0.08)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      osc2.connect(gain2)
      gain2.connect(this.masterGain)
      osc2.start(now + 0.08)
      osc2.stop(now + 0.4)
    } catch {
      // Safe fallback
    }
  }

  /**
   * Low dull thud sound on incorrect order or defect
   */
  public playError(): void {
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return
    const vol = this.getVolume()
    if (vol <= 0) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(160, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2)

      gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

      osc.connect(gain)
      gain.connect(this.masterGain)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch {
      // Safe fallback
    }
  }
}

export const soundManager = new SoundManager()
