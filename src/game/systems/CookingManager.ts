import { CustomerOrder, FoodItemConfig, FryingItem, PlateItem, ServeEvaluation } from '../types'
import { getFoodConfig, INITIAL_FOOD_CATALOG } from '../data/catalog'

export class CookingManager {
  private maxPanSlots: number
  private slots: (FryingItem | null)[]
  private plateItems: PlateItem[] = []
  private currentOrder: CustomerOrder | null = null

  private customerNames = [
    'Khách quen áo xanh',
    'Học sinh tan trường',
    'Chị văn phòng',
    'Anh tài xế công nghệ',
    'Cô hàng xóm',
    'Bạn sinh viên',
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
  }

  public generateCustomerOrder(availableFoodIds?: string[]): CustomerOrder {
    const validFoods = availableFoodIds
      ? INITIAL_FOOD_CATALOG.filter((f) => availableFoodIds.includes(f.id))
      : INITIAL_FOOD_CATALOG

    const activeFoods = validFoods.length > 0 ? validFoods : INITIAL_FOOD_CATALOG

    // Pick 1 to 2 distinct items for early orders
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

    const order: CustomerOrder = {
      orderId: `order_${Date.now()}`,
      customerName,
      items,
      totalItems,
      createdAt: Date.now(),
      patienceMs: 45000,
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
            totalCoins += Math.round(basePrice * 1.3) // 30% golden bonus tip
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
        feedback: 'Chưa đủ món theo yêu cầu của khách!',
      }
    }

    if (undercookedCount > 0) {
      return {
        success: false,
        coinsEarned: Math.round(totalCoins * 0.5),
        xpEarned: Math.round(totalXp * 0.5),
        perfectCount,
        acceptableCount,
        undercookedCount,
        overcookedCount,
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
        feedback: 'Khách phàn nàn: Món bị chiên quá lửa, khét rồi!',
      }
    }

    // High quality serve!
    let feedback = 'Khách rất thích món ăn!'
    if (perfectCount === matchedPlateIndices.length) {
      feedback = 'Xuất sắc! Chiên vàng ươm hoàn hảo!'
    }

    // Generate next order
    this.generateCustomerOrder()

    return {
      success: true,
      coinsEarned: totalCoins,
      xpEarned: totalXp,
      perfectCount,
      acceptableCount,
      undercookedCount,
      overcookedCount,
      feedback,
    }
  }
}
