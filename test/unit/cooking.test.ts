import { describe, it, expect, beforeEach } from 'vitest'
import { CookingManager } from '../../src/game/systems/CookingManager'
import { getFoodConfig } from '../../src/game/data/catalog'

describe('CookingManager', () => {
  let manager: CookingManager

  beforeEach(() => {
    manager = new CookingManager(6)
  })

  it('should initialize with 6 empty slots and an active order', () => {
    expect(manager.getMaxSlots()).toBe(6)
    expect(manager.getSlots().every((s) => s === null)).toBe(true)
    expect(manager.getCurrentOrder()).not.toBeNull()
    expect(manager.getCurrentOrder()?.items.length).toBeGreaterThan(0)
  })

  it('should add food to the first available slot', () => {
    const slot0 = manager.addFoodToPan('fish_ball_classic')
    expect(slot0).toBe(0)

    const slots = manager.getSlots()
    expect(slots[0]?.foodId).toBe('fish_ball_classic')
    expect(slots[0]?.state).toBe('raw')

    const slot1 = manager.addFoodToPan('beef_ball_classic')
    expect(slot1).toBe(1)
  })

  it('should enforce slot capacity limits', () => {
    for (let i = 0; i < 6; i++) {
      const slot = manager.addFoodToPan('fish_ball_classic')
      expect(slot).toBe(i)
    }

    // 7th item should fail as pan is full
    const fullSlot = manager.addFoodToPan('fish_ball_classic')
    expect(fullSlot).toBeNull()
  })

  it('should advance cooking states correctly from raw to cooking to perfect to overcooked', () => {
    manager.addFoodToPan('fish_ball_classic')
    const config = getFoodConfig('fish_ball_classic')!
    expect(config.cookTimeMs).toBe(4000)
    // cookTimeMs: 4000, perfectWindowMs: 3000

    // Advance 1000ms (< 60% cookTime) -> raw
    manager.update(1000)
    expect(manager.getSlots()[0]?.state).toBe('raw')

    // Advance another 2000ms (total 3000ms, > 60% cookTime, < cookTime) -> cooking
    manager.update(2000)
    expect(manager.getSlots()[0]?.state).toBe('cooking')

    // Advance another 2000ms (total 5000ms, between cookTime 4000 and 7000) -> perfect
    manager.update(2000)
    expect(manager.getSlots()[0]?.state).toBe('perfect')

    // Advance another 3000ms (total 8000ms, > 7000ms) -> overcooked
    manager.update(3000)
    expect(manager.getSlots()[0]?.state).toBe('overcooked')
  })

  it('should scoop food from pan into plate', () => {
    manager.addFoodToPan('fish_ball_classic')
    manager.update(5000) // now perfect

    const plateItem = manager.removeFoodFromPan(0)
    expect(plateItem).not.toBeNull()
    expect(plateItem?.foodId).toBe('fish_ball_classic')
    expect(plateItem?.state).toBe('perfect')

    // Pan slot 0 should now be empty
    expect(manager.getSlots()[0]).toBeNull()
    // Plate should have 1 item
    expect(manager.getPlateItems().length).toBe(1)
  })

  it('should reject order if plate does not have required items', () => {
    const result = manager.serveCurrentOrder()
    expect(result.success).toBe(false)
    expect(result.coinsEarned).toBe(0)
  })

  it('should evaluate order successfully when required foods are prepared on plate', () => {
    const order = manager.getCurrentOrder()!
    const firstItem = order.items[0]

    // Prepare required items and scoop to plate
    for (let i = 0; i < firstItem.quantity; i++) {
      const slot = manager.addFoodToPan(firstItem.foodId)!
      // Advance to perfect cooking time
      manager.update(5000)
      manager.removeFoodFromPan(slot)
    }

    // If order had 2 types of items, prepare second as well
    if (order.items.length > 1) {
      const secondItem = order.items[1]
      for (let i = 0; i < secondItem.quantity; i++) {
        const slot = manager.addFoodToPan(secondItem.foodId)!
        manager.update(5000)
        manager.removeFoodFromPan(slot)
      }
    }

    const serveResult = manager.serveCurrentOrder()
    expect(serveResult.success).toBe(true)
    expect(serveResult.coinsEarned).toBeGreaterThan(0)
    expect(serveResult.xpEarned).toBeGreaterThan(0)
    expect(serveResult.perfectCount).toBeGreaterThan(0)
  })
})
