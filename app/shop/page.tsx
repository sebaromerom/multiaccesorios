import { prisma } from '@/lib/prisma'
import AddToCartButton from './AddToCartButton'
import ProductStockBadge from './ProductStockBadge'
import ProductImage from './ProductImage' // 1. Traemos el componente cliente que creamos
import Link from 'next/link'
import SearchBar from './SearchBar'
import MobileSortSelect from './MobileSortSelect'
import { Suspense } from 'react'
import { Category } from '@prisma/client'

export const dynamic = 'force-dynamic'

/* eslint-disable @next/next/no-img-element */

const CATEGORIES = [
  { value: 'Carcasa',    label: 'Carcasas' },
  { value: 'Lamina',     label: 'Láminas' },
  { value: 'Cargador',   label: 'Cargadores' },
  { value: 'Cable',      label: 'Cables' },
  { value: 'Audifonos',  label: 'Audífonos' },
  { value: 'Vapers',     label: 'Vapers' },
  { value: 'Computacion', label: 'Computación' },
  { value: 'Otros',      label: 'Otros' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: Menor a Mayor' },
  { value: 'price_desc', label: 'Precio: Mayor a Menor' },
  { value: 'alpha_asc', label: 'Nombre: A a la Z' },
  { value: 'alpha_desc', label: 'Nombre: Z a la A' },
]

const PAGE_SIZE = 24

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string; sort?: string }>
}) {
  const { q, cat, page, sort = 'newest' } = await searchParams
  const currentPage = Number(page || 1)

  // Filtros de base de datos
  const where = {
    stock: { gt: 0 },
    ...(cat ? { category: cat as Category } : {}),
    ...(q ? {
      OR: [
        { name:        { contains: q, mode: 'insensitive' as const } },
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

  // Consultas en paralelo a Prisma (Server-side)
  const [products, totalProducts, categoryAggregations] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { variants: true },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { stock: { gt: 0 } },
    })
  ])

  // Mapeo de contadores seguro contra tipos 'null' de base de datos
  const categoryCounts = categoryAggregations.reduce((acc, curr) => {
    if (curr.category) {
      acc[curr.category] = curr._count.id;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE)

  // Generador de URLs para filtros cruzados en links tradicionales de escritorio
  const buildUrl = (updates: { cat?: string | null; q?: string | null; page?: string | null; sort?: string | null }) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    if (sort !== 'newest') params.set('sort', sort)
    
    if (updates.q !== undefined) updates.q === null ? params.delete('q') : params.set('q', updates.q)
    if (updates.cat !== undefined) updates.cat === null ? params.delete('cat') : params.set('cat', updates.cat)
    if (updates.sort !== undefined) updates.sort === null ? params.delete('sort') : params.set('sort', updates.sort)
    if (updates.page !== undefined) updates.page === null ? params.delete('page') : params.set('page', updates.page)
    
    return `/shop?${params.toString()}`
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');

        .shop-root {
          min-height: 100vh;
          background: #fff;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── HERO BANNER RESPONSIVO ── */
        .shop-hero {
          border-bottom: 1px solid #e5e5e5;
          padding: 60px 40px 40px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 32px;
        }
        .shop-hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(42px, 7vw, 100px);
          line-height: 0.85;
          letter-spacing: -0.02em;
          color: #0a0a0a;
          margin: 0;
        }
        .shop-hero-title span { color: #d11a2a; }
        
        .shop-hero-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        .shop-count {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #888;
          font-weight: 500;
        }

        .mobile-sort-wrapper {
          display: none;
          padding: 0 20px 16px;
          background: #fff;
        }

        /* ── LAYOUT PRINCIPAL ── */
        .shop-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: calc(100vh - 200px);
        }

        /* ── SIDEBAR (ESCRITORIO) ── */
        .shop-sidebar {
          border-right: 1px solid #e5e5e5;
          padding: 40px 24px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .sidebar-label {
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 16px;
          margin-top: 36px;
          display: block;
          font-weight: 700;
        }
        .sidebar-label:first-child { margin-top: 0; }
        
        .cat-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.02em;
          border: none;
          background: transparent;
          color: #555;
          cursor: pointer;
          transition: all 0.15s ease;
          border-left: 2px solid transparent;
          text-decoration: none;
        }
        .cat-btn:hover { color: #0a0a0a; background: #f9f9f9; border-left-color: #ccc; }
        .cat-btn.active { color: #0a0a0a; font-weight: 700; border-left-color: #d11a2a; background: #fff5f5; }
        .cat-count { font-size: 11px; color: #aaa; font-weight: 400; }
        .cat-btn.active .cat-count { color: #d11a2a; font-weight: 600; }

        /* ── CATEGORÍAS EN MÓVIL ── */
        .shop-mobile-cats {
          display: none;
          overflow-x: auto;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
          gap: 10px;
          padding: 16px 4px;
          border-bottom: 1px solid oklch(0.90 0.005 60);
          background: #fff;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .shop-mobile-cats::-webkit-scrollbar { display: none; }

        .mobile-cat-pill {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid oklch(0.85 0.005 60); 
          border-radius: 6px;
          background: oklch(0.99 0.005 60);
          color: oklch(0.50 0.005 60);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-cat-pill.active {
          background: oklch(0.20 0.005 60);
          color: #fff;
          border-color: oklch(0.20 0.005 60);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        .mobile-cat-pill:not(.active):hover {
          background: oklch(0.95 0.005 60);
          color: oklch(0.15 0.005 60);
          border-color: oklch(0.75 0.005 60);
        }

        /* ── MAIN CONTENT ── */
        .shop-main { padding: 40px 40px 80px; }
        .shop-search-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
          width: 100%;
        }
        .search-result-text { font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #888; }
        .search-result-text strong { color: #0a0a0a; }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1px;
          background: #e5e5e5;
          border: 1px solid #e5e5e5;
        }

        /* ── PRODUCT CARD ── */
        .product-card {
          background: #fff;
          display: flex;
          flex-direction: column;
          opacity: 0;
          animation: cardIn 0.4s ease forwards;
        }
        @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .product-img-wrap { aspect-ratio: 1; overflow: hidden; background: #fcfcfc; position: relative; }
        .product-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); display: block; }
        .product-card:hover .product-img-wrap img { transform: scale(1.05); }
        
        .product-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #ccc; }
        
        .product-stock-badge { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #333; padding: 4px 8px; border: 1px solid #e5e5e5; z-index: 2; }
        .product-stock-badge.low { background: #d11a2a; color: #fff; border-color: #d11a2a; }

        .product-info { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .product-name { font-size: 13px; font-weight: 500; color: #0a0a0a; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 36px; text-decoration: none; }
        .product-name:hover { color: #d11a2a; }
        
        .product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
        .product-price { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: #0a0a0a; letter-spacing: 0.01em; line-height: 1; }

        .btn-ver, .btn-cart { height: 32px; padding: 0 14px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 1.5px solid #0a0a0a; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
        .btn-ver { background: transparent; color: #0a0a0a; }
        .btn-ver:hover { background: #0a0a0a; color: #fff; }

        .shop-empty { padding: 100px 0; text-align: center; }
        .shop-empty p { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; }

        .shop-pagination { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 60px; }
        .page-btn { width: 40px; height: 40px; font-size: 13px; font-weight: 600; border: 1.5px solid #e5e5e5; background: #fff; color: #444; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .page-btn:hover { border-color: #0a0a0a; color: #0a0a0a; }
        .page-btn.active { background: #0a0a0a; color: #fff; border-color: #0a0a0a; }
        .page-btn.arrow { font-size: 18px; width: 48px; }

        @media (max-width: 768px) {
          .shop-layout { grid-template-columns: 1fr; }
          .shop-sidebar { display: none; }
          .shop-mobile-cats { display: flex; }
          .mobile-sort-wrapper { display: block; }

          .shop-hero {
            padding: 32px 20px 24px;
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .shop-hero-meta {
            align-items: flex-start;
            width: 100%;
          }
          .shop-main { padding: 24px 20px 60px; }
          
          .shop-search-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
          }

          .product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1px;
          }
          .product-info { padding: 12px; gap: 8px; }
          .product-name { font-size: 11px; min-height: 32px; line-height: 1.3; }
          
          .product-bottom { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 8px; 
          }
          .product-price { font-size: 22px; }
          
          .product-bottom > * {
            width: 100%;
          }
          
          .btn-ver {
            width: 100%;
            padding: 0;
            font-size: 10px;
            height: 32px;
          }
          .product-stock-badge {
            top: 6px;
            right: 6px;
            font-size: 8px;
            padding: 3px 6px;
          }
        }
      `}</style>

      <div className="shop-root">
        {/* HERO BANNER */}
        <div className="shop-hero">
          <h1 className="shop-hero-title">
            {cat ? cat.toUpperCase() : 'CATÁLOGO'}
          </h1>
          <div className="shop-hero-meta">
            <Suspense>
              <SearchBar />
            </Suspense>
            <span className="shop-count">
              {totalProducts} productos disponibles
            </span>
          </div>
        </div>

        {/* CATEGORÍAS HORIZONTALES EN MÓVIL */}
        <div className="shop-mobile-cats">
          <Link href={buildUrl({ cat: null, page: '1' })} className={`mobile-cat-pill${!cat ? ' active' : ''}`}>
            Todos
          </Link>
          {CATEGORIES.map(c => (
            <Link key={c.value} href={buildUrl({ cat: c.value, page: '1' })} className={`mobile-cat-pill${cat === c.value ? ' active' : ''}`}>
              {c.label} {categoryCounts[c.value] ? `(${categoryCounts[c.value]})` : ''}
            </Link>
          ))}
        </div>

        {/* SELECTOR DE ORDENAMIENTO EN MÓVIL */}
        <Suspense>
          <MobileSortSelect currentSort={sort} q={q} cat={cat} />
        </Suspense>

        {/* INTERFAZ PRINCIPAL */}
        <div className="shop-layout">

          {/* ASIDE / SIDEBAR (SÓLO VISIBLE EN ESCRITORIO) */}
          <aside className="shop-sidebar">
            <span className="sidebar-label">Categorías</span>
            <Link href={buildUrl({ cat: null, page: '1' })} className={`cat-btn${!cat ? ' active' : ''}`}>
              <span>Todos</span>
            </Link>
            {CATEGORIES.map(c => {
              const count = categoryCounts[c.value] || 0;
              return (
                <Link key={c.value} href={buildUrl({ cat: c.value, page: '1' })} className={`cat-btn${cat === c.value ? ' active' : ''}`}>
                  <span>{c.label}</span>
                  <span className="cat-count">{count}</span>
                </Link>
              )
            })}

            <span className="sidebar-label">Ordenar Por</span>
            {SORT_OPTIONS.map(option => (
              <Link 
                key={option.value} 
                href={buildUrl({ sort: option.value, page: '1' })} 
                className={`cat-btn${sort === option.value ? ' active' : ''}`}
              >
                <span>{option.label}</span>
              </Link>
            ))}
          </aside>

          {/* CONTENIDO / PRODUCTOS */}
          <main className="shop-main">

            {/* METADATOS DE BÚSQUEDA */}
            <div className="shop-search-row">
              <div className="search-result-text">
                {q ? (
                  <>Resultados para <strong>&ldquo;{q}&rdquo;</strong> — {totalProducts} productos</>
                ) : cat ? (
                  <> {totalProducts} productos en <strong>{cat}</strong></>
                ) : (
                  <>{totalProducts} productos</>
                )}
              </div>
              {(q || cat || sort !== 'newest') && (
                <Link href="/shop" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d11a2a', fontWeight: 700, textDecoration: 'none' }}>
                  Limpiar filtros ×
                </Link>
              )}
            </div>

            {/* GRILLA DE PRODUCTOS RESPONSIVE */}
            {products.length === 0 ? (
              <div className="shop-empty">
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product, index) => {
                  return (
                    <div
                      key={product.id}
                      className="product-card"
                      style={{ animationDelay: `${Math.min(index * 0.025, 0.5)}s` }}
                    >
                      {/* 2. Reemplazamos toda la lógica manual rota de imágenes por nuestro componente protegido */}
                      <Link href={`/shop/${product.id}`} className="product-img-wrap" style={{ display: 'block' }}>
                        <ProductImage 
                          productId={product.id}
                          productName={product.name}
                          initialImageUrl={product.imageUrl}
                        />
                        
                        <ProductStockBadge 
                          productId={product.id} 
                          initialStock={product.stock} 
                        />
                      </Link>

                      <div className="product-info">
                        <Link href={`/shop/${product.id}`} className="product-name">
                          {product.name}
                        </Link>

                        <div className="product-bottom">
                          <span className="product-price">
                            ${product.price.toLocaleString('es-CL')}
                          </span>

                          {product.variants.length > 0 ? (
                            <Link href={`/shop/${product.id}`} className="btn-ver">
                              Ver →
                            </Link>
                          ) : (
                            <div className="w-full">
                              <AddToCartButton
                                product={{
                                  id:    product.id,
                                  name:  product.name,
                                  price: product.price,
                                  stock: product.stock
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="shop-pagination">
                {currentPage > 1 && (
                  <Link
                    href={buildUrl({ page: String(currentPage - 1) })}
                    className="page-btn arrow"
                  >←</Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i-1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`d${i}`} style={{ padding: '0 4px', color: '#bbb', fontSize: 12 }}>…</span>
                    ) : (
                      <Link
                        key={p}
                        href={buildUrl({ page: String(p) })}
                        className={`page-btn${p === currentPage ? ' active' : ''}`}
                      > {p}</Link>
                    )
                  )}

                {currentPage < totalPages && (
                  <Link
                    href={buildUrl({ page: String(currentPage + 1) })}
                    className="page-btn arrow"
                  >→</Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}