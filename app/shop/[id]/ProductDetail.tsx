'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, type PointerEvent, type TouchEvent } from 'react'
import { toast } from 'sonner'
import {
  BatteryCharging,
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import BrandLogo from '@/components/BrandLogo'
import SafeProductImage from '@/components/SafeProductImage'

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
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState<string | null>(
    variants.find((variant) => variant.stock > 0)?.size ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [clicked, setClicked] = useState(false)
  const galleryTrackRef = useRef<HTMLDivElement | null>(null)
  const galleryDragRef = useRef<{ startX: number; lastX: number; startIndex: number } | null>(null)
  const galleryTouchRef = useRef<{
    startX: number
    startY: number
    lastX: number
    lastY: number
    startIndex: number
  } | null>(null)

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
  const safeDisplayImages = displayImages.length > 0 ? displayImages : [null]
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
  const variantLabel =
    product.category === 'Vapers'
      ? 'Sabor / Variante'
      : product.category === 'Carcasa' || product.category === 'Lamina'
        ? 'Modelo / Variante'
        : product.category === 'Audifonos'
          ? 'Color / Variante'
          : 'Variante'
  const variantHelp =
    product.category === 'Vapers'
      ? 'No encuentras tu sabor? Avísanos y lo buscamos para ti.'
      : 'No encuentras tu modelo? Avísanos y lo buscamos para ti.'

  function selectVariant(size: string) {
    setSelectedSize(size)
    setActiveImage(0)
    setQuantity(1)
    galleryTrackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }

  function setGalleryImage(index: number) {
    const safeIndex = Math.max(0, Math.min(index, safeDisplayImages.length - 1))

    setActiveImage(safeIndex)
  }

  function startGalleryDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return
    if (safeDisplayImages.length <= 1) return

    galleryDragRef.current = {
      startX: event.clientX,
      lastX: event.clientX,
      startIndex: activeImage,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveGalleryDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return
    const drag = galleryDragRef.current
    if (!drag) return

    drag.lastX = event.clientX
    const deltaX = drag.startX - event.clientX

    if (Math.abs(deltaX) > 4) {
      event.preventDefault()
    }
  }

  function endGalleryDrag() {
    const drag = galleryDragRef.current
    if (!drag) return

    galleryDragRef.current = null
    const deltaX = drag.lastX - drag.startX

    if (Math.abs(deltaX) < 34) return

    setGalleryImage(drag.startIndex + (deltaX < 0 ? 1 : -1))
  }

  function startGalleryTouch(event: TouchEvent<HTMLDivElement>) {
    if (safeDisplayImages.length <= 1) return

    const touch = event.touches[0]
    if (!touch) return

    galleryTouchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startIndex: activeImage,
    }
  }

  function moveGalleryTouch(event: TouchEvent<HTMLDivElement>) {
    const touchState = galleryTouchRef.current
    const touch = event.touches[0]
    if (!touchState || !touch) return

    touchState.lastX = touch.clientX
    touchState.lastY = touch.clientY
  }

  function endGalleryTouch() {
    const touchState = galleryTouchRef.current
    if (!touchState) return

    galleryTouchRef.current = null
    const deltaX = touchState.lastX - touchState.startX
    const deltaY = touchState.lastY - touchState.startY
    const isHorizontalSwipe = Math.abs(deltaX) >= 34 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15

    if (!isHorizontalSwipe) {
      return
    }

    setGalleryImage(touchState.startIndex + (deltaX < 0 ? 1 : -1))
  }

  function handleVariantClick(size: string, isAvailable: boolean) {
    if (isAvailable) selectVariant(size)
  }

  function addToCart() {
    if (hasVariants && !selectedVariant) {
      toast.error('Selecciona una variante')
      return false
    }

    if (availableStock <= 0) {
      toast.error('No queda mas stock disponible de este articulo')
      return false
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
    return true
  }

  function buyNow() {
    if (addToCart()) {
      router.push('/shop/cart')
    }
  }

  const paymentText = 'Paga hasta en 6 cuotas sin interés con'

  return (
    <div className="product-detail-root">
      <div className="product-detail-grid">
        <section className="gallery-column" aria-label="Galeria del producto">
          <div className="desktop-thumbs">
            {safeDisplayImages.slice(0, 6).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setGalleryImage(index)}
                className={`thumb-button${activeImage === index ? ' active' : ''}`}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <SafeProductImage src={image} alt="" fill sizes="72px" imageClassName="thumb-image" />
              </button>
            ))}
          </div>

          <div className="main-image-card">
            <div
              ref={galleryTrackRef}
              className="main-image-track"
              onPointerDown={startGalleryDrag}
              onPointerMove={moveGalleryDrag}
              onPointerUp={endGalleryDrag}
              onPointerCancel={endGalleryDrag}
              onPointerLeave={endGalleryDrag}
              onTouchStart={startGalleryTouch}
              onTouchMove={moveGalleryTouch}
              onTouchEnd={endGalleryTouch}
              onTouchCancel={endGalleryTouch}
            >
              <div key={`${primaryImage}-${activeImage}`} className="main-image-slide">
                <SafeProductImage
                  src={primaryImage}
                  alt={activeImage === 0 ? product.name : `${product.name} imagen ${activeImage + 1}`}
                  fill
                  sizes="(max-width: 760px) 100vw, 520px"
                  priority
                  imageClassName="main-product-image"
                  unoptimized
                />
              </div>
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
          <div className="breadcrumb">Inicio / {product.category ?? 'Catálogo'} / {product.name}</div>
          <p className="brand-kicker">{product.category ?? 'Multi Accesorios'}</p>
          <h1>{product.name}</h1>

          <div className="rating-row">
            <span>Vendido por Multi Accesorios</span>
            <BrandLogo className="seller-dot" alt="" sizes="16px" />
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
              <div className="section-label">{variantLabel}</div>
              <div
                className="variant-grid"
              >
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id
                  const itemInCart = cartItems.find((item) => item.id === `${product.id}-${variant.size}`)
                  const freeStock = Math.max(0, variant.stock - (itemInCart?.quantity ?? 0))
                  const isAvailable = freeStock > 0
                  const hasOwnVariantImage = Boolean(variant.images[0] ?? variant.imageUrl)
                  const variantImage = variant.images[0] ?? variant.imageUrl ?? fallbackImages[0] ?? null

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantClick(variant.size, isAvailable)}
                      disabled={!isAvailable}
                      className={`variant-card${isSelected ? ' active' : ''}${!isAvailable ? ' disabled' : ''}`}
                    >
                      <span className="variant-image-wrap">
                        <SafeProductImage
                          src={variantImage}
                          alt=""
                          fill
                          sizes="(max-width: 760px) 34px, 56px"
                          imageClassName={hasOwnVariantImage ? '' : 'fallback-variant-image'}
                        />
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
              <p className="variant-help">{variantHelp}</p>
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
          <button type="button" className="buy-now-button" onClick={buyNow}>
            <Zap className="size-4" />
            Comprar ahora
          </button>

          <div className="protected-box">
            <p>Compra protegida</p>
            <span><ShieldCheck className="size-4" /> Garantía de 30 días</span>
            <span><PackageCheck className="size-4" /> Devolución fácil</span>
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
            <small>Hasta 6 cuotas sin interés</small>
          </div>

          <div className="seller-box">
            <BrandLogo className="seller-logo" alt="" sizes="34px" />
            <span><b>Multi Accesorios</b><small>Tienda oficial</small></span>
            <span className="verified">Verificado</span>
          </div>
        </aside>

        <section className="detail-tabs">
          <div className="tabs-head">
            <button className="active">Descripción</button>
            <button>Especificaciones</button>
            <button>Qué incluye</button>
            <button>Preguntas frecuentes</button>
          </div>
          <p>{product.description || 'Producto seleccionado por Multi Accesorios, disponible para retiro en tienda y despacho a todo Chile.'}</p>
          <div className="feature-row">
            <span><BatteryCharging className="size-6" /> <b>Stock real</b><small>Según variante</small></span>
            <span><ShieldCheck className="size-6" /> <b>Compra segura</b><small>Sitio protegido</small></span>
            <span><Truck className="size-6" /> <b>Despacho rápido</b><small>24-48h en Linares</small></span>
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
