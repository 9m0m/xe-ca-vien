import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PlayerRepository } from '../../src/db/repository'
import { CART_UPGRADES, getUpgradeConfig, getNextUpgradeTier } from '../../src/game/data/upgrades'
import { getSessionToken } from './session'

export const upgradesRouter = new Hono()

const PurchaseUpgradeSchema = z.object({
  upgradeKey: z.string().min(1),
})

// GET /api/v1/upgrades/catalog - Get available cart upgrades
upgradesRouter.get('/catalog', (c) => {
  return c.json({
    success: true,
    data: {
      upgrades: CART_UPGRADES,
    },
  })
})

// POST /api/v1/upgrades/purchase - Purchase an upgrade tier
upgradesRouter.post('/purchase', zValidator('json', PurchaseUpgradeSchema), async (c) => {
  const token = getSessionToken(c)

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cần phiên đăng nhập để nâng cấp xe.',
        },
      },
      401,
    )
  }

  const playerState = await PlayerRepository.getPlayerBySession(token)
  if (!playerState) {
    return c.json(
      {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Phiên chơi không tồn tại hoặc đã hết hạn.',
        },
      },
      401,
    )
  }

  const { upgradeKey } = c.req.valid('json')
  const upgradeConfig = getUpgradeConfig(upgradeKey)

  if (!upgradeConfig) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UPGRADE_NOT_FOUND',
          message: 'Nâng cấp không tồn tại trong danh mục.',
        },
      },
      404,
    )
  }

  const currentTier = playerState.upgrades[upgradeKey] ?? 1
  const nextTier = getNextUpgradeTier(upgradeKey, currentTier)

  if (!nextTier) {
    return c.json(
      {
        success: false,
        error: {
          code: 'ALREADY_MAX_TIER',
          message: 'Trang bị xe này đã đạt cấp tối đa!',
        },
      },
      400,
    )
  }

  if (playerState.progress.level < nextTier.levelRequired) {
    return c.json(
      {
        success: false,
        error: {
          code: 'LEVEL_TOO_LOW',
          message: `Cần đạt Cấp ${nextTier.levelRequired} để mở khóa nâng cấp này.`,
        },
      },
      400,
    )
  }

  if (playerState.progress.coins < nextTier.cost) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INSUFFICIENT_COINS',
          message: `Không đủ xu để nâng cấp (Cần ${nextTier.cost.toLocaleString('vi-VN')} đ).`,
        },
      },
      400,
    )
  }

  try {
    const result = await PlayerRepository.purchaseUpgrade(playerState.player.id, upgradeKey)
    return c.json({
      success: true,
      data: {
        newCoins: result.newCoins,
        upgrades: result.upgrades,
        purchasedUpgrade: upgradeKey,
        newTier: nextTier.tier,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Purchase failed'
    return c.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: msg,
        },
      },
      500,
    )
  }
})
