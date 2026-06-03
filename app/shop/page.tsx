import { prisma } from '@/lib/prisma'
import AddToCartButton from './AddToCartButton'
import ProductImage from './ProductImage'
import Link from 'next/link'
import SearchBar from './SearchBar'
import CartHeaderLink from './CartHeaderLink'
import SortSelect from './SortSelect'
import { Suspense } from 'react'
import { Category, Product } from '@prisma/client'
import {
  BadgePercent,
  Cable,
  Clock3,
  Headphones,
  Heart,
  Home,
  Laptop,
  Menu,
  PackageCheck,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Truck,
  User,
  Zap,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  { value: 'Carcasa', label: 'Carcasas', icon: Smartphone },
  { value: 'Lamina', label: 'Laminas', icon: PanelsTopLeft },
  { value: 'Audifonos', label: 'Audio', icon: Headphones },
  { value: 'Cable', label: 'Cables', icon: Cable },
  { value: 'Cargador', label: 'Cargadores', icon: Zap },
  { value: 'Vapers', label: 'Vapers', icon: Sparkles },
  { value: 'Computacion', label: 'Tech', icon: Laptop },
  { value: 'Otros', label: 'Hogar', icon: Home },
] as const

const PAGE_SIZE = 24

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string; sort?: string }>
}) {
  const { q, cat, page, sort = 'newest' } = await searchParams
  const currentPage = Math.max(1, Number(page || 1))

  const where = {
    stock: { gt: 0 },
    ...(cat ? { category: cat as Category } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const orderBy =
    sort === 'price_asc' ? { price: 'asc' as const } :
    sort === 'price_desc' ? { price: 'desc' as const } :
    sort === 'alpha_asc' ? { name: 'asc' as const } :
    sort === 'alpha_desc' ? { name: 'desc' as const } :
    { createdAt: 'desc' as const }

  const [products, totalProducts, allAvailableProducts, categoryAggregations] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { variants: true },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { stock: { gt: 0 } } }),
    prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { stock: { gt: 0 } },
    }),
  ])

  const categoryCounts = categoryAggregations.reduce((acc, curr) => {
    if (curr.category) acc[curr.category] = curr._count.id
    return acc
  }, {} as Record<string, number>)

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE)
  const selectedCategory = CATEGORIES.find((category) => category.value === cat)
  const buildUrl = (updates: { cat?: string | null; q?: string | null; page?: string | null; sort?: string | null }) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    if (sort !== 'newest') params.set('sort', sort)

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
          background: #f6f6f5;
        }

        .shop-catalog-root {
          min-height: 100vh;
          background: #f7f7f6;
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
        }

        .shop-topbar {
          height: 46px;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 52px;
          border-radius: 22px 22px 0 0;
          font-size: 13px;
          font-weight: 600;
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
          width: 56px;
          height: 56px;
          border-radius: 10px;
          background: #e30613;
          color: #fff;
          display: grid;
          place-items: center;
          font-family: Georgia, serif;
          font-size: 42px;
          font-style: italic;
          font-weight: 700;
          line-height: 1;
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
          gap: 34px;
          font-size: 13px;
          font-weight: 800;
        }

        .shop-nav-links a {
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
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .product-card {
          position: relative;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fff;
          min-width: 0;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(20, 20, 20, 0.08);
          border-color: #d6d6d6;
        }

        .product-img-wrap {
          position: relative;
          display: block;
          aspect-ratio: 1 / 1.12;
          background: #fafafa;
          padding: 18px;
          text-decoration: none;
        }

        .product-img-inner {
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

        .product-fav {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 2;
          color: #606060;
          background: transparent;
          border: 0;
        }

        .product-info {
          padding: 0 16px 16px;
        }

        .product-name {
          min-height: 42px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: #111;
          text-decoration: none;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
          text-transform: uppercase;
        }

        .product-price {
          display: block;
          color: #e30613;
          font-size: 20px;
          font-weight: 900;
          margin: 14px 0 16px;
        }

        .shop-empty {
          border: 1px dashed #ddd;
          border-radius: 8px;
          padding: 80px 20px;
          text-align: center;
          color: #777;
          font-weight: 800;
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
            font-size: 31px;
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
            padding: 0 16px 32px;
            background: #fff;
          }

          .shop-main-head {
            display: none;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .product-card {
            border-radius: 6px;
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
          }

          .product-info {
            padding: 0 10px 10px;
          }

          .product-name {
            min-height: 38px;
            font-size: 11px;
            line-height: 1.35;
          }

          .product-price {
            font-size: 16px;
            margin: 9px 0 10px;
          }

          .shop-benefits {
            display: none;
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
              <span className="shop-topbar-item"><Truck className="size-4 text-red-500" /> Envios a todo Chile</span>
              <span className="shop-topbar-item"><Clock3 className="size-4" /> Despacho 24-48h en Linares</span>
            </div>
            <div className="shop-topbar-group">
              <span className="shop-topbar-item">Centro de ayuda</span>
              <span className="shop-topbar-item">Contacto</span>
            </div>
          </div>

          <header className="shop-header">
            <Link href="/" className="shop-brand">
              <span className="shop-brand-mark">m</span>
              <span className="shop-brand-text">MULTI<br />ACCESORIOS</span>
            </Link>

            <Suspense>
              <SearchBar />
            </Suspense>

            <div className="shop-header-actions">
              <Link href="/admin/login" className="shop-header-action"><User className="size-6" /><span>Mi cuenta<small>Ingresar</small></span></Link>
              <CartHeaderLink />
            </div>
          </header>

          <nav className="shop-nav">
            <Link href="/shop" className="shop-all-cats">
              <span className="inline-flex items-center gap-12"><Menu className="size-5" /> Todas las categorias</span>
            </Link>
            <div className="shop-nav-links">
                <Link href="/shop"><BadgePercent className="mr-1 inline size-4" /> Ofertas</Link>
              <Link href={buildUrl({ sort: 'newest', page: '1' })}>Nuevos</Link>
              <Link href="/shop">Mas vendidos</Link>
              <Link href="/shop">Marcas</Link>
              <Link href="/">Blog</Link>
              <Link href="/">Contacto</Link>
            </div>
          </nav>

          <header className="shop-mobile-header">
            <div className="shop-mobile-top">
              <Link href="/" className="shop-brand">
                <span className="shop-brand-mark">m</span>
                <span className="shop-brand-text">MULTI<br />ACCESORIOS</span>
              </Link>
              <div className="shop-mobile-actions">
                <CartHeaderLink mobile />
              </div>
            </div>
            <Suspense>
              <SearchBar />
            </Suspense>
          </header>

          <div className="shop-mobile-cats">
            <Link href={buildUrl({ cat: null, page: '1' })} className={`mobile-cat${!cat ? ' active' : ''}`}>
              <span className="mobile-cat-icon"><Menu className="size-5" /></span>
              Todos
            </Link>
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Link key={category.value} href={buildUrl({ cat: category.value, page: '1' })} className={`mobile-cat${cat === category.value ? ' active' : ''}`}>
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

          <div className="shop-content">
            <aside className="shop-sidebar">
              <section className="shop-panel">
                <div className="shop-panel-title">Categorias</div>
                <Link href={buildUrl({ cat: null, page: '1' })} className={`shop-side-link${!cat ? ' active' : ''}`}>
                  <span className="shop-side-main"><BadgePercent className="size-4" /> Todos los productos</span>
                  <span className="shop-side-count">{allAvailableProducts}</span>
                </Link>
                {CATEGORIES.map((category) => {
                  const Icon = category.icon
                  const count = categoryCounts[category.value] || 0
                  return (
                    <Link key={category.value} href={buildUrl({ cat: category.value, page: '1' })} className={`shop-side-link${cat === category.value ? ' active' : ''}`}>
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
                  <h1>{selectedCategory ? selectedCategory.label : 'Catalogo'}</h1>
                  <p>{totalProducts} productos disponibles</p>
                </div>
                <Suspense><SortSelect value={sort} /></Suspense>
              </div>

              <div className="shop-cat-chips">
                <Link href={buildUrl({ cat: null, page: '1' })} className={`shop-chip${!cat ? ' active' : ''}`}>Todos</Link>
                {CATEGORIES.map((category) => (
                  <Link key={category.value} href={buildUrl({ cat: category.value, page: '1' })} className={`shop-chip${cat === category.value ? ' active' : ''}`}>
                    {category.label} ({categoryCounts[category.value] || 0})
                  </Link>
                ))}
              </div>

              {products.length === 0 ? (
                <div className="shop-empty">No se encontraron productos</div>
              ) : (
                <div className="product-grid">
                  {products.map((product) => (
                    <article key={product.id} className="product-card">
                      <Link href={`/shop/${product.id}`} className="product-img-wrap">
                        <span className="product-img-inner">
                          <ProductImage
                            productId={product.id}
                            productName={product.name}
                            initialImageUrl={(product as Product & { imageUrl?: string | null }).imageUrl || null}
                          />
                        </span>
                        <span className="product-stock-badge">En stock</span>
                        <span className="product-fav"><Heart className="size-5" /></span>
                      </Link>
                      <div className="product-info">
                        <Link href={`/shop/${product.id}`} className="product-name">
                          {product.name}
                        </Link>
                        <span className="product-price">${Number(product.price).toLocaleString('es-CL')}</span>
                        {product.variants.length > 0 ? (
                          <Link href={`/shop/${product.id}`} className="h-10 rounded-[4px] border border-red-600 text-red-600 flex items-center justify-center text-xs font-black no-underline">
                            Ver opciones
                          </Link>
                        ) : (
                          <AddToCartButton
                            product={{
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              stock: product.stock,
                              imageUrl: product.imageUrl,
                            }}
                          />
                        )}
                      </div>
                    </article>
                  ))}
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
            <div className="shop-benefit"><Truck className="size-8" /><span>Envios a todo Chile<small>Rapido y seguro</small></span></div>
            <div className="shop-benefit"><Clock3 className="size-8" /><span>Despacho 24-48h en Linares<small>Compras antes de las 14:00</small></span></div>
            <div className="shop-benefit"><ShieldCheck className="size-8" /><span>Compra segura<small>Sitio protegido SSL</small></span></div>
            <div className="shop-benefit"><PackageCheck className="size-8" /><span>Garantia y cambios<small>Hasta 30 dias</small></span></div>
          </footer>
        </div>
      </div>
    </>
  )
}
