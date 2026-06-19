import { prisma } from '@/lib/prisma'
import { buildValidatedOrderPricing, OrderValidationError } from '@/lib/orders'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await buildValidatedOrderPricing(prisma, body.items ?? [])

    return NextResponse.json({
      subtotal: result.subtotal,
      discount: result.discount,
      total: result.total,
      appliedDiscounts: result.appliedDiscounts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof OrderValidationError
          ? error.message
          : 'No pudimos validar el carrito',
      },
      { status: 400 }
    )
  }
}
