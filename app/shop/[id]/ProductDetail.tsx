'use client'

import Image from 'next/image'
import { useRef, useState, type PointerEvent } from 'react'
import { toast } from 'sonner'
import {
  BatteryCharging,
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
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

function cleanImages(images: string[]) {
  return images.filter((url) => url && !url.includes('placehold'))
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
  const [selectedSize, setSelectedSize] = useState<string | null>(
    variants.find((variant) => variant.stock > 0)?.size ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [clicked, setClicked] = useState(false)
  const galleryTrackRef = useRef<HTMLDivElement | null>(null)
  const galleryDragRef = useRef<{ x: number; scrollLeft: number } | null>(null)

  const cartItems = useCartStore((state) => state.cart)
  const addToCartStore = useCartStore((state) => state.addToCart)

  const hasVariants = variants.length > 0
  const selectedVariant = variants.find((variant) => variant.size === selectedSize)
  const fallbackImages = cleanImages(carouselImages)
  const variantImages = selectedVariant
    ? cleanImages([
        ...selectedVariant.images,
        ...(selectedVariant.imageUrl ? [selectedVariant.imageUrl] : []),
      ])
    : []

  const displayImages = variantImages.length > 0 ? variantImages : fallbackImages
  const safeDisplayImages = displayImages.length > 0 ? displayImages : ['/no-image-placeholder.jpg']
  const primaryImage = safeDisplayImages[activeImage] ?? safeDisplayImages[0]

  const availableStock = (() => {
    if (hasVariants) {
      if (!selectedVariant) return 0
      const itemInCart = cartItems.find((item) => item.id === `${product.id}-${selectedVariant.size}`)
      return Math.max(0, selectedVariant.stock - (itemInCart?.quantity ?? 0))
    }

    const itemInCart = cartItems.find((item) => item.id === product.id && !item.size)
    return Math.max(0, product.stock - (itemInCart?.quantity ?? 0))
  })()

  const hasAnyStockAvailable = hasVariants
    ? variants.some((variant) => {
        const itemInCart = cartItems.find((item) => item.id === `${product.id}-${variant.size}`)
        return variant.stock - (itemInCart?.quantity ?? 0) > 0
      })
    : availableStock > 0

  function selectVariant(size: string) {
    setSelectedSize(size)
    setActiveImage(0)
    setQuantity(1)
    galleryTrackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }

  function setGalleryImage(index: number) {
    const safeIndex = Math.max(0, Math.min(index, safeDisplayImages.length - 1))

    setActiveImage(safeIndex)
    galleryTrackRef.current?.scrollTo({
      left: galleryTrackRef.current.clientWidth * safeIndex,
      behavior: 'smooth',
    })
  }

  function syncImageFromScroll() {
    const track = galleryTrackRef.current
    if (!track || track.clientWidth === 0) return

    const nextIndex = Math.round(track.scrollLeft / track.clientWidth)
    setActiveImage(Math.max(0, Math.min(nextIndex, safeDisplayImages.length - 1)))
  }

  function startGalleryDrag(event: PointerEvent<HTMLDivElement>) {
    if (safeDisplayImages.length <= 1) return

    galleryDragRef.current = {
      x: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveGalleryDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = galleryDragRef.current
    if (!drag) return

    const deltaX = drag.x - event.clientX

    if (Math.abs(deltaX) > 4) {
      event.preventDefault()
    }

    event.currentTarget.scrollLeft = drag.scrollLeft + deltaX
  }

  function endGalleryDrag() {
    if (!galleryDragRef.current) return

    galleryDragRef.current = null
    syncImageFromScroll()
  }

  function addToCart() {
    if (hasVariants && !selectedVariant) {
      toast.error('Selecciona una variante')
      return
    }

    if (availableStock <= 0) {
      toast.error('No queda mas stock disponible de este articulo')
      return
    }

    const amount = Math.min(quantity, availableStock)
    setClicked(true)
    setTimeout(() => setClicked(false), 250)

    for (let index = 0; index < amount; index++) {
      addToCartStore({
        id: hasVariants ? `${product.id}-${selectedVariant?.size}` : product.id,
        productId: product.id,
        name: hasVariants ? `${product.name} (${selectedVariant?.size})` : product.name,
        price: product.price,
        stock: hasVariants && selectedVariant ? selectedVariant.stock : product.stock,
        size: selectedVariant?.size ?? null,
        imageUrl: primaryImage,
      })
    }

    toast.success(`${product.name}${selectedVariant ? ` (${selectedVariant.size})` : ''} agregado`)
  }

  const paymentText = 'Paga hasta en 6 cuotas sin interes con'

  return (
    <div className="product-detail-root">
      <div className="product-detail-grid">
        <section className="gallery-column" aria-label="Galeria del producto">
          <div className="desktop-thumbs">
            <span className="discount-pill">-15%</span>
            {safeDisplayImages.slice(0, 6).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setGalleryImage(index)}
                className={`thumb-button${activeImage === index ? ' active' : ''}`}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <Image src={image} alt="" fill sizes="72px" className="thumb-image" />
              </button>
            ))}
          </div>

          <div className="main-image-card">
            <div
              ref={galleryTrackRef}
              className="main-image-track"
              onScroll={syncImageFromScroll}
              onPointerDown={startGalleryDrag}
              onPointerMove={moveGalleryDrag}
              onPointerUp={endGalleryDrag}
              onPointerCancel={endGalleryDrag}
              onPointerLeave={endGalleryDrag}
            >
              {safeDisplayImages.map((image, index) => (
                <div key={`${image}-${index}`} className="main-image-slide">
                  <Image
                    src={image}
                    alt={index === 0 ? product.name : `${product.name} imagen ${index + 1}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 520px"
                    priority={index === 0}
                    className="main-product-image"
                  />
                </div>
              ))}
            </div>
            <span className="mobile-slide-count">{Math.min(activeImage + 1, safeDisplayImages.length)}/{safeDisplayImages.length}</span>
          </div>

          <div className="gallery-dots">
            {safeDisplayImages.slice(0, 5).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setGalleryImage(index)}
                className={activeImage === index ? 'active' : ''}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="product-copy">
          <div className="breadcrumb">Inicio / {product.category ?? 'Catalogo'} / {product.name}</div>
          <p className="brand-kicker">{product.category ?? 'Multi Accesorios'}</p>
          <h1>{product.name}</h1>

          <div className="rating-row">
            <span>4.7</span>
            <span className="stars">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-3 fill-red-600 text-red-600" />)}
            </span>
            <span>(126 resenas)</span>
            <span className="divider" />
            <span>Vendido por Multi Accesorios</span>
            <span className="seller-dot">m</span>
          </div>

          <div className="price-block">
            <strong>${Number(product.price).toLocaleString('es-CL')}</strong>
            <span>CLP</span>
          </div>
          <p className="payment-line">{paymentText} <b>mercado pago</b></p>

          <div className="stock-line">
            <span>En stock</span>
            <small>Despacho 24-48h en Linares</small>
          </div>

          {hasVariants && (
            <div className="variant-section">
              <div className="section-label">Sabor / Variante</div>
              <div className="variant-grid">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id
                  const itemInCart = cartItems.find((item) => item.id === `${product.id}-${variant.size}`)
                  const freeStock = Math.max(0, variant.stock - (itemInCart?.quantity ?? 0))
                  const isAvailable = freeStock > 0
                  const hasOwnVariantImage = Boolean(variant.images[0] ?? variant.imageUrl)
                  const variantImage = variant.images[0] ?? variant.imageUrl ?? fallbackImages[0] ?? '/no-image-placeholder.jpg'

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => isAvailable && selectVariant(variant.size)}
                      disabled={!isAvailable}
                      className={`variant-card${isSelected ? ' active' : ''}${!isAvailable ? ' disabled' : ''}`}
                    >
                      <span className="variant-image-wrap">
                        <Image src={variantImage} alt="" fill sizes="56px" className={hasOwnVariantImage ? '' : 'fallback-variant-image'} />
                      </span>
                      <span className="variant-text">
                        <strong>{variant.size}</strong>
                        <small>{isAvailable ? 'En stock' : 'Agotado'}</small>
                      </span>
                      {isSelected && <span className="variant-check"><Check className="size-3" /></span>}
                    </button>
                  )
                })}
              </div>
              <p className="variant-help">No encuentras tu sabor? Avisanos y lo buscamos para ti.</p>
            </div>
          )}
        </section>

        <aside className="purchase-card">
          <p className="purchase-kicker">Precio final</p>
          <div className="purchase-price">
            <strong>${Number(product.price).toLocaleString('es-CL')}</strong>
            <span>CLP</span>
          </div>

          <div className="qty-control" aria-label="Cantidad">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Disminuir cantidad"><Minus className="size-4" /></button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((value) => Math.min(availableStock || 1, value + 1))} aria-label="Aumentar cantidad"><Plus className="size-4" /></button>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={!hasAnyStockAvailable || (hasVariants && !selectedVariant) || availableStock <= 0}
            className="add-cart-button"
            style={{ transform: clicked ? 'scale(0.98)' : 'scale(1)' }}
          >
            <ShoppingCart className="size-5" />
            Agregar al carrito
          </button>
          <button type="button" className="buy-now-button">
            <Zap className="size-4" />
            Comprar ahora
          </button>

          <div className="protected-box">
            <p>Compra protegida</p>
            <span><ShieldCheck className="size-4" /> Garantia de 30 dias</span>
            <span><PackageCheck className="size-4" /> Devolucion facil</span>
            <span><Check className="size-4" /> Compra 100% segura</span>
          </div>

          <div className="payment-box">
            <p>Medios de pago</p>
            <div className="payment-badges">
              <span>mercado pago</span>
              <span>VISA</span>
              <span>MC</span>
              <span>Redcompra</span>
            </div>
            <small>Hasta 6 cuotas sin interes</small>
          </div>

          <div className="seller-box">
            <span className="seller-logo">m</span>
            <span><b>Multi Accesorios</b><small>+10.000 ventas</small></span>
            <span className="verified">Verificado</span>
          </div>
        </aside>

        <section className="detail-tabs">
          <div className="tabs-head">
            <button className="active">Descripcion</button>
            <button>Especificaciones</button>
            <button>Que incluye</button>
            <button>Resenas (126)</button>
            <button>Preguntas frecuentes</button>
          </div>
          <p>{product.description || 'Producto seleccionado por Multi Accesorios, disponible para retiro en tienda y despacho a todo Chile.'}</p>
          <div className="feature-row">
            <span><BatteryCharging className="size-6" /> <b>Stock real</b><small>Segun variante</small></span>
            <span><ShieldCheck className="size-6" /> <b>Compra segura</b><small>Sitio protegido</small></span>
            <span><Truck className="size-6" /> <b>Despacho rapido</b><small>24-48h en Linares</small></span>
            <span><Store className="size-6" /> <b>Retiro en tienda</b><small>Disponible</small></span>
          </div>
        </section>
      </div>

      <div className="mobile-buy-bar">
        <div>
          <strong>${Number(product.price).toLocaleString('es-CL')}</strong>
          <span>CLP</span>
        </div>
        <div className="mobile-qty">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="size-4" /></button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => Math.min(availableStock || 1, value + 1))}><Plus className="size-4" /></button>
        </div>
        <button type="button" onClick={addToCart} disabled={!hasAnyStockAvailable || availableStock <= 0}>
          <ShoppingCart className="size-4" />
          Agregar
        </button>
      </div>
    </div>
  )
}
