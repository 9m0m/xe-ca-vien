export interface PlayerGameStats {
  ordersServed: number
  perfectItemsFried: number
  totalCoinsEarned: number
  foodsUnlockedCount: number
  upgradesPurchasedCount: number
}

export interface Achievement {
  id: string
  titleVi: string
  descriptionVi: string
  targetValue: number
  metric: 'orders' | 'perfectFries' | 'foodsUnlocked' | 'upgrades' | 'coins'
  rewardCoins: number
  rewardXp: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_order',
    titleVi: 'Khai Trương Buôn May',
    descriptionVi: 'Phục vụ thành công đơn hàng đầu tiên cho thực khách vỉa hè.',
    targetValue: 1,
    metric: 'orders',
    rewardCoins: 2000,
    rewardXp: 50,
  },
  {
    id: 'orders_10',
    titleVi: 'Khách Quen Vỉa Hè',
    descriptionVi: 'Phục vụ liên tục 10 lượt thực khách ghé xe cá viên.',
    targetValue: 10,
    metric: 'orders',
    rewardCoins: 5000,
    rewardXp: 100,
  },
  {
    id: 'orders_50',
    titleVi: 'Bậc Thầy Chảo Dầu',
    descriptionVi: 'Hoàn thành 50 đơn hàng trên phố ăn vặt Sài Gòn.',
    targetValue: 50,
    metric: 'orders',
    rewardCoins: 15000,
    rewardXp: 300,
  },
  {
    id: 'perfect_fry_10',
    titleVi: 'Tay Chiên Chuẩn Xác',
    descriptionVi: 'Vớt 10 xiên đồ ăn đạt độ chín vàng giòn hoàn hảo.',
    targetValue: 10,
    metric: 'perfectFries',
    rewardCoins: 3000,
    rewardXp: 80,
  },
  {
    id: 'perfect_fry_50',
    titleVi: 'Đệ Nhất Cá Viên',
    descriptionVi: 'Vớt 50 xiên đồ ăn đạt độ chín vàng giòn rụm không một vết khét.',
    targetValue: 50,
    metric: 'perfectFries',
    rewardCoins: 10000,
    rewardXp: 250,
  },
  {
    id: 'menu_expand_10',
    titleVi: 'Thực Đơn Phong Phú',
    descriptionVi: 'Mở khóa từ 10 món ăn vặt khác nhau trong bộ sưu tập xe.',
    targetValue: 10,
    metric: 'foodsUnlocked',
    rewardCoins: 6000,
    rewardXp: 150,
  },
  {
    id: 'first_upgrade',
    titleVi: 'Nâng Cấp Cơ Ngơi',
    descriptionVi: 'Nâng cấp chiếc xe cá viên với trang thiết bị tiện nghi đầu tiên.',
    targetValue: 1,
    metric: 'upgrades',
    rewardCoins: 2000,
    rewardXp: 60,
  },
  {
    id: 'rich_vendor',
    titleVi: 'Đại Gia Vỉa Hè',
    descriptionVi: 'Tích lũy đạt mốc 50.000đ trong hũ tiền buôn bán.',
    targetValue: 50000,
    metric: 'coins',
    rewardCoins: 10000,
    rewardXp: 200,
  },
]

export function checkAchievementUnlocked(
  achievement: Achievement,
  stats: PlayerGameStats,
  currentCoins: number,
): boolean {
  switch (achievement.metric) {
    case 'orders':
      return stats.ordersServed >= achievement.targetValue
    case 'perfectFries':
      return stats.perfectItemsFried >= achievement.targetValue
    case 'foodsUnlocked':
      return stats.foodsUnlockedCount >= achievement.targetValue
    case 'upgrades':
      return stats.upgradesPurchasedCount >= achievement.targetValue
    case 'coins':
      return currentCoins >= achievement.targetValue
    default:
      return false
  }
}

export function getAchievementProgress(
  achievement: Achievement,
  stats: PlayerGameStats,
  currentCoins: number,
): { current: number; target: number; percentage: number } {
  let current = 0
  switch (achievement.metric) {
    case 'orders':
      current = stats.ordersServed
      break
    case 'perfectFries':
      current = stats.perfectItemsFried
      break
    case 'foodsUnlocked':
      current = stats.foodsUnlockedCount
      break
    case 'upgrades':
      current = stats.upgradesPurchasedCount
      break
    case 'coins':
      current = currentCoins
      break
  }
  const percentage = Math.min(100, Math.floor((current / achievement.targetValue) * 100))
  return { current, target: achievement.targetValue, percentage }
}
