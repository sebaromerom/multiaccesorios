'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ProductCarousel from '@/components/ProductCarousel'
import { useCartStore } from '@/lib/store' // ── IMPORTAMOS EL STORE GLOBAL ──

type Variant = {
  id: string
  size: string
  stock: number
  imageUrl: string | null
  images?: string[]
}

type Product = {
  id: string
  name: string
  price: number
  stock: number
}

export default function AddToCartWithSize({
  product,
  variants,
  carouselImages,
  showCarouselOnly = false,
}: {
  product: Product
  variants: Variant[]
  carouselImages: string[]
  showCarouselOnly?: boolean
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [clicked, setClicked] = useState(false)

  // ── ESTADO GLOBAL DEL CARRITO ──
  const cart = useCartStore((state) => state.cart)

  const hasVariants = variants.length > 0
  const selectedVariant = variants.find(v => v.size === selectedSize)

  // Definimos el ID único que tendrá este item en el carrito (base o compuesto)
  const targetCartId = hasVariants ? `${product.id}-${selectedSize}` : product.id

  // Calculamos el stock disponible real restando lo que ya está en el carrito
  const itemInCart = cart.find((i) => i.id === targetCartId)
  const quantityInCart = itemInCart ? itemInCart.quantity : 0
  
  const currentMaxStock = hasVariants 
    ? (selectedVariant ? selectedVariant.stock : 0) 
    : product.stock

  const availableStock = currentMaxStock - quantityInCart

  // Prioridad: imágenes del carrusel de la variante → imageUrl → imágenes del producto
  const displayImages: string[] =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : selectedVariant?.imageUrl
      ? [selectedVariant.imageUrl]
      : carouselImages

  if (showCarouselOnly) {
    return <ProductCarousel images={displayImages} name={product.name} />
  }

  function addToCart() {
    if (hasVariants && !selectedSize) {
      toast.error('Selecciona una variante')
      return
    }

    if (availableStock <= 0) {
      toast.error('No queda más stock disponible de esta variante')
      return
    }

    setClicked(true)
    setTimeout(() => setClicked(false), 300)

    // ── MUTACIÓN REACTIVA USANDO LA API DE ZUSTAND ──
    const existing = cart.find((i) => i.id === targetCartId)
    let updatedCart = []

    if (existing) {
      updatedCart = cart.map((item) =>
        item.id === targetCartId ? { ...item, quantity: item.quantity + 1 } : item
      )
    } else {
      updatedCart = [
        ...cart,
        {
          id:       targetCartId, // ID compuesto para que la página del carro lo procese sin duplicarse
          name:     product.name,
          price:    product.price,
          quantity: 1,
        },
      ]
    }

    // Guardamos directo en el store
    useCartStore.setState({ cart: updatedCart })
    
    toast.success(`${product.name}${selectedSize ? ` (${selectedSize})` : ''} agregado`)
  }

  return (
    <div className="flex flex-col gap-4">
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            Variante {selectedSize && `— ${selectedSize}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map(variant => {
              // Stock remanente de este botón específico
              const variantInCart = cart.find((i) => i.id === `${product.id}-${variant.size}`)
              const variantQtyInCart = variantInCart ? variantInCart.quantity : 0
              const isVariantAgotada = variant.stock - variantQtyInCart <= 0

              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedSize(variant.size)}
                  disabled={isVariantAgotada}
                  className={`
                    px-4 py-2 text-sm tracking-widest border rounded transition-all duration-200
                    ${isVariantAgotada
                      ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed line-through'
                      : selectedSize === variant.size
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground'
                    }
                  `}
                >
                  {variant.size}
                </button>
              )
            })}
          </div>

          {selectedSize && selectedVariant && (
            availableStock <= 3 ? (
              <p className="text-xs text-red-500 tracking-widest uppercase font-medium">
                {availableStock === 0 ? 'Agotado en el carrito' : `Últimas ${availableStock} unidades`}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {availableStock} unidades disponibles
              </p>
            )
          )}
        </div>
      )}

      <Button
        onClick={addToCart}
        size="lg"
        disabled={hasVariants ? !selectedSize || availableStock <= 0 : availableStock <= 0}
        className="w-full"
        style={{
          transform: clicked ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
      >
        {hasVariants && !selectedSize 
          ? 'Selecciona una variante' 
          : availableStock <= 0 
          ? 'Sin stock disponible' 
          : 'Agregar al carrito'}
      </Button>
    </div>
  )
}