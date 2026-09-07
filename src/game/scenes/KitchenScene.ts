import Phaser from 'phaser'

export class KitchenScene extends Phaser.Scene {
  private panImage?: Phaser.GameObjects.Image
  private trayImage?: Phaser.GameObjects.Image
  private bubbleParticles?: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super('KitchenScene')
  }

  create() {
    const { width, height } = this.scale

    // Counter background surface (street cart stainless steel table)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a)

    // Stainless steel table dividing line
    const divider = this.add.graphics()
    divider.lineStyle(2, 0x334155, 1)
    divider.lineBetween(0, height * 0.45, width, height * 0.45)

    // Customer / Order counter zone (upper half)
    this.add
      .text(width / 2, 40, 'KHU VỰC KHÁCH GỌI MÓN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
        align: 'center',
      })
      .setOrigin(0.5)

    // Order prompt placeholder
    const orderPlate = this.add.graphics()
    orderPlate.fillStyle(0x1e293b, 0.9)
    orderPlate.fillRoundedRect(20, 65, width - 40, 70, 8)
    orderPlate.lineStyle(1, 0x475569, 1)
    orderPlate.strokeRoundedRect(20, 65, width - 40, 70, 8)

    this.add
      .text(width / 2, 100, 'Đang chờ khách tới quán...', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5)

    // Frying Pan in middle zone
    const panY = height * 0.45
    this.panImage = this.add.image(width / 2, panY, 'pan_surface').setOrigin(0.5)

    // Sizzling oil bubble particles
    this.bubbleParticles = this.add.particles(width / 2, panY, 'oil_bubble', {
      x: { min: -140, max: 140 },
      y: { min: -100, max: 100 },
      scale: { start: 0.4, end: 1 },
      alpha: { start: 0.8, end: 0 },
      speedY: { min: -20, max: -40 },
      lifespan: 1200,
      frequency: 250,
      quantity: 2,
    })

    // Label for Frying Area
    this.add
      .text(width / 2, panY - 110, 'CHẢO DẦU NÓNG', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5)

    // Bottom Prep Tray (Khu vực khay xiên cá viên)
    const trayY = height - 90
    this.trayImage = this.add.image(width / 2, trayY, 'prep_tray').setOrigin(0.5)

    // Food Tray Label
    this.add
      .text(width / 2, trayY - 70, 'KHAY NGUYÊN LIỆU', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)

    // Sample placeholder food items resting in tray slots
    const foods = [
      { key: 'fish_ball_classic', label: 'Cá viên' },
      { key: 'beef_ball_classic', label: 'Bò viên' },
      { key: 'sausage_red', label: 'Xúc xích' },
    ]

    const slotStartX = width / 2 - 130
    const slotSpacing = 86

    foods.forEach((food, index) => {
      const itemX = slotStartX + index * slotSpacing
      const itemY = trayY

      const sprite = this.add.image(itemX, itemY, food.key).setInteractive({ cursor: 'pointer' })

      this.add
        .text(itemX, itemY + 36, food.label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: '#e2e8f0',
        })
        .setOrigin(0.5)

      // Interactive gentle bounce feedback on tap
      sprite.on('pointerdown', () => {
        this.tweens.add({
          targets: sprite,
          scaleX: 1.15,
          scaleY: 0.85,
          yoyo: true,
          duration: 100,
          ease: 'Quad.easeInOut',
        })
      })
    })
  }

  destroy() {
    this.bubbleParticles?.destroy()
  }
}
