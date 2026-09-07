import { describe, it, expect } from 'vitest'
import {
  FULL_FOOD_CATALOG,
  FOOD_CATALOG_MAP,
  getFoodsByCategory,
  getFoodsByTier,
  getUnlockCost,
} from '../../src/game/data/catalog'

describe('Vietnamese Street Food Catalog Integrity', () => {
  it('should contain exactly 60 authentic street-food catalog entries', () => {
    expect(FULL_FOOD_CATALOG.length).toBe(60)
  })

  it('should have all unique food IDs', () => {
    const ids = FULL_FOOD_CATALOG.map((f) => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(60)
  })

  it('should have valid non-empty Vietnamese names and positive values for every item', () => {
    for (const food of FULL_FOOD_CATALOG) {
      expect(food.displayNameVi.length).toBeGreaterThan(1)
      expect(food.cookTimeMs).toBeGreaterThanOrEqual(3000)
      expect(food.perfectWindowMs).toBeGreaterThanOrEqual(2000)
      expect(food.overcookTimeMs).toBeGreaterThanOrEqual(2000)
      expect(food.basePrice).toBeGreaterThanOrEqual(4000)
      expect(food.baseReward).toBeGreaterThan(0)
      expect(food.unlockTier).toBeGreaterThanOrEqual(1)
      expect(food.unlockTier).toBeLessThanOrEqual(5)
      expect(getUnlockCost(food)).toBe(food.basePrice * 4)
    }
  })

  it('should map food IDs to correct items in FOOD_CATALOG_MAP', () => {
    expect(FOOD_CATALOG_MAP['fish_ball_classic']?.displayNameVi).toBe('Cá viên')
    expect(FOOD_CATALOG_MAP['beef_ball_classic']?.displayNameVi).toBe('Bò viên')
    expect(FOOD_CATALOG_MAP['sausage_red']?.displayNameVi).toBe('Xúc xích đỏ')
    expect(FOOD_CATALOG_MAP['fish_tofu']?.displayNameVi).toBe('Đậu hũ cá')
    expect(FOOD_CATALOG_MAP['ha_cao']?.displayNameVi).toBe('Há cảo')
    expect(FOOD_CATALOG_MAP['crab_stick']?.displayNameVi).toBe('Thanh cua')
    expect(FOOD_CATALOG_MAP['cheese_stick']?.displayNameVi).toBe('Phô mai que')
  })

  it('should cover all 5 unlock tiers', () => {
    for (let tier = 1; tier <= 5; tier++) {
      const tierFoods = getFoodsByTier(tier)
      expect(tierFoods.length).toBeGreaterThan(0)
    }
  })

  it('should cover all 6 street-food categories', () => {
    const categories = ['vien', 'tofu_cake', 'sausage', 'surimi', 'dumpling', 'cheese_crispy']
    for (const cat of categories) {
      const catFoods = getFoodsByCategory(cat)
      expect(catFoods.length).toBeGreaterThan(0)
    }
  })
})
