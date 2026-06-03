'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store'

export default function CartHeaderLink({ mobile = false }: { mobile?: boolean }) {
  const cart = useCartStore((state) => state.cart)

  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (mobile) {
    return (
      <Link href="/shop/cart" className="shop-cart-icon-link" aria-label={`Carrito con ${quantity} productos`}>
        <ShoppingCart className="size-6" />
        {quantity > 0 && <span className="shop-cart-count">{quantity}</span>}
      </Link>
    )
  }

  return (
    <Link href="/shop/cart" className="shop-header-action">
      <span className="shop-cart-icon-link">
        <ShoppingCart className="size-6" />
        {quantity > 0 && <span className="shop-cart-count">{quantity}</span>}
      </span>
      ${total.toLocaleString('es-CL')}
    </Link>
  )
}
