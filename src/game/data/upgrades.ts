export interface UpgradeTier {
  tier: number
  cost: number
  levelRequired: number
  effectValue: number
  descriptionVi: string
}

export interface CartUpgrade {
  id: string
  nameVi: string
  shortDescVi: string
  iconName: 'ChefHat' | 'Flame' | 'Clock' | 'Utensils' | 'Layers'
  tiers: UpgradeTier[]
}

export const CART_UPGRADES: CartUpgrade[] = [
  {
    id: 'pan_capacity',
    nameVi: 'Chảo Dầu Mở Rộng',
    shortDescVi: 'Mở rộng sức chứa chảo dầu chiên thêm nhiều xiên cùng lúc.',
    iconName: 'Flame',
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 6,
        descriptionVi: 'Sức chứa tiêu chuẩn: 6 vị trí chiên cùng lúc.',
      },
      {
        tier: 2,
        cost: 15000,
        levelRequired: 2,
        effectValue: 8,
        descriptionVi: 'Mở rộng chảo: 8 vị trí chiên đồng thời.',
      },
      {
        tier: 3,
        cost: 35000,
        levelRequired: 4,
        effectValue: 10,
        descriptionVi: 'Chảo công nghiệp đại: 10 vị trí chiên rộn rã.',
      },
    ],
  },
  {
    id: 'oil_thermostat',
    nameVi: 'Bếp Gas Điều Nhiệt',
    shortDescVi: 'Ổn định lửa dầu, nới rộng khoảng thời gian xiên chín vàng giòn rụm.',
    iconName: 'Clock',
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 0,
        descriptionVi: 'Khoảng thời gian chín vàng mặc định.',
      },
      {
        tier: 2,
        cost: 12000,
        levelRequired: 2,
        effectValue: 1000,
        descriptionVi: '+1.0 giây thời gian vàng (dễ canh xiên hoàn hảo hơn).',
      },
      {
        tier: 3,
        cost: 28000,
        levelRequired: 3,
        effectValue: 2000,
        descriptionVi: '+2.0 giây thời gian vàng (chiên mượt mà không lo khét).',
      },
    ],
  },
  {
    id: 'awning_comfort',
    nameVi: 'Mái Bạt Che Mát Vỉa Hè',
    shortDescVi: 'Bạt sọc che mát giúp thực khách vui vẻ kiên nhẫn đợi lâu hơn.',
    iconName: 'ChefHat',
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 0,
        descriptionVi: 'Thời gian kiên nhẫn chuẩn của khách.',
      },
      {
        tier: 2,
        cost: 10000,
        levelRequired: 1,
        effectValue: 15000,
        descriptionVi: '+15 giây thời gian khách kiên nhẫn chờ món.',
      },
      {
        tier: 3,
        cost: 25000,
        levelRequired: 3,
        effectValue: 30000,
        descriptionVi: '+30 giây thời gian khách kiên nhẫn chờ món.',
      },
    ],
  },
  {
    id: 'speed_tongs',
    nameVi: 'Kẹp Gắp Inox Siêu Tốc',
    shortDescVi: 'Kẹp gắp trợ lực gắp xiên cá viên ráo dầu lên dĩa cực nhanh.',
    iconName: 'Utensils',
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 1.0,
        descriptionVi: 'Tốc độ gắp ráo dầu bình thường.',
      },
      {
        tier: 2,
        cost: 8000,
        levelRequired: 2,
        effectValue: 1.5,
        descriptionVi: 'Tăng 50% tốc độ gắp xiên lên dĩa.',
      },
      {
        tier: 3,
        cost: 20000,
        levelRequired: 3,
        effectValue: 2.0,
        descriptionVi: 'Tăng 100% tốc độ gắp xiên (nhanh gấp đôi).',
      },
    ],
  },
  {
    id: 'tray_expansion',
    nameVi: 'Khay Trưng Bày Đồ Ăn Lớn',
    shortDescVi: 'Trưng bày nhiều món ăn trên khay inox hơn mà không cần lật trang.',
    iconName: 'Layers',
    tiers: [
      {
        tier: 1,
        cost: 0,
        levelRequired: 1,
        effectValue: 4,
        descriptionVi: '4 món trưng bày trên khay mỗi trang.',
      },
      {
        tier: 2,
        cost: 18000,
        levelRequired: 3,
        effectValue: 6,
        descriptionVi: '6 món trưng bày trên khay mỗi trang.',
      },
    ],
  },
]

export function getUpgradeConfig(upgradeId: string): CartUpgrade | undefined {
  return CART_UPGRADES.find((u) => u.id === upgradeId)
}

export function getUpgradeTier(upgradeId: string, currentTier: number): UpgradeTier {
  const upgrade = getUpgradeConfig(upgradeId)
  if (!upgrade) {
    return { tier: 1, cost: 0, levelRequired: 1, effectValue: 0, descriptionVi: '' }
  }
  const found = upgrade.tiers.find((t) => t.tier === currentTier)
  return found || upgrade.tiers[0]
}

export function getNextUpgradeTier(upgradeId: string, currentTier: number): UpgradeTier | null {
  const upgrade = getUpgradeConfig(upgradeId)
  if (!upgrade) return null
  return upgrade.tiers.find((t) => t.tier === currentTier + 1) || null
}
