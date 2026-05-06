'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Product = {
  id: string
  name: string
  price: number
}

export default function AddToCartButton({ product }: { product: Product }) {
  const [clicked, setClicked] = useState(false)

  function addToCart() {
    setClicked(true)
    setTimeout(() => setClicked(false), 300)

    const cart = JSON.parse(localStorage.getItem('cart') ?? '[]')
    const existing = cart.find((i: { id: string }) => i.id === product.id)

    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ ...product, quantity: 1 })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    toast.success(`${product.name} agregado al carrito`)
  }

  return (
    <Button
      onClick={addToCart}
      size="sm"
      style={{
        transform: clicked ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
    >
      Agregar
    </Button>
  )
}