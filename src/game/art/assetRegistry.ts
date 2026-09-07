/**
 * Xe Cá Viên — Asset Registry & Texture Pipeline Specifications
 * Adheres strictly to docs/ART_BIBLE.md:
 * - 2.5D elevated three-quarter perspective
 * - Consistent top-left warm key lighting (0xffedd5) and subtle bottom-right bounce
 * - Dark warm 1.5–2px outline treatment for crisp mobile silhouettes (320px–390px)
 * - Grounded Southern Vietnamese street-food details (inox rivets, score cuts, blisters)
 */

export interface SpriteAssetDefinition {
  key: string
  width: number
  height: number
  category: 'environment' | 'prop' | 'food' | 'sauce' | 'fx'
  perspective: 'three-quarter-elevated' | 'top-down'
  silhouetteType: 'round' | 'cylinder' | 'cube' | 'dumpling' | 'flat' | 'specialty' | 'ui'
  descriptionVi: string
}

export const GAME_SPRITE_REGISTRY: Record<string, SpriteAssetDefinition> = {
  // Environment & Cart Props
  pan_surface: {
    key: 'pan_surface',
    width: 340,
    height: 260,
    category: 'environment',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'ui',
    descriptionVi: 'Chảo chiên inox vỉa hè viền cuộn mép, tay cầm cách nhiệt và dầu sôi vàng óng.',
  },
  serving_plate: {
    key: 'serving_plate',
    width: 360,
    height: 80,
    category: 'prop',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'ui',
    descriptionVi: 'Dĩa inox chữ nhật dập gân chống trượt, chuyên để vớt ráo dầu đồ ăn vặt.',
  },
  prep_tray: {
    key: 'prep_tray',
    width: 360,
    height: 120,
    category: 'environment',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'ui',
    descriptionVi: 'Khay inox nhiều ngăn trưng bày thực phẩm tươi sống trước tủ kính xe cá viên.',
  },

  // Canonical Core Food Items
  fish_ball_classic: {
    key: 'fish_ball_classic',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Cá viên chiên truyền thống, phồng tròn nhẹ với vài đốm phồng vàng tự nhiên.',
  },
  beef_ball_classic: {
    key: 'beef_ball_classic',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Bò viên gân tiêu đen đậm đà, bề mặt sần sùi nhẹ đặc trưng bò viên Chợ Lớn.',
  },
  sausage_red: {
    key: 'sausage_red',
    width: 56,
    height: 40,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Xúc xích đỏ vỉa hè khía hoa thị hai đầu, nở bung khi gặp dầu nóng.',
  },
  fish_tofu: {
    key: 'fish_tofu',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cube',
    descriptionVi: 'Đậu hũ cá khối vuông góc bo tròn, viền chiên vàng rộm mặt mềm mịn.',
  },

  // Shape Family Canonical Assets
  shape_flat_golden: {
    key: 'shape_flat_golden',
    width: 56,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'flat',
    descriptionVi: 'Chả cá dẹt / bánh gà giòn rụm với vân bột xù giòn tan.',
  },
  shape_round_herb: {
    key: 'shape_round_herb',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Cá viên / mực viên rau củ lấm tấm thì là và cà rốt xắt nhuyễn.',
  },
  shape_round_orange: {
    key: 'shape_round_orange',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Tôm viên và sò điệp surimi màu cam tươi bắt mắt.',
  },
  shape_round_golden: {
    key: 'shape_round_golden',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Bánh bao trứng cá / phô mai viên phồng vàng ươm.',
  },
  shape_round_red: {
    key: 'shape_round_red',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Hồ lô nướng chiên đỏ thắm bóng bẩy vị ngọt mặn.',
  },
  shape_cube_cheese: {
    key: 'shape_cube_cheese',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cube',
    descriptionVi: 'Đậu hũ phô mai mềm béo, viền giòn vàng ruộm.',
  },
  shape_cylinder_brown: {
    key: 'shape_cylinder_brown',
    width: 56,
    height: 40,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Xúc xích Đức / dồi sụn nướng nâu cánh gián đậm đà.',
  },
  shape_cylinder_green: {
    key: 'shape_cylinder_green',
    width: 56,
    height: 40,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Chả cá đậu đũa / bò cuộn lá lốt xanh mướt thơm ngậy.',
  },
  shape_cylinder_red: {
    key: 'shape_cylinder_red',
    width: 56,
    height: 40,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Thanh cua surimi hai màu đỏ trắng sọc vân tự nhiên.',
  },
  shape_cylinder_golden: {
    key: 'shape_cylinder_golden',
    width: 56,
    height: 40,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Phô mai que / chả giò rế vàng giòn rực rỡ.',
  },
  shape_dumpling_white: {
    key: 'shape_dumpling_white',
    width: 56,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'dumpling',
    descriptionVi: 'Há cảo / sủi cảo tôm vỏ trong suốt ánh hồng nhân tôm thịt.',
  },
  shape_dumpling_golden: {
    key: 'shape_dumpling_golden',
    width: 56,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'dumpling',
    descriptionVi: 'Hoành thánh chiên phồng xòe cánh vàng giòn rụm.',
  },
  shape_specialty_twist: {
    key: 'shape_specialty_twist',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'specialty',
    descriptionVi: 'Mực xoắn / tôm xoắn hai màu đỏ trắng xoáy trôn ốc độc đáo.',
  },
  shape_specialty_bag: {
    key: 'shape_specialty_bag',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'specialty',
    descriptionVi: 'Túi tiền hải sản túm miệng buộc lá hành vàng ruộm.',
  },
  shape_specialty_snail: {
    key: 'shape_specialty_snail',
    width: 48,
    height: 48,
    category: 'food',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'specialty',
    descriptionVi: 'Ốc bươu nhồi thịt kèm sả cây thơm nồng vỉa hè.',
  },

  // Condiments & Sauces
  bottle_chili: {
    key: 'bottle_chili',
    width: 28,
    height: 50,
    category: 'sauce',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Chai tương ớt đỏ tươi nắp nhọn đặc trưng xe vỉa hè.',
  },
  bottle_black: {
    key: 'bottle_black',
    width: 28,
    height: 50,
    category: 'sauce',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Chai tương đen ngọt sánh nâu sẫm ăn kèm cá viên.',
  },
  bottle_mayo: {
    key: 'bottle_mayo',
    width: 28,
    height: 50,
    category: 'sauce',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Chai xốt béo mayonnaise vàng kem sánh mịn.',
  },
  bottle_tamarind: {
    key: 'bottle_tamarind',
    width: 28,
    height: 50,
    category: 'sauce',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Chai sốt me chua cay mặn ngọt màu nâu cánh gián.',
  },
  bottle_sate: {
    key: 'bottle_sate',
    width: 28,
    height: 50,
    category: 'sauce',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'cylinder',
    descriptionVi: 'Chai sa tế ớt hiểm sủi váng dầu đỏ rực cay nồng.',
  },
  bowl_pickle: {
    key: 'bowl_pickle',
    width: 36,
    height: 36,
    category: 'sauce',
    perspective: 'three-quarter-elevated',
    silhouetteType: 'round',
    descriptionVi: 'Chén dưa leo xắt lát và đồ chua cà rốt củ cải trắng ăn kèm chống ngấy.',
  },

  // Particle & FX
  oil_bubble: {
    key: 'oil_bubble',
    width: 12,
    height: 12,
    category: 'fx',
    perspective: 'top-down',
    silhouetteType: 'round',
    descriptionVi: 'Bong bóng dầu sôi lăn tăn ánh kim vàng.',
  },
  oil_splash: {
    key: 'oil_splash',
    width: 8,
    height: 8,
    category: 'fx',
    perspective: 'top-down',
    silhouetteType: 'round',
    descriptionVi: 'Tia dầu bắn nhẹ khi thả đồ ăn tươi vào chảo sôi.',
  },
  oil_steam: {
    key: 'oil_steam',
    width: 16,
    height: 16,
    category: 'fx',
    perspective: 'top-down',
    silhouetteType: 'round',
    descriptionVi: 'Làn khói hơi nước bốc lên từ chảo dầu nóng.',
  },
}
