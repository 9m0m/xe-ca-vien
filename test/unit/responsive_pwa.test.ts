import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { useAppStore } from '@/store/useAppStore'

describe('PWA Manifest & Assets', () => {
  const publicDir = path.join(process.cwd(), 'public')
  const manifestPath = path.join(publicDir, 'manifest.webmanifest')
  const swPath = path.join(publicDir, 'sw.js')

  it('contains valid manifest.webmanifest with required PWA metadata', () => {
    expect(fs.existsSync(manifestPath)).toBe(true)
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw)

    expect(manifest.name).toBe('Xe Cá Viên — Tiệm Cá Viên Chiên Vỉa Hè')
    expect(manifest.short_name).toBe('Xe Cá Viên')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBe('#0f172a')
    expect(manifest.background_color).toBe('#0f172a')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)

    // Verify icons exist on disk
    for (const icon of manifest.icons) {
      const iconPath = path.join(publicDir, icon.src.replace(/^\//, ''))
      expect(fs.existsSync(iconPath)).toBe(true)
    }
  })

  it('contains valid Service Worker script handling install, activate, and fetch', () => {
    expect(fs.existsSync(swPath)).toBe(true)
    const swContent = fs.readFileSync(swPath, 'utf-8')

    expect(swContent).toContain("addEventListener('install'")
    expect(swContent).toContain("addEventListener('activate'")
    expect(swContent).toContain("addEventListener('fetch'")
    expect(swContent).toContain('caches.open')
    expect(swContent).toContain('skipWaiting()')
    expect(swContent).toContain('clients.claim()')
  })
})

describe('Offline / Reconnect UX Store State', () => {
  beforeEach(() => {
    useAppStore.setState({ isOnline: true })
  })

  it('updates online status when setIsOnline is invoked', () => {
    expect(useAppStore.getState().isOnline).toBe(true)

    useAppStore.getState().setIsOnline(false)
    expect(useAppStore.getState().isOnline).toBe(false)

    useAppStore.getState().setIsOnline(true)
    expect(useAppStore.getState().isOnline).toBe(true)
  })

  it('falls back to local balance updates seamlessly when offline in submitOrderReward', async () => {
    useAppStore.setState({
      coins: 1000,
      xp: 50,
      level: 1,
      isOnline: false,
    })

    const res = await useAppStore.getState().submitOrderReward({
      orderId: 'test_order_offline',
      items: [{ foodId: 'fish_ball_classic', state: 'perfect' }],
      coinsEarned: 250,
      xpEarned: 60,
    })

    expect(res.success).toBe(true)
    expect(res.newCoins).toBe(1250)
    expect(res.newXp).toBe(110)
    expect(res.newLevel).toBe(2) // 1 + floor(110 / 100) = 2

    expect(useAppStore.getState().coins).toBe(1250)
    expect(useAppStore.getState().level).toBe(2)
  })
})
