import { prisma } from '@/lib/prisma'
import { applyDiscounts } from '@/lib/discounts'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const items = body.items as { productId: string; quantity: number; size?: string | null }[]
  const productIds = items.map((i) => i.productId)

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })

  const rules = await prisma.discountRule.findMany({
    where: { active: true },
  })

  const cartItems = items.map((i) => {
    const product = products.find((p) => p.id === i.productId)
    if (!product) throw new Error('Producto no encontrado')

    const variant = i.size ? product.variants.find((v) => v.size === i.size) : null
    if (i.size && !variant) throw new Error('Variante no encontrada')

    const availableStock = variant ? variant.stock : product.stock
    if (i.quantity < 1 || i.quantity > availableStock) {
      throw new Error('Stock insuficiente')
    }

    return {
      productId: i.productId,
      name: i.size ? `${product.name} (${i.size})` : product.name,
      price: product.price,
      quantity: i.quantity,
    }
  })

  const result = applyDiscounts(cartItems, rules)

  return NextResponse.json(result)
}
