import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const discounts = await prisma.discountRule.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(discounts)
}

export async function POST(req: Request) {
  const body = await req.json()

  const discount = await prisma.discountRule.create({
    data: {
      name: body.name,
      type: body.type,
      value: body.value,
      minQuantity: body.minQuantity,
      productId: body.productId ?? null,
    },
  })

  return NextResponse.json(discount)
}