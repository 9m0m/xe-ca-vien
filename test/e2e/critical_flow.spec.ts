import { test, expect } from '@playwright/test'

test.describe('Critical E2E User Flow & Responsive Viewports', () => {
  test('Open app, render game canvas, verify HUD stats and open/close modals', async ({ page }) => {
    // 1. Navigate to application root
    await page.goto('/')

    // 2. Wait for loading screen to disappear and game canvas to render
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    // 3. Verify top navigation HUD bar displays level badge
    const levelBadge = page.locator('text=/Cấp \\d+/')
    await expect(levelBadge).toBeVisible()

    // 4. Verify currency badge
    const currencyBadge = page.locator('text=/\\d+.* đ/')
    await expect(currencyBadge).toBeVisible()

    // 5. Open Shop / Food Menu modal
    const shopBtn = page.locator('button[aria-label="Cửa hàng món mới"]')
    await expect(shopBtn).toBeVisible()
    await shopBtn.click()

    // Verify Shop modal opened
    const shopHeading = page.locator('text=Chợ Đầu Mối Vỉa Hè')
    await expect(shopHeading).toBeVisible()

    // Close Shop modal
    const closeShopBtn = page.locator('button[aria-label="Đóng"]')
    await closeShopBtn.click()
    await expect(shopHeading).not.toBeVisible()

    // 6. Open Upgrades modal
    const upgradesBtn = page.locator('button[aria-label="Nâng cấp xe cá viên"]')
    await expect(upgradesBtn).toBeVisible()
    await upgradesBtn.click()

    const upgradesHeading = page.locator('text=Nâng Cấp Xe Cá Viên')
    await expect(upgradesHeading).toBeVisible()

    // Close Upgrades modal
    const closeUpgradeBtn = page.locator('button[aria-label="Đóng"]')
    await closeUpgradeBtn.click()
    await expect(upgradesHeading).not.toBeVisible()

    // 7. Open Achievements modal
    const achBtn = page.locator('button[aria-label="Thành tựu và kỷ lục"]')
    await expect(achBtn).toBeVisible()
    await achBtn.click()

    const achHeading = page.locator('text=Thành Tựu & Kỷ Lục')
    await expect(achHeading).toBeVisible()

    // Close Achievements modal
    const closeAchBtn = page.locator('button[aria-label="Đóng"]')
    await closeAchBtn.click()
    await expect(achHeading).not.toBeVisible()
  })
})
