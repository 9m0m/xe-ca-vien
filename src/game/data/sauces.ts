export interface SauceConfig {
  id: string
  displayNameVi: string
  colorHex: string
  colorNumeric: number
  spriteKey: string
  description: string
}

export const SAUCE_CATALOG: SauceConfig[] = [
  {
    id: 'tuong_ot',
    displayNameVi: 'Tương ớt',
    colorHex: '#dc2626',
    colorNumeric: 0xdc2626,
    spriteKey: 'bottle_chili',
    description: 'Tương ớt cay nồng đậm đà chuẩn vị miền Nam.',
  },
  {
    id: 'tuong_den',
    displayNameVi: 'Tương đen',
    colorHex: '#2b1810',
    colorNumeric: 0x2b1810,
    spriteKey: 'bottle_black',
    description: 'Tương đen ngọt dịu, sánh quyện đặc trưng của xe cá viên.',
  },
  {
    id: 'mayo',
    displayNameVi: 'Mayonnaise',
    colorHex: '#fef3c7',
    colorNumeric: 0xfef3c7,
    spriteKey: 'bottle_mayo',
    description: 'Sốt mayonnaise béo ngậy, làm dịu vị cay.',
  },
  {
    id: 'sot_me',
    displayNameVi: 'Sốt me',
    colorHex: '#92400e',
    colorNumeric: 0x92400e,
    spriteKey: 'bottle_tamarind',
    description: 'Sốt me chua ngọt kích thích vị giác.',
  },
  {
    id: 'sa_te',
    displayNameVi: 'Sa tế',
    colorHex: '#b91c1c',
    colorNumeric: 0xb91c1c,
    spriteKey: 'bottle_sate',
    description: 'Ớt sa tế rim cay bùng nổ hương thơm.',
  },
  {
    id: 'dua_chua',
    displayNameVi: 'Dưa chua',
    colorHex: '#84cc16',
    colorNumeric: 0x84cc16,
    spriteKey: 'bowl_pickle',
    description: 'Dưa leo, đu đủ chua ngọt giòn rụm giải ngấy.',
  },
]

export const SAUCE_MAP: Record<string, SauceConfig> = Object.fromEntries(
  SAUCE_CATALOG.map((s) => [s.id, s]),
)

export function getSauceConfig(id: string): SauceConfig | undefined {
  return SAUCE_MAP[id]
}
