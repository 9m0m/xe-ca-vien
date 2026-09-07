import Phaser from 'phaser'
import { CookingManager } from '../systems/CookingManager'
import { CookingState, FryingItem } from '../types'
import { getFoodConfig } from '../data/catalog'
import { useAppStore } from '@/store/useAppStore'

interface SlotDisplay {
  container: Phaser.GameObjects.Container
  sprite: Phaser.GameObjects.Image
  progressGfx: Phaser.GameObjects.Graphics
  stateText: Phaser.GameObjects.Text
  smokeParticles?: Phaser.GameObjects.Particles.ParticleEmitter
}

export class KitchenScene extends Phaser.Scene {
  private cookingManager!: CookingManager
  private panImage?: Phaser.GameObjects.Image
  private bubbleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter

  // Display containers
  private slotDisplays: SlotDisplay[] = []
  private plateContainer?: Phaser.GameObjects.Container
  private orderContainer?: Phaser.GameObjects.Container
  private feedbackText?: Phaser.GameObjects.Text

  // Coordinates for 6 pan slots (2 rows of 3)
  private readonly slotOffsets = [
    { x: -90, y: -45 },
    { x: 0, y: -45 },
    { x: 90, y: -45 },
    { x: -90, y: 45 },
    { x: 0, y: 45 },
    { x: 90, y: 45 },
  ]

  constructor() {
    super('KitchenScene')
  }

  create() {
    this.cookingManager = new CookingManager(6)
    const { width, height } = this.scale

    // 1. Counter background surface
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a)

    // 2. Customer Order Section (Top 120px)
    this.setupOrderDisplay(width)

    // 3. Frying Pan Section (Center)
    const panY = 270
    this.panImage = this.add.image(width / 2, panY, 'pan_surface').setOrigin(0.5)

    // Simmering oil bubble particles
    this.bubbleEmitter = this.add.particles(width / 2, panY, 'oil_bubble', {
      x: { min: -140, max: 140 },
      y: { min: -95, max: 95 },
      scale: { start: 0.3, end: 0.9 },
      alpha: { start: 0.8, end: 0 },
      speedY: { min: -15, max: -35 },
      lifespan: 1100,
      frequency: 200,
      quantity: 2,
    })

    // Pan Header label
    this.add
      .text(width / 2, panY - 110, 'CHẢO DẦU SÔI (6 NGĂN)', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5)

    // 4. Setup 6 Pan Slot Displays
    this.setupPanSlots(width / 2, panY)

    // 5. Serving Plate Section (Between Pan and Tray)
    const plateY = 445
    this.setupServingPlate(width / 2, plateY)

    // 6. Food Prep Tray (Bottom)
    const trayY = height - 85
    this.setupFoodPrepTray(width / 2, trayY)

    // 7. Temporary Feedback text banner
    this.feedbackText = this.add
      .text(width / 2, height / 2, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fef08a',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(100)

    // Initial render of order
    this.refreshOrderDisplay()
  }

  private setupOrderDisplay(width: number) {
    this.orderContainer = this.add.container(width / 2, 65)

    // Order Board Background
    const bg = this.add.graphics()
    bg.fillStyle(0x1e2530, 0.95)
    bg.fillRoundedRect(-width / 2 + 12, -50, width - 24, 100, 8)
    bg.lineStyle(1.5, 0x475569, 1)
    bg.strokeRoundedRect(-width / 2 + 12, -50, width - 24, 100, 8)
    this.orderContainer.add(bg)
  }

  private refreshOrderDisplay() {
    if (!this.orderContainer) return
    const order = this.cookingManager.getCurrentOrder()
    const { width } = this.scale

    // Clear previous dynamic texts and buttons in container (keep background at index 0)
    while (this.orderContainer.length > 1) {
      const child = this.orderContainer.getAt(1)
      this.orderContainer.remove(child, true)
    }

    if (!order) return

    // Customer Name Label
    const nameText = this.add
      .text(-width / 2 + 24, -40, `👤 ${order.customerName}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f59e0b',
      })
      .setOrigin(0, 0)
    this.orderContainer.add(nameText)

    // Order Items list
    const orderSummary = order.items
      .map((it) => {
        const food = getFoodConfig(it.foodId)
        return `${it.quantity}x ${food?.displayNameVi ?? it.foodId}`
      })
      .join('  •  ')

    const itemsText = this.add
      .text(-width / 2 + 24, -18, `Yêu cầu: ${orderSummary}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0, 0)
    this.orderContainer.add(itemsText)

    // Serve Button ("Giao Món")
    const btnWidth = 110
    const btnHeight = 30
    const btnX = width / 2 - 24 - btnWidth / 2
    const btnY = 22

    const btnGfx = this.add.graphics()
    btnGfx.fillStyle(0xd97706, 1)
    btnGfx.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 6)
    btnGfx.lineStyle(1, 0xb45309, 1)
    btnGfx.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 6)

    const btnText = this.add
      .text(btnX, btnY, 'Giao Món ❯', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    // Serve interactive zone
    const hitZone = this.add
      .zone(btnX, btnY, btnWidth, btnHeight)
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })

    hitZone.on('pointerdown', () => this.handleServeOrder())

    this.orderContainer.add([btnGfx, btnText, hitZone])
  }

  private setupPanSlots(centerX: number, centerY: number) {
    this.slotDisplays = []

    for (let i = 0; i < 6; i++) {
      const offset = this.slotOffsets[i]
      const slotX = centerX + offset.x
      const slotY = centerY + offset.y

      const container = this.add.container(slotX, slotY)

      // Slot circular wire basket base
      const basketGfx = this.add.graphics()
      basketGfx.lineStyle(1.5, 0x78350f, 0.6)
      basketGfx.strokeCircle(0, 0, 30)
      container.add(basketGfx)

      // Progress arc graphics
      const progressGfx = this.add.graphics()
      container.add(progressGfx)

      // Food item sprite placeholder (initially invisible)
      const sprite = this.add.image(0, 0, 'fish_ball_classic').setVisible(false)
      sprite.setInteractive({ cursor: 'pointer' })
      const slotIndex = i
      sprite.on('pointerdown', () => this.handleScoopFood(slotIndex))
      container.add(sprite)

      // Cooking state label badge
      const stateText = this.add
        .text(0, 26, '', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
      container.add(stateText)

      this.slotDisplays.push({
        container,
        sprite,
        progressGfx,
        stateText,
      })
    }
  }

  private setupServingPlate(centerX: number, plateY: number) {
    this.add.image(centerX, plateY, 'serving_plate').setOrigin(0.5)

    // Plate Title
    this.add
      .text(centerX - 160, plateY - 32, 'DĨA CHỜ GIAO:', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#94a3b8',
      })
      .setOrigin(0, 0)

    // Container holding food items resting on plate
    this.plateContainer = this.add.container(centerX, plateY)
  }

  private trayItemsContainer?: Phaser.GameObjects.Container
  private currentTrayPage = 0
  private unsubscribeStore?: () => void

  private setupFoodPrepTray(centerX: number, trayY: number) {
    this.add.image(centerX, trayY, 'prep_tray').setOrigin(0.5)

    // Tray Header Title
    this.add
      .text(centerX, trayY - 65, 'KHAY NGUYÊN LIỆU (CHẠM ĐỂ THẢ VÀO CHẢO)', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)

    this.trayItemsContainer = this.add.container(centerX, trayY)

    // Left Page Arrow (<)
    const prevBtn = this.add
      .text(centerX - 170, trayY, '◀', {
        fontSize: '16px',
        color: '#f59e0b',
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })

    prevBtn.on('pointerdown', () => {
      if (this.currentTrayPage > 0) {
        this.currentTrayPage--
        this.refreshFoodPrepTray()
      }
    })

    // Right Page Arrow (>)
    const nextBtn = this.add
      .text(centerX + 170, trayY, '▶', {
        fontSize: '16px',
        color: '#f59e0b',
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })

    nextBtn.on('pointerdown', () => {
      const { unlockedFoods } = useAppStore.getState()
      const totalFoods = unlockedFoods.length > 0 ? unlockedFoods.length : 4
      const maxPages = Math.ceil(totalFoods / 4)
      if (this.currentTrayPage < maxPages - 1) {
        this.currentTrayPage++
        this.refreshFoodPrepTray()
      }
    })

    // Render initial tray
    this.refreshFoodPrepTray()

    // Subscribe to store updates when new foods are purchased
    this.unsubscribeStore = useAppStore.subscribe((state, prev) => {
      if (state.unlockedFoods.length !== prev.unlockedFoods.length) {
        this.refreshFoodPrepTray()
        this.cookingManager.generateCustomerOrder(state.unlockedFoods)
        this.refreshOrderDisplay()
      }
    })
  }

  private refreshFoodPrepTray() {
    if (!this.trayItemsContainer) return
    this.trayItemsContainer.removeAll(true)

    const { unlockedFoods } = useAppStore.getState()
    const activeFoodIds =
      unlockedFoods.length > 0
        ? unlockedFoods
        : ['fish_ball_classic', 'beef_ball_classic', 'sausage_red', 'fish_tofu']

    const itemsPerPage = 4
    const pageStart = this.currentTrayPage * itemsPerPage
    const pageItems = activeFoodIds.slice(pageStart, pageStart + itemsPerPage)

    const slotStartX = -130
    const slotSpacing = 86

    pageItems.forEach((foodId, index) => {
      const food = getFoodConfig(foodId)
      if (!food) return

      const itemX = slotStartX + index * slotSpacing

      const sprite = this.add.image(itemX, 0, food.spriteKey).setInteractive({ cursor: 'pointer' })

      const label = this.add
        .text(itemX, 32, food.displayNameVi, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#f8fafc',
        })
        .setOrigin(0.5)

      // Tap to drop into hot pan
      const screenX = this.scale.width / 2 + itemX
      const screenY = this.scale.height - 85
      sprite.on('pointerdown', () => this.handleDropFoodToPan(food.id, screenX, screenY))

      this.trayItemsContainer?.add([sprite, label])
    })
  }

  private handleDropFoodToPan(foodId: string, fromX: number, fromY: number) {
    const slotIndex = this.cookingManager.addFoodToPan(foodId)
    if (slotIndex === null) {
      this.showToast('Chảo đã đầy! Hãy vớt bớt món ra dĩa.')
      return
    }

    const offset = this.slotOffsets[slotIndex]
    const targetX = this.scale.width / 2 + offset.x
    const targetY = 270 + offset.y

    // Flying drop animation into pan
    const flyingSprite = this.add.image(fromX, fromY, getFoodConfig(foodId)?.spriteKey ?? foodId)
    this.tweens.add({
      targets: flyingSprite,
      x: targetX,
      y: targetY,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        flyingSprite.destroy()

        // Splash particle effect on drop into hot oil
        const splash = this.add.particles(targetX, targetY, 'oil_splash', {
          speed: { min: 40, max: 90 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.8, end: 0 },
          lifespan: 300,
          quantity: 6,
        })
        this.time.delayedCall(300, () => splash.destroy())
      },
    })
  }

  private handleScoopFood(slotIndex: number) {
    const plateItem = this.cookingManager.removeFoodFromPan(slotIndex)
    if (!plateItem) return

    const offset = this.slotOffsets[slotIndex]
    const fromX = this.scale.width / 2 + offset.x
    const fromY = 270 + offset.y

    // Flying scoop animation towards serving plate
    const config = getFoodConfig(plateItem.foodId)
    const flyingSprite = this.add.image(fromX, fromY, config?.spriteKey ?? plateItem.foodId)

    this.tweens.add({
      targets: flyingSprite,
      x: this.scale.width / 2,
      y: 445,
      duration: 220,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        flyingSprite.destroy()
        this.refreshPlateDisplay()
      },
    })
  }

  private refreshPlateDisplay() {
    if (!this.plateContainer) return
    this.plateContainer.removeAll(true)

    const items = this.cookingManager.getPlateItems()
    const maxItemsToShow = 6
    const displayedItems = items.slice(-maxItemsToShow)

    const spacing = 50
    const startX = -((displayedItems.length - 1) * spacing) / 2

    displayedItems.forEach((item, idx) => {
      const config = getFoodConfig(item.foodId)
      if (!config) return

      const itemX = startX + idx * spacing
      const sprite = this.add.image(itemX, -6, config.spriteKey).setScale(0.75)

      // Apply tint based on cooking state
      this.applyCookingTint(sprite, item.state)

      // Small state badge
      const badgeText = item.state === 'perfect' ? '⭐' : item.state === 'overcooked' ? '💀' : '✓'
      const badge = this.add
        .text(itemX + 12, 12, badgeText, {
          fontSize: '11px',
        })
        .setOrigin(0.5)

      this.plateContainer?.add([sprite, badge])
    })
  }

  private handleServeOrder() {
    const currentOrder = this.cookingManager.getCurrentOrder()
    const evalResult = this.cookingManager.serveCurrentOrder()

    if (!evalResult.success) {
      this.showToast(`❌ ${evalResult.feedback}`)
      return
    }

    // Submit reward to server-authoritative backend
    const { submitOrderReward } = useAppStore.getState()
    submitOrderReward({
      orderId: currentOrder?.orderId ?? `ord_${Date.now()}`,
      items: (currentOrder?.items ?? []).map((it) => ({ foodId: it.foodId, state: 'perfect' })),
      coinsEarned: evalResult.coinsEarned,
      xpEarned: evalResult.xpEarned,
    })

    // Show celebration toast
    this.showToast(
      `🎉 ${evalResult.feedback}\n+${evalResult.coinsEarned.toLocaleString('vi-VN')} đ  (+${evalResult.xpEarned} XP)`,
    )

    // Refresh display
    this.refreshPlateDisplay()
    this.refreshOrderDisplay()
  }

  private applyCookingTint(sprite: Phaser.GameObjects.Image, state: CookingState) {
    if (state === 'raw') {
      sprite.clearTint()
    } else if (state === 'cooking') {
      sprite.setTint(0xfde047) // Light sizzling yellow
    } else if (state === 'perfect') {
      sprite.setTint(0xf59e0b) // Rich golden fried crust
    } else if (state === 'overcooked') {
      sprite.setTint(0x451a03) // Dark overcooked charcoal
    }
  }

  private showToast(message: string) {
    if (!this.feedbackText) return

    this.feedbackText.setText(message).setAlpha(1).setScale(1.1)
    this.tweens.killTweensOf(this.feedbackText)
    this.tweens.add({
      targets: this.feedbackText,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      delay: 1600,
      duration: 400,
      ease: 'Quad.easeOut',
    })
  }

  update(_time: number, delta: number) {
    this.cookingManager.update(delta)

    const slots = this.cookingManager.getSlots()

    for (let i = 0; i < 6; i++) {
      const item: FryingItem | null = slots[i]
      const display = this.slotDisplays[i]

      if (!item) {
        display.sprite.setVisible(false)
        display.progressGfx.clear()
        display.stateText.setText('')
        continue
      }

      const config = getFoodConfig(item.foodId)
      if (!config) continue

      display.sprite.setVisible(true)
      display.sprite.setTexture(config.spriteKey)

      // Dynamic cooking tint
      this.applyCookingTint(display.sprite, item.state)

      // Draw progress arc around the food slot
      display.progressGfx.clear()

      let arcColor = 0xfde047
      if (item.state === 'perfect') arcColor = 0x22c55e // Green / Golden success
      if (item.state === 'overcooked') arcColor = 0xef4444 // Red overcook warning

      display.progressGfx.lineStyle(3, arcColor, 0.9)
      const normalizedAngle = Math.min(1, item.progress > 1 ? item.progress - 1 : item.progress)
      display.progressGfx.beginPath()
      display.progressGfx.arc(
        0,
        0,
        28,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + normalizedAngle * 360),
        false,
      )
      display.progressGfx.strokePath()

      // State badge text
      if (item.state === 'raw') {
        display.stateText.setText('Sống').setColor('#fde68a')
      } else if (item.state === 'cooking') {
        display.stateText.setText('Đang chiên...').setColor('#fef08a')
      } else if (item.state === 'perfect') {
        display.stateText.setText('VÀNG GIÒN!').setColor('#4ade80')
      } else {
        display.stateText.setText('CHÁY!').setColor('#f87171')
      }
    }
  }

  destroy() {
    this.unsubscribeStore?.()
    this.bubbleEmitter?.destroy()
  }
}
