import {
  CustomerOrder,
  FoodItemConfig,
  FryingItem,
  PlateItem,
  ServeEvaluation,
  ServingStyle,
} from '../types'
import { getFoodConfig, FULL_FOOD_CATALOG } from '../data/catalog'

export class CookingManager {
  private maxPanSlots: number
  private slots: (FryingItem | null)[]
  private plateItems: PlateItem[] = []
  private selectedSauces: string[] = []
  private hasDuaChua = false
  private currentOrder: CustomerOrder | null = null

  private customerNames = [
    'Khách quen áo xanh',
    'Học sinh tan trường',
    'Chị văn phòng',
    'Anh tài xế công nghệ',
    'Cô hàng xóm',
    'Bạn sinh viên',
    'Bác xe ôm đầu ngõ',
    'Cặp đôi đi dạo',
  ]

  constructor(maxPanSlots = 6) {
    this.maxPanSlots = maxPanSlots
    this.slots = new Array(maxPanSlots).fill(null)
    this.generateCustomerOrder()
  }

  public getMaxSlots(): number {
    return this.maxPanSlots
  }

  public getSlots(): (FryingItem | null)[] {
    return [...this.slots]
  }

  public getPlateItems(): PlateItem[] {
    return [...this.plateItems]
  }

  public getSelectedSauces(): string[] {
    return [...this.selectedSauces]
  }

  public getHasDuaChua(): boolean {
    return this.hasDuaChua
  }

  public togglePlateSauce(sauceId: string): boolean {
    if (this.selectedSauces.includes(sauceId)) {
      this.selectedSauces = this.selectedSauces.filter((s) => s !== sauceId)
      return false
    } else {
      this.selectedSauces.push(sauceId)
      return true
    }
  }

  public togglePlateDuaChua(): boolean {
    this.hasDuaChua = !this.hasDuaChua
    return this.hasDuaChua
  }

  public clearSauces(): void {
    this.selectedSauces = []
    this.hasDuaChua = false
  }

  public getCurrentOrder(): CustomerOrder | null {
    return this.currentOrder
  }

  public getFirstAvailableSlot(): number | null {
    const idx = this.slots.findIndex((s) => s === null)
    return idx !== -1 ? idx : null
  }

  public addFoodToPan(foodId: string): number | null {
    const slotIdx = this.getFirstAvailableSlot()
    if (slotIdx === null) return null

    const config = getFoodConfig(foodId)
    if (!config) return null

    const fryingItem: FryingItem = {
      slotIndex: slotIdx,
      foodId,
      startTime: Date.now(),
      elapsedMs: 0,
      state: 'raw',
      progress: 0,
    }

    this.slots[slotIdx] = fryingItem
    return slotIdx
  }

  public update(deltaMs: number): void {
    for (let i = 0; i < this.maxPanSlots; i++) {
      const item = this.slots[i]
      if (!item) continue

      const config = getFoodConfig(item.foodId)
      if (!config) continue

      item.elapsedMs += deltaMs

      const cookTime = config.cookTimeMs
      const perfectEnd = cookTime + config.perfectWindowMs

      if (item.elapsedMs < cookTime * 0.6) {
        item.state = 'raw'
        item.progress = item.elapsedMs / cookTime
      } else if (item.elapsedMs < cookTime) {
        item.state = 'cooking'
        item.progress = item.elapsedMs / cookTime
      } else if (item.elapsedMs <= perfectEnd) {
        item.state = 'perfect'
        item.progress = 1.0 + (item.elapsedMs - cookTime) / config.perfectWindowMs
      } else {
        item.state = 'overcooked'
        item.progress = 2.0 + (item.elapsedMs - perfectEnd) / config.overcookTimeMs
      }
    }
  }

  public removeFoodFromPan(slotIndex: number): PlateItem | null {
    if (slotIndex < 0 || slotIndex >= this.maxPanSlots) return null
    const item = this.slots[slotIndex]
    if (!item) return null

    const plateItem: PlateItem = {
      id: `${item.foodId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      foodId: item.foodId,
      state: item.state,
      cookedAt: Date.now(),
    }

    this.slots[slotIndex] = null
    this.plateItems.push(plateItem)
    return plateItem
  }

  public clearPlate(): void {
    this.plateItems = []
    this.clearSauces()
  }

  public generateCustomerOrder(availableFoodIds?: string[]): CustomerOrder {
    const validFoods = availableFoodIds
      ? FULL_FOOD_CATALOG.filter((f) => availableFoodIds.includes(f.id))
      : FULL_FOOD_CATALOG

    const activeFoods = validFoods.length > 0 ? validFoods : FULL_FOOD_CATALOG

    // Pick 1 to 2 distinct items for early/mid orders
    const count = Math.min(activeFoods.length, Math.random() < 0.6 ? 1 : 2)
    const shuffled = [...activeFoods].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count)

    const items = selected.map((f) => ({
      foodId: f.id,
      quantity:
        Math.floor(Math.random() * (f.quantityPerOrderRange[1] - f.quantityPerOrderRange[0] + 1)) +
        f.quantityPerOrderRange[0],
    }))

    const totalItems = items.reduce((sum, it) => sum + it.quantity, 0)
    const customerName = this.customerNames[Math.floor(Math.random() * this.customerNames.length)]

    // Determine sauces from requested foods compatibility
    const allSaucePool = Array.from(new Set(selected.flatMap((f) => f.sauceTags)))
    const requestedSauces: string[] = []
    if (allSaucePool.length > 0) {
      requestedSauces.push(allSaucePool[Math.floor(Math.random() * allSaucePool.length)])
      if (allSaucePool.length > 1 && Math.random() < 0.5) {
        const secondSauce = allSaucePool.find((s) => !requestedSauces.includes(s))
        if (secondSauce) requestedSauces.push(secondSauce)
      }
    }

    const hasDuaChua = Math.random() < 0.45

    // Serving style: skewer for small orders, tray for combo or tray items
    const hasTrayItem = selected.some((f) => f.servingStyle === 'tray')
    const servingStyle: ServingStyle = totalItems > 3 || hasTrayItem ? 'tray' : 'skewer'

    const order: CustomerOrder = {
      orderId: `order_${Date.now()}`,
      customerName,
      items,
      totalItems,
      requestedSauces,
      hasDuaChua,
      servingStyle,
      createdAt: Date.now(),
      patienceMs: 50000,
    }

    this.currentOrder = order
    return order
  }

  public serveCurrentOrder(): ServeEvaluation {
    if (!this.currentOrder) {
      return {
        success: false,
        coinsEarned: 0,
        xpEarned: 0,
        perfectCount: 0,
        acceptableCount: 0,
        undercookedCount: 0,
        overcookedCount: 0,
        satisfactionScore: 0,
        sauceScore: 0,
        speedScore: 0,
        reputationEarned: 0,
        feedback: 'Không có đơn hàng nào đang chờ!',
      }
    }

    let totalCoins = 0
    let totalXp = 0
    let perfectCount = 0
    let acceptableCount = 0
    let undercookedCount = 0
    let overcookedCount = 0

    const remainingPlate = [...this.plateItems]
    const matchedPlateIndices: number[] = []

    let allFulfilled = true

    for (const orderItem of this.currentOrder.items) {
      const config: FoodItemConfig | undefined = getFoodConfig(orderItem.foodId)
      const basePrice = config?.basePrice ?? 5000
      const baseReward = config?.baseReward ?? 20

      let fulfilledForThisType = 0

      for (let i = 0; i < remainingPlate.length; i++) {
        if (matchedPlateIndices.includes(i)) continue
        const item = remainingPlate[i]

        if (item.foodId === orderItem.foodId) {
          matchedPlateIndices.push(i)
          fulfilledForThisType++

          if (item.state === 'perfect') {
            perfectCount++
            totalCoins += Math.round(basePrice * 1.3)
            totalXp += Math.round(baseReward * 1.5)
          } else if (item.state === 'cooking') {
            acceptableCount++
            totalCoins += basePrice
            totalXp += baseReward
          } else if (item.state === 'raw') {
            undercookedCount++
          } else if (item.state === 'overcooked') {
            overcookedCount++
          }

          if (fulfilledForThisType >= orderItem.quantity) break
        }
      }

      if (fulfilledForThisType < orderItem.quantity) {
        allFulfilled = false
      }
    }

    // Remove fulfilled items from plate
    this.plateItems = this.plateItems.filter((_, idx) => !matchedPlateIndices.includes(idx))

    if (!allFulfilled || matchedPlateIndices.length === 0) {
      return {
        success: false,
        coinsEarned: 0,
        xpEarned: 0,
        perfectCount,
        acceptableCount,
        undercookedCount,
        overcookedCount,
        satisfactionScore: 0,
        sauceScore: 0,
        speedScore: 0,
        reputationEarned: 0,
        feedback: 'Chưa đủ món theo yêu cầu của khách!',
      }
    }

    // Calculate Multi-dimensional Satisfaction Score:
    // 1. Cook Score (0 - 50 pts)
    const perfectRatio = perfectCount / matchedPlateIndices.length
    let cookScore = Math.round(perfectRatio * 50)
    if (undercookedCount > 0) cookScore = Math.max(0, cookScore - 25)
    if (overcookedCount > 0) cookScore = Math.max(0, cookScore - 30)

    // 2. Sauce Score (0 - 30 pts)
    let sauceScore = 20
    if (this.currentOrder.requestedSauces.length > 0) {
      let matchedSauces = 0
      for (const sauce of this.currentOrder.requestedSauces) {
        if (this.selectedSauces.includes(sauce)) matchedSauces++
      }
      const sauceRatio = matchedSauces / this.currentOrder.requestedSauces.length
      sauceScore = Math.round(sauceRatio * 30)
    }
    if (this.currentOrder.hasDuaChua) {
      if (this.hasDuaChua) {
        sauceScore = Math.min(30, sauceScore + 5)
      } else {
        sauceScore = Math.max(0, sauceScore - 10)
      }
    }

    // 3. Speed Score (0 - 20 pts)
    const elapsed = Date.now() - this.currentOrder.createdAt
    const remainingRatio = Math.max(0, 1 - elapsed / this.currentOrder.patienceMs)
    const speedScore = Math.round(remainingRatio * 20)

    const satisfactionScore = Math.max(0, Math.min(100, cookScore + sauceScore + speedScore))

    // Handle severe defects
    if (undercookedCount > 0) {
      return {
        success: false,
        coinsEarned: Math.round(totalCoins * 0.5),
        xpEarned: Math.round(totalXp * 0.5),
        perfectCount,
        acceptableCount,
        undercookedCount,
        overcookedCount,
        satisfactionScore,
        sauceScore,
        speedScore,
        reputationEarned: -3,
        feedback: 'Khách phàn nàn: Món còn sống, chưa chín giòn!',
      }
    }

    if (overcookedCount > 0) {
      return {
        success: false,
        coinsEarned: Math.round(totalCoins * 0.4),
        xpEarned: Math.round(totalXp * 0.4),
        perfectCount,
        acceptableCount,
        undercookedCount,
        overcookedCount,
        satisfactionScore,
        sauceScore,
        speedScore,
        reputationEarned: -4,
        feedback: 'Khách phàn nàn: Món bị chiên quá lửa, khét rồi!',
      }
    }

    // Generous Tip Bonus for High Satisfaction (>= 80%)
    let feedback = 'Khách hài lòng với món ăn!'
    let reputationEarned = 2
    if (satisfactionScore >= 80) {
      const tipBonus = Math.round(totalCoins * 0.25)
      totalCoins += tipBonus
      reputationEarned = 5
      feedback = 'Khách mê mẩn! Thưởng thêm tiền tip!'
    } else if (satisfactionScore < 50) {
      reputationEarned = 0
      feedback = 'Khách ăn tạm được nhưng hơi thiếu vị.'
    }

    // Reset plate sauces
    this.clearSauces()

    // Generate next customer order
    this.generateCustomerOrder()

    return {
      success: true,
      coinsEarned: totalCoins,
      xpEarned: totalXp,
      perfectCount,
      acceptableCount,
      undercookedCount,
      overcookedCount,
      satisfactionScore,
      sauceScore,
      speedScore,
      reputationEarned,
      feedback,
    }
  }
}
