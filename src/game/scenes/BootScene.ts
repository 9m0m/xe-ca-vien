import Phaser from 'phaser'

/**
 * BootScene: Generates canonical 2.5D street-food art assets adhering to docs/ART_BIBLE.md:
 * - Elevated 3/4 perspective with grounded contact shadow
 * - Top-left warm key lighting (0xfffbeb) and subtle bottom-right bounce
 * - Dark warm 1.5–2px outlines for phone-screen silhouette legibility (320px–390px)
 * - Grounded Southern Vietnamese street details (inox rivets, score cuts, blister spots)
 * - No emojis, no AI purple/blue gradients, no glossy plastic spheres
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    this.createCanonicalArtTextures()
  }

  create() {
    this.scene.start('KitchenScene')
  }

  private createCanonicalArtTextures() {
    // =========================================================================
    // 1. INOX PAN SURFACE (Chảo dầu sôi inox viền cuốn, quai tán đinh)
    // =========================================================================
    const panGfx = this.make.graphics({ x: 0, y: 0 })
    // Outer shadow
    panGfx.fillStyle(0x020617, 0.6)
    panGfx.fillRoundedRect(4, 6, 332, 252, 18)

    // Left and Right Wok Handles (Quai chảo kim loại tán đinh)
    panGfx.fillStyle(0x334155, 1)
    panGfx.fillRoundedRect(0, 110, 12, 40, 6)
    panGfx.fillRoundedRect(328, 110, 12, 40, 6)
    panGfx.fillStyle(0x94a3b8, 1)
    panGfx.fillCircle(6, 120, 2)
    panGfx.fillCircle(6, 140, 2)
    panGfx.fillCircle(334, 120, 2)
    panGfx.fillCircle(334, 140, 2)

    // Outer Inox Rim
    panGfx.fillStyle(0x64748b, 1)
    panGfx.fillRoundedRect(10, 0, 320, 260, 16)
    // Metallic Inox Sheen
    panGfx.fillStyle(0x94a3b8, 1)
    panGfx.fillRoundedRect(14, 4, 312, 252, 14)
    panGfx.fillStyle(0xcbd5e1, 0.4)
    panGfx.fillRect(20, 8, 300, 8) // Top light specular reflection

    // Inner Dark Bevel
    panGfx.fillStyle(0x1e293b, 1)
    panGfx.fillRoundedRect(18, 12, 304, 236, 12)

    // Deep Hot Oil Base (Vàng nâu hổ phách dầu chiên)
    panGfx.fillStyle(0xb45309, 1)
    panGfx.fillRoundedRect(22, 16, 296, 228, 10)
    panGfx.fillStyle(0xd97706, 0.9)
    panGfx.fillRoundedRect(26, 20, 288, 220, 8)

    // Subtle oil shimmer ripples
    panGfx.lineStyle(1.5, 0xfef08a, 0.25)
    panGfx.strokeEllipse(170, 80, 100, 30)
    panGfx.strokeEllipse(170, 160, 110, 35)

    panGfx.generateTexture('pan_surface', 340, 260)
    panGfx.destroy()

    // =========================================================================
    // 2. SERVING PLATE (Dĩa Inox Chữ Nhật Đựng Xiên Ráo Dầu)
    // =========================================================================
    const plateGfx = this.make.graphics({ x: 0, y: 0 })
    // Drop shadow
    plateGfx.fillStyle(0x020617, 0.5)
    plateGfx.fillRoundedRect(4, 6, 352, 72, 12)
    // Rolled Inox Edge
    plateGfx.fillStyle(0x64748b, 1)
    plateGfx.fillRoundedRect(0, 0, 360, 80, 12)
    // Mirror Polished Plate Body
    plateGfx.fillStyle(0x94a3b8, 1)
    plateGfx.fillRoundedRect(4, 4, 352, 72, 10)
    plateGfx.fillStyle(0xe2e8f0, 0.6)
    plateGfx.fillRoundedRect(8, 6, 344, 16, 6) // Specular highlight strip
    // Anti-slip ribbed grooves (Gân dập nổi trên dĩa inox vỉa hè)
    plateGfx.lineStyle(1.5, 0x475569, 0.4)
    for (let x = 40; x < 340; x += 35) {
      plateGfx.strokeRoundedRect(x, 26, 24, 44, 4)
    }
    plateGfx.generateTexture('serving_plate', 360, 80)
    plateGfx.destroy()

    // =========================================================================
    // 3. PREP TRAY (Khay Trưng Bày Đồ Ăn Inox 4-6 Ngăn)
    // =========================================================================
    const trayGfx = this.make.graphics({ x: 0, y: 0 })
    // Shadow
    trayGfx.fillStyle(0x020617, 0.6)
    trayGfx.fillRoundedRect(4, 6, 352, 112, 10)
    // Metal Base
    trayGfx.fillStyle(0x475569, 1)
    trayGfx.fillRoundedRect(0, 0, 360, 120, 10)
    trayGfx.fillStyle(0x64748b, 1)
    trayGfx.fillRoundedRect(4, 4, 352, 112, 8)
    // Stainless steel specular reflection
    trayGfx.fillStyle(0xcbd5e1, 0.35)
    trayGfx.fillRect(10, 8, 340, 6)
    // Compartment wells with subtle depth shadow
    for (let i = 0; i < 4; i++) {
      const wellX = 14 + i * 86
      trayGfx.fillStyle(0x1e293b, 0.7)
      trayGfx.fillRoundedRect(wellX, 20, 76, 90, 6)
      trayGfx.fillStyle(0x334155, 0.9)
      trayGfx.fillRoundedRect(wellX + 2, 22, 72, 86, 5)
    }
    trayGfx.generateTexture('prep_tray', 360, 120)
    trayGfx.destroy()

    // =========================================================================
    // 4. FOOD: CÁ VIÊN CHIÊN (Fish Ball Classic)
    // =========================================================================
    const fishBallGfx = this.make.graphics({ x: 0, y: 0 })
    // Grounding shadow
    fishBallGfx.fillStyle(0x0f172a, 0.35)
    fishBallGfx.fillEllipse(24, 44, 36, 8)
    // Dark outline
    fishBallGfx.fillStyle(0x78350f, 1)
    fishBallGfx.fillCircle(24, 24, 22)
    // Base golden-ivory paste color
    fishBallGfx.fillStyle(0xfde68a, 1)
    fishBallGfx.fillCircle(24, 24, 20)
    // Natural fry blisters & golden spots (đốm phồng vàng tự nhiên)
    fishBallGfx.fillStyle(0xd97706, 0.7)
    fishBallGfx.fillCircle(18, 18, 6)
    fishBallGfx.fillCircle(30, 26, 5)
    fishBallGfx.fillCircle(22, 32, 4)
    // Specular light bounce (top-left)
    fishBallGfx.fillStyle(0xfffbeb, 0.8)
    fishBallGfx.fillCircle(16, 14, 4)
    fishBallGfx.generateTexture('fish_ball_classic', 48, 48)
    fishBallGfx.destroy()

    // =========================================================================
    // 5. FOOD: BÒ VIÊN GÂN (Beef Ball Classic)
    // =========================================================================
    const beefBallGfx = this.make.graphics({ x: 0, y: 0 })
    // Grounding shadow
    beefBallGfx.fillStyle(0x0f172a, 0.35)
    beefBallGfx.fillEllipse(24, 44, 36, 8)
    // Dark outline
    beefBallGfx.fillStyle(0x451a03, 1)
    beefBallGfx.fillCircle(24, 24, 22)
    // Deep meaty brown base
    beefBallGfx.fillStyle(0x78350f, 1)
    beefBallGfx.fillCircle(24, 24, 20)
    // Black pepper flecks & tendon streaks (tiêu đen & gân bò)
    beefBallGfx.fillStyle(0x1c1917, 0.8)
    beefBallGfx.fillCircle(16, 20, 2)
    beefBallGfx.fillCircle(28, 18, 2)
    beefBallGfx.fillCircle(22, 28, 2.5)
    beefBallGfx.fillCircle(30, 30, 1.8)
    // Golden-brown seared crust
    beefBallGfx.fillStyle(0x92400e, 0.6)
    beefBallGfx.fillCircle(20, 18, 8)
    // Subtle top-left highlight
    beefBallGfx.fillStyle(0xd97706, 0.5)
    beefBallGfx.fillCircle(16, 14, 4)
    beefBallGfx.generateTexture('beef_ball_classic', 48, 48)
    beefBallGfx.destroy()

    // =========================================================================
    // 6. FOOD: XÚC XÍCH ĐỎ KHÍA HOA THỊ (Red Sausage)
    // =========================================================================
    const sausageGfx = this.make.graphics({ x: 0, y: 0 })
    // Grounding shadow
    sausageGfx.fillStyle(0x0f172a, 0.35)
    sausageGfx.fillEllipse(28, 36, 44, 8)
    // Dark outline
    sausageGfx.fillStyle(0x7f1d1d, 1)
    sausageGfx.fillRoundedRect(4, 6, 48, 26, 13)
    // Red sausage body
    sausageGfx.fillStyle(0xb91c1c, 1)
    sausageGfx.fillRoundedRect(6, 8, 44, 22, 11)
    // Characteristic street-cart score cuts (khía hoa thị xòe cánh khi chiên)
    sausageGfx.fillStyle(0x991b1b, 1)
    sausageGfx.fillRect(16, 8, 3, 22)
    sausageGfx.fillRect(27, 8, 3, 22)
    sausageGfx.fillRect(38, 8, 3, 22)
    // Top highlight sheen
    sausageGfx.fillStyle(0xfca5a5, 0.6)
    sausageGfx.fillRoundedRect(10, 10, 36, 5, 2)
    sausageGfx.generateTexture('sausage_red', 56, 40)
    sausageGfx.destroy()

    // =========================================================================
    // 7. FOOD: ĐẬU HŨ CÁ KHỐI VUÔNG (Fish Tofu Cube)
    // =========================================================================
    const tofuGfx = this.make.graphics({ x: 0, y: 0 })
    // Grounding shadow
    tofuGfx.fillStyle(0x0f172a, 0.35)
    tofuGfx.fillEllipse(24, 44, 38, 8)
    // Outline & 2.5D bevel
    tofuGfx.fillStyle(0xb45309, 1)
    tofuGfx.fillRoundedRect(4, 4, 40, 40, 6)
    // Golden fried crust sides
    tofuGfx.fillStyle(0xd97706, 1)
    tofuGfx.fillRoundedRect(6, 6, 36, 36, 5)
    // Soft creamy pale center
    tofuGfx.fillStyle(0xfef08a, 1)
    tofuGfx.fillRoundedRect(10, 10, 28, 28, 4)
    // Top-left soft highlight
    tofuGfx.fillStyle(0xffffff, 0.7)
    tofuGfx.fillRect(12, 12, 16, 4)
    tofuGfx.generateTexture('fish_tofu', 48, 48)
    tofuGfx.destroy()

    // =========================================================================
    // 8. SHAPE FAMILY: CHẢ CÁ DẸT / BÁNH GÀ (Flat Golden)
    // =========================================================================
    const flatGfx = this.make.graphics({ x: 0, y: 0 })
    flatGfx.fillStyle(0x0f172a, 0.35)
    flatGfx.fillEllipse(28, 42, 46, 8)
    flatGfx.fillStyle(0x92400e, 1)
    flatGfx.fillRoundedRect(4, 8, 48, 30, 8)
    flatGfx.fillStyle(0xf59e0b, 1)
    flatGfx.fillRoundedRect(6, 10, 44, 26, 6)
    // Panko crust specks
    flatGfx.fillStyle(0xd97706, 0.8)
    flatGfx.fillCircle(14, 18, 3)
    flatGfx.fillCircle(24, 24, 3.5)
    flatGfx.fillCircle(38, 16, 2.5)
    flatGfx.fillStyle(0xfef08a, 0.7)
    flatGfx.fillRect(10, 12, 28, 4)
    flatGfx.generateTexture('shape_flat_golden', 56, 48)
    flatGfx.destroy()

    // =========================================================================
    // 9. SHAPE FAMILY: VIÊN RAU CỦ (Round Herb)
    // =========================================================================
    const roundHerbGfx = this.make.graphics({ x: 0, y: 0 })
    roundHerbGfx.fillStyle(0x0f172a, 0.35)
    roundHerbGfx.fillEllipse(24, 44, 36, 8)
    roundHerbGfx.fillStyle(0x78350f, 1)
    roundHerbGfx.fillCircle(24, 24, 22)
    roundHerbGfx.fillStyle(0xfef08a, 1)
    roundHerbGfx.fillCircle(24, 24, 20)
    // Dill & spring onion flecks (thì là, hành lá & cà rốt nhuyễn)
    roundHerbGfx.fillStyle(0x16a34a, 0.85)
    roundHerbGfx.fillCircle(16, 18, 3)
    roundHerbGfx.fillCircle(28, 26, 2.5)
    roundHerbGfx.fillCircle(22, 32, 2.8)
    roundHerbGfx.fillStyle(0xea580c, 0.8)
    roundHerbGfx.fillCircle(28, 16, 2)
    roundHerbGfx.fillCircle(18, 28, 2)
    roundHerbGfx.fillStyle(0xfffbeb, 0.7)
    roundHerbGfx.fillCircle(15, 14, 4)
    roundHerbGfx.generateTexture('shape_round_herb', 48, 48)
    roundHerbGfx.destroy()

    // =========================================================================
    // 10. SHAPE FAMILY: TÔM VIÊN / SÒ ĐIỆP (Round Orange)
    // =========================================================================
    const roundOrangeGfx = this.make.graphics({ x: 0, y: 0 })
    roundOrangeGfx.fillStyle(0x0f172a, 0.35)
    roundOrangeGfx.fillEllipse(24, 44, 36, 8)
    roundOrangeGfx.fillStyle(0x9a3412, 1)
    roundOrangeGfx.fillCircle(24, 24, 22)
    roundOrangeGfx.fillStyle(0xf97316, 1)
    roundOrangeGfx.fillCircle(24, 24, 20)
    roundOrangeGfx.fillStyle(0xfed7aa, 0.8)
    roundOrangeGfx.fillCircle(18, 18, 8)
    roundOrangeGfx.fillStyle(0xffffff, 0.6)
    roundOrangeGfx.fillCircle(15, 14, 3.5)
    roundOrangeGfx.generateTexture('shape_round_orange', 48, 48)
    roundOrangeGfx.destroy()

    // =========================================================================
    // 11. SHAPE FAMILY: BÁNH BAO TRỨNG CÁ (Round Golden)
    // =========================================================================
    const roundGoldenGfx = this.make.graphics({ x: 0, y: 0 })
    roundGoldenGfx.fillStyle(0x0f172a, 0.35)
    roundGoldenGfx.fillEllipse(24, 44, 36, 8)
    roundGoldenGfx.fillStyle(0xb45309, 1)
    roundGoldenGfx.fillCircle(24, 24, 22)
    roundGoldenGfx.fillStyle(0xfbbf24, 1)
    roundGoldenGfx.fillCircle(24, 24, 20)
    // Orange roe stripes
    roundGoldenGfx.fillStyle(0xf97316, 0.75)
    roundGoldenGfx.fillCircle(24, 22, 10)
    roundGoldenGfx.fillStyle(0xfffbeb, 0.7)
    roundGoldenGfx.fillCircle(16, 14, 4)
    roundGoldenGfx.generateTexture('shape_round_golden', 48, 48)
    roundGoldenGfx.destroy()

    // =========================================================================
    // 12. SHAPE FAMILY: HỒ LÔ CHIÊN (Round Red)
    // =========================================================================
    const roundRedGfx = this.make.graphics({ x: 0, y: 0 })
    roundRedGfx.fillStyle(0x0f172a, 0.35)
    roundRedGfx.fillEllipse(24, 44, 36, 8)
    roundRedGfx.fillStyle(0x7f1d1d, 1)
    roundRedGfx.fillCircle(24, 24, 22)
    roundRedGfx.fillStyle(0xdc2626, 1)
    roundRedGfx.fillCircle(24, 24, 20)
    roundRedGfx.fillStyle(0xf87171, 0.7)
    roundRedGfx.fillCircle(18, 18, 8)
    roundRedGfx.fillStyle(0xfff1f2, 0.6)
    roundRedGfx.fillCircle(16, 14, 3.5)
    roundRedGfx.generateTexture('shape_round_red', 48, 48)
    roundRedGfx.destroy()

    // =========================================================================
    // 13. SHAPE FAMILY: ĐẬU HŨ PHÔ MAI (Cube Cheese)
    // =========================================================================
    const cubeCheeseGfx = this.make.graphics({ x: 0, y: 0 })
    cubeCheeseGfx.fillStyle(0x0f172a, 0.35)
    cubeCheeseGfx.fillEllipse(24, 44, 38, 8)
    cubeCheeseGfx.fillStyle(0xd97706, 1)
    cubeCheeseGfx.fillRoundedRect(4, 4, 40, 40, 6)
    cubeCheeseGfx.fillStyle(0xfef08a, 1)
    cubeCheeseGfx.fillRoundedRect(6, 6, 36, 36, 5)
    cubeCheeseGfx.fillStyle(0xfbbf24, 0.8)
    cubeCheeseGfx.fillCircle(24, 24, 10) // Cheese melt core
    cubeCheeseGfx.fillStyle(0xffffff, 0.7)
    cubeCheeseGfx.fillRect(10, 10, 14, 4)
    cubeCheeseGfx.generateTexture('shape_cube_cheese', 48, 48)
    cubeCheeseGfx.destroy()

    // =========================================================================
    // 14. SHAPE FAMILY: DỒI SỤN / XÚC XÍCH ĐỨC (Cylinder Brown)
    // =========================================================================
    const cylBrownGfx = this.make.graphics({ x: 0, y: 0 })
    cylBrownGfx.fillStyle(0x0f172a, 0.35)
    cylBrownGfx.fillEllipse(28, 36, 44, 8)
    cylBrownGfx.fillStyle(0x451a03, 1)
    cylBrownGfx.fillRoundedRect(4, 6, 48, 26, 13)
    cylBrownGfx.fillStyle(0x78350f, 1)
    cylBrownGfx.fillRoundedRect(6, 8, 44, 22, 11)
    cylBrownGfx.fillStyle(0x92400e, 0.8)
    cylBrownGfx.fillRoundedRect(10, 10, 36, 8, 4)
    cylBrownGfx.fillStyle(0xfde68a, 0.5)
    cylBrownGfx.fillRect(14, 10, 24, 3)
    cylBrownGfx.generateTexture('shape_cylinder_brown', 56, 40)
    cylBrownGfx.destroy()

    // =========================================================================
    // 15. SHAPE FAMILY: BÒ LÁ LỐT / ĐẬU ĐŨA (Cylinder Green)
    // =========================================================================
    const cylGreenGfx = this.make.graphics({ x: 0, y: 0 })
    cylGreenGfx.fillStyle(0x0f172a, 0.35)
    cylGreenGfx.fillEllipse(28, 36, 44, 8)
    cylGreenGfx.fillStyle(0x14532d, 1)
    cylGreenGfx.fillRoundedRect(4, 6, 48, 26, 13)
    cylGreenGfx.fillStyle(0x166534, 1)
    cylGreenGfx.fillRoundedRect(6, 8, 44, 22, 11)
    cylGreenGfx.fillStyle(0x22c55e, 0.5)
    cylGreenGfx.fillRoundedRect(10, 10, 36, 6, 3)
    cylGreenGfx.generateTexture('shape_cylinder_green', 56, 40)
    cylGreenGfx.destroy()

    // =========================================================================
    // 16. SHAPE FAMILY: THANH CUA SURIMI (Cylinder Red/White)
    // =========================================================================
    const cylRedGfx = this.make.graphics({ x: 0, y: 0 })
    cylRedGfx.fillStyle(0x0f172a, 0.35)
    cylRedGfx.fillEllipse(28, 36, 44, 8)
    cylRedGfx.fillStyle(0x7f1d1d, 1)
    cylRedGfx.fillRoundedRect(4, 6, 48, 26, 13)
    cylRedGfx.fillStyle(0xb91c1c, 1)
    cylRedGfx.fillRoundedRect(6, 8, 44, 22, 11)
    cylRedGfx.fillStyle(0xf8fafc, 0.9) // White crabmeat center layer
    cylRedGfx.fillRoundedRect(10, 15, 36, 12, 4)
    cylRedGfx.generateTexture('shape_cylinder_red', 56, 40)
    cylRedGfx.destroy()

    // =========================================================================
    // 17. SHAPE FAMILY: PHÔ MAI QUE / CHẢ GIÒ (Cylinder Golden)
    // =========================================================================
    const cylGoldGfx = this.make.graphics({ x: 0, y: 0 })
    cylGoldGfx.fillStyle(0x0f172a, 0.35)
    cylGoldGfx.fillEllipse(28, 36, 44, 8)
    cylGoldGfx.fillStyle(0x92400e, 1)
    cylGoldGfx.fillRoundedRect(4, 6, 48, 26, 13)
    cylGoldGfx.fillStyle(0xd97706, 1)
    cylGoldGfx.fillRoundedRect(6, 8, 44, 22, 11)
    cylGoldGfx.fillStyle(0xfde047, 0.7)
    cylGoldGfx.fillRoundedRect(10, 10, 36, 7, 3)
    cylGoldGfx.generateTexture('shape_cylinder_golden', 56, 40)
    cylGoldGfx.destroy()

    // =========================================================================
    // 18. SHAPE FAMILY: HÁ CẢO TÔM THỊT (Dumpling White)
    // =========================================================================
    const dumpWhiteGfx = this.make.graphics({ x: 0, y: 0 })
    dumpWhiteGfx.fillStyle(0x0f172a, 0.35)
    dumpWhiteGfx.fillEllipse(28, 42, 44, 8)
    dumpWhiteGfx.fillStyle(0x94a3b8, 1)
    dumpWhiteGfx.fillRoundedRect(6, 8, 44, 30, 14)
    dumpWhiteGfx.fillStyle(0xf8fafc, 1)
    dumpWhiteGfx.fillRoundedRect(8, 10, 40, 26, 12)
    // Translucent pink shrimp interior
    dumpWhiteGfx.fillStyle(0xf472b6, 0.5)
    dumpWhiteGfx.fillCircle(28, 22, 9)
    // Dumpling pleats (gấp nếp vỏ bánh)
    dumpWhiteGfx.lineStyle(1.5, 0xcbd5e1, 0.8)
    dumpWhiteGfx.strokeLineShape(new Phaser.Geom.Line(20, 10, 24, 16))
    dumpWhiteGfx.strokeLineShape(new Phaser.Geom.Line(28, 10, 28, 16))
    dumpWhiteGfx.strokeLineShape(new Phaser.Geom.Line(36, 10, 32, 16))
    dumpWhiteGfx.generateTexture('shape_dumpling_white', 56, 48)
    dumpWhiteGfx.destroy()

    // =========================================================================
    // 19. SHAPE FAMILY: HOÀNH THÁNH CHIÊN (Dumpling Golden)
    // =========================================================================
    const dumpGoldGfx = this.make.graphics({ x: 0, y: 0 })
    dumpGoldGfx.fillStyle(0x0f172a, 0.35)
    dumpGoldGfx.fillEllipse(28, 42, 44, 8)
    dumpGoldGfx.fillStyle(0x78350f, 1)
    dumpGoldGfx.fillRoundedRect(6, 8, 44, 30, 10)
    dumpGoldGfx.fillStyle(0xb45309, 1)
    dumpGoldGfx.fillRoundedRect(8, 10, 40, 26, 8)
    dumpGoldGfx.fillStyle(0xfbbf24, 0.8)
    dumpGoldGfx.fillCircle(28, 23, 8)
    dumpGoldGfx.generateTexture('shape_dumpling_golden', 56, 48)
    dumpGoldGfx.destroy()

    // =========================================================================
    // 20. SHAPE FAMILY: MỰC XOẮN (Specialty Twist)
    // =========================================================================
    const twistGfx = this.make.graphics({ x: 0, y: 0 })
    twistGfx.fillStyle(0x0f172a, 0.35)
    twistGfx.fillEllipse(24, 44, 36, 8)
    twistGfx.fillStyle(0x991b1b, 1)
    twistGfx.fillCircle(24, 24, 22)
    twistGfx.fillStyle(0xf87171, 1)
    twistGfx.fillCircle(24, 24, 20)
    twistGfx.fillStyle(0xffffff, 0.9)
    twistGfx.fillCircle(24, 24, 13)
    twistGfx.fillStyle(0xef4444, 1)
    twistGfx.fillCircle(24, 24, 7)
    twistGfx.generateTexture('shape_specialty_twist', 48, 48)
    twistGfx.destroy()

    // =========================================================================
    // 21. SHAPE FAMILY: TÚI TIỀN HẢI SẢN (Specialty Bag)
    // =========================================================================
    const bagGfx = this.make.graphics({ x: 0, y: 0 })
    bagGfx.fillStyle(0x0f172a, 0.35)
    bagGfx.fillEllipse(24, 44, 36, 8)
    bagGfx.fillStyle(0x92400e, 1)
    bagGfx.fillCircle(24, 28, 18)
    bagGfx.fillStyle(0xd97706, 1)
    bagGfx.fillCircle(24, 28, 16)
    // Pouch neck tied with green scallion ribbon (buộc cọng hành tươi)
    bagGfx.fillStyle(0x16a34a, 1)
    bagGfx.fillRoundedRect(17, 12, 14, 4, 2)
    bagGfx.fillStyle(0xfef08a, 1)
    bagGfx.fillTriangle(24, 2, 16, 13, 32, 13)
    bagGfx.generateTexture('shape_specialty_bag', 48, 48)
    bagGfx.destroy()

    // =========================================================================
    // 22. SHAPE FAMILY: ỐC NHỒI THỊT SẢ (Specialty Snail)
    // =========================================================================
    const snailGfx = this.make.graphics({ x: 0, y: 0 })
    snailGfx.fillStyle(0x0f172a, 0.35)
    snailGfx.fillEllipse(24, 44, 36, 8)
    // Snail shell
    snailGfx.fillStyle(0x1e293b, 1)
    snailGfx.fillCircle(22, 24, 20)
    // Lemongrass meat stuffing protruding
    snailGfx.fillStyle(0xfef08a, 1)
    snailGfx.fillCircle(28, 20, 11)
    // Lemongrass stalk green leaf
    snailGfx.fillStyle(0x65a30d, 1)
    snailGfx.fillRect(26, 6, 4, 16)
    snailGfx.generateTexture('shape_specialty_snail', 48, 48)
    snailGfx.destroy()

    // =========================================================================
    // 23. SQUEEZE SAUCE BOTTLES (Chai Xịt Nước Sốt Vỉa Hè)
    // =========================================================================
    const makeBottle = (key: string, bodyColor: number, capColor: number) => {
      const bGfx = this.make.graphics({ x: 0, y: 0 })
      // Shadow
      bGfx.fillStyle(0x0f172a, 0.35)
      bGfx.fillEllipse(14, 47, 22, 5)
      // Outline
      bGfx.fillStyle(0x1e293b, 1)
      bGfx.fillTriangle(14, 0, 8, 14, 20, 14)
      bGfx.fillRoundedRect(2, 16, 24, 32, 5)

      // Bottle Cap / Nozzle Tip
      bGfx.fillStyle(capColor, 1)
      bGfx.fillTriangle(14, 2, 9, 13, 19, 13)

      // Bottle Collar
      bGfx.fillStyle(0x94a3b8, 1)
      bGfx.fillRect(9, 13, 10, 4)

      // Translucent Bottle Body & Sauce Level
      bGfx.fillStyle(bodyColor, 1)
      bGfx.fillRoundedRect(4, 18, 20, 28, 4)

      // Vertical highlight glare
      bGfx.fillStyle(0xffffff, 0.4)
      bGfx.fillRect(6, 20, 3, 22)
      bGfx.generateTexture(key, 28, 50)
      bGfx.destroy()
    }

    makeBottle('bottle_chili', 0xdc2626, 0xef4444)
    makeBottle('bottle_black', 0x2b1810, 0x78350f)
    makeBottle('bottle_mayo', 0xfef3c7, 0xfbbf24)
    makeBottle('bottle_tamarind', 0x92400e, 0xb45309)
    makeBottle('bottle_sate', 0xb91c1c, 0xf87171)

    // =========================================================================
    // 24. GARNISH: DƯA CHUA ĂN KÈM (Pickle Dish)
    // =========================================================================
    const pickleGfx = this.make.graphics({ x: 0, y: 0 })
    // Shadow
    pickleGfx.fillStyle(0x0f172a, 0.35)
    pickleGfx.fillEllipse(18, 33, 30, 6)
    // Street blue plastic melamine dish (chén nhựa xanh vỉa hè)
    pickleGfx.fillStyle(0x0369a1, 1)
    pickleGfx.fillCircle(18, 18, 16)
    pickleGfx.fillStyle(0x38bdf8, 1)
    pickleGfx.fillCircle(18, 18, 14)
    pickleGfx.fillStyle(0xf8fafc, 1)
    pickleGfx.fillCircle(18, 18, 12)
    // Pickled cucumber wheels
    pickleGfx.fillStyle(0x65a30d, 1)
    pickleGfx.fillCircle(14, 14, 6)
    pickleGfx.fillCircle(22, 16, 6)
    // Crinkle-cut carrot slivers
    pickleGfx.fillStyle(0xea580c, 1)
    pickleGfx.fillRect(12, 18, 11, 3)
    pickleGfx.fillRect(17, 12, 3, 10)
    pickleGfx.generateTexture('bowl_pickle', 36, 36)
    pickleGfx.destroy()

    // =========================================================================
    // 25. PARTICLE & FX TEXTURES
    // =========================================================================
    const bubbleGfx = this.make.graphics({ x: 0, y: 0 })
    bubbleGfx.fillStyle(0xfef08a, 0.9)
    bubbleGfx.fillCircle(6, 6, 6)
    bubbleGfx.fillStyle(0xffffff, 0.8)
    bubbleGfx.fillCircle(4, 4, 2)
    bubbleGfx.generateTexture('oil_bubble', 12, 12)
    bubbleGfx.destroy()

    const splashGfx = this.make.graphics({ x: 0, y: 0 })
    splashGfx.fillStyle(0xfef08a, 1)
    splashGfx.fillCircle(4, 4, 4)
    splashGfx.generateTexture('oil_splash', 8, 8)
    splashGfx.destroy()

    const steamGfx = this.make.graphics({ x: 0, y: 0 })
    steamGfx.fillStyle(0xffffff, 0.3)
    steamGfx.fillCircle(8, 8, 8)
    steamGfx.generateTexture('oil_steam', 16, 16)
    steamGfx.destroy()
  }
}
