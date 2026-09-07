import Phaser from 'phaser'
import { CookingManager } from '../systems/CookingManager'
import { CookingState, FryingItem } from '../types'
import { getFoodConfig } from '../data/catalog'
import { getSauceConfig } from '../data/sauces'
import { useAppStore } from '@/store/useAppStore'
import { soundManager } from '../audio/soundManager'
import { triggerHaptic } from '../systems/haptics'
import { isReducedMotionPreferred, getAnimationDuration } from '../systems/accessibility'

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
  private panHeaderLabel?: Phaser.GameObjects.Text
  private panSlots = 6
  private speedTongsFactor = 1.0
  private itemsPerPage = 4
  private currentTrayPage = 0
  private unsubscribeStore?: () => void

  private getSlotOffsets(count: number): { x: number; y: number }[] {
    if (count === 8) {
      return [
        { x: -105, y: -45 },
        { x: -35, y: -45 },
        { x: 35, y: -45 },
        { x: 105, y: -45 },
        { x: -105, y: 45 },
        { x: -35, y: 45 },
        { x: 35, y: 45 },
        { x: 105, y: 45 },
      ]
    }
    if (count === 10) {
      return [
        { x: -120, y: -45 },
        { x: -60, y: -45 },
        { x: 0, y: -45 },
        { x: 60, y: -45 },
        { x: 120, y: -45 },
        { x: -120, y: 45 },
        { x: -60, y: 45 },
        { x: 0, y: 45 },
        { x: 60, y: 45 },
        { x: 120, y: 45 },
      ]
    }
    return [
      { x: -90, y: -45 },
      { x: 0, y: -45 },
      { x: 90, y: -45 },
      { x: -90, y: 45 },
      { x: 0, y: 45 },
      { x: 90, y: 45 },
    ]
  }

  private applyUpgradesFromStore() {
    const { upgrades } = useAppStore.getState()
    const panTier = upgrades?.pan_capacity ?? 1
    const oilTier = upgrades?.oil_thermostat ?? 1
    const awningTier = upgrades?.awning_comfort ?? 1
    const tongsTier = upgrades?.speed_tongs ?? 1
    const trayTier = upgrades?.tray_expansion ?? 1

    const newSlots = panTier === 3 ? 10 : panTier === 2 ? 8 : 6
    const perfectBonus = oilTier === 3 ? 2000 : oilTier === 2 ? 1000 : 0
    const patienceBonus = awningTier === 3 ? 30000 : awningTier === 2 ? 15000 : 0
    this.speedTongsFactor = tongsTier === 3 ? 2.0 : tongsTier === 2 ? 1.5 : 1.0
    this.itemsPerPage = trayTier >= 2 ? 6 : 4

    this.cookingManager.setUpgradeModifiers({
      maxPanSlots: newSlots,
      perfectWindowBonusMs: perfectBonus,
      customerPatienceBonusMs: patienceBonus,
    })

    if (newSlots !== this.panSlots) {
      this.panSlots = newSlots
      this.rebuildPanSlots()
    }
  }

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
    const panY = 240
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
    this.panHeaderLabel = this.add
      .text(width / 2, panY - 110, `CHẢO DẦU SÔI (${this.panSlots} NGĂN)`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5)

    // Apply upgrade modifiers before building slots
    this.applyUpgradesFromStore()

    // 4. Setup Pan Slot Displays
    this.setupPanSlots(width / 2, panY)

    // 5. Setup Sauce Bar (Between Pan and Plate)
    const sauceY = 360
    this.setupSauceBar(width / 2, sauceY)

    // 6. Serving Plate Section (Between Sauce and Tray)
    const plateY = 460
    this.setupServingPlate(width / 2, plateY)

    // 7. Food Prep Tray (Bottom)
    const trayY = height - 80
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

    // Store subscription for live upgrade & audio updates
    this.unsubscribeStore = useAppStore.subscribe((state, prevState) => {
      if (state.upgrades !== prevState.upgrades) {
        this.applyUpgradesFromStore()
      }
      if (
        state.soundEnabled !== prevState.soundEnabled ||
        state.soundVolume !== prevState.soundVolume
      ) {
        if (!state.soundEnabled) {
          soundManager.stopFryingLoop()
        } else {
          soundManager.updateFryingVolume()
        }
      }
    })
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

    // Customer Name & Serving Style Label
    const styleLabel = order.servingStyle === 'tray' ? '🍽️ Khay' : '🍢 Xiên'
    const nameText = this.add
      .text(-width / 2 + 24, -40, `👤 ${order.customerName}  •  ${styleLabel}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
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
      .text(-width / 2 + 24, -20, `Món: ${orderSummary}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0, 0)
    this.orderContainer.add(itemsText)

    // Requested Sauces & Garnish
    const sauceNames = order.requestedSauces
      .map((s) => getSauceConfig(s)?.displayNameVi ?? s)
      .join(', ')
    const pickleText = order.hasDuaChua ? ' + Dưa chua' : ''
    const sauceSummary = sauceNames ? `Sốt: ${sauceNames}${pickleText}` : 'Không cần sốt'

    const sauceReqText = this.add
      .text(-width / 2 + 24, 0, sauceSummary, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fde047',
      })
      .setOrigin(0, 0)
    this.orderContainer.add(sauceReqText)

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
    const offsets = this.getSlotOffsets(this.panSlots)

    for (let i = 0; i < this.panSlots; i++) {
      const offset = offsets[i] || { x: 0, y: 0 }
      const slotX = centerX + offset.x
      const slotY = centerY + offset.y

      const container = this.add.container(slotX, slotY)

      // Slot circular wire basket base
      const basketGfx = this.add.graphics()
      basketGfx.lineStyle(1.5, 0x78350f, 0.6)
      basketGfx.strokeCircle(0, 0, this.panSlots > 6 ? 24 : 30)
      container.add(basketGfx)

      // Progress arc graphics
      const progressGfx = this.add.graphics()
      container.add(progressGfx)

      // Food item sprite placeholder (initially invisible)
      const sprite = this.add.image(0, 0, 'fish_ball_classic').setVisible(false)
      if (this.panSlots > 6) sprite.setScale(0.85)
      sprite.setInteractive({ cursor: 'pointer' })
      const slotIndex = i
      sprite.on('pointerdown', () => this.handleScoopFood(slotIndex))
      container.add(sprite)

      // Cooking state label badge
      const stateText = this.add
        .text(0, this.panSlots > 6 ? 22 : 26, '', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: this.panSlots > 6 ? '8px' : '9px',
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

  private rebuildPanSlots() {
    for (const display of this.slotDisplays) {
      display.container.destroy()
    }
    this.slotDisplays = []
    this.setupPanSlots(this.scale.width / 2, 240)
    if (this.panHeaderLabel) {
      this.panHeaderLabel.setText(`CHẢO DẦU SÔI (${this.panSlots} NGĂN)`)
    }
  }

  private setupSauceBar(centerX: number, sauceY: number) {
    // Title
    this.add
      .text(centerX, sauceY - 32, 'QUẦY NƯỚC SỐT (CHẠM ĐỂ RƯỚI VÀO DĨA):', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#fef08a',
      })
      .setOrigin(0.5)

    const sauces = [
      { id: 'tuong_ot', label: 'Tương ớt', sprite: 'bottle_chili' },
      { id: 'tuong_den', label: 'Tương đen', sprite: 'bottle_black' },
      { id: 'mayo', label: 'Mayo', sprite: 'bottle_mayo' },
      { id: 'sot_me', label: 'Sốt me', sprite: 'bottle_tamarind' },
      { id: 'dua_chua', label: 'Dưa chua', sprite: 'bowl_pickle' },
    ]

    const spacing = 68
    const startX = centerX - ((sauces.length - 1) * spacing) / 2

    sauces.forEach((s, idx) => {
      const bottleX = startX + idx * spacing
      const bottle = this.add.image(bottleX, sauceY, s.sprite).setInteractive({ cursor: 'pointer' })

      this.add
        .text(bottleX, sauceY + 28, s.label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#e2e8f0',
        })
        .setOrigin(0.5)

      bottle.on('pointerdown', () => {
        soundManager.playSauceSquirt()
        triggerHaptic('light')

        // Squeeze bounce
        this.tweens.add({
          targets: bottle,
          scaleY: 0.8,
          scaleX: 1.15,
          yoyo: true,
          duration: getAnimationDuration(90),
          ease: 'Quad.easeInOut',
        })

        if (s.id === 'dua_chua') {
          const added = this.cookingManager.togglePlateDuaChua()
          this.showToast(added ? '🥒 Đã thêm Dưa chua vào dĩa!' : 'Đã bỏ Dưa chua')
        } else {
          const added = this.cookingManager.togglePlateSauce(s.id)
          this.showToast(added ? `🥫 Đã rưới ${s.label} vào dĩa!` : `Đã bỏ ${s.label}`)
        }
        this.refreshPlateDisplay()
      })
    })
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
      const maxPages = Math.ceil(totalFoods / this.itemsPerPage)
      if (this.currentTrayPage < maxPages - 1) {
        this.currentTrayPage++
        this.refreshFoodPrepTray()
      }
    })

    // Render initial tray
    this.refreshFoodPrepTray()

    // Subscribe to store updates when new foods or upgrades are purchased
    this.unsubscribeStore = useAppStore.subscribe((state, prev) => {
      if (state.unlockedFoods.length !== prev.unlockedFoods.length) {
        this.refreshFoodPrepTray()
        const newOrder = this.cookingManager.generateCustomerOrder(state.unlockedFoods)
        const { startOrder } = useAppStore.getState()
        startOrder(newOrder.items.map((it) => ({ foodId: it.foodId, quantity: it.quantity })))
          .then((serverOrder) => {
            if (serverOrder) newOrder.orderId = serverOrder.id
          })
          .catch(() => {})
        this.refreshOrderDisplay()
      }
      if (state.upgrades !== prev.upgrades) {
        this.applyUpgradesFromStore()
        this.refreshFoodPrepTray()
      }
      if (state.soundVolume !== prev.soundVolume || state.soundEnabled !== prev.soundEnabled) {
        soundManager.updateFryingVolume()
      }
    })

    // Register initial order with backend if online
    const initialOrder = this.cookingManager.getCurrentOrder()
    if (initialOrder) {
      useAppStore
        .getState()
        .startOrder(initialOrder.items.map((it) => ({ foodId: it.foodId, quantity: it.quantity })))
        .then((serverOrder) => {
          if (serverOrder) initialOrder.orderId = serverOrder.id
        })
        .catch(() => {})
    }
  }

  private refreshFoodPrepTray() {
    if (!this.trayItemsContainer) return
    this.trayItemsContainer.removeAll(true)

    const { unlockedFoods } = useAppStore.getState()
    const activeFoodIds =
      unlockedFoods.length > 0
        ? unlockedFoods
        : ['fish_ball_classic', 'beef_ball_classic', 'sausage_red', 'fish_tofu']

    const itemsPerPage = this.itemsPerPage
    const pageStart = this.currentTrayPage * itemsPerPage
    const pageItems = activeFoodIds.slice(pageStart, pageStart + itemsPerPage)

    const slotStartX = itemsPerPage === 6 ? -150 : -130
    const slotSpacing = itemsPerPage === 6 ? 60 : 86

    pageItems.forEach((foodId, index) => {
      const food = getFoodConfig(foodId)
      if (!food) return

      const itemX = slotStartX + index * slotSpacing

      const sprite = this.add.image(itemX, 0, food.spriteKey).setInteractive({ cursor: 'pointer' })
      if (itemsPerPage === 6) sprite.setScale(0.85)

      const label = this.add
        .text(itemX, 32, food.displayNameVi, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: itemsPerPage === 6 ? '9px' : '10px',
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

    const offsets = this.getSlotOffsets(this.panSlots)
    const offset = offsets[slotIndex] || { x: 0, y: 0 }
    const targetX = this.scale.width / 2 + offset.x
    const targetY = 240 + offset.y

    soundManager.playDropSplash()
    triggerHaptic('light')

    // Flying drop animation into pan
    const flyingSprite = this.add.image(fromX, fromY, getFoodConfig(foodId)?.spriteKey ?? foodId)
    this.tweens.add({
      targets: flyingSprite,
      x: targetX,
      y: targetY,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: getAnimationDuration(250),
      ease: 'Back.easeOut',
      onComplete: () => {
        flyingSprite.destroy()

        // Splash particle effect on drop into hot oil
        if (!isReducedMotionPreferred()) {
          const splash = this.add.particles(targetX, targetY, 'oil_splash', {
            speed: { min: 40, max: 90 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            lifespan: 300,
            quantity: 6,
          })
          this.time.delayedCall(300, () => splash.destroy())
        }
      },
    })
  }

  private handleScoopFood(slotIndex: number) {
    const plateItem = this.cookingManager.removeFoodFromPan(slotIndex)
    if (!plateItem) return

    soundManager.playScoop()
    triggerHaptic('medium')

    const offsets = this.getSlotOffsets(this.panSlots)
    const offset = offsets[slotIndex] || { x: 0, y: 0 }
    const fromX = this.scale.width / 2 + offset.x
    const fromY = 240 + offset.y

    // Flying scoop animation towards serving plate (duration scaled by speed tongs)
    const config = getFoodConfig(plateItem.foodId)
    const flyingSprite = this.add.image(fromX, fromY, config?.spriteKey ?? plateItem.foodId)

    this.tweens.add({
      targets: flyingSprite,
      x: this.scale.width / 2,
      y: 445,
      duration: getAnimationDuration(Math.round(220 / this.speedTongsFactor)),
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

    // Render Applied Sauces & Garnish bar on plate
    const appliedSauces = this.cookingManager.getSelectedSauces()
    const hasDuaChua = this.cookingManager.getHasDuaChua()

    const sauceLabels = appliedSauces.map((s) => getSauceConfig(s)?.displayNameVi ?? s)
    if (hasDuaChua) sauceLabels.push('Dưa chua')

    if (sauceLabels.length > 0) {
      const saucePlateText = this.add
        .text(0, 24, `Đã rưới: ${sauceLabels.join(' + ')}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#fef08a',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
      this.plateContainer?.add(saucePlateText)
    }
  }

  private async handleServeOrder() {
    const currentOrder = this.cookingManager.getCurrentOrder()
    const appliedSauces = this.cookingManager.getSelectedSauces()
    const hasDuaChua = this.cookingManager.getHasDuaChua()

    const evalResult = this.cookingManager.serveCurrentOrder()

    if (!evalResult.success) {
      soundManager.playError()
      triggerHaptic('warning')
      this.showToast(`❌ ${evalResult.feedback}`)
      return
    }

    soundManager.playCashChime()
    triggerHaptic('success')

    // Submit reward to server-authoritative backend
    const { submitOrderReward, startOrder, isOnline } = useAppStore.getState()
    let orderId = currentOrder?.orderId ?? `ord_${Date.now()}`

    if (isOnline && (!orderId || orderId.startsWith('order_'))) {
      const serverOrder = await startOrder(
        currentOrder?.items.map((it) => ({ foodId: it.foodId, quantity: it.quantity })),
      )
      if (serverOrder) {
        orderId = serverOrder.id
      }
    }

    const servedItems =
      evalResult.servedItems ??
      (currentOrder?.items ?? []).map((it) => ({ foodId: it.foodId, state: 'perfect' as const }))

    submitOrderReward({
      orderId,
      items: servedItems,
      appliedSauces,
      hasDuaChua,
      coinsEarned: evalResult.coinsEarned,
      xpEarned: evalResult.xpEarned,
    })

    // Show satisfaction celebration toast
    const tipText = evalResult.satisfactionScore >= 80 ? ' • Thưởng Tip +25%!' : ''
    this.showToast(
      `🎉 ${evalResult.feedback}\n+${evalResult.coinsEarned.toLocaleString('vi-VN')} đ  (+${evalResult.xpEarned} XP)\nHài lòng: ${evalResult.satisfactionScore}%${tipText}`,
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
    const hasCookingItems = slots.some((s) => s !== null)
    if (hasCookingItems) {
      soundManager.startFryingLoop()
    } else {
      soundManager.stopFryingLoop()
    }

    for (let i = 0; i < this.slotDisplays.length; i++) {
      const item: FryingItem | null = slots[i]
      const display = this.slotDisplays[i]
      if (!display) continue

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
    soundManager.stopFryingLoop()
  }
}
