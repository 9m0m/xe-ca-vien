import { describe, it, expect } from 'vitest'
import {
  CART_UPGRADES,
  getUpgradeConfig,
  getUpgradeTier,
  getNextUpgradeTier,
} from '../../src/game/data/upgrades'
import {
  ACHIEVEMENTS,
  checkAchievementUnlocked,
  getAchievementProgress,
} from '../../src/game/data/achievements'
import { CookingManager } from '../../src/game/systems/CookingManager'

describe('Cart Upgrades & Progression Unit Tests', () => {
  it('should have valid configuration for all CART_UPGRADES', () => {
    expect(CART_UPGRADES.length).toBeGreaterThanOrEqual(5)

    for (const upgrade of CART_UPGRADES) {
      expect(upgrade.id).toBeTruthy()
      expect(upgrade.nameVi).toBeTruthy()
      expect(upgrade.tiers.length).toBeGreaterThanOrEqual(2)

      // Tier 1 is always starter / free
      expect(upgrade.tiers[0].tier).toBe(1)
      expect(upgrade.tiers[0].cost).toBe(0)

      // Subsequent tiers cost coins and have increasing requirements
      for (let i = 1; i < upgrade.tiers.length; i++) {
        expect(upgrade.tiers[i].cost).toBeGreaterThan(0)
        expect(upgrade.tiers[i].tier).toBe(upgrade.tiers[i - 1].tier + 1)
      }
    }
  })

  it('should resolve upgrade tiers correctly', () => {
    const panConfig = getUpgradeConfig('pan_capacity')
    expect(panConfig).toBeDefined()
    expect(panConfig?.nameVi).toBe('Chảo Dầu Mở Rộng')

    const tier1 = getUpgradeTier('pan_capacity', 1)
    expect(tier1.effectValue).toBe(6)

    const nextTier = getNextUpgradeTier('pan_capacity', 1)
    expect(nextTier).toBeDefined()
    expect(nextTier?.tier).toBe(2)
    expect(nextTier?.cost).toBe(15000)
    expect(nextTier?.effectValue).toBe(8)

    const maxTier = getNextUpgradeTier('pan_capacity', 3)
    expect(maxTier).toBeNull()
  })

  it('should evaluate achievement conditions accurately', () => {
    const firstOrderAch = ACHIEVEMENTS.find((a) => a.id === 'first_order')!
    expect(firstOrderAch).toBeDefined()

    const stats0 = {
      ordersServed: 0,
      perfectItemsFried: 0,
      totalCoinsEarned: 0,
      foodsUnlockedCount: 4,
      upgradesPurchasedCount: 0,
    }
    expect(checkAchievementUnlocked(firstOrderAch, stats0, 10000)).toBe(false)

    const stats1 = { ...stats0, ordersServed: 1 }
    expect(checkAchievementUnlocked(firstOrderAch, stats1, 10000)).toBe(true)

    const progress = getAchievementProgress(firstOrderAch, stats0, 10000)
    expect(progress.current).toBe(0)
    expect(progress.target).toBe(1)
    expect(progress.percentage).toBe(0)

    const progressDone = getAchievementProgress(firstOrderAch, stats1, 10000)
    expect(progressDone.percentage).toBe(100)
  })

  it('should dynamically expand cooking slots and modifiers in CookingManager', () => {
    const manager = new CookingManager(6)
    expect(manager.getMaxSlots()).toBe(6)
    expect(manager.getSlots().length).toBe(6)

    // Expand pan to 8 slots
    manager.setUpgradeModifiers({
      maxPanSlots: 8,
      perfectWindowBonusMs: 1000,
      customerPatienceBonusMs: 15000,
    })

    expect(manager.getMaxSlots()).toBe(8)
    expect(manager.getSlots().length).toBe(8)

    // Fill all 8 slots
    for (let i = 0; i < 8; i++) {
      const slot = manager.addFoodToPan('fish_ball_classic')
      expect(slot).toBe(i)
    }

    // 9th item should be rejected (pan full)
    const extra = manager.addFoodToPan('fish_ball_classic')
    expect(extra).toBeNull()
  })
})
