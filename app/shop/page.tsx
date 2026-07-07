import { prisma } from '@/lib/prisma'
import AddToCartButton from './AddToCartButton'
import ProductImage from './ProductImage'
import Link from 'next/link'
import SearchBar from './SearchBar'
import CartHeaderLink from './CartHeaderLink'
import SortSelect from './SortSelect'
import BrandLogo from '@/components/BrandLogo'
import SafeProductImage from '@/components/SafeProductImage'
import { getActiveBanner } from '@/lib/marketing'
import { formatProductName } from '@/lib/utils'
import { Suspense } from 'react'
import { Category } from '@prisma/client'
import {
  BadgePercent,
  Cable,
  Clock3,
  Headphones,
  Laptop,
  Menu,
  MessageCircle,
  PackageCheck,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Truck,
  Zap,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const WHATSAPP_URL = 'https://wa.me/56927109764'

const CATEGORIES = [
  { value: 'Carcasa', label: 'Carcasas', icon: Smartphone },
  { value: 'Lamina', label: 'Láminas', icon: PanelsTopLeft },
  { value: 'Audifonos', label: 'Audio', icon: Headphones },
  { value: 'Cable', label: 'Conectividad', icon: Cable },
  { value: 'Cargador', label: 'Carga oficial', icon: Zap },
  { value: 'Vapers', label: 'Vapers', icon: Sparkles },
  { value: 'Computacion', label: 'PC', icon: Laptop },
] as const

const CATEGORY_SEARCH_ALIASES: Partial<Record<Category, string[]>> = {
  Carcasa: ['carcasa', 'carcasas', 'case', 'cases', 'funda', 'fundas'],
  Lamina: ['lamina', 'laminas', 'protector', 'protector pantalla', 'vidrio'],
  Cargador: ['cargador', 'cargadores', 'carga', 'charger'],
  Cable: ['cable', 'cables', 'usb', 'tipo c', 'lightning'],
  Audifonos: ['audifono', 'audifonos', 'audio', 'bluetooth', 'tws', 'auricular', 'auriculares'],
  Vapers: ['vaper', 'vapers', 'vape', 'vapeo', 'desechable', 'desechables', 'puff', 'puffs'],
  Computacion: ['computacion', 'computo', 'tech', 'pc', 'notebook', 'laptop'],
}

const PAGE_SIZE = 24
const BRANDS = ['Hoco', 'Samsung', 'Borofone', 'Apple', 'Xiaomi', 'Baseus', 'MLab'] as const
const SORT_LABELS: Record<string, string> = {
  popular: 'Popularidad',
  newest: 'Más recientes',
  sales: 'Más vendidos',
  price_asc: 'Menor precio',
  price_desc: 'Mayor precio',
  alpha_asc: 'A-Z',
  alpha_desc: 'Z-A',
}
const CATEGORY_POPULARITY: Partial<Record<Category, number>> = {
  Carcasa: 18,
  Lamina: 16,
  Cargador: 14,
  Cable: 13,
  Audifonos: 12,
  Vapers: 10,
  Computacion: 8,
}

type CatalogProduct = {
  imageUrl: string | null
  category: Category | null
  price: number
  stock: number
  createdAt: Date
  variants: { stock: number; imageUrl: string | null; images: { url: string }[] }[]
  discounts: { id: string }[]
  _count: { orderItems: number }
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function hasUsableImage(product: CatalogProduct) {
  if (product.imageUrl && !product.imageUrl.includes('placehold')) return true
  return product.variants.some((variant) => {
    if (variant.imageUrl && !variant.imageUrl.includes('placehold')) return true
    return variant.images.some((image) => image.url && !image.url.includes('placehold'))
  })
}

function isUsableImageUrl(url?: string | null) {
  return Boolean(url && !url.includes('placehold'))
}

function getVariantPreviewImage(product: CatalogProduct) {
  const candidates = [...product.variants]
    .filter((variant) => variant.stock > 0)
    .sort((a, b) => b.stock - a.stock)
    .flatMap((variant) => [
      variant.imageUrl,
      ...variant.images.map((image) => image.url),
    ])
    .filter((url): url is string => isUsableImageUrl(url))

  return candidates.find((url) => url !== product.imageUrl) ?? candidates[0] ?? null
}

function commercialPopularityScore(product: CatalogProduct) {
  const sales = product._count.orderItems
  const hasVariants = product.variants.some((variant) => variant.stock > 0)
  const impulsePrice = product.price >= 2990 && product.price <= 19990
  const accessiblePrice = product.price > 0 && product.price <= 39990
  const stockScore = Math.min(product.stock, 12)

  return (
    sales * 100 +
    (hasUsableImage(product) ? 40 : 0) +
    (product.discounts.length > 0 ? 25 : 0) +
    (hasVariants ? 18 : 0) +
    stockScore +
    (impulsePrice ? 12 : accessiblePrice ? 6 : 0) +
    (product.category ? CATEGORY_POPULARITY[product.category] ?? 0 : 0)
  )
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string; sort?: string; promo?: string; brand?: string }>
}) {
  const { q, cat, page, sort = 'popular', promo, brand } = await searchParams
  const currentPage = Math.max(1, Number(page || 1))
  const normalizedQuery = normalizeSearch(q ?? '')
  const categoryMatches = normalizedQuery
    ? CATEGORIES
      .filter((category) => {
        const aliases = CATEGORY_SEARCH_ALIASES[category.value as Category] ?? []
        return [category.value, category.label, ...aliases].some((term) => normalizeSearch(term).includes(normalizedQuery))
      })
      .map((category) => category.value as Category)
    : []
  const selectedBrand = brand && brand !== 'all'
    ? BRANDS.find((candidate) => candidate.toLowerCase() === brand.toLowerCase())
    : null
  const publicProductWhere = {
    price: { gt: 0 },
    stock: { gt: 0 },
    category: { not: null },
  }

  const where = {
    ...publicProductWhere,
    ...(cat ? { category: cat as Category } : {}),
    ...(promo === '1' ? { discounts: { some: { active: true } } } : {}),
    ...(brand === 'all'
      ? {
          OR: BRANDS.map((brandName) => ({
            name: { contains: brandName, mode: 'insensitive' as const },
          })),
        }
      : selectedBrand
        ? { name: { contains: selectedBrand, mode: 'insensitive' as const } }
        : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        ...(categoryMatches.length > 0 ? [{ category: { in: categoryMatches } }] : []),
      ],
    } : {}),
  }

  const orderBy =
    sort === 'price_asc' ? [{ price: 'asc' as const }] :
    sort === 'price_desc' ? [{ price: 'desc' as const }] :
    sort === 'alpha_asc' ? [{ name: 'asc' as const }] :
    sort === 'alpha_desc' ? [{ name: 'desc' as const }] :
    sort === 'newest' ? [{ createdAt: 'desc' as const }] :
    sort === 'sales' ? [{ orderItems: { _count: 'desc' as const } }, { createdAt: 'desc' as const }] :
    [
      { orderItems: { _count: 'desc' as const } },
      { stock: 'desc' as const },
      { createdAt: 'desc' as const },
    ]
  const productInclude = {
    variants: {
      include: { images: { orderBy: { order: 'asc' as const } } },
    },
    discounts: {
      where: { active: true },
      select: { id: true },
    },
    _count: {
      select: { orderItems: true },
    },
  }
  const useCommercialPopularity = sort === 'popular'
  const productsPromise = useCommercialPopularity
    ? prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' as const }],
        include: productInclude,
      }).then((allProducts) => allProducts
        .sort((a, b) => {
          const scoreDiff = commercialPopularityScore(b) - commercialPopularityScore(a)
          if (scoreDiff !== 0) return scoreDiff
          return b.createdAt.getTime() - a.createdAt.getTime()
        })
        .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE))
    : prisma.product.findMany({
        where,
        orderBy,
        include: productInclude,
        take: PAGE_SIZE,
        skip: (currentPage - 1) * PAGE_SIZE,
      })

  const [products, totalProducts, allAvailableProducts, categoryAggregations, shopBanner, activeDiscountCount] = await Promise.all([
    productsPromise,
    prisma.product.count({ where }),
    prisma.product.count({ where: publicProductWhere }),
    prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      where: publicProductWhere,
    }),
    getActiveBanner('shop_top'),
    prisma.discountRule.count({ where: { active: true, productId: { not: null } } }),
  ])
  const hasActiveOffers = activeDiscountCount > 0

  const categoryCounts = categoryAggregations.reduce((acc, curr) => {
    if (curr.category) acc[curr.category] = curr._count.id
    return acc
  }, {} as Record<string, number>)
  const visibleCategories = CATEGORIES.filter((category) => (categoryCounts[category.value] || 0) > 0 || cat === category.value)

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE)
  const selectedCategory = CATEGORIES.find((category) => category.value === cat)
  const selectedSortLabel = SORT_LABELS[sort] ?? 'Popularidad'
  const hasActiveFilters = Boolean(q || cat || promo || brand || sort !== 'popular')
  const buildUrl = (updates: { cat?: string | null; q?: string | null; page?: string | null; sort?: string | null; promo?: string | null; brand?: string | null }) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    if (sort !== 'popular') params.set('sort', sort)
    if (promo) params.set('promo', promo)
    if (brand) params.set('brand', brand)

    if (updates.q !== undefined) {
      if (updates.q === null) params.delete('q')
      else params.set('q', updates.q)
    }
    if (updates.cat !== undefined) {
      if (updates.cat === null) params.delete('cat')
      else params.set('cat', updates.cat)
    }
    if (updates.sort !== undefined) {
      if (updates.sort === null) params.delete('sort')
      else params.set('sort', updates.sort)
    }
    if (updates.promo !== undefined) {
      if (updates.promo === null) params.delete('promo')
      else params.set('promo', updates.promo)
    }
    if (updates.brand !== undefined) {
      if (updates.brand === null) params.delete('brand')
      else params.set('brand', updates.brand)
    }
    if (updates.page !== undefined) {
      if (updates.page === null) params.delete('page')
      else params.set('page', updates.page)
    }

    const queryString = params.toString()
    return `/shop${queryString ? `?${queryString}` : ''}`
  }

  return (
    <>
      <style>{`
        body:has(.shop-catalog-root) .public-navbar {
          display: none;
        }

        body:has(.shop-catalog-root) main {
          padding: 0 !important;
          background: #fff;
        }

        .shop-catalog-root {
          min-height: 100vh;
          background: #fff;
          color: #111;
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          letter-spacing: 0;
        }

        .shop-shell {
          max-width: 1510px;
          margin: 0 auto;
          background: #fff;
          min-height: 100vh;
          box-shadow: 0 18px 60px rgba(15, 15, 15, 0.08);
          overflow: hidden;
        }

        .shop-topbar {
          height: 46px;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 52px;
          font-size: 13px;
          font-weight: 600;
        }

        @media (min-width: 1511px) {
          .shop-shell {
            box-shadow: 0 12px 38px rgba(15, 15, 15, 0.06);
          }
        }

        .shop-topbar-group {
          display: flex;
          align-items: center;
          gap: 34px;
        }

        .shop-topbar-item {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #f4f4f5;
          white-space: nowrap;
        }

        .shop-header {
          padding: 24px 52px 18px;
          display: grid;
          grid-template-columns: 230px minmax(360px, 1fr) 340px;
          align-items: center;
          gap: 24px;
          border-bottom: 1px solid #ececec;
          background: #fff;
        }

        .shop-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #111;
          text-decoration: none;
        }

        .shop-brand-mark {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 10px;
          background: #fff;
          display: block;
          overflow: hidden;
          flex: 0 0 auto;
        }

        .shop-brand-text {
          font-size: 24px;
          line-height: 0.9;
          font-weight: 900;
          letter-spacing: 0;
        }

        .shop-search-control {
          height: 52px;
          border: 1px solid #d9d9d9;
          border-radius: 999px;
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          overflow: hidden;
          background: #fff;
        }

        .shop-search-control input {
          min-width: 0;
          height: 100%;
          border: 0;
          outline: 0;
          padding: 0 28px;
          font-size: 14px;
          color: #333;
        }

        .shop-search-clear {
          width: 34px;
          height: 34px;
          border: 0;
          background: transparent;
          color: #999;
          cursor: pointer;
          font-weight: 800;
        }

        .shop-search-submit {
          width: 58px;
          height: 52px;
          border: 0;
          background: #e30613;
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .shop-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 24px;
        }

        .shop-header-action {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #111;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .shop-header-action small {
          display: block;
          color: #666;
          font-size: 11px;
          font-weight: 600;
        }

        .shop-cart-icon-link {
          position: relative;
          color: #111;
          display: inline-flex;
        }

        .shop-cart-count {
          position: absolute;
          top: -10px;
          right: -10px;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #e30613;
          color: #fff;
          font-size: 10px;
          display: grid;
          place-items: center;
          font-weight: 900;
          padding: 0 4px;
        }

        .shop-nav {
          height: 74px;
          display: flex;
          align-items: center;
          gap: 34px;
          padding: 0 52px;
          border-bottom: 1px solid #ececec;
          background: #fff;
        }

        .shop-all-cats {
          height: 44px;
          min-width: 245px;
          background: #111;
          color: #fff;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 18px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .shop-nav-links {
          display: flex;
          align-items: center;
          gap: clamp(18px, 2.1vw, 34px);
          font-size: 13px;
          font-weight: 800;
        }

        .shop-nav-links a {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          color: #111;
          text-decoration: none;
        }

        .shop-nav-links a:first-child {
          color: #e30613;
        }

        .shop-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          padding: 26px 52px 42px;
          background: #fff;
        }

        .shop-campaign {
          margin: 26px 52px 0;
          min-height: 150px;
          border-radius: 8px;
          background: #111;
          color: #fff;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 28px 34px;
        }

        .shop-campaign-copy {
          position: relative;
          z-index: 2;
          max-width: 48%;
        }

        .shop-campaign-copy p {
          color: #ff4d57;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .shop-campaign-copy h2 {
          margin-top: 8px;
          font-size: 26px;
          line-height: 1.05;
          font-weight: 950;
        }

        .shop-campaign-copy small {
          display: block;
          margin-top: 8px;
          color: #e5e5e5;
          font-size: 12px;
          font-weight: 700;
        }

        .shop-campaign-link {
          margin-top: 16px;
          height: 34px;
          padding: 0 15px;
          border-radius: 4px;
          background: #e30613;
          color: #fff;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          font-size: 11px;
          font-weight: 900;
        }

        .shop-campaign-media {
          position: absolute;
          inset: 10px 24px 10px 48%;
        }

        .shop-campaign-media img {
          object-fit: contain;
        }

        .shop-panel {
          border: 1px solid #ececec;
          border-radius: 8px;
          background: #fff;
          padding: 24px 22px;
        }

        .shop-panel + .shop-panel {
          margin-top: 18px;
        }

        .shop-panel-title {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .shop-side-link {
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #222;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }

        .shop-side-link.active {
          color: #e30613;
        }

        .shop-side-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .shop-side-count {
          color: #777;
          font-size: 12px;
          font-weight: 700;
        }

        .shop-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #777;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .shop-range {
          height: 4px;
          border-radius: 999px;
          background: #e30613;
          margin: 14px 0 24px;
          position: relative;
        }

        .shop-range::before,
        .shop-range::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #e30613;
          transform: translateY(-50%);
        }

        .shop-range::before { left: 0; }
        .shop-range::after { right: 0; }

        .shop-check {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          margin: 14px 0;
        }

        .shop-check span:first-child {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .shop-check-box {
          width: 14px;
          height: 14px;
          border: 1px solid #bbb;
          border-radius: 3px;
        }

        .shop-main-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 22px;
        }

        .shop-title h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0;
        }

        .shop-title p {
          margin: 10px 0 0;
          color: #777;
          font-size: 14px;
          font-weight: 600;
        }

        .shop-result-note {
          margin-top: 8px;
          color: #555;
          font-size: 12px;
          font-weight: 700;
        }

        .shop-sort-select {
          height: 44px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          padding: 0 16px;
          color: #111;
          font-size: 13px;
          font-weight: 800;
        }

        .shop-cat-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 26px;
        }

        .shop-active-filters {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin: -10px 0 18px;
        }

        .shop-active-pill {
          min-height: 32px;
          border: 1px solid #e5e5e5;
          border-radius: 999px;
          background: #fafafa;
          color: #333;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .shop-active-pill strong {
          color: #111;
          font-weight: 950;
        }

        .shop-active-pill.clear {
          border-color: #e30613;
          background: #fff;
          color: #e30613;
        }

        .shop-chip {
          min-width: 96px;
          height: 42px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          color: #222;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        .shop-chip.active {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px;
          align-items: stretch;
        }

        .product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fff;
          min-width: 0;
          overflow: hidden;
          content-visibility: auto;
          contain-intrinsic-size: 420px;
          transition: border-color 0.16s ease, background-color 0.16s ease;
        }

        .product-card:hover {
          border-color: #d6d6d6;
          background: #fdfdfd;
        }

        .product-img-wrap {
          position: relative;
          display: block;
          aspect-ratio: 1 / 1.04;
          background: #fafafa;
          padding: 20px;
          text-decoration: none;
        }

        .product-img-inner {
          position: relative;
          width: 100%;
          height: 100%;
          display: block;
          overflow: hidden;
        }

        .product-img-inner img {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          background: #fafafa !important;
        }

        .product-stock-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 2;
          border: 1px solid #bfe7c8;
          color: #1f9a3f;
          background: #f6fff7;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
        }

        .product-stock-badge.low {
          color: #e30613;
          border-color: #ffb9bd;
          background: #fff6f6;
        }

        .product-option-badge {
          position: absolute;
          right: 16px;
          bottom: 16px;
          z-index: 2;
          border-radius: 999px;
          background: #111;
          color: #fff;
          padding: 5px 10px;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 10px 20px rgba(0,0,0,.16);
        }

        .product-fav {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 2;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #606060;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          line-height: 0;
        }

        .product-fav svg {
          width: 22px;
          height: 22px;
          display: block;
          stroke-width: 2.2;
        }

        .product-info {
          padding: 0 18px 18px;
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        .product-info > a:last-child,
        .product-info > button:last-child {
          margin-top: auto;
        }

        .product-name {
          min-height: 48px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: #111;
          text-decoration: none;
          font-size: 13px;
          line-height: 1.42;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .product-price {
          display: block;
          color: #e30613;
          font-size: 20px;
          font-weight: 900;
          margin: 12px 0 16px;
        }

        @media (min-width: 1420px) {
          .product-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .shop-empty {
          border: 1px dashed #ddd;
          border-radius: 8px;
          padding: 80px 20px;
          text-align: center;
          color: #777;
          font-weight: 800;
        }

        .shop-empty a {
          display: inline-flex;
          min-height: 44px;
          margin-top: 14px;
          align-items: center;
          color: #e30613;
          font-size: 13px;
          font-weight: 900;
        }

        .shop-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 34px;
        }

        .page-btn {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          border: 1px solid #ddd;
          color: #111;
          display: grid;
          place-items: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        .page-btn.active {
          background: #111;
          color: #fff;
          border-color: #111;
        }

        .shop-benefits {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding: 26px 52px;
          border-top: 1px solid #ececec;
          background: #fff;
        }

        .shop-benefit {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 14px;
          font-weight: 900;
        }

        .shop-benefit small {
          display: block;
          margin-top: 4px;
          color: #777;
          font-weight: 600;
        }

        .shop-mobile-header,
        .shop-mobile-cats,
        .shop-mobile-controls {
          display: none;
        }

        @media (max-width: 1180px) {
          .shop-shell {
            box-shadow: none;
          }

          .shop-topbar,
          .shop-header,
          .shop-nav,
          .shop-sidebar,
          .shop-cat-chips,
          .shop-sort-select {
            display: none;
          }

          .shop-mobile-header {
            display: block;
            padding: 18px 16px 12px;
            background: #fff;
            position: sticky;
            top: 0;
            z-index: 20;
            border-bottom: 1px solid #ededed;
          }

          .shop-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }

          .shop-mobile-actions {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .shop-mobile-header .shop-brand-mark {
            width: 42px;
            height: 42px;
            border-radius: 8px;
          }

          .shop-mobile-header .shop-brand-text {
            font-size: 15px;
            line-height: 0.9;
          }

          .shop-mobile-header .shop-brand {
            gap: 8px;
          }

          .shop-search-control {
            height: 44px;
            border-radius: 5px;
            grid-template-columns: 1fr auto auto;
          }

          .shop-search-control input {
            padding: 0 14px;
            font-size: 13px;
          }

          .shop-search-submit {
            height: 44px;
            width: 48px;
          }

          .shop-mobile-cats {
            display: flex;
            gap: 14px;
            overflow-x: auto;
            padding: 14px 16px 10px;
            background: #fff;
            scrollbar-width: none;
          }

          .shop-mobile-cats::-webkit-scrollbar {
            display: none;
          }

          .mobile-cat {
            flex: 0 0 auto;
            width: 56px;
            color: #111;
            text-decoration: none;
            text-align: center;
            font-size: 11px;
            font-weight: 800;
          }

          .mobile-cat-icon {
            width: 44px;
            height: 44px;
            margin: 0 auto 7px;
            border: 1px solid #ddd;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: #fff;
          }

          .mobile-cat.active .mobile-cat-icon {
            background: #111;
            color: #fff;
            border-color: #111;
          }

          .shop-mobile-controls {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(142px, auto);
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background: #fff;
          }

          .shop-mobile-controls span {
            font-size: 13px;
            color: #666;
            font-weight: 700;
            white-space: nowrap;
          }

          .shop-active-filters {
            margin: -6px 0 14px;
            gap: 6px;
            overflow-x: auto;
            flex-wrap: nowrap;
            scrollbar-width: none;
          }

          .shop-active-filters::-webkit-scrollbar {
            display: none;
          }

          .shop-active-pill {
            flex: 0 0 auto;
            min-height: 30px;
            padding: 0 10px;
            font-size: 10px;
          }

          .mobile-sort-select {
            height: 38px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #fff;
            color: #111;
            padding: 0 12px;
            font-size: 12px;
            font-weight: 900;
            min-width: 0;
            max-width: 100%;
          }

          .shop-content {
            display: block;
            padding: 0 16px calc(var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom) + 28px);
            background: #fff;
          }

          .shop-campaign {
            margin: 12px 16px 16px;
            min-height: 122px;
            padding: 18px 16px;
          }

          .shop-campaign-copy {
            max-width: 56%;
          }

          .shop-campaign-copy h2 {
            font-size: 17px;
          }

          .shop-campaign-copy small {
            display: none;
          }

          .shop-campaign-media {
            inset: 14px -8px 10px 52%;
          }

          .shop-main-head {
            display: none;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            align-items: start;
          }

          .product-card {
            border-radius: 6px;
            min-height: 0;
            height: auto;
            content-visibility: visible;
            contain-intrinsic-size: none;
          }

          .product-img-wrap {
            height: clamp(150px, 36vw, 215px);
            aspect-ratio: auto;
            padding: 10px;
          }

          .product-stock-badge {
            top: 9px;
            left: 9px;
            font-size: 9px;
            padding: 3px 6px;
          }

          .product-fav {
            top: 9px;
            right: 9px;
            width: 32px;
            height: 32px;
          }

          .product-fav svg {
            width: 19px;
            height: 19px;
          }

          .product-info {
            padding: 0 10px 10px;
            flex: none;
          }

          .product-info > a:last-child,
          .product-info > button:last-child {
            margin-top: 0;
          }

          .product-name {
            min-height: 38px;
            font-size: 11px;
            line-height: 1.35;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .product-price {
            font-size: 16px;
            margin: 9px 0 10px;
          }

          .product-info a,
          .product-info button {
            min-height: 44px;
          }

          .shop-benefits {
            display: none;
          }

          .shop-brand-chips {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            margin: 0 0 16px;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .shop-brand-chips::-webkit-scrollbar {
            display: none;
          }

          .shop-brand-chips .shop-chip {
            flex: 0 0 auto;
            min-width: 82px;
            height: 40px;
            padding: 0 14px;
          }
        }

        @media (max-width: 360px) {
          .shop-content { padding-left: 10px; padding-right: 10px; }
          .shop-mobile-controls { padding-left: 10px; padding-right: 10px; grid-template-columns: minmax(0, 1fr) 138px; }
          .shop-mobile-controls span { font-size: 12px; }
          .product-grid { gap: 8px; }
          .product-img-wrap { height: 142px; }
          .product-info { padding-left: 8px; padding-right: 8px; }
        }
      `}</style>

      <div className="shop-catalog-root">
        <div className="shop-shell">
          <div className="shop-topbar">
            <div className="shop-topbar-group">
              <span className="shop-topbar-item"><Truck className="size-4 text-red-500" /> Envíos a todo Chile</span>
              <span className="shop-topbar-item"><Clock3 className="size-4" /> Despacho 24-48h en Linares</span>
            </div>
            <div className="shop-topbar-group">
              <span className="shop-topbar-item">Centro de ayuda</span>
              <Link href="/#contacto" className="shop-topbar-item">Contacto</Link>
            </div>
          </div>

          <header className="shop-header">
            <Link href="/" className="shop-brand">
              <BrandLogo className="shop-brand-mark" priority sizes="56px" />
              <span className="shop-brand-text">MULTI<br />ACCESORIOS</span>
            </Link>

            <Suspense>
              <SearchBar key={`desktop-${q ?? ''}`} initialQuery={q ?? ''} />
            </Suspense>

            <div className="shop-header-actions">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="shop-header-action"><MessageCircle className="size-6" /><span>Ayuda<small>WhatsApp</small></span></a>
              <CartHeaderLink />
            </div>
          </header>

          <nav className="shop-nav">
            <Link href="/shop" className="shop-all-cats">
              <span className="inline-flex items-center gap-12"><Menu className="size-5" /> Todas las categorías</span>
            </Link>
            <div className="shop-nav-links">
              {hasActiveOffers && <Link href={buildUrl({ promo: '1', brand: null, page: '1' })}><BadgePercent className="mr-1 inline size-4" /> Ofertas</Link>}
              <Link href={buildUrl({ sort: 'newest', page: '1' })}>Nuevos</Link>
              <Link href={buildUrl({ sort: 'sales', page: '1' })}>Más vendidos</Link>
              <Link href={buildUrl({ brand: 'all', promo: null, page: '1' })}>Marcas</Link>
              {' '}
              <Link href="/#contacto">Contacto</Link>
            </div>
          </nav>

          <header className="shop-mobile-header">
            <div className="shop-mobile-top">
              <Link href="/" className="shop-brand">
                <BrandLogo className="shop-brand-mark" priority sizes="42px" />
                <span className="shop-brand-text">MULTI<br />ACCESORIOS</span>
              </Link>
              <div className="shop-mobile-actions">
                <CartHeaderLink mobile />
              </div>
            </div>
            <Suspense>
              <SearchBar key={`mobile-${q ?? ''}`} initialQuery={q ?? ''} />
            </Suspense>
          </header>

          <div className="shop-mobile-cats">
            <Link href={buildUrl({ cat: null, page: '1' })} className={`mobile-cat${!cat ? ' active' : ''}`}>
              <span className="mobile-cat-icon"><Menu className="size-5" /></span>
              Todos
            </Link>
            {visibleCategories.map((category) => {
              const Icon = category.icon
              return (
                <Link key={category.value} href={buildUrl({ cat: category.value, promo: null, brand: null, page: '1' })} className={`mobile-cat${cat === category.value ? ' active' : ''}`}>
                  <span className="mobile-cat-icon"><Icon className="size-5" /></span>
                  {category.label}
                </Link>
              )
            })}
          </div>

          <div className="shop-mobile-controls">
            <span>{totalProducts} productos</span>
            <Suspense><SortSelect value={sort} mobile /></Suspense>
          </div>

          {shopBanner && (
            <section className="shop-campaign">
              <div className="shop-campaign-copy">
                <p>{shopBanner.eyebrow ?? 'Campaña activa'}</p>
                <h2>{shopBanner.title}</h2>
                {shopBanner.subtitle && <small>{shopBanner.subtitle}</small>}
                <Link href={shopBanner.href} className="shop-campaign-link">Ver campaña</Link>
              </div>
              <span className="shop-campaign-media">
                <SafeProductImage
                  src={shopBanner.imageUrl ?? shopBanner.mobileImageUrl}
                  alt={shopBanner.title}
                  fill
                  sizes="(max-width: 760px) 42vw, 380px"
                />
              </span>
            </section>
          )}

          <div className="shop-content">
            <aside className="shop-sidebar">
              <section className="shop-panel">
                <div className="shop-panel-title">Categorías</div>
                <Link href={buildUrl({ cat: null, page: '1' })} className={`shop-side-link${!cat ? ' active' : ''}`}>
                  <span className="shop-side-main"><BadgePercent className="size-4" /> Todos los productos</span>
                  <span className="shop-side-count">{allAvailableProducts}</span>
                </Link>
                {visibleCategories.map((category) => {
                  const Icon = category.icon
                  const count = categoryCounts[category.value] || 0
                  return (
                    <Link key={category.value} href={buildUrl({ cat: category.value, promo: null, brand: null, page: '1' })} className={`shop-side-link${cat === category.value ? ' active' : ''}`}>
                      <span className="shop-side-main"><Icon className="size-4" /> {category.label}</span>
                      <span className="shop-side-count">{count}</span>
                    </Link>
                  )
                })}
              </section>

            </aside>

            <main>
              <div className="shop-main-head">
                <div className="shop-title">
                  <h1>{promo === '1' ? 'Ofertas' : brand ? selectedBrand ?? 'Marcas' : selectedCategory ? selectedCategory.label : 'Catálogo'}</h1>
                  <p>{totalProducts} productos disponibles</p>
                  {q && <div className="shop-result-note">Resultados para: <strong>{q}</strong></div>}
                </div>
                <Suspense><SortSelect value={sort} /></Suspense>
              </div>

              {hasActiveFilters && (
                <div className="shop-active-filters" aria-label="Filtros activos">
                  {q && <Link href={buildUrl({ q: null, page: '1' })} className="shop-active-pill">Busqueda: <strong>{q}</strong> x</Link>}
                  {selectedCategory && <Link href={buildUrl({ cat: null, page: '1' })} className="shop-active-pill">Categoria: <strong>{selectedCategory.label}</strong> x</Link>}
                  {promo === '1' && <Link href={buildUrl({ promo: null, page: '1' })} className="shop-active-pill">Ofertas x</Link>}
                  {selectedBrand && <Link href={buildUrl({ brand: null, page: '1' })} className="shop-active-pill">Marca: <strong>{selectedBrand}</strong> x</Link>}
                  {sort !== 'popular' && <Link href={buildUrl({ sort: null, page: '1' })} className="shop-active-pill">Orden: <strong>{selectedSortLabel}</strong> x</Link>}
                  <Link href="/shop?page=1" className="shop-active-pill clear">Limpiar todo</Link>
                </div>
              )}

              <div className={`shop-cat-chips${brand ? ' shop-brand-chips' : ''}`}>
                <Link href={buildUrl({ cat: null, promo: null, brand: null, page: '1' })} className={`shop-chip${!cat && !promo && !brand ? ' active' : ''}`}>Todos</Link>
                {brand
                  ? BRANDS.map((brandName) => (
                      <Link
                        key={brandName}
                        href={buildUrl({ brand: brandName, cat: null, promo: null, page: '1' })}
                        className={`shop-chip${selectedBrand === brandName ? ' active' : ''}`}
                      >
                        {brandName}
                      </Link>
                    ))
                  : visibleCategories.map((category) => (
                      <Link key={category.value} href={buildUrl({ cat: category.value, promo: null, brand: null, page: '1' })} className={`shop-chip${cat === category.value ? ' active' : ''}`}>
                        {category.label} ({categoryCounts[category.value] || 0})
                      </Link>
                    ))}
              </div>

              {products.length === 0 ? (
                <div className="shop-empty">
                  <p>{promo === '1' ? 'No hay ofertas activas por el momento.' : q ? 'No encontramos coincidencias con esa busqueda.' : 'No se encontraron productos.'}</p>
                  <Link href={q || cat || brand || promo ? '/shop?page=1' : '/shop?sort=newest&page=1'}>
                    {q || cat || brand || promo ? 'Volver al catalogo' : 'Ver productos nuevos'}
                  </Link>
                </div>
              ) : (
                <div className="product-grid">
                  {products.map((product) => {
                    const displayName = formatProductName(product.name)
                    const variantPreviewImage = getVariantPreviewImage(product)
                    const cardImage = product.variants.length > 0
                      ? variantPreviewImage ?? product.imageUrl ?? null
                      : product.imageUrl ?? null

                    return (
                    <article key={product.id} className="product-card">
                      <Link href={`/shop/${product.id}`} className="product-img-wrap">
                        <span className="product-img-inner">
                          <ProductImage
                            productId={product.id}
                            productName={displayName}
                            initialImageUrl={cardImage}
                          />
                        </span>
                        <span className="product-stock-badge">En stock</span>
                        {product.variants.length > 0 && <span className="product-option-badge">Modelos</span>}
                      </Link>
                      <div className="product-info">
                        <Link href={`/shop/${product.id}`} className="product-name">
                          {displayName}
                        </Link>
                        <span className="product-price">${Number(product.price).toLocaleString('es-CL')}</span>
                        {product.variants.length > 0 ? (
                          <Link href={`/shop/${product.id}`} className="h-10 rounded-[4px] border border-red-600 text-red-600 flex items-center justify-center text-xs font-black no-underline">
                            Elegir modelo
                          </Link>
                        ) : (
                          <AddToCartButton
                            product={{
                              id: product.id,
                              name: displayName,
                              price: product.price,
                              stock: product.stock,
                              imageUrl: product.imageUrl,
                            }}
                          />
                        )}
                      </div>
                    </article>
                    )
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="shop-pagination">
                  {currentPage > 1 && (
                    <Link href={buildUrl({ page: String(currentPage - 1) })} className="page-btn">‹</Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-zinc-400">...</span>
                      ) : (
                        <Link key={p} href={buildUrl({ page: String(p) })} className={`page-btn${p === currentPage ? ' active' : ''}`}>{p}</Link>
                      )
                    )}
                  {currentPage < totalPages && (
                    <Link href={buildUrl({ page: String(currentPage + 1) })} className="page-btn">›</Link>
                  )}
                </div>
              )}
            </main>
          </div>

          <footer className="shop-benefits">
            <div className="shop-benefit"><Truck className="size-8" /><span>Envíos a todo Chile<small>Rápido y seguro</small></span></div>
            <div className="shop-benefit"><Clock3 className="size-8" /><span>Despacho 24-48h en Linares<small>Compras antes de las 14:00</small></span></div>
            <div className="shop-benefit"><ShieldCheck className="size-8" /><span>Compra segura<small>Sitio protegido SSL</small></span></div>
            <div className="shop-benefit"><PackageCheck className="size-8" /><span>Garantía y cambios<small>Hasta 30 días</small></span></div>
          </footer>
        </div>
      </div>
    </>
  )
}
