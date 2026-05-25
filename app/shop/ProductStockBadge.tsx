'use client'

import { useCartStore } from '@/lib/store'

type StockBadgeProps = {
  productId: string
  initialStock: number
}

export default function ProductStockBadge({ productId, initialStock }: StockBadgeProps) {
  const cart = useCartStore((state) => state.cart)

  // Buscamos si el item ya está en el carrito para descontar del badge visual en tiempo real
  const itemInCart = cart.find((i) => i.id === productId && !i.size)
  const quantityInCart = itemInCart ? itemInCart.quantity : 0
  const dynamicStock = initialStock - quantityInCart

  return (
    <div className={`product-stock-badge${dynamicStock <= 5 ? ' low' : ''}`}>
      {dynamicStock <= 0 ? (
        'Agotado'
      ) : dynamicStock <= 5 ? (
        `¡Últimas ${dynamicStock}!`
      ) : (
        `${dynamicStock} uds`
      )}
    </div>
  )
}