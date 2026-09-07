export type FoodCategory =
  'vien' | 'tofu_cake' | 'sausage' | 'surimi' | 'dumpling' | 'cheese_crispy'

export type ShapeProfile = 'round' | 'cylinder' | 'cube' | 'dumpling' | 'flat' | 'specialty'

export type CookingState = 'raw' | 'cooking' | 'perfect' | 'overcooked'

export type ServingStyle = 'skewer' | 'tray' | 'box'

export interface FoodItemConfig {
  id: string
  displayNameVi: string
  category: FoodCategory
  shapeProfile: ShapeProfile
  cookTimeMs: number
  perfectWindowMs: number
  overcookTimeMs: number
  basePrice: number
  baseReward: number
  unlockTier: number
  spriteKey: string
  servingStyle: ServingStyle
  sauceTags: string[]
  quantityPerOrderRange: [number, number]
  enabled: boolean
}

export interface FryingItem {
  slotIndex: number
  foodId: string
  startTime: number
  elapsedMs: number
  state: CookingState
  progress: number // 0.0 - 1.0 (raw->cooked), 1.0 - 1.5 (perfect window), > 1.5 (overcooked)
}

export interface PlateItem {
  id: string
  foodId: string
  state: CookingState
  cookedAt: number
}

export interface OrderItem {
  foodId: string
  quantity: number
}

export interface CustomerOrder {
  orderId: string
  customerName: string
  items: OrderItem[]
  totalItems: number
  requestedSauces: string[]
  hasDuaChua: boolean
  servingStyle: ServingStyle
  createdAt: number
  patienceMs: number
}

export interface ServeEvaluation {
  success: boolean
  coinsEarned: number
  xpEarned: number
  perfectCount: number
  acceptableCount: number
  undercookedCount: number
  overcookedCount: number
  satisfactionScore: number
  sauceScore: number
  speedScore: number
  reputationEarned: number
  feedback: string
}
