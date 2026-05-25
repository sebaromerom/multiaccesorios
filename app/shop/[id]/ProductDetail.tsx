'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import ProductCarousel from '@/components/ProductCarousel'
import { useCartStore } from '@/lib/store'

type Variant = {
  id: string
  size: string
  stock: number
  imageUrl: string | null
  images: string[]
}

type Product = {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
  description: string | null
}

export default function ProductDetail({
  product,
  variants,
  carouselImages,
}: {
  product: Product
  variants: Variant[]
  carouselImages: string[]
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [clicked, setClicked]           = useState(false)

  // ── INTEGRACIÓN CON ZUSTAND STORE ──
  const cartItems = useCartStore((state) => state.cart)
  const addToCartStore = useCartStore((state) => state.addToCart)

  const hasVariants     = variants.length > 0
  const selectedVariant = variants.find(v => v.size === selectedSize)

  // ── CÁLCULO DE STOCK DINÁMICO REACTIVO ──
  const getDynamicProductStock = () => {
    const itemInCart = cartItems.find((i) => i.id === product.id)
    return Math.max(0, product.stock - (itemInCart?.quantity ?? 0))
  }

  const getDynamicVariantStock = (variant: Variant) => {
    const targetId = `${product.id}-${variant.size}`
    const itemInCart = cartItems.find((i) => i.id === targetId)
    return Math.max(0, variant.stock - (itemInCart?.quantity ?? 0))
  }

  // Stock disponible de la variante o producto seleccionado actualmente
  const currentAvailableStock = hasVariants
    ? (selectedVariant ? getDynamicVariantStock(selectedVariant) : 0)
    : getDynamicProductStock()

  // Determina si queda stock de cualquier tipo
  const hasAnyStockAvailable = hasVariants
    ? variants.some(v => getDynamicVariantStock(v) > 0)
    : getDynamicProductStock() > 0

  const displayImages: string[] =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : selectedVariant?.imageUrl
      ? [selectedVariant.imageUrl]
      : carouselImages

  function addToCart() {
    if (hasVariants && !selectedSize) {
      toast.error('Selecciona una variante')
      return
    }

    if (currentAvailableStock <= 0) {
      toast.error('No queda más stock disponible de este artículo')
      return
    }

    setClicked(true)
    setTimeout(() => setClicked(false), 300)

    // Ajustado exactamente a la interfaz 'ProductInput' sin la propiedad quantity
    addToCartStore({
      id:       hasVariants ? `${product.id}-${selectedSize}` : product.id,
      name:     hasVariants ? `${product.name} (${selectedSize})` : product.name,
      price:    product.price,
      stock:    hasVariants && selectedVariant ? selectedVariant.stock : product.stock,
    })

    toast.success(`${product.name}${selectedSize ? ` (${selectedSize})` : ''} agregado`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[60vh] lg:min-h-[80vh]">

      {/* ── IMAGEN ───────────────────────────────────────────────────────── */}
      <div
        className="relative bg-zinc-50 flex items-center justify-center p-4 py-8 lg:p-16"
        style={{ animation: 'fadeIn 0.5s ease forwards' }}
      >
        {product.category && (
          <div className="absolute top-4 left-4 lg:top-6 lg:left-6 text-[9px] tracking-[0.4em] uppercase text-zinc-400 border border-zinc-200 px-3 py-1.5 bg-white z-10">
            {product.category}
          </div>
        )}

        <div className="w-full max-w-70 sm:max-w-sm lg:max-w-lg">
          <ProductCarousel images={displayImages} name={product.name} />
        </div>
      </div>

      {/* ── INFO ─────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col justify-between py-8 px-0 lg:p-16 lg:border-l lg:border-zinc-100"
        style={{ animation: 'fadeInUp 0.5s ease 0.1s both' }}
      >
        <div className="flex flex-col gap-0">

          <h1
            className="text-3xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tighter leading-none text-black mb-6 lg:mb-8"
            style={{ fontStyle: 'italic' }}
          >
            {product.name}
          </h1>

          <div className="w-10 lg:w-12 h-0.5 bg-red-600 mb-6 lg:mb-8" />

          <div className="flex items-baseline gap-2 lg:gap-3 mb-2">
            <span className="text-4xl lg:text-5xl font-black tracking-tight text-black">
              ${Number(product.price).toLocaleString('es-CL')}
            </span>
            <span className="text-[10px] lg:text-xs tracking-[0.2em] uppercase text-zinc-400">CLP</span>
          </div>

          {/* Stock dinámico sin variantes */}
          {!hasVariants && (
            <p className={`text-[9px] lg:text-[10px] tracking-[0.3em] uppercase font-bold mb-6 lg:mb-8 ${
              getDynamicProductStock() > 0 ? 'text-zinc-400' : 'text-red-500'
            }`}>
              {getDynamicProductStock() > 0 ? `${getDynamicProductStock()} unidades disponibles` : 'Sin stock disponible'}
            </p>
          )}

          {product.description && (
            <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed w-full lg:max-w-sm mt-2 lg:mt-4 mb-6 lg:mb-8">
              {product.description}
            </p>
          )}

          {/* ── VARIANTES DINÁMICAS ────────────────────────────────────────── */}
          {hasVariants && (
            <div className="mt-4 lg:mt-6 mb-8 lg:mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] lg:text-[10px] tracking-[0.3em] uppercase text-zinc-400 font-bold">
                  Variante
                </p>
                {selectedSize && (
                  <p className="text-[9px] lg:text-[10px] tracking-[0.2em] uppercase text-black font-bold">
                    {selectedSize}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {variants.map(variant => {
                  const isSelected    = selectedSize === variant.size
                  const dynamicStock  = getDynamicVariantStock(variant)
                  const isAvailable   = dynamicStock > 0

                  return (
                    <button
                      key={variant.id}
                      onClick={() => isAvailable && setSelectedSize(variant.size)}
                      disabled={!isAvailable}
                      className={`
                        px-3 py-2 lg:px-4 lg:py-2.5 text-[10px] lg:text-[11px] tracking-[0.15em] uppercase font-bold border-2 transition-all duration-200
                        ${!isAvailable
                          ? 'border-zinc-100 text-zinc-300 cursor-not-allowed line-through bg-zinc-50'
                          : isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-zinc-200 text-zinc-600 hover:border-black hover:text-black'
                        }
                      `}
                    >
                      {variant.size}
                    </button>
                  )
                })}
              </div>

              {selectedVariant && (
                <p className={`text-[9px] lg:text-[10px] tracking-[0.3em] uppercase font-bold mt-3 ${
                  getDynamicVariantStock(selectedVariant) <= 3 ? 'text-red-500' : 'text-zinc-400'
                }`}>
                  {getDynamicVariantStock(selectedVariant) === 0
                    ? 'Agotado en este tamaño (añadido al carrito)'
                    : getDynamicVariantStock(selectedVariant) <= 3
                    ? `⚠ Últimas ${getDynamicVariantStock(selectedVariant)} unidades`
                    : `${getDynamicVariantStock(selectedVariant)} unidades disponibles`
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── CTA DINÁMICO ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 mt-6 lg:mt-0">
          {hasAnyStockAvailable ? (
            <>
              <button
                onClick={addToCart}
                disabled={hasVariants && selectedSize ? currentAvailableStock <= 0 : false}
                className={`
                  w-full py-4 lg:py-5 text-[10px] lg:text-xs tracking-[0.3em] uppercase font-black transition-all duration-300
                  flex items-center justify-center gap-3
                  ${(hasVariants && !selectedSize)
                    ? 'bg-zinc-100 text-zinc-400 cursor-default'
                    : (hasVariants && selectedSize && currentAvailableStock <= 0)
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-red-600'
                  }
                `}
                style={{
                  transform: clicked ? 'scale(0.98)' : 'scale(1)',
                  transition: 'transform 0.15s ease, background-color 0.3s ease',
                }}
              >
                {hasVariants && !selectedSize
                  ? 'Selecciona una variante'
                  : hasVariants && selectedSize && currentAvailableStock <= 0
                  ? 'Sin existencias libres'
                  : (
                    <>
                      Agregar al carrito
                      <span className="text-base">→</span>
                    </>
                  )
                }
              </button>

              <p className="text-center text-[8px] lg:text-[9px] tracking-[0.3em] uppercase text-zinc-400">
                Retiro en tienda · Envío Starken a todo Chile
              </p>
            </>
          ) : (
            <div className="w-full py-4 lg:py-5 text-[10px] lg:text-xs tracking-[0.3em] uppercase font-black text-center text-zinc-400 bg-zinc-100 border-2 border-zinc-200">
              Producto totalmente agotado
            </div>
          )}
        </div>

      </div>
    </div>
  )
}