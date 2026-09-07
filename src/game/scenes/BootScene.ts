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

    // 11. Shape Family: Flat (Chả cá dẹt, sandwich, bánh gà)
    const flatGfx = this.make.graphics({ x: 0, y: 0 })
    flatGfx.fillStyle(0xfde047, 1)
    flatGfx.fillRoundedRect(4, 10, 48, 28, 8)
    flatGfx.fillStyle(0xd97706, 0.5)
    flatGfx.strokeRoundedRect(4, 10, 48, 28, 8)
    flatGfx.generateTexture('shape_flat_golden', 56, 48)
    flatGfx.destroy()

    // 12. Shape Family: Round Herb (Cá viên rau củ, mực viên rau củ)
    const roundHerbGfx = this.make.graphics({ x: 0, y: 0 })
    roundHerbGfx.fillStyle(0xfef08a, 1)
    roundHerbGfx.fillCircle(24, 24, 22)
    roundHerbGfx.fillStyle(0x16a34a, 0.8) // Green herb flecks
    roundHerbGfx.fillCircle(16, 18, 3)
    roundHerbGfx.fillCircle(28, 28, 3)
    roundHerbGfx.fillCircle(22, 32, 2.5)
    roundHerbGfx.generateTexture('shape_round_herb', 48, 48)
    roundHerbGfx.destroy()

    // 13. Shape Family: Round Orange / Seafood (Tôm viên, hải sản, sò điệp)
    const roundOrangeGfx = this.make.graphics({ x: 0, y: 0 })
    roundOrangeGfx.fillStyle(0xf97316, 0.9)
    roundOrangeGfx.fillCircle(24, 24, 22)
    roundOrangeGfx.fillStyle(0xfed7aa, 0.6)
    roundOrangeGfx.fillCircle(20, 20, 10)
    roundOrangeGfx.generateTexture('shape_round_orange', 48, 48)
    roundOrangeGfx.destroy()

    // 14. Shape Family: Round Golden / Cheese (Phô mai viên, bánh bao trứng cá)
    const roundGoldenGfx = this.make.graphics({ x: 0, y: 0 })
    roundGoldenGfx.fillStyle(0xfbbf24, 1)
    roundGoldenGfx.fillCircle(24, 24, 22)
    roundGoldenGfx.fillStyle(0xd97706, 0.4)
    roundGoldenGfx.fillCircle(18, 18, 12)
    roundGoldenGfx.generateTexture('shape_round_golden', 48, 48)
    roundGoldenGfx.destroy()

    // 15. Shape Family: Round Red / Hồ Lô
    const roundRedGfx = this.make.graphics({ x: 0, y: 0 })
    roundRedGfx.fillStyle(0xdc2626, 1)
    roundRedGfx.fillCircle(24, 24, 22)
    roundRedGfx.fillStyle(0xf87171, 0.6)
    roundRedGfx.fillCircle(18, 18, 8)
    roundRedGfx.generateTexture('shape_round_red', 48, 48)
    roundRedGfx.destroy()

    // 16. Shape Family: Cube Cheese (Đậu hũ phô mai, bánh sữa tươi)
    const cubeCheeseGfx = this.make.graphics({ x: 0, y: 0 })
    cubeCheeseGfx.fillStyle(0xfef08a, 1)
    cubeCheeseGfx.fillRoundedRect(4, 4, 40, 40, 6)
    cubeCheeseGfx.fillStyle(0xf59e0b, 0.8)
    cubeCheeseGfx.strokeRoundedRect(4, 4, 40, 40, 6)
    cubeCheeseGfx.generateTexture('shape_cube_cheese', 48, 48)
    cubeCheeseGfx.destroy()

    // 17. Shape Family: Cylinder Brown (Xúc xích Đức, dồi sụn, xông khói)
    const cylBrownGfx = this.make.graphics({ x: 0, y: 0 })
    cylBrownGfx.fillStyle(0x78350f, 1)
    cylBrownGfx.fillRoundedRect(4, 8, 48, 24, 12)
    cylBrownGfx.fillStyle(0x92400e, 0.6)
    cylBrownGfx.fillRoundedRect(8, 12, 40, 8, 4)
    cylBrownGfx.generateTexture('shape_cylinder_brown', 56, 40)
    cylBrownGfx.destroy()

    // 18. Shape Family: Cylinder Green (Chả cá đậu đũa, bò cuộn lá lốt)
    const cylGreenGfx = this.make.graphics({ x: 0, y: 0 })
    cylGreenGfx.fillStyle(0x166534, 1)
    cylGreenGfx.fillRoundedRect(4, 8, 48, 24, 12)
    cylGreenGfx.fillStyle(0x22c55e, 0.5)
    cylGreenGfx.fillRoundedRect(8, 12, 40, 8, 4)
    cylGreenGfx.generateTexture('shape_cylinder_green', 56, 40)
    cylGreenGfx.destroy()

    // 19. Shape Family: Cylinder Red (Thanh cua, nem chua rán, chả cá bọc ớt)
    const cylRedGfx = this.make.graphics({ x: 0, y: 0 })
    cylRedGfx.fillStyle(0xb91c1c, 1)
    cylRedGfx.fillRoundedRect(4, 8, 48, 24, 12)
    cylRedGfx.fillStyle(0xffffff, 0.7) // Crab stick white center
    cylRedGfx.fillRoundedRect(8, 14, 40, 12, 4)
    cylRedGfx.generateTexture('shape_cylinder_red', 56, 40)
    cylRedGfx.destroy()

    // 20. Shape Family: Cylinder Golden (Phô mai que, chả giò, chả ram)
    const cylGoldGfx = this.make.graphics({ x: 0, y: 0 })
    cylGoldGfx.fillStyle(0xd97706, 1)
    cylGoldGfx.fillRoundedRect(4, 8, 48, 24, 12)
    cylGoldGfx.fillStyle(0xfde047, 0.6)
    cylGoldGfx.fillRoundedRect(8, 12, 40, 8, 4)
    cylGoldGfx.generateTexture('shape_cylinder_golden', 56, 40)
    cylGoldGfx.destroy()

    // 21. Shape Family: Dumpling White (Há cảo, sủi cảo tôm)
    const dumpWhiteGfx = this.make.graphics({ x: 0, y: 0 })
    dumpWhiteGfx.fillStyle(0xf1f5f9, 1)
    dumpWhiteGfx.fillRoundedRect(6, 10, 44, 28, 14)
    dumpWhiteGfx.fillStyle(0xf472b6, 0.4) // Pink shrimp show-through
    dumpWhiteGfx.fillCircle(28, 24, 10)
    dumpWhiteGfx.generateTexture('shape_dumpling_white', 56, 48)
    dumpWhiteGfx.destroy()

    // 22. Shape Family: Dumpling Golden (Hoành thánh chiên giòn)
    const dumpGoldGfx = this.make.graphics({ x: 0, y: 0 })
    dumpGoldGfx.fillStyle(0xb45309, 1)
    dumpGoldGfx.fillRoundedRect(6, 10, 44, 28, 10)
    dumpGoldGfx.fillStyle(0xfbbf24, 0.7)
    dumpGoldGfx.fillCircle(28, 24, 10)
    dumpGoldGfx.generateTexture('shape_dumpling_golden', 56, 48)
    dumpGoldGfx.destroy()

    // 23. Shape Family: Specialty Twist (Mực xoắn, tôm xoắn)
    const twistGfx = this.make.graphics({ x: 0, y: 0 })
    twistGfx.fillStyle(0xf87171, 1)
    twistGfx.fillCircle(24, 24, 22)
    twistGfx.fillStyle(0xffffff, 0.8)
    twistGfx.fillCircle(24, 24, 14)
    twistGfx.fillStyle(0xf87171, 1)
    twistGfx.fillCircle(24, 24, 8)
    twistGfx.generateTexture('shape_specialty_twist', 48, 48)
    twistGfx.destroy()

    // 24. Shape Family: Specialty Bag (Túi tiền hải sản)
    const bagGfx = this.make.graphics({ x: 0, y: 0 })
    bagGfx.fillStyle(0xd97706, 1)
    bagGfx.fillCircle(24, 28, 18)
    bagGfx.fillStyle(0xb45309, 1)
    bagGfx.fillRoundedRect(18, 6, 12, 12, 4) // Pouch neck
    bagGfx.generateTexture('shape_specialty_bag', 48, 48)
    bagGfx.destroy()

    // 25. Shape Family: Specialty Snail (Ốc nhồi)
    const snailGfx = this.make.graphics({ x: 0, y: 0 })
    snailGfx.fillStyle(0x334155, 1) // Snail shell
    snailGfx.fillCircle(24, 24, 20)
    snailGfx.fillStyle(0xfef08a, 1) // Lemongrass meat stuffing
    snailGfx.fillCircle(28, 20, 10)
    snailGfx.generateTexture('shape_specialty_snail', 48, 48)
    snailGfx.destroy()
  }
}
