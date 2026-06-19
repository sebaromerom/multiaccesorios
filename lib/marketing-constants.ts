export const BANNER_POSITIONS = [
  { value: 'home_hero', label: 'Home principal' },
  { value: 'home_secondary', label: 'Home secundario' },
  { value: 'shop_top', label: 'Tienda superior' },
] as const

export type BannerPosition = (typeof BANNER_POSITIONS)[number]['value']
