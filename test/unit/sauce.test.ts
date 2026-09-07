import { describe, it, expect, beforeEach } from 'vitest'
import { CookingManager } from '../../src/game/systems/CookingManager'
import { SAUCE_CATALOG, getSauceConfig } from '../../src/game/data/sauces'

describe('Sauce System and Satisfaction Scoring', () => {
  let manager: CookingManager

  beforeEach(() => {
    manager = new CookingManager(6)
  })

  it('should define authentic Vietnamese sauces in SAUCE_CATALOG', () => {
    expect(SAUCE_CATALOG.length).toBe(6)
    expect(getSauceConfig('tuong_ot')?.displayNameVi).toBe('Tương ớt')
    expect(getSauceConfig('tuong_den')?.displayNameVi).toBe('Tương đen')
    expect(getSauceConfig('mayo')?.displayNameVi).toBe('Mayonnaise')
    expect(getSauceConfig('dua_chua')?.displayNameVi).toBe('Dưa chua')
  })

  it('should toggle sauces and dưa chua on the serving plate', () => {
    expect(manager.getSelectedSauces()).toEqual([])
    expect(manager.getHasDuaChua()).toBe(false)

    // Add tuong_ot
    const added1 = manager.togglePlateSauce('tuong_ot')
    expect(added1).toBe(true)
    expect(manager.getSelectedSauces()).toContain('tuong_ot')

    // Add mayo
    manager.togglePlateSauce('mayo')
    expect(manager.getSelectedSauces()).toEqual(['tuong_ot', 'mayo'])

    // Remove tuong_ot
    const removed1 = manager.togglePlateSauce('tuong_ot')
    expect(removed1).toBe(false)
    expect(manager.getSelectedSauces()).toEqual(['mayo'])

    // Toggle dưa chua
    manager.togglePlateDuaChua()
    expect(manager.getHasDuaChua()).toBe(true)
    manager.togglePlateDuaChua()
    expect(manager.getHasDuaChua()).toBe(false)
  })

  it('should generate customer orders with sauce requests and serving style', () => {
    const order = manager.getCurrentOrder()
    expect(order).not.toBeNull()
    expect(Array.isArray(order?.requestedSauces)).toBe(true)
    expect(typeof order?.hasDuaChua).toBe('boolean')
    expect(['skewer', 'tray']).toContain(order?.servingStyle)
  })

  it('should calculate higher satisfaction when requested sauces and dưa chua are matched', () => {
    const order = manager.getCurrentOrder()!

    // Prepare food
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        const slot = manager.addFoodToPan(item.foodId)!
        manager.update(5000) // perfect cook
        manager.removeFoodFromPan(slot)
      }
    }

    // Apply all requested sauces
    for (const sauce of order.requestedSauces) {
      manager.togglePlateSauce(sauce)
    }
    if (order.hasDuaChua) {
      manager.togglePlateDuaChua()
    }

    const evalResult = manager.serveCurrentOrder()
    expect(evalResult.success).toBe(true)
    expect(evalResult.satisfactionScore).toBeGreaterThanOrEqual(75)
    expect(evalResult.sauceScore).toBeGreaterThan(0)
    expect(evalResult.reputationEarned).toBeGreaterThan(0)
  })
})
