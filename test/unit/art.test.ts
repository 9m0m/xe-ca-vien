import { describe, it, expect } from 'vitest'
import { GAME_SPRITE_REGISTRY } from '../../src/game/art/assetRegistry'
import { FULL_FOOD_CATALOG } from '../../src/game/data/catalog'

describe('Art Pipeline & Silhouette Tests (Phase 7)', () => {
  it('should register all canonical props and environment elements', () => {
    expect(GAME_SPRITE_REGISTRY['pan_surface']).toBeDefined()
    expect(GAME_SPRITE_REGISTRY['serving_plate']).toBeDefined()
    expect(GAME_SPRITE_REGISTRY['prep_tray']).toBeDefined()
  })

  it('should ensure all 60 catalog food items map to registered sprite assets', () => {
    expect(FULL_FOOD_CATALOG.length).toBe(60)

    for (const food of FULL_FOOD_CATALOG) {
      const spriteDef = GAME_SPRITE_REGISTRY[food.spriteKey]
      expect(
        spriteDef,
        `Food "${food.id}" references unregistered sprite "${food.spriteKey}"`,
      ).toBeDefined()

      // Phone-screen silhouette verification: Width and height must be compact for 320px–430px mobile viewport
      expect(spriteDef.width).toBeGreaterThanOrEqual(32)
      expect(spriteDef.width).toBeLessThanOrEqual(64)
      expect(spriteDef.height).toBeGreaterThanOrEqual(32)
      expect(spriteDef.height).toBeLessThanOrEqual(64)

      // Must follow canonical elevated perspective
      expect(spriteDef.perspective).toBe('three-quarter-elevated')
    }
  })

  it('should register all 5 sauce squeeze bottles and pickle bowl with correct silhouettes', () => {
    const sauceKeys = [
      'bottle_chili',
      'bottle_black',
      'bottle_mayo',
      'bottle_tamarind',
      'bottle_sate',
      'bowl_pickle',
    ]

    for (const key of sauceKeys) {
      const def = GAME_SPRITE_REGISTRY[key]
      expect(def).toBeDefined()
      expect(def.category).toBe('sauce')
      expect(def.perspective).toBe('three-quarter-elevated')
    }
  })
})
