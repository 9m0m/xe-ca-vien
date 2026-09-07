import { test, expect } from '@playwright/test'

test.describe('Critical E2E Persistence Flow (Release Gate 2)', () => {
  test('New visitor -> Guest session -> Order lifecycle -> Refresh persistence -> Upgrade purchase -> Refresh persistence', async ({
    page,
    context,
  }) => {
    // 1. Visit application as a new visitor
    await page.goto('/')

    // Wait for loading screen to clear and game canvas to render
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    // Verify initial guest HUD stats
    const levelBadge = page.locator('text=/Cấp 1/')
    await expect(levelBadge).toBeVisible()

    const currencyBadge = page.locator('header span:has-text("10.000 đ")')
    await expect(currencyBadge).toBeVisible()

    // 2. Verify Session Security:
    // HttpOnly cookie xcv_session must exist in the browser context
    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name === 'xcv_session')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.httpOnly).toBe(true)

    // Verify zero session secrets stored in browser localStorage
    const storedSecret = await page.evaluate(() => {
      return (
        localStorage.getItem('xcv_session_token') ||
        localStorage.getItem('sessionToken') ||
        localStorage.getItem('token')
      )
    })
    expect(storedSecret).toBeNull()

    // 3. Complete an order through the real server API
    const orderResult = await page.evaluate(async () => {
      // Step A: Start order
      const startRes = await fetch('/api/v1/orders/start', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredItems: [
            { foodId: 'fish_ball_classic', quantity: 2 },
            { foodId: 'sausage_red', quantity: 1 },
          ],
        }),
      })
      const startData = await startRes.json()
      if (!startData.success || !startData.data?.id) {
        throw new Error('Order start failed: ' + JSON.stringify(startData))
      }
      const orderId = startData.data.id

      // Step B: Complete order with valid served items and idempotency key
      const idempotencyKey = `e2e_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const completeRes = await fetch('/api/v1/orders/complete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          idempotencyKey,
          servedItems: [
            { foodId: 'fish_ball_classic', state: 'perfect' },
            { foodId: 'fish_ball_classic', state: 'perfect' },
            { foodId: 'sausage_red', state: 'perfect' },
          ],
          appliedSauces: ['tuong_ot'],
          hasDuaChua: true,
        }),
      })
      const completeData = await completeRes.json()
      if (!completeData.success || !completeData.data) {
        throw new Error('Order complete failed: ' + JSON.stringify(completeData))
      }

      // Sync state into Zustand store so HUD updates reactively
      const store = (
        window as unknown as {
          __APP_STORE__?: { getState: () => { setPlayerStats: (s: unknown) => void } }
        }
      ).__APP_STORE__
      if (store) {
        store.getState().setPlayerStats({
          coins: completeData.data.newTotalCoins,
          xp: completeData.data.newXp,
          level: completeData.data.newLevel,
        })
      }

      return completeData.data
    })

    expect(orderResult.coinsAwarded).toBeGreaterThan(0)
    const postOrderCoins = orderResult.newTotalCoins
    expect(postOrderCoins).toBeGreaterThan(10000)

    // 4. Browser Refresh (Proving persistence via HttpOnly cookie re-authentication)
    await page.reload()
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    // Verify balance persisted across reload
    const expectedFormattedCoins = `${postOrderCoins.toLocaleString('vi-VN')} đ`
    const persistedCurrency = page.locator(`header span:has-text("${expectedFormattedCoins}")`)
    await expect(persistedCurrency).toBeVisible()

    // 5. Purchase an upgrade through the real UI
    const upgradesBtn = page.locator('button[aria-label="Nâng cấp xe cá viên"]')
    await expect(upgradesBtn).toBeVisible()
    await upgradesBtn.click()

    const upgradesHeading = page.locator('text=Nâng Cấp Xe Cá Viên')
    await expect(upgradesHeading).toBeVisible()

    // Find "Mái Bạt Che Mát Vỉa Hè" (awning_comfort: cost 10,000 đ, required level 1)
    const awningCard = page.locator('div:has-text("Mái Bạt Che Mát Vỉa Hè")').locator('..')
    const upgradeActionBtn = awningCard.locator('button:has-text("Nâng Cấp (10.000 đ)")').first()
    await expect(upgradeActionBtn).toBeVisible()
    await upgradeActionBtn.click()

    // Verify upgrade purchased: tier becomes Cấp 2/3
    await expect(awningCard.locator('text=Cấp 2/3')).toBeVisible({ timeout: 5_000 })

    // Close Upgrades modal
    const closeUpgradeBtn = page.locator('button[aria-label="Đóng"]')
    await closeUpgradeBtn.click()
    await expect(upgradesHeading).not.toBeVisible()

    // Verify coins deducted on HUD: postOrderCoins - 10,000
    const remainingCoins = postOrderCoins - 10000
    const remainingFormatted = `${remainingCoins.toLocaleString('vi-VN')} đ`
    await expect(page.locator(`header span:has-text("${remainingFormatted}")`)).toBeVisible()

    // 6. Refresh again to verify upgrade ownership persists across sessions
    await page.reload()
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    // Open upgrades modal again
    await upgradesBtn.click()
    await expect(upgradesHeading).toBeVisible()

    // Confirm persisted upgrade tier
    const awningCardAfterReload = page
      .locator('div:has-text("Mái Bạt Che Mát Vỉa Hè")')
      .locator('..')
    await expect(awningCardAfterReload.locator('text=Cấp 2/3')).toBeVisible()

    // Close modal
    await closeUpgradeBtn.click()
  })
})
