import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    // Generate clean geometric placeholder textures to avoid any 404/broken assets
    this.createPlaceholderTextures()
  }

  create() {
    // Transition to main cooking/kitchen scene
    this.scene.start('KitchenScene')
  }

  private createPlaceholderTextures() {
    // 1. Oil Pan texture (inox rim with golden simmering oil)
    const panGfx = this.make.graphics({ x: 0, y: 0 })
    panGfx.fillStyle(0x475569, 1) // Outer inox rim
    panGfx.fillRoundedRect(0, 0, 340, 260, 16)
    panGfx.fillStyle(0x334155, 1) // Inox inner shadow
    panGfx.fillRoundedRect(6, 6, 328, 248, 12)
    panGfx.fillStyle(0xd97706, 0.85) // Hot frying oil base
    panGfx.fillRoundedRect(10, 10, 320, 240, 10)
    panGfx.generateTexture('pan_surface', 340, 260)
    panGfx.destroy()

    // 2. Oil Bubble texture
    const bubbleGfx = this.make.graphics({ x: 0, y: 0 })
    bubbleGfx.fillStyle(0xfef08a, 0.9)
    bubbleGfx.fillCircle(6, 6, 6)
    bubbleGfx.fillStyle(0xffffff, 0.8)
    bubbleGfx.fillCircle(4, 4, 2)
    bubbleGfx.generateTexture('oil_bubble', 12, 12)
    bubbleGfx.destroy()

    // 3. Prep Tray texture
    const trayGfx = this.make.graphics({ x: 0, y: 0 })
    trayGfx.fillStyle(0x64748b, 1)
    trayGfx.fillRoundedRect(0, 0, 360, 120, 8)
    trayGfx.fillStyle(0x94a3b8, 1)
    trayGfx.fillRoundedRect(4, 4, 352, 112, 6)
    trayGfx.fillStyle(0x1e293b, 0.2) // Tray slot compartments
    for (let i = 0; i < 4; i++) {
      trayGfx.fillRoundedRect(12 + i * 86, 12, 76, 96, 4)
    }
    trayGfx.generateTexture('prep_tray', 360, 120)
    trayGfx.destroy()

    // 4. Food: Cá Viên (Fish ball placeholder)
    const fishBallGfx = this.make.graphics({ x: 0, y: 0 })
    fishBallGfx.fillStyle(0xfde68a, 1)
    fishBallGfx.fillCircle(24, 24, 22)
    fishBallGfx.fillStyle(0xd97706, 0.4) // Subtle fried highlight
    fishBallGfx.fillCircle(20, 20, 12)
    fishBallGfx.generateTexture('fish_ball_classic', 48, 48)
    fishBallGfx.destroy()

    // 5. Food: Bò Viên (Beef ball placeholder)
    const beefBallGfx = this.make.graphics({ x: 0, y: 0 })
    beefBallGfx.fillStyle(0x78350f, 1)
    beefBallGfx.fillCircle(24, 24, 22)
    beefBallGfx.fillStyle(0x92400e, 0.5)
    beefBallGfx.fillCircle(20, 20, 12)
    beefBallGfx.generateTexture('beef_ball_classic', 48, 48)
    beefBallGfx.destroy()

    // 6. Food: Xúc Xích Đỏ (Red sausage placeholder)
    const sausageGfx = this.make.graphics({ x: 0, y: 0 })
    sausageGfx.fillStyle(0xb91c1c, 1)
    sausageGfx.fillRoundedRect(4, 8, 48, 24, 12)
    sausageGfx.fillStyle(0xef4444, 0.5)
    sausageGfx.fillRoundedRect(8, 12, 40, 8, 4)
    sausageGfx.generateTexture('sausage_red', 56, 40)
    sausageGfx.destroy()

    // 7. Food: Đậu Hũ Cá (Fish tofu cube placeholder)
    const tofuGfx = this.make.graphics({ x: 0, y: 0 })
    tofuGfx.fillStyle(0xfde047, 1) // Warm pale tofu base
    tofuGfx.fillRoundedRect(4, 4, 40, 40, 6)
    tofuGfx.fillStyle(0xd97706, 0.6) // Golden fried crust edge
    tofuGfx.strokeRoundedRect(4, 4, 40, 40, 6)
    tofuGfx.generateTexture('fish_tofu', 48, 48)
    tofuGfx.destroy()

    // 8. Serving Plate (Dĩa Inox để món đã vớt)
    const plateGfx = this.make.graphics({ x: 0, y: 0 })
    plateGfx.fillStyle(0x475569, 1) // Inox rim
    plateGfx.fillRoundedRect(0, 0, 360, 80, 10)
    plateGfx.fillStyle(0x94a3b8, 1) // Inox plate base
    plateGfx.fillRoundedRect(4, 4, 352, 72, 8)
    plateGfx.fillStyle(0xe2e8f0, 0.4) // Subtle metallic sheen
    plateGfx.fillRoundedRect(8, 8, 344, 24, 6)
    plateGfx.generateTexture('serving_plate', 360, 80)
    plateGfx.destroy()

    // 9. Splash particle texture
    const splashGfx = this.make.graphics({ x: 0, y: 0 })
    splashGfx.fillStyle(0xfef08a, 1)
    splashGfx.fillCircle(4, 4, 4)
    splashGfx.generateTexture('oil_splash', 8, 8)
    splashGfx.destroy()

    // 10. Steam particle texture
    const steamGfx = this.make.graphics({ x: 0, y: 0 })
    steamGfx.fillStyle(0xffffff, 0.35)
    steamGfx.fillCircle(8, 8, 8)
    steamGfx.generateTexture('oil_steam', 16, 16)
    steamGfx.destroy()
  }
}
