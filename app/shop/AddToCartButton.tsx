'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { toast } from 'sonner'

type Product = {
  id: string
  name: string
  price: number
  stock: number
}

export default function AddToCartButton({ product }: { product: Product }) {
  const [clicked, setClicked] = useState(false)
  
  // useCartStore ya maneja internamente la sincronización segura con el cliente
  const cart = useCartStore((state) => state.cart)
  const addToCartStore = useCartStore((state) => state.addToCart)

  // Buscamos si el item ya está en el carrito
  const itemInCart = cart.find((i) => i.id === product.id && !i.size)
  const quantityInCart = itemInCart ? itemInCart.quantity : 0
  const availableStock = product.stock - quantityInCart

  function handleAddToCart() {
    if (availableStock <= 0) {
      toast.error('No queda más stock disponible de este producto')
      return
    }

    setClicked(true)
    setTimeout(() => setClicked(false), 300)

    addToCartStore(product)
    toast.success(`${product.name} agregado al carrito`)
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={availableStock <= 0}
      size="sm"
      className="w-full"
      style={{
        transform: clicked ? 'scale(0.92)' : 'scale(1)',
        transition: 'all 0.15s ease',
        backgroundColor: availableStock <= 0 ? '#f4f4f5' : undefined,
        color: availableStock <= 0 ? '#a1a1aa' : undefined,
        border: availableStock <= 0 ? '1px solid #e4e4e7' : undefined,
        cursor: availableStock <= 0 ? 'not-allowed' : 'pointer'
      }}
    >
      {availableStock <= 0 ? 'Agotado' : 'Agregar'}
    </Button>
  )
}