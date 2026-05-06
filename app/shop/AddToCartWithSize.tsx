'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Variant = {
  id: string
  size: string
  stock: number
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
}: {
  product: Product
  variants: Variant[]
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [clicked, setClicked] = useState(false)

  const hasVariants = variants.length > 0

  function addToCart() {
    if (hasVariants && !selectedSize) {
      toast.error('Selecciona una talla')
      return
    }

    setClicked(true)
    setTimeout(() => setClicked(false), 300)

    const cart = JSON.parse(localStorage.getItem('cart') ?? '[]')
    const cartKey = hasVariants ? `${product.id}-${selectedSize}` : product.id
    const existing = cart.find((i: { cartKey: string }) => i.cartKey === cartKey)

    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({
        cartKey,
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        size: selectedSize,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    toast.success(`${product.name}${selectedSize ? ` (${selectedSize})` : ''} agregado al carrito`)
  }

  const selectedVariant = variants.find(v => v.size === selectedSize)

  return (
    <div className="flex flex-col gap-4">
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            Talla {selectedSize && `— ${selectedSize}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map(variant => (
              <button
                key={variant.id}
                onClick={() => setSelectedSize(variant.size)}
                disabled={variant.stock === 0}
                className={`
                  px-4 py-2 text-sm tracking-widest border rounded transition-all duration-200
                  ${variant.stock === 0
                    ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed line-through'
                    : selectedSize === variant.size
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground'
                  }
                `}
              >
                {variant.size}
              </button>
            ))}
          </div>

          {selectedVariant && (
            selectedVariant.stock <= 3 ? (
              <p className="text-xs text-red-500 tracking-widest uppercase font-medium">
                ¡Últimas {selectedVariant.stock} unidades!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {selectedVariant.stock} unidades disponibles
              </p>
            )
          )}
        </div>
      )}

      <Button
        onClick={addToCart}
        size="lg"
        className="w-full"
        style={{
          transform: clicked ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
      >
        {hasVariants && !selectedSize ? 'Selecciona una talla' : 'Agregar al carrito'}
      </Button>
    </div>
  )
}