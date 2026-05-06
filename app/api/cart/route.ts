import { prisma } from '@/lib/prisma'
import { applyDiscounts } from '@/lib/discounts'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const productIds = body.items.map((i: { productId: string }) => i.productId)

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  const rules = await prisma.discountRule.findMany({
    where: { active: true },
  })

  const cartItems = body.items.map((i: { productId: string; quantity: number }) => {
    const product = products.find((p) => p.id === i.productId)!
    return {
      productId: i.productId,
      name: product.name,
      price: product.price,
      quantity: i.quantity,
    }
  })

  const result = applyDiscounts(cartItems, rules)

  return NextResponse.json(result)
}